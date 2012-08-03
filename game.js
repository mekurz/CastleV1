function Game()
{
  this.ANIMATION_INTERVAL = 50;
  this.interval_loop = null;
  this.animation_queue = new Array();
  this.splat_queue = new Array();
  this.dragging = false;
  this.mouse_start = new Point();
  this.tooltip = new Tooltip();
  this.is_player_move = false;
  
  var canvas = null;
  this.map_ctx = null;
  this.buffer = null;
  this.buffer_ctx = null;
  this.spell_buffer = null;
  this.spell_ctx = null;
  var load_div = $("#load_div");

  this.initialize = function()
  {
    Log = new Logger();
    Log.debug( "Initializing..." );

    Time = new GameTime();
    Storage = new GameStorage();
    Inventory = new InventoryManager();
    Inventory.initialize();
    
    Minimap = new Minimap();
    Minimap.initialize();
    
    Loader = new DataLoader();
    Images = new ImageCache();
    
    Loader.initialize();

    canvas = $("#map");
    
    if( canvas && canvas[0].getContext )
    {
      this.map_ctx = canvas[0].getContext("2d");
      this.buffer = document.createElement("canvas");
      this.buffer.width = canvas[0].width;
      this.buffer.height = canvas[0].height;
      this.buffer_ctx = this.buffer.getContext("2d");
      
      this.spell_buffer = document.createElement("canvas");
      this.spell_buffer.width = canvas[0].width;
      this.spell_buffer.height = canvas[0].height;
      this.spell_ctx = this.spell_buffer.getContext("2d");
      
      canvas.bind( "mousedown", this.on_mouse_down );
      canvas.bind( "mouseup", this.on_mouse_up );
      canvas.bind( "mouseleave", this.on_mouse_leave );
      canvas.bind( "mousemove", this.on_mouse_move );
      
      return true;
    }
    
    return false;
  };
  
  this.run = function( debug )
  {
    DEBUGGING = debug;
    
    if( this.initialize() )
    {
      $(document).bind( "keydown", this.key_handler );
      
      this.interval_loop = setInterval( this.initial_draw_loop, this.ANIMATION_INTERVAL );
      set_processing();
    }
  };
  
  this.initial_draw_loop = function()
  {
    if( Images.is_loaded() )
    {
      Log.debug( "Done loading images." );
      
      Dungeon = new DungeonManager();
      Map = new ViewPort();
      
      initialize_player();
      Time.update_time();
      
      if( DEBUGGING )
      {
        setup_debug_level();
      }
      else
      {
        Dungeon.create_level();
        Player.location = Dungeon.levels[0].get_starting_location();
        Dungeon.explore_at_location( Player.location );
      }
      
      Map.center_map_on_location( Player.location );
      Dungeon.update_level();
      
      document.game.draw();
      clearInterval( document.game.interval_loop );
      document.game.interval_loop = null;
      
      set_finished();
      set_command( NO_COMMAND );
      
      load_div.remove();
      Log.add( "Ready for action!" );
    }
  };
  
  this.do_turn = function()
  {
    /*if( Player.is_dead() )    // No more turns if the Player is dead
    {
      return;
    } */
    
    if( this.splat_queue.length > 0 )
    {
      Log.debug( "Processing splats..." );
      this.process_splats();
    }
    else if( this.animation_queue.length == 0 )
    {
      this.is_player_move = false;
      this.update();
    }
    
    Time.update_time();   // Update the game clock
    this.draw();
    this.draw_spells();
  };
  
  this.update = function()
  {
    // MEK TO DO PERFORM ANY NECESSARY LOGIC ROUTINES HERE NOT DIRECTLY ATTACHED TO AN EVENT (I.E. MOVE MONSTERS) 
    Dungeon.move_monsters();
    
    // Heal 1 hit point every minute
    if( Time.time % 60 == 0 )
    {
      Player.heal( 1 );
      Player.update_hp();
    }
  };
  
  this.draw_map = function( ctx )
  {
    var level = Dungeon.get_current_level();

    Map.draw_map( ctx); // First layer: Map tiles, doors, widgets (including stairs) 
    this.draw_collection( level.doors, ctx );
    this.draw_collection( level.stairs_up, ctx );
    this.draw_collection( level.stairs_down, ctx );
    this.draw_collection( level.traps, ctx );
    // TODO widgets go here
    
    this.draw_collection( level.items, ctx );     // Second layer: Items
    
    this.draw_collection( level.monsters, ctx );  // Third layer: Monsters and Player    
    Player.draw( ctx );
  };
  
  this.draw = function()
  {
    /*if( Player.is_dead() )    // No more drawing if the Player is dead
    {
      return;
    }*/
    
    this.draw_map( this.buffer_ctx );    
    this.map_ctx.drawImage( this.buffer, 0, 0 );
  };
  
  this.draw_collection = function( collection, ctx )
  {
    for( var i = 0; i < collection.length; ++i )
    {
      collection[i].draw( ctx );
    } 
  };
  
  function initialize_player() 
  {
    Player = new PlayerActor();
    DrawPlayer = new Paperdoll();
    DrawPlayer.construct_paperdoll();
    Player.update_stats();
  }
  
  this.key_handler = function( evt )
  {
    evt = ( evt ) ? evt : ( ( window.event ) ? event : null );
  
    if( evt && !is_processing() /*&& !Player.is_dead() */ )
    {
      // Events that can be used on dialogs
      if( evt.keyCode == 84 && ( OPEN_DIALOGS == 0 || Inventory.is_open ) ) // T
      {
          Inventory.take_all();
          document.game.draw();
          return;
      }
      
      
      if( OPEN_DIALOGS > 0 )
      {
        return; // Prevent 
      }
      
      // Events that CANNOT be used on dialogs
      switch( evt.keyCode )
      {
        case 36: // numpad 7
        case 38: // up
        case 33: // numpad 9
        case 37: // left
        case 39: // right
        case 35: // numpad 1
        case 40: // down
        case 34: // numpad 3
          if( new Movement().move_on_keypress( evt.keyCode ) )
          {
            document.game.do_turn();
          }
          break;
        case 27: // esc
          set_command( NO_COMMAND );
          default_cursor();
          break;
        case 67: // C
          perform_action( "close" );
          break;
        case 68: // D
          perform_action( "disarm" );
          break;
        case 69: // E
          perform_action( "sleep" );
          break;
        case 73: // I
          Inventory.open();
          break;
        case 77: // M
          Minimap.open();
          break;
        case 79: // O
          perform_action( "open" );
          break;
        case 82: // R
          perform_action( "rest" );
          break;
        case 83: // S
          perform_action( "search" );
          break;
        case 188: // <
          if( evt.shiftKey ) perform_action( "up" );
          break;
        case 190: // >
          if( evt.shiftKey ) perform_action( "down" );
          break;
        default:
          Log.debug( "Unknown key = " + evt.keyCode );
          break;
      }
    }
  };
  
  this.on_mouse_leave = function( evt )
  {
    if( document.game.dragging )
    {
      document.game.end_dragging();
    }
  };
  
  this.on_mouse_down = function( evt )
  {
    if( !is_processing() /*&& !Player.is_dead()*/ )
    {
      var mouse_pos = get_mouse_location( canvas[0], evt );
      
      if( evt.button == 0 && !document.game.tooltip.visible )   // Left-click
      {
        if( Player.location.equals( mouse_pos ) )
        {
          document.game.dragging = true;
          move_cursor();
        }
      }
      else if( evt.button == 2 ) // Right-click
      {
        document.game.tooltip.show_tooltip( mouse_pos );
      }
      
      delete mouse_pos;
    }
    
    return false;
  };
  
  this.on_mouse_up = function( evt )
  {
    if( !is_processing() )
    {
      if( evt.button == 0 && !document.game.tooltip.visible )      
      {
        var mouse_pos = get_mouse_location( canvas[0], evt );
        
        if( document.game.dragging )
        {
          document.game.end_dragging();
        }

        if( process_click( mouse_pos ) )
        {
          document.game.is_player_move = true;
          document.game.do_turn();
        }
        
        Log.debug( "Clicked on " + mouse_pos.to_string() );
        //Log.debug( JSON.stringify( Dungeon.get_current_level().map_tiles[mouse_pos.y][mouse_pos.x] ) );
      }
      else if( evt.button == 2 ) // Right-click
      {
        document.game.tooltip.hide_tooltip(); 
      }
    }
    
    return false;
  };
  
  this.end_dragging = function()
  {
    document.game.dragging = false;
    default_cursor();
    
    if( document.game.animation_queue.length == 0 )
    {
      Map.center_map_on_location( Player.location );
      document.game.draw();
    }
    
    //Log.debug( "End dragging." );
  };
  
  this.on_mouse_move = function( evt )
  {
    if( !is_processing() && document.game.dragging )
    {
      //Log.debug( "Dragging player..." ); 
      var mouse_pos = get_mouse_location_for_dragging( canvas[0], evt );
      
      if( !Player.location.equals( mouse_pos ) )
      {
        var vector = Player.location.get_unit_vector( mouse_pos );
        
        if( Map.is_valid_move( Player.location, vector ) )
        {
          var move = new Movement();
          var valid = move.move_actor_with_vector( Player, vector );
  
          if( valid )
          {
            Time.add_time( TIME_STANDARD_MOVE );
            document.game.do_turn();
            
            if( Map.is_location_on_an_edge( Player.location ) || document.game.animation_queue.length > 0 )
            {
              document.game.end_dragging();
            }
          }
        }
      }
    }
    
    return false;
  };
  
  this.draw_spells = function()
  {
    if( this.animation_queue.length > 0 )
    {
      set_processing();
      
      // Make a backup copy of what the canvas looks like so we can draw spell effects over top without having to always redraw the viewport.
      this.spell_ctx.drawImage( canvas[0], 0, 0 );
      document.game.interval_loop = setInterval( this.draw_spells_interval_loop, this.ANIMATION_INTERVAL );
    }
  };
  
  this.draw_spells_interval_loop = function()
  {
    //Log.debug( "Running spell animation interval..." );
    document.game.buffer_ctx.drawImage( document.game.spell_buffer, 0, 0 );    // Draw the backup of the map without any spell effects.
    draw_spells_for_interval( document.game.buffer_ctx );
    document.game.map_ctx.drawImage( document.game.buffer, 0, 0 );
    
    if( document.game.animation_queue.length == 0 && document.game.is_player_move )
    {
      stop_animations();
      document.game.do_turn();
    }
    else
    { 
      // If the animation queue is empty, but we have some splats queued up, add them to the animation queue.
      if( document.game.animation_queue.length == 0 && document.game.splat_queue.length > 0 )
      {
        document.game.draw();
        document.game.spell_ctx.drawImage( canvas[0], 0, 0 );   // Make sure we refresh the spell buffer to remove any dead monsters!
        document.game.process_splats();
      }
      
      // If all animations are done (no more splats), clean everything up.
      if( document.game.animation_queue.length == 0 )
      {
        stop_animations(); 
        Map.center_map_on_location( Player.location );
        document.game.draw();
      }
    }
  };
  
  this.add_splat = function( target )
  {
    this.splat_queue.push( target ); 
  };
  
  this.process_splats = function()
  {
    for( var x = 0; x < this.splat_queue.length; x++ )
    {
      add_spell_effect( new Splat( this.splat_queue[x] ) ); 
    }
    
    this.splat_queue = new Array();
  };
};

function stop_animations()
{
  window.clearInterval( document.game.interval_loop );
  document.game.interval_loop = null;
  set_finished();
  set_command( NO_COMMAND );
}
