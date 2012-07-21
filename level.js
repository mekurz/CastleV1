function Level()
{
  Level.base_constructor.call( this );
  this.map_tiles = new Array();
  this.monsters = new Array();
  this.items = new Array();
  this.rooms = new Array();
  this.doors = new Array();
  this.stairs_up = new Array();
  this.stairs_down = new Array();
  
  this.create_single_monster = function( monster_type, location )
  {
    var monster = new Monster( monster_type );
    monster.move_to( location );
    this.monsters.push( monster );
  };
  
  this.create_single_item = function( stat_id, point )
  {
    var item = new Item( stat_id, point );
    this.items.push( item );
  };
    
  this.get_monster_ix = function( monster_id )
  {
    for( var i = 0; i < this.monsters.length; ++i )
    {
      if( this.monsters[i].id == monster_id )
      {
        return i;
      }
    } 
  };
  
  this.get_monster_in_tile = function( location )
  {
    for( var i = 0; i < this.monsters.length; ++i )
    {
      if( this.monsters[i].location.equals( location ) )
      {
        return this.monsters[i];
      }
    }
    
    return null;
  };
  
  this.get_stair_ix_at_location = function( collection, location )
  {
    for( var ix = 0; ix < collection.length; ++ix )
    {
      if( location.equals( collection[ix].location ) )
      {
        return ix;
      }
    }
    
    return -1;
  };
  
  this.get_starting_location = function( stair_ix )
  {
    if( this.stairs_up.length == 0 || stair_ix > this.stairs_up.length )
    {
      var room_ix = Math.floor( Math.random() * this.rooms.length );
      return this.rooms[room_ix].get_room_center();
    }
    else
    {
      return this.stairs_up[stair_ix].location;
    }
  };
  
  this.get_exit_location = function( stair_ix )
  {
    return this.stairs_down[stair_ix].location;
  };
    
  this.spawn_monster = function()
  {
    var room_ix = -1;
    var location = null;
    
     // Keep trying for random room/location combinations until we find an open spot (monsters can't spawn ontop of other monsters!)
    while( room_ix == -1 || this.get_monster_in_tile( location ) != null )
    {
      room_ix = Math.floor( Math.random() * this.rooms.length );
      location = this.rooms[room_ix].get_random_location();
    }
    
    this.create_single_monster( RATMAN, location );    
  };
  
  this.initialize = function( num_stairs_up )
  {
    var mapgen = new MapGenerator();
    mapgen.create_new_level( this, num_stairs_up );
    
    // Spawn monsters (start with one per room)
    for( var monster_ix = 0; monster_ix < this.rooms.length; ++monster_ix )
    {
      this.spawn_monster();
    }
  };
}
extend( Level, Serializable );

Level.prototype.load = function( obj )
{
  this.map_tiles = Storage.load_map( obj.map_tiles );
  this.monsters = Storage.load_collection( obj.monsters, Monster );
  this.items = Storage.load_collection( obj.items, Item );
  this.rooms = Storage.load_collection( obj.rooms, Room );
  this.doors = Storage.load_collection( obj.doors, Door );
  this.stairs_up = Storage.load_collection( obj.stairs_up, Widget );
  this.stairs_down = Storage.load_collection( obj.stairs_down, Widget );
};

function DungeonManager()
{
  this.level_ix = 0;
  this.levels = new Array();
  
  this.create_level = function( num_stairs_up )
  {
    var new_level = new Level();
    new_level.initialize( num_stairs_up );
    
    if( this.levels.length == 0 ) // Top level of the dungeon doesn't have stairs up YET
    {
      new_level.stairs_up.length = 0;
    }
    
    this.levels.push( new_level );
  };
  
  this.update_level = function()
  {
    $("#level").text( this.level_ix + 1 );
  };
  
  this.get_current_level = function()
  {
    return this.levels[this.level_ix];
  };
  
  this.get_map_tiles = function()
  {
    return this.levels[this.level_ix].map_tiles;
  };
  
  this.get_items = function()
  {
    return this.levels[this.level_ix].items;
  };
  
  this.get_monsters = function()
  {
    return this.levels[this.level_ix].monsters;
  };
  
  this.is_location_lit = function( location )
  {
    return this.levels[this.level_ix].map_tiles[location.y][location.x].is_lit;
  };
  
  this.is_location_lit_unexplored = function( location )
  {
    return this.levels[this.level_ix].map_tiles[location.y][location.x].is_lit_unexplored();
  };
  
  this.is_location_explored = function( location )
  {
    return this.levels[this.level_ix].map_tiles[location.y][location.x].explored;
  };
  
  this.move_monsters = function()
  {
    if( !FREEZE_MONSTERS )
    {
      for( var i = 0; i < this.levels[this.level_ix].monsters.length; ++i )
      {
        this.levels[this.level_ix].monsters[i].do_move();
      }
    }
  };
  
  this.get_monster_in_tile = function( location )
  {
    return this.get_current_level().get_monster_in_tile( location );
  };
  
  this.kill_monster = function( monster_id )
  {
    var level = this.get_current_level();
    level.monsters.splice( level.get_monster_ix( monster_id ), 1 );
  };
  
  this.get_items_in_tile = function( point )
  {
    var loot = new Array();
    var level = this.get_current_level();
    
    for( var i = 0; i < level.items.length; ++i )
    {
      if( level.items[i].location.equals( point ) )
      {
        loot.push( level.items[i] );
      }
    }
    
    return loot;
  };
  
  this.count_items_in_tile = function( point )
  {
    var num = 0;
    var level = this.get_current_level();
    
    for( var i = 0; i < level.items.length; ++i )
    {
      if( level.items[i].location.equals( point ) )
      {
        num++;
      }
    }
    
    return num;
  };
  
  this.explore_at_location = function( point )
  {
    var map_tiles = this.get_map_tiles();
    var tile = map_tiles[point.y][point.x];
    
    if( tile.is_lit_room() )
    {
      this.update_room_tiles( map_tiles, tile.room_id, explore_tile );
    }
    else
    {
      this.update_adjacent_tiles( map_tiles, point, explore_tile );
    }
  };
  
  this.update_adjacent_tiles = function( map_tiles, point, callback )
  {
    for( var row = point.y - 1; row <= point.y + 1; ++row )
    {
      for( var col = point.x - 1; col <= point.x + 1; ++col )
      {
        if( row >= 0 && row < map_tiles.length && col >= 0 && col < map_tiles[0].length )
        {
          callback( map_tiles, row, col );
        }
      }
    }
  };
  
  this.update_room_tiles = function( map_tiles, room_id, callback )
  {
    var room = this.get_current_level().rooms[room_id];
    
    for( var row = room.top_left.y - 1; row <= room.top_left.y + room.height; ++row )
    {
      for( var col = room.top_left.x - 1; col <= room.top_left.x + room.width; ++col )
      {
        callback( map_tiles, row, col );
      }
    }
  };
  
  this.search_at_location = function( point )
  {
    var doors = this.get_current_level().doors;
    for( var ix = 0; ix < doors.length; ++ix )
    {
      if( point.adjacent_to( doors[ix].location ) && !doors[ix].is_visible() )
      {
        doors[ix].find_door();
        Log.add( "You found a secret door!" );
      }
    }
  };
  
  this.get_door_in_tile = function( point )
  {
    var level = this.get_current_level();
    
    for( var i = 0; i < level.doors.length; ++i )
    {
      if( level.doors[i].location.equals( point ) )
      {
        return level.doors[i];
      }
    } 
    
    return null;
  };
  
  this.go_down = function( stair_ix )
  {
    if( this.level_ix + 2 > this.levels.length )
    {
      this.create_level( this.levels[this.level_ix].stairs_down.length );
    }
    
    this.level_ix++;
    Player.location.assign( this.levels[this.level_ix].get_starting_location( stair_ix ) ); // Start at the Stairs UP corresponding to the Stairs DOWN that were just used
  };
  
  this.go_up = function( stair_ix )
  {
    this.level_ix--;
    Player.location.assign( this.levels[this.level_ix].get_exit_location( stair_ix ) ); // Start at the Stairs DOWN corresponding to the Stairs UP that were just used
  };
}
extend( DungeonManager, Serializable );

DungeonManager.prototype.load = function( obj )
{
  DungeonManager.super_class.load.call( this, obj );
  this.levels = Storage.load_collection( obj.levels, Level );
};

// Callbacks for affecting map tiles in various ways
function explore_tile( map_tiles, row, col )
{
  map_tiles[row][col].explored = true;
}

function light_tile( map_tiles, row, col )
{
  map_tiles[row][col].is_lit = true;
}