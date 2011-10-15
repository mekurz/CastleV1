var MONSTER_DATA = [ "{\"description\":\"Rat Man\",\"src\":\"ratman.png\",\"location\":null,\"max_hp\":7,\"max_mana\":0,\"ac\":10,\"sight\":3,\"melee_damage\":1}"
                    ,"{\"description\":\"Hill Giant\",\"src\":\"hillgiant.png\",\"location\":null,\"max_hp\":30,\"max_mana\":0,\"ac\":10,\"sight\":6,\"melee_damage\":4,\"spell\":6}" 
                    ];

var monsters = new Array();

function create_monsters()
{
  create_single_monster( RATMAN, new Point(  3, 3 ) );
  create_single_monster( RATMAN, new Point( 10, 2 ) );
  create_single_monster( RATMAN, new Point(  6,14 ) );
  create_single_monster( RATMAN, new Point( 12,14 ) );
  create_single_monster( HILLGIANT, new Point( 19, 9 ) );
}

function create_single_monster( monster_type, location )
{
  var json = MONSTER_DATA[monster_type];
  var monster = new Monster();
  monster.parse_JSON( json );
  monster.move_to( location );
  monster.img = Images.MONSTER_IMAGES[monster_type];

  monster.initialize();
  monsters.push( monster );
}

function draw_monsters( ctx )
{
  for( var i = 0; i < monsters.length; ++i )
  {
    monsters[i].draw( ctx );
  } 
}

function move_monsters( ctx )
{
  if( !FREEZE_MONSTERS )
  {
    for( var i = 0; i < monsters.length; ++i )
    {
      monsters[i].do_move();
    }
  }
}

function get_monster_in_tile( point )
{
  for( var i = 0; i < monsters.length; ++i )
  {
    if( monsters[i].location.equals( point ) )
    {
      return monsters[i];
    }
  } 
  
  return null;
}

function get_monster_ix( monster_id )
{
  for( var i = 0; i < monsters.length; ++i )
  {
    if( monsters[i].id == monster_id )
    {
      return i;
    }
  } 
}

function get_monster_by_id( monster_id )
{
  for( var i = 0; i < monsters.length; ++i )
  {
    if( monsters[i].id == monster_id )
    {
      return monsters[i];
    }
  } 
}

function Monster()
{
  Monster.base_constructor.call( this, Monster.max_monster_id );
  Monster.max_monster_id++;
  this.is_monster = true;
}
extend( Monster, Actor );

Monster.max_monster_id = 0;

Monster.prototype.damage = function( value )
{
  Monster.super_class.damage.call( this, value );
  
  if( this.current_hp <= 0 )
  {
    this.kill(); 
  }
};

Monster.prototype.kill = function()
{
  Log.add( "The " + this.description + " is dead." );
  
  document.game.add_splat( this.location );
  
  monsters.splice( get_monster_ix( this.id ), 1 );
  
  // TODO DROP LOOT, GIVE XP, BLAH BLAH BLAH  
};

Monster.prototype.get_tooltip = function()
{
  var html = "<li>" + this.get_health_term() + " " + this.description;
  html += " (id=" + this.id + ")";  
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
    
    if( Map.does_line_of_sight_exist( this.location, Player.location ) && this.is_location_within_sight( Player.location ) )
    {
      // Monsters that can cast spells have a 50% chance to cast it at the Player instead of moving if they are not adjacent to the player
      if( this.spell != undefined && !this.location.adjacent_to( Player.location ) && ( Math.random() * 100 ) > 50 && MONSTER_SPELLS )
      {
        add_spell_effect( new ProjectileSpellEffect( this.spell, this.location, Player.location ),  new Spell( this.spell, this, Player.location ) );
      }
      else
      {
        // Monster can see Player and moves to attack.
        vector = this.location.get_unit_vector( Player.location );
      }
    }
    else if( ( Math.random() * 100 ) > 50 )   // 50% chance of wandering randomly if they cannot see the player.
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