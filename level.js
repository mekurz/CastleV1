function Level()
{
  this.map_tiles = new Array();
  this.monsters = new Array();
  this.items = new Array();
  this.rooms = new Array();
  
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
      this.explore_lit_room( map_tiles, tile.room_id );
    }
    else
    {
      explore_adjacent( map_tiles, point );
    }
  };
  
  function explore_adjacent( map_tiles, point )
  {
    for( var row = point.y - 1; row <= point.y + 1; ++row )
    {
      for( var col = point.x - 1; col <= point.x + 1; ++col )
      {
        if( row >= 0 && row < map_tiles.length && col >= 0 && col < map_tiles[0].length )
        {
          map_tiles[row][col].explored = true;
        }
      }
    }
  }
  
  this.explore_lit_room = function( map_tiles, room_id )
  {
    var room = this.get_current_level().rooms[room_id];
    
    for( var row = room.top_left.y - 1; row <= room.top_left.y + room.height; ++row )
    {
      for( var col = room.top_left.x - 1; col <= room.top_left.x + room.width; ++col )
      {
        map_tiles[row][col].explored = true;
      }
    }
  };
}