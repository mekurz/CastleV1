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

  this.initialize = function()
  {
    Log = new Logger();
    Log.debug( "Initializing..." );

    Inventory = new InventoryManager();
    Inventory.initialize();
    
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
  
  function setup_debug_level()
  {
    Player.move_to( new Point( 10, 7 ) );
    create_debug_level();  
    create_debug_monsters();
    create_debug_items();
  }
  
  this.initial_draw_loop = function()
  {
    if( Images.is_loaded() )
    {
      Log.debug( "Image preload complete." );
      
      Dungeon = new DungeonManager();
      Map = new ViewPort();
      
      initialize_player();
      
      if( DEBUGGING )
      {
        setup_debug_level();
      }
      else
      {
        var mapgen = new MapGenerator();
        Dungeon.levels[0] = mapgen.create_new_level();
        Player.location = Dungeon.levels[0].get_starting_location();
        Dungeon.explore_at_location( Player.location );
      }
      
      Map.center_map_on_location( Player.location );
      
      document.game.draw();
      clearInterval( document.game.interval_loop );
      document.game.interval_loop = null;
      
      set_finished();
      set_command( NO_COMMAND );
      
      Log.debug( "Done initialization." );
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
    
    this.draw();
    this.draw_spells();
  };
  
  this.update = function()
  {
    // MEK TO DO PERFORM ANY NECESSARY LOGIC ROUTINES HERE NOT DIRECTLY ATTACHED TO AN EVENT (I.E. MOVE MONSTERS) 
    Dungeon.move_monsters();
  };
  
  this.draw = function()
  {
    /*if( Player.is_dead() )    // No more drawing if the Player is dead
    {
      return;
    }*/
    
    var level = Dungeon.get_current_level();

    Map.draw_map( this.buffer_ctx ); // First layer: Map tiles and doors
    this.draw_collection( level.doors, this.buffer_ctx );
    
    this.draw_collection( level.items, this.buffer_ctx );     // Second layer: Items
    // TODO: widgets go here
    
    this.draw_collection( level.monsters, this.buffer_ctx );  // Third layer: Monsters and Player    
    Player.draw( this.buffer_ctx );
    
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
    Player.paperdoll.construct_paperdoll();
    Player.update_stats();
  }
  
  this.key_handler = function( evt )
  {
    evt = ( evt ) ? evt : ( ( window.event ) ? event : null );
  
    if( evt && !is_processing() /*&& !Player.is_dead() */ )
    {
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
          var move = new Movement().move_on_keypress( evt.keyCode );
          document.game.do_turn();
          break;
        case 27: // esc
          set_command( NO_COMMAND );
          default_cursor();
          break;
        case 67: // C
          perform_action( "close" );
          break;
        case 73: // I
          Inventory.open();
          break;
        case 79: // O
          perform_action( "open" );
          break;
        case 84: // G
          Inventory.take_all();
          document.game.draw();
          break;
        case 83: // S
          perform_action( "search" );
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
