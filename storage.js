function Serializable() {}

Serializable.prototype.load = function( obj )
{
  $.extend( this, obj );
};

/*function remove_dom_elements( obj )
{
  for( var attr in obj )
  {
    if( obj[attr].nodeType && obj[attr].nodeType == 1 )
    {
      delete obj[attr];
    }
    else if( obj[attr] instanceof Object )
    {
      remove_dom_elements( attr );
    }    
  }
} */

function GameStorage()
{
  this.save = function()
  {
    var map_tiles = Dungeon.get_current_level().map_tiles;
    $.jStorage.set( "map", map_tiles );
    $.jStorage.set( "player", Player );
  };
  
  this.load = function()
  {
    var map_tiles = $.jStorage.get( "map" );
    var player = $.jStorage.get("player");
    
    if( map_tiles )
    {
      load_map( map_tiles );
    }
    else
    {
      Log.debug( "No save data found." );
    }
    
    Player.load( player );
  };
  
  this.erase = function()
  {
    $.jStorage.flush();
    Log.debug( "Erased LocalStorage cache." );
  };
  
  function load_map( new_tiles )
  {
    var map_tiles = new Array();
    
    for( var row = 0; row < new_tiles.length; ++row )
    {
      map_tiles[row] = new Array();
      
      for( var col = 0; col < new_tiles[row].length; ++col )
      {
        map_tiles[row][col] = new Tile();
        map_tiles[row][col].load( new_tiles[row][col] );
      }
    }
    
    Dungeon.get_current_level().map_tiles = map_tiles;
  }
}