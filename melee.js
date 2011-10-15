function Melee( source, target )
{
  this.source = source;
  this.target = target;
  
  this.process = function()
  {
    var attack_roll = this.generate_attack_roll();
    
    Log.debug( "Attack roll = " + attack_roll );
    
    if( attack_roll == 20 )
    {
      this.process_critical_hit();
    }
    else if( attack_roll >= this.target.ac )
    { 
      this.process_regular_hit();
    }
    else
    {
      this.process_miss();
    }
  };
   
  this.generate_attack_roll = function()
  {
     // TODO incorporate buffs from player.
    return Math.floor( Math.random() * 20 + 1 );      // d20 roll
  };
  
  this.show_kill_message_if_necessary = function( damage )
  {
    if( this.target.would_damage_kill_actor( damage ) )
    {
      if( this.source.is_monster )
      {
        Log.add( "The " + this.source.description + " dealt you a mortal strike!" );
      }
      else
      {
        Log.add( "You slice into the " + this.target.description + ", spraying viscera everywhere!" );
      }
    }
  };
  
  this.process_critical_hit = function()
  {
    var damage = this.source.get_melee_damage() * 2;
    
    // TODO ADD SOME RANDOMIZED FLAVOUR TEXT?
    if( this.source.is_monster )
    {
      Log.add( "The " + this.source.description + " hits you in a vital location!" );
    }
    else
    {
      Log.add( "You hit the " + this.target.description + " in a vital location!" );
    }
    
    this.show_kill_message_if_necessary( damage );
    this.target.damage( damage );
  };
  
  this.process_regular_hit = function()
  {
    // TODO ADD SOME RANDOMIZED FLAVOUR TEXT?
    if( this.source.is_monster )
    {
      Log.add( "The " + this.source.description + " swings and hits you with a solid blow!" );
    }
    else
    {
      Log.add( "You swing and deal a solid blow to the " + this.target.description + "!" );
    }
    
    this.show_kill_message_if_necessary( this.source.get_melee_damage() );
    this.target.damage( this.source.get_melee_damage() );
  };
  
  this.process_miss = function()
  {
    // TODO ADD SOME RANDOMIZED FLAVOUR TEXT?
    if( this.source.is_monster )
    {
      Log.add( "The " + this.source.description + " misses you with a wild swing!" );
    }
    else
    {
      Log.add( "You swing wildly at the " + this.target.description + " and miss!" );
    }
  };
}