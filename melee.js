
// TODO EXTEND THIS TO SUPPORT PULLING STATS FROM ONE ACTOR AND USING THOSE IN THE ATTACK
// TODO FOR NOW WE ASSUME THAT THE SOURCE IS THE PLAYER
function Melee( target )
{
  this.source = null;
  this.target = target;
  
  this.process = function()
  {
    var attack_roll = generate_attack_roll(); // TODO incorporate buffs from player.
    
    Log.debug( "Attack roll = " + attack_roll );
    
    if( attack_roll == 20 )
    {
      // critical hit always hits -> double dmg 
      Log.add( "You hit the " + this.target.description + " in a vital location!" );
      this.target.damage( 4 );
    }
    else if( attack_roll >= this.target.ac )  // Regular hit
    { 
      // TODO ADD SOME RANDOMIZED FLAVOUR TEXT
      Log.add( "You swing and deal a solid blow to the " + this.target.description + "!" );
      this.target.damage( 2 );
    }
    else // Miss
    {
      Log.add( "You swing wildly at the " + this.target.description + " and miss!" );
    }
    
   // TODO handle this better... message appears after the monster dead message.
   // if( this.target.is_dead() )
   // {
   //   Log.add( "You slice into the " + this.target.description + ", spraying viscera everywhere!" );
   // }
  };
   
  
  function generate_attack_roll()
  {
    return Math.floor( Math.random() * 20 + 1 );      // d20 roll
  }
}