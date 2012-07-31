function Movement()
{
  this.get_vector_for_keypress = function( key )
  {
    var vector = null;
    
    switch( key )
    {
      case 36:  // numpad 7
        vector = new Point( -1, -1 );
        break;
      case 38:  // up
        vector = new Point( 0, -1 );
        break;
      case 33:  // numpad 9
        vector = new Point( 1, -1 );
        break;    
      case 37: // left
        vector = new Point( -1, 0 );
        break;    
      case 39: // right
        vector = new Point( 1, 0 );
        break;
      case 35:  // numpad 1
        vector = new Point( -1, 1 );
        break; 
      case 40:  // down
        vector = new Point( 0, 1 );
        break;
      case 34:  // numpad 3
        vector = new Point( 1, 1 );
        break;
      default:
        break;
    }
    
    return vector;
  };
  
  this.move_on_keypress = function( key )
  {
    var vector = this.get_vector_for_keypress( key );
    var success = this.move_actor_with_vector( Player, vector );
        
    if( !document.game.dragging )
    {
      Map.center_map_on_location( Player.location );
    }
    
    return success;
  };
  
  this.move_actor_with_vector = function( actor, vector )
  {
    if( Map.is_valid_move( actor.location, vector ) )
    {
      if( !actor.is_monster )
      {
        Time.add_time( TIME_STANDARD_MOVE ); 
      }
      
      var target = new Point( actor.location.x, actor.location.y );
      target.add_vector( vector );
      var target_item = Map.get_target_item_in_tile( target );
      
      if( target_item )
      {
        if( ( actor.is_monster || !document.game.dragging ) && this.is_valid_target_for_melee( actor, target_item ) )
        {
          // Monsters can hit us if we drag past them, but don't allow the Player to drag into a monster
          var melee_attack = new Melee( actor, target_item );
          melee_attack.process();
          return true;
        }
        else if( target_item.is_door )
        {
          if( !target_item.is_open() )
          {
            target_item.set_open();
          }
          
          apply_vector_to_actor( actor, vector );
          return true;
        }
      }
      else
      {
        apply_vector_to_actor( actor, vector );
        return true;
      }
    }
    
    return false;
  };
  
  this.is_valid_target_for_melee = function( actor, target_item )
  {
    return actor != target_item && !( actor.is_monster && target_item.is_monster ) && !target_item.is_door; 
  };
  
  function apply_vector_to_actor( actor, vector )
  {
    actor.add_vector( vector );
        
    if( !actor.is_monster )
    {
      Dungeon.explore_at_location( actor.location );
      Dungeon.trigger_traps_in_tile( actor.location );
    }
  }
}