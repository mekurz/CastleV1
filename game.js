function Game()
{
  this.ANIMATION_INTERVAL = 50;
  this.interval_loop = null;
  this.animation_queue = new Array();
  this.splat_queue = new Array();
  this.dragging = false;
  this.mouse_start = new Point();
  
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
          
    Images = new ImageCache();
    Images.initialize();
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
      
      Map = new ViewPort();
      Map.initialize();
      
      initialize_player();
      
      canvas.bind( "mousedown", this.on_mouse_down );
      canvas.bind( "mouseup", this.on_mouse_up );
      canvas.bind( "mouseleave", this.on_mouse_leave );
      canvas.bind( "mousemove", this.on_mouse_move );
          
      Log.debug( "Done initialization." );
      
      return true;
    }
    
    return false;
  };
  
  this.run = function()
  {
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
      Player.img = Images.PLAYER_IMAGE;
      Map.center_map_on_location( Player.location );
      create_monsters();
      
      Log.debug( "Image preload complete." );
      document.game.draw();
      
      clearInterval( document.game.interval_loop );
      document.game.interval_loop = null;
      
      set_finished();
      set_command( NO_COMMAND );
    }
  };
  
  this.do_turn = function()
  {
    if( this.animation_queue.length > 0 )
    {
      Log.debug( "Starting spell animations..." );
      this.draw();
      this.draw_spells(); 
    }
    else if( this.splat_queue.length > 0 )
    {
      Log.debug( "Processing splats..." );
      this.process_splats();
      this.draw();
      this.draw_spells();
    }
    else
    {
      this.update();
      this.draw();
    }
  };
  
  this.update = function()
  {
    // MEK TO DO PERFORM ANY NECESSARY LOGIC ROUTINES HERE NOT DIRECTLY ATTACHED TO AN EVENT (I.E. MOVE MONSTERS) 
  };
  
  this.draw = function()
  {
    Map.draw_map( this.buffer_ctx );
    Player.draw( this.buffer_ctx );
    draw_monsters( this.buffer_ctx );
    
    this.map_ctx.drawImage( this.buffer, 0, 0 );
  };
  
  function initialize_player()      // MEK TODO THIS SHOULD BE A SUBCLASS EVENTUALLY
  {
    Player = new Actor();
    Player.id = "man";
    Player.move_to( new Point( 10, 7 ) );
  }
  
  this.key_handler = function( evt )
  {
    evt = ( evt ) ? evt : ( ( window.event ) ? event : null );
  
    if( evt && !is_processing() )
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
    if( !is_processing() )
    {
      var mouse_pos = get_mouse_location( canvas[0], evt );
      
      if( evt.button == 0 )   // Left-click
      {
        document.game.mouse_start.assign( mouse_pos );
        
        if( Player.location.equals( mouse_pos ) )
        {
          document.game.dragging = true;
          move_cursor();
          //Log.debug( "Begin dragging." ); 
        }
      }
      else if( evt.button == 2 ) // Right-click
      {
        show_tooltip( mouse_pos );
      }
      
      delete mouse_pos;
    }
    
    return false;
  };
  
  this.on_mouse_up = function( evt )
  {
    if( !is_processing() )
    {
      hide_tooltip();
      
      if( document.game.dragging )
      {
        document.game.end_dragging();
      }
      else
      {
        process_click( document.game.mouse_start ); 
        document.game.do_turn();      
      }
    }
    
    return false;
  };
  
  this.end_dragging = function()
  {
    document.game.dragging = false;
    default_cursor();
    Map.center_map_on_location( Player.location );
    document.game.draw();
    //Log.debug( "End dragging." );
  };
  
  this.on_mouse_move = function( evt )
  {
    if( !is_processing() && document.game.dragging )
    {
      //Log.debug( "Dragging player..." ); 
      
      var mouse_pos = get_mouse_location( canvas[0], evt );
      
      if( !Player.location.equals( mouse_pos ) )
      {
        var vector = Player.location.get_unit_vector( mouse_pos );
        var move = new Movement().move_player_with_vector( vector );
        document.game.mouse_start.assign( mouse_pos );
        document.game.do_turn();
        
        delete vector;
        delete move;
        
        if( Map.is_location_on_an_edge( Player.location ) )
        {
          Log.debug( "Dragging caused player to collide with viewport edge!" );
          document.game.end_dragging();
        }
      }
      
      delete mouse_pos;
    }
    
    return false;
  };
  
  this.draw_spells = function()
  {
    set_processing();
    
    // Make a backup copy of what the canvas looks like so we can draw spell effects over top without having to always redraw the viewport.
    this.spell_ctx.drawImage( canvas[0], 0, 0 );
    document.game.interval_loop = setInterval( this.draw_spells_interval_loop, this.ANIMATION_INTERVAL );
  };
  
  this.draw_spells_interval_loop = function()
  {
    //Log.debug( "Running spell animation interval..." );
    document.game.buffer_ctx.drawImage( document.game.spell_buffer, 0, 0 );    // Draw the backup of the map without any spell effects.
    draw_spells_for_interval( document.game.buffer_ctx );
    document.game.map_ctx.drawImage( document.game.buffer, 0, 0 );
    
    if( document.game.animation_queue.length == 0 )
    {
      window.clearInterval( document.game.interval_loop );
      document.game.interval_loop = null;
      document.game.do_turn();
      set_finished();
      set_command( NO_COMMAND );
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
