function Serializable() {}

Serializable.prototype.load = function( obj )
{
  $.extend( this, obj );
};

function GameInfo()
{
  this.version = 1;
  this.dungeon_info = Dungeon;
  this.player_info = Player;
  this.game_time = Time.time;
  this.icon = DrawPlayer.get_data_url();
  
  var now = new Date();
  this.datestamp = now.toDateString();
  this.timestamp = now.toTimeString();
}

function GameStorage()
{
  this.save = function()
  {
    var save_game = new GameInfo();
    $.jStorage.set( "game", save_game );
  };
  
  this.load = function()
  {
    try
    {
      var save_game = $.jStorage.get("game");
      
      if( save_game )
      {
        Dungeon.load( save_game.dungeon_info );
        Player.load( save_game.player_info );
        Time.time = save_game.game_time;
        
        Time.update_time();
        Player.update_stats();
        Dungeon.update_level();
        Inventory.load();
        DrawPlayer.construct_paperdoll();
        Map.center_map_on_location( Player.location );
        document.game.draw();
      }
      else
      {
        Log.debug( "No save data found." );
      }
    }
    catch( err )
    {
      Log.add( "An error has occurred while loading saved game data." );
      Log.debug( err.message );
    }
  };
  
  this.erase = function()
  {
    $.jStorage.flush();
    Log.debug( "Erased LocalStorage cache." );
  };
  
  this.load_map = function( new_tiles )
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
    
    return map_tiles;
  };
  
  this.load_collection = function( src, TYPE )
  {
    var dest = [];
    
    for( var ix = 0; ix < src.length; ++ix )
    {
      var obj = new TYPE();
      obj.load( src[ix] );
      dest.push( obj );
    }
    
    return dest;
  };
  
  this.load_point = function( src )
  {
    var location = new Point();
    location.load( src );
    return location;
  };
}