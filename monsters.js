var BEHAVE_AGGRESSIVE = 0;
var BEHAVE_PASSIVE    = 1;
var BEHAVE_INERT      = 2;

function Monster( type )
{
  Monster.base_constructor.call( this, Monster.max_monster_id );
  Monster.max_monster_id++;
  
  this.type       = type;
  this.is_monster = true;
  this.img_id     = type;
  
  this.load_from_xml();
  Monster.super_class.initialize.call( this );
}
extend( Monster, Actor );

Monster.max_monster_id = 0;

Monster.prototype.load_from_xml = function()
{
  var xml = Loader.get_monster_data( this.type );
  
  this.description = xml.find("Description").text();
  this.max_hp      = xml.find("HP").text();
  this.max_mana    = xml.find("Mana").text();
  this.ac          = xml.find("AC").text();
  this.sight       = xml.find("Sight").text();
  this.melee_damage= xml.find("Melee").text();
  this.spell       = xml.find("SpellCast").attr("id");
  this.behave      = parseInt( xml.find("Behave").text() );
  
  if( this.spell == "" )
  {
    this.spell = undefined;    
  }
  
  if( isNaN( this.behave ) )
  {
    this.behave = chance( 50 ) ? BEHAVE_AGGRESSIVE : BEHAVE_PASSIVE;
  }
};

Monster.prototype.become_aggressive = function()
{
  if( this.behave != BEHAVE_INERT )
  {
    this.behave = BEHAVE_AGGRESSIVE;
  }
};

Monster.prototype.damage = function( value )
{
  Monster.super_class.damage.call( this, value );
  this.become_aggressive();
  
  if( this.current_hp <= 0 )
  {
    this.kill(); 
  }
};

Monster.prototype.kill = function()
{
  Log.add( "The " + this.description + " is dead." );
  
  document.game.add_splat( this.location );
  
  Dungeon.kill_monster( this.id );
    
  // TODO DROP LOOT, GIVE XP, BLAH BLAH BLAH  
};

Monster.prototype.get_tooltip = function()
{
  var html = "<li>" + this.get_health_term() + " " + this.description;
  
  if( DEBUGGING )
  {
    html += " (id=" + this.id + ", behave=" + this.behave + ")";
  }
  html += "</li>";
  
  return html;
};

Monster.prototype.is_location_within_sight = function( target )
{
  return ( Math.floor( this.location.distance_to( target ) ) <= this.sight );
};

Monster.prototype.do_move = function()
{
  if( Map.is_location_visible( this.location ) )
  {
    var vector = null;
    
    if( this.is_location_within_sight( Player.location ) && Map.does_line_of_sight_exist( this.location, Player.location ) )
    {
      // Monsters that can cast spells have a 50% chance to cast it at the Player instead of moving if they are not adjacent to the player
      if( this.spell != undefined && !this.location.adjacent_to( Player.location ) && chance( 50 ) && MONSTER_SPELLS && this.behave == BEHAVE_AGGRESSIVE )
      {
        create_spell( this.spell, this, Player.location );
      }
      else if( this.behave == BEHAVE_AGGRESSIVE || this.location.adjacent_to( Player.location ) )
      {
        // Aggressive monsters move to attack.
        // Passive/inert only attack when something is adjacent
        this.become_aggressive();
        vector = this.location.get_unit_vector( Player.location );
      }
    }
    else if( chance( 50 ) && this.behave != BEHAVE_INERT )   // 50% chance of wandering randomly if they cannot see the player.
    {
      //Log.debug( "Monster " + this.id + " doesn't see Player and wanders aimlessly." );
      var vector = new Point();
      vector.x += Math.floor( Math.random() * 3 ) - 1;
      vector.y += Math.floor( Math.random() * 3 ) - 1;
    }
    
    if( vector )
    {
      var move = new Movement().move_actor_with_vector( this, vector );
    }
  }
  else
  {
    //Log.debug( "Monster " + this.id + " not visible. Not moving." ); 
  }
};