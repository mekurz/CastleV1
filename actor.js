function Actor( id )
{
  this.id           = id;
  this.description  = "You";
  this.img          = null;
  this.location     = new Point();
  this.max_hp       = 0;
  this.max_mana     = 0;
  this.current_hp   = 0;
  this.current_mana = 0;
  this.ac           = 0;
  this.sight        = 100;
  this.melee_damage = 2;
  
  this.is_monster   = false;
  this.spell        = -1;
}

Actor.prototype.initialize = function()
{
  this.current_hp   = this.max_hp;
  this.current_mana = this.max_mana;
};

Actor.prototype.draw = function( ctx )
{
  if( Map.is_location_visible( this.location ) )
  {
    var view_pos = Map.translate_map_coord_to_viewport( this.location );
    ctx.drawImage( this.img, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) );
    delete view_pos;
  }   
};

Actor.prototype.heal = function( value )
{
  this.current_hp += value;
  if( this.current_hp > this.max_hp )
  {
    this.current_hp = this.max_hp; 
  }
};

Actor.prototype.damage = function( value )
{
  this.current_hp -= value;
  Log.debug( this.description + " has " + this.current_hp + " hp remaining." );
};

Actor.prototype.is_dead = function()
{
  return this.current_hp <= 0;
};

Actor.prototype.would_damage_kill_actor = function( value )
{
  return ( this.current_hp - value ) <= 0; 
};

Actor.prototype.regen_mana = function( value )
{
  this.current_mana += value;
  if( this.current_mana > this.max_mana )
  {
    this.current_mana = this.max_mana; 
  }
};

Actor.prototype.use_mana = function( value )
{
  this.current_mana -= value;
};
  
Actor.prototype.get_health_term = function()
{
  var health_pct = Math.floor( this.current_hp / this.max_hp * 100 );
  
  if( health_pct == 100 )
  {
    return "a healthy"; 
  }
  else if( health_pct >= 80 )
  {
    return "a slightly injured"; 
  }
  else if( health_pct >= 60 )
  {
    return "a moderately injured"; 
  }
  else if( health_pct >= 40 )
  {
    return "an injured"; 
  }
  else if( health_pct >= 20 )
  {
    return "a seriously injured"; 
  }
  else
  {
    return "a critically injured"; 
  }
};

Actor.prototype.move_to = function( location )
{
  this.location.assign( location );
};

Actor.prototype.add_vector = function( vector )
{
  this.location.add_vector( vector );
};

Actor.prototype.get_melee_damage = function()
{
  // TODO incorporate inventory here
  return this.melee_damage;
};