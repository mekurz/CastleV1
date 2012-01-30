function perform_action( action )
{
  if( !is_processing() )
  {
    if( is_targeted_action( action ) )
    {
      crosshairs_cursor();
      set_command( action );
    }
    else
    {
      handle_action( action );
    }
  }
}

function is_action( action )
{
  return action == "search" || action == "open" || action == "close";
}

function is_targeted_action( action )
{
  return action == "open" || action == "close";
}

function handle_action( action, location )
{
  var is_valid = false;
  
  if( action == "search" )
  {
    do_search();
    is_valid = true;
  }
  else if( action == "open" )
  {
    is_valid = do_open( location );
    set_finished();
  }
  else if( action == "close" )
  {
    is_valid = do_close( location );
    set_finished();
  }
  
  return is_valid;  
}

function do_search()
{
  Dungeon.search_at_location( Player.location );
  document.game.do_turn();
}

function do_open( location )
{
  if( location.adjacent_to( Player.location ) )
  {
    var door = Dungeon.get_door_in_tile( location );
    
    if( door && door.is_visible() && !door.is_open() )
    {
      door.set_open();
      Log.add( "You open the door." );
      return true;
    }
    else
    {
      Log.add( "Nothing to open." );
      return false;
    }
  }
  else
  {
    Log.add( "You cannot reach that!" );
    return false;
  }
}

function do_close( location )
{
  if( location.adjacent_to( Player.location ) )
  {
    var door = Dungeon.get_door_in_tile( location );
    
    if( door && door.is_visible() && door.is_open() && !door.is_broken() )
    {
      // Check for something blocking the door the would prevent us from closing it.
      var target_item = Map.get_target_item_in_tile( location );
      
      if( target_item && target_item.is_monster  )
      {
        Log.add( "The " + target_item.description + " is blocking the door!" );
        return false;
      }
      else if( Dungeon.count_items_in_tile( location ) > 0 )
      {
        Log.add( "There are objects blocking the door." );
        return false;
      }
      else
      {  
        door.set_closed();
        Log.add( "You close the door." );
        return true;
      }
    }
    else
    {
      Log.add( "Nothing to close." );
      return false;
    }
  }
  else
  {
    Log.add( "You cannot reach that!" );
    return false;
  }
}