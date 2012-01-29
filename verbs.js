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

function is_targeted_action( action )
{
  return false;   // TODO list targeted actions here
}

function handle_action( action )
{
  if( action == "search" )
  {
    Dungeon.search_at_location( Player.location );
  }
  
  document.game.do_turn();
}