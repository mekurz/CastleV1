function process_click( location )
{
  if( is_processing() ) // Don't allow clicks if we're already processing an event.
  {
    return false;
  }
  
  set_processing();
  var command = get_command();
  var valid_action = false;
  
  switch( command )
  {
    case 0:
      var target_item = Movement.is_target_tile_occupied( location );
      
      if( location.adjacent_to( Player.location ) && target_item != null )  // TODO ASSUMES THAT ONLY MONSTERS CAN BE ADJACENT
      {
        new Melee( target_item ).process();
        valid_action = true;
      }
      
      set_finished();      
      break;
    case MAGIC_MISSILE:
    case LIGHTNING_BOLT:
    case FIREBOLT:
      add_spell_effect( new ProjectileSpellEffect( command, location ),  new Spell( command, location ) );
      valid_action = true;
      break;    
    case FIREBALL:
      add_spell_effect( new AreaSpellEffect( FIREBOLT, FIREBALL, location ),  new AreaEffectSpell( command, location ) );
      valid_action = true;
      break;

    default:
      Log.debug( "Unrecognized command.");
      set_finished();
      break;
  }

  default_cursor();
  set_command( NO_COMMAND );
  
  return valid_action;
}

function get_mouse_location( canvas, event )
{
  var canoffset = $(canvas).offset();
  var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
  var y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;
  
  var location = new Point( x, y );
  location.convert_to_tile_coord();
  
  Log.debug( "Clicked on raw coord (" + x + ", " + y + ") and converted to tile coord " + location.to_string() );
  
  return location;
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