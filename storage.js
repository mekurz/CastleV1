function Serializable()
{
  this.load = function( obj )
  {
    $.extend( this, obj );
  };
}

function GameStorage()
{
  this.save = function()
  {
    var map_tiles = Dungeon.get_current_level().map_tiles;
    $.jStorage.set( "map", map_tiles );
  };
  
  this.load = function()
  {
    var map_tiles = $.jStorage.get( "map" );
    
    if( map_tiles )
    {
      load_map( map_tiles );
    }
    else
    {
      Log.debug( "No save data found." );
    }
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