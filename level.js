function Level()
{
  this.map_tiles = null;
  this.monsters = new Array();
  this.items = new Array();
  
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
}