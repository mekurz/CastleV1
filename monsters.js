var MONSTER_DATA = [ "{\"description\":\"Rat Man\",\"src\":\"ratman.png\",\"location\":null,\"max_hp\":10,\"max_mana\":0,\"ac\":10}"
                     
                    ];

var monsters = new Array();

function create_monsters()
{
  create_single_monster( RATMAN, new Point(  3, 3 ) );
  create_single_monster( RATMAN, new Point( 10, 2 ) );
  create_single_monster( RATMAN, new Point(  7, 5 ) );
  create_single_monster( RATMAN, new Point(  8, 5 ) );
  create_single_monster( RATMAN, new Point( 19, 9 ) );
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
  for( var i = 0; i < monsters.length; ++i )
  {
    monsters[i].do_move();
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

Monster.prototype.do_move = function()
{
  if( Map.is_location_visible( this.location ) )
  {
    var vector = new Point();
    vector.x += Math.floor( Math.random() * 3 ) - 1;    // FOR NOW, JUST MOVE MONSTERS RANDOMLY
    vector.y += Math.floor( Math.random() * 3 ) - 1;
    
    if( vector.neither_coord_is_zero() )
    {
      Log.debug( "Monster " + this.id + " attempting to advance " + vector.to_string() );
      var move = new Movement().move_actor_with_vector( this, vector );
    }
    else
    {
      Log.debug( "Monster " + this.id + " is too lazy to move." ); 
    }
  }
  else
  {
    Log.debug( "Monster " + this.id + " not visible. Not moving." ); 
  }
};