function Level()
{
  this.map_tiles = new Array();
  this.monsters = new Array();
  this.items = new Array();
  this.rooms = new Array();
  this.doors = new Array();
  
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
  
  this.get_starting_location = function()
  {
    var room_ix = Math.floor( Math.random() * this.rooms.length );
    return this.rooms[room_ix].get_room_center();
  };
  
    
  this.spawn_monster = function()
  {
    var room_ix = -1;
    var location = null;
    
     // Keep trying for random room/location combinations until we find an open spot (monsters can't spawn ontop of other monsters!)
    while( room_ix == -1 || Dungeon.get_monster_in_tile( location ) != null )
    {
      room_ix = Math.floor( Math.random() * this.rooms.length );
      location = this.rooms[room_ix].get_random_location();
    }
    
    this.create_single_monster( RATMAN, location );    
  };
}

function DungeonManager()
{
  this.level_ix = 0;
  this.levels = new Array();
  
  this.create_level = function()
  {
    var new_level = new Level();
    new_level.initialize();
    Levels.push( new_level );
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
  
  this.get_monster_in_tile = function( point )
  {
    var level = this.get_current_level();
    
    for( var i = 0; i < level.monsters.length; ++i )
    {
      if( level.monsters[i].location.equals( point ) )
      {
        return level.monsters[i];
      }
    } 
    
    return null;
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
    var find_chance = 50;   // TODO Player stats should change this value
    
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
}

// Callbacks for affecting map tiles in various ways
function explore_tile( map_tiles, row, col )
{
  map_tiles[row][col].explored = true;
}

function light_tile( map_tiles, row, col )
{
  map_tiles[row][col].is_lit = true;
}