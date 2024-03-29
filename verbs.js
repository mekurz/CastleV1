function perform_action( action )
{
  if( !is_processing() )
  {
    if( get_command() != NO_COMMAND )
    {
      cancel_action();
    }
    
    if( is_targeted_action( action ) )
    {
      crosshairs_cursor();
      set_command( action );
      toggle_action();
    }
    else
    {
      handle_action( action );
    }
  }
}

function toggle_action()
{
  $("#btn_" + get_command()).button("toggle");
}

function cancel_action()
{
  toggle_spell( SpellBar.get_button_ix( get_command() ) );
  toggle_action();
  set_command( NO_COMMAND );
  default_cursor();
}

function is_action( action )
{
  return action == "search" || action == "open" || action == "close" || action == "rest" || action == "sleep" || action == "down" || action == "up" || action == "disarm";
}

function is_targeted_action( action )
{
  return action == "open" || action == "close" || action == "disarm";
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
  else if( action == "rest" )
  {
    do_rest();
    is_valid = true;
  }
  else if( action == "sleep" )
  {
    do_sleep();
    is_valid = true;
  }
  else if( action == "down" )
  {
    is_valid = go_down();
  }
  else if( action == "up" )
  {
    is_valid = go_up();
  }
  else if( action == "disarm" )
  {
    is_valid = do_disarm( location );
    set_finished();
  }
  else if( action == "take" )
  {
    Inventory.take_all();
    document.game.draw();
    is_valid = true;
  }
  
  return is_valid;  
}

function do_search()
{
  if( attempt_long_action( ROUNDS_IN_ONE_MIN ) == ROUNDS_IN_ONE_MIN )
  {
    Dungeon.search_at_location( Player.location );
    document.game.do_turn();
  }
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
      Time.add_time( TIME_STANDARD_MOVE );
      return true;
    }
    else
    {
      Log.add( "Nothing to open." );
    }
  }
  else
  {
    Log.add( "You cannot reach that!" );
  }
  
  return false;
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
      }
      else if( Dungeon.count_items_in_tile( location ) > 0 )
      {
        Log.add( "There are objects blocking the door." );
      }
      else
      {  
        door.set_closed();
        Log.add( "You close the door." );
        Time.add_time( TIME_STANDARD_MOVE );
        return true;
      }
    }
    else
    {
      Log.add( "Nothing to close." );
    }
  }
  else
  {
    Log.add( "You cannot reach that!" );
  }
  
  return false;
}

function do_rest()
{
  // We will heal by simply waiting. Player regenerates 1 HP every minute
  attempt_long_action( ( Player.max_hp - Player.current_hp ) * ROUNDS_IN_ONE_MIN );
}

function do_sleep()
{
  // We regenerate mana by attempting to sleep for 8 hours. 
  // If we are interrupted at any point, we will have regenerated a percentage of mana based on how much of the 8 hours we slept 
  var mana_to_regen = Player.max_mana - Player.current_mana;
  
  if( mana_to_regen > 0 )
  {
    var slept = attempt_long_action( 4800 );
    var mana_regained = Math.floor( mana_to_regen * slept / 4800 );
    Player.regen_mana( mana_regained );
    Player.update_mana();
  }
}

function attempt_long_action( rounds )
{
  var attempt = rounds;
  
  for( var ix = 0; ix < rounds; ++ ix )
  {
    var hp_at_start = Player.current_hp;
    Time.add_time( TIME_STANDARD_MOVE );
    document.game.update();
    StatusEffects.run_effects( Time );
    
    if( is_interrupted( hp_at_start ) )
    {      
      Log.add( "You are interrupted!" );
      attempt = ix;
      break;
    }
  }
  
  Time.update_time();
  document.game.draw();
  document.game.draw_spells();
  return attempt;
}

function is_interrupted( hp_at_start )
{
  // Check for adjacent monsters
  var monsters = Dungeon.get_monsters();
  for( var ix = 0; ix < monsters.length; ++ ix )
  {
    if( monsters[ix].location.adjacent_to( Player.location ) )
    {
      return true;
    }
  }
  
  // If the animation queue is not empty, it means a monster cast a spell at the Player
  if( document.game.animation_queue.length > 0 )
  {
    return true;
  }
  
  // Player took damage from some source during this turn
  if( Player.current_hp < hp_at_start )
  {
    return true;
  }
  
  return false;
}

function go_down()
{
  var level = Dungeon.get_current_level();
  var stair_ix = level.get_stair_ix_at_location( level.stairs_down, Player.location );
  
  if( stair_ix != -1 )
  {
    Dungeon.go_down( stair_ix );
    change_level();
    return true;
  }
  else
  {
    Log.add( "No stairs down here." );
  }
  
  return false;
}

function go_up()
{
  var level = Dungeon.get_current_level();
  var stair_ix = level.get_stair_ix_at_location( level.stairs_up, Player.location );
  
  if( stair_ix != -1 )
  {
    Dungeon.go_up( stair_ix );
    change_level();
    return true;
  }
  else
  {
    Log.add( "No stairs up here." );
  }
  
  return false;
}

function change_level()
{
  Dungeon.explore_at_location( Player.location );
  Map.center_map_on_location( Player.location );
  Time.add_time( TIME_STANDARD_MOVE );
  Time.update_time();
  Dungeon.update_level();
  document.game.draw();
}

function do_disarm( location )
{
  if( location.adjacent_to( Player.location ) )
  {
    var trap = Dungeon.get_trap_in_tile( location );
    
    if( trap && trap.is_visible() && !trap.tripped )
    {
      // Check for something blocking the trap the would prevent us from disarming it.
      var target_item = Map.get_target_item_in_tile( location );
      
      if( target_item && target_item.is_monster  )
      {
        Log.add( "The " + target_item.description + " is blocking you from doing that!" );
      }
      else if( attempt_long_action( ROUNDS_IN_ONE_MIN ) == ROUNDS_IN_ONE_MIN )
      {
        Dungeon.disarm_trap( trap.location );
        Log.add( "You disarm the " + trap.description + "." );
        document.game.do_turn();
        return true;
      }
    }
    else
    {
      Log.add( "Nothing to disarm." );
    }
  }
  else
  {
    Log.add( "You cannot reach that!" );
  }
  
  return false;
}