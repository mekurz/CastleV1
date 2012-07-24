function Serializable() {}

Serializable.prototype.load = function( obj )
{
  $.extend( this, obj );
};

var STORAGE_ACTION_CLOSE = 0;
var STORAGE_ACTION_LOAD  = 1;
var STORAGE_ACTION_SAVE  = 2;

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
  this.description = "TEST GAME";
}

function GameStorage()
{
  this.selected_game = -1;
  this.action       = STORAGE_ACTION_CLOSE;
  this.saved_games  = [];
  this.no_games_msg = $("#no_games_msg");
  this.games_list   = $("#stored_games");
  this.new_save_div = $("#new_save_div");
  
  this.popup = $("#storage").dialog({ autoOpen: false,
                                      resizable: false,
                                      modal: true,
                                      width: 600,
                                      open: function(event, ui) {
                                              open_dialog();
                                           },
                                      close: function(event, ui) {
                                              Storage.close_action();
                                              close_dialog();
                                              document.game.draw();
                                            },
                                      buttons: [
                                            {
                                              text: "OK",
                                              click: function() { Storage.popup.dialog("close"); }
                                            },
                                            {
                                              text: "Cancel",
                                              click: function() {
                                                  Storage.action = STORAGE_ACTION_CLOSE;  
                                                  Storage.popup.dialog("close");
                                                }
                                            },
                                        ]
                                   });
  
  this.save = function()
  {
    this.saved_games.push( new GameInfo() );  // TODO must also have a way to overwrite
    $.jStorage.set( "game", this.saved_games );
  };
  
  this.load_selected_game = function()
  {
    try
    {
      if( this.selected_game > -1 )
      {
        var saved_game = this.saved_games[this.selected_game];
        Dungeon.load( saved_game.dungeon_info );
        Player.load( saved_game.player_info );
        Time.time = saved_game.game_time;
        
        Time.update_time();
        Player.update_stats();
        Dungeon.update_level();
        Inventory.load();
        DrawPlayer.construct_paperdoll();
        Map.center_map_on_location( Player.location );
        document.game.draw();
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
      map_tiles[row] = this.load_collection( new_tiles[row], Tile );
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
  
  function open_popup( caption, action )
  {
    if( !is_processing() )
    {
      set_command( NO_COMMAND );
      Storage.action = action;
      Storage.selected_game = -1;
      Storage.popup.dialog( "option", "title", caption );
      Storage.popup.dialog("open");
    }
  }
  
  this.open_load = function()
  {
    this.saved_games = $.jStorage.get("game") || [];
    open_popup( "Load Game", STORAGE_ACTION_LOAD );
    this.new_save_div.hide();
    this.games_list.empty();

    if( this.saved_games.length > 0 )
    {
      this.no_games_msg.hide();
      build_game_list();
    }
    else
    {
      this.no_games_msg.show();
    }
  };
  
  this.open_save = function()
  { 
    open_popup( "Save Game", STORAGE_ACTION_SAVE );
    this.no_games_msg.hide();
  };
  
  this.close_action = function()
  {
    if( this.action == STORAGE_ACTION_LOAD )
    {
      Log.debug( "Loading..." );
      this.load_selected_game();
      Log.debug( "Done." );        
    }
    else if( this.action == STORAGE_ACTION_SAVE )
    {
      Log.debug( "Saving..." );
    }
    else
    {
      Log.debug( "Cancelled out of Load/Save popup." );
    }
  };
  
  function get_html_for_single_game( info )
  {
    var html = "<li class=\"ui-widget-content\">";
    html += "<img src=\"" + info.icon + "\" class=\"Avatar\"></img><div style=\"display:inline-block;width:500px;\">";
    html += "<span class=\"StoredGameTitle\">" + info.description + "</span><br/><div class=\"StoredGameInfo\">";
    html += "<span class=\"StatName\">" + info.player_info.description + " (Level #)</span>";
    html += "<span style=\"float:right;\">Last Modified: " + info.datestamp + "</span>";
    
    var saved_time = new GameTime();
    saved_time.time = info.game_time;
    html += "<span class=\"StatName\">Game Time: " + saved_time.get_time() + "</span></div></div></li>";

    return html;
  }
  
  function build_game_list()
  {
    for( var ix = 0; ix < Storage.saved_games.length; ix++ )
    {
      Storage.games_list.append( get_html_for_single_game( Storage.saved_games[ix] ) );
    }
    
    Storage.games_list.selectable({ selecting: function(event, ui){
                                      if( $(".ui-selected, .ui-selecting").length > 1 ) {
                                        $(ui.selecting).removeClass("ui-selecting");
                                      }
                                    },
                                    selected: function(event, ui) {
                                        var new_selection = $("#stored_games li").index( ui.selected );
                                        if( new_selection == Storage.selected_game )
                                        {
                                          $(ui.selected).removeClass("ui-selected");
                                          Storage.selected_game = -1; 
                                        }
                                        else
                                          Storage.selected_game = new_selection;    
                                      }
                                   
                                });
  }
}