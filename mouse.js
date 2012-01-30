function process_click( location )
{
  if( is_processing() || location.equals( Player.location ) ) // Don't allow clicks if we're already processing an event.
  {
    return false;
  }
  
  set_processing();
  var command = get_command();
  var valid_action = false;
  
  if( command == "0" )
  {
    var target_item = Map.get_target_item_in_tile( location );
    
    if( location.adjacent_to( Player.location ) && target_item != null && target_item.is_monster )
    {
      new Melee( Player, target_item ).process();
      valid_action = true;
    }
    
    set_finished();      
  }
  else
  {
    if( is_action( command ) )
    {
      valid_action = handle_action( command, location );
    }
    else if( create_spell( command, Player, location ) )
    {
      valid_action = true; 
    }
    else
    {
      Log.debug( "Unrecognized command.");
      set_finished();
    }
  }

  default_cursor();
  set_command( NO_COMMAND );
  
  return valid_action;
}

function get_raw_mouse_location( canvas, event )
{
  var canoffset = $(canvas).offset();
  var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
  var y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;
  
  return new Point( x, y );
}

function get_mouse_location( canvas, event )
{
  var location = get_raw_mouse_location( canvas, event );
  location.convert_to_tile_coord();
  
  //Log.debug( "Clicked on raw coord (" + x + ", " + y + ") and converted to tile coord " + location.to_string() );
  return location;
}

function get_mouse_location_for_dragging( canvas, event )
{
  var actual_pos = get_raw_mouse_location( canvas, event );
  var tile_center = new Point( actual_pos.x, actual_pos.y );
  tile_center.convert_to_tile_coord();
  tile_center.convert_to_raw_tile_center();
  
  if( actual_pos.distance_to( tile_center ) <= TILE_DRAG_BUFFER )
  {
    tile_center.convert_to_tile_coord();
    return tile_center;
  }
  
  return Player.location;
}

function crosshairs_cursor()
{
  document.getElementById("map").style.cursor = "crosshair";
}

function default_cursor()
{
  document.getElementById("map").style.cursor = "";
}

function move_cursor()
{
  document.getElementById("map").style.cursor = "move";
}