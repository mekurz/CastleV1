function Actor( id )
{
  Actor.base_constructor.call( this );
  this.id           = id;
  this.description  = "You";
  this.img_id       = 0;
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
extend( Actor, Serializable );

Actor.prototype.initialize = function()
{
  this.current_hp   = this.max_hp;
  this.current_mana = this.max_mana;
};

Actor.prototype.load = function( obj )
{
  Actor.super_class.load.call( this, obj );
  this.location = Storage.load_point( obj.location );
};

Actor.prototype.draw = function( ctx )
{
  if( this.should_draw_actor() )
  {
    var view_pos = Map.translate_map_coord_to_viewport( this.location );
    
    if( Dungeon.is_location_lit_unexplored( this.location ) )
    {
      Map.draw_single_tile( view_pos.y, view_pos.x, ctx, true );
    }
    
    var img_loc = convert_tile_ix_to_point( this.img_id );
    ctx.drawImage( Images.MONSTER_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ), TILE_WIDTH, TILE_WIDTH );
  }   
};

Actor.prototype.should_draw_actor = function()
{
  // Draw Actor if:
  //  - its location is in the viewport
  //  - it is on a lit tile OR directly adjacent to the Player
  //  - line of sight exists (leave to the end since it is the most expensive check)
  return DETECT_MONSTERS || 
         ( Map.is_location_visible( this.location )
      && ( Dungeon.is_location_lit( this.location ) || this.location.adjacent_to( Player.location ) ) 
      && Map.does_line_of_sight_exist( Player.location, this.location ) );
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

var STR = 0;
var INT = 1;
var DEX = 2;
var CON = 3;
var NUM_STATS = 4;

function PlayerActor()
{
  PlayerActor.base_constructor.call( this, "man" );
  PlayerActor.super_class.initialize.call( this );
  
  this.bag = new Array();
  this.spellbook = new Array();
  this.level = 1;
  this.xp    = 12345;  // TODO TEMP VALUE
  this.ac    = 100;    // TODO TEMP VALUE
  this.stats = [ new CharStat(), new CharStat(), new CharStat(), new CharStat() ];
    
  // TODO: THESE ARE TEMPORARY SETTINGS
  this.max_hp = 10;
  this.current_hp = this.max_hp;
  this.max_mana = 15;
  this.current_mana = this.max_mana;
  // TODO END TEMPORARY
  
  this.draw = function( ctx )
  {
    DrawPlayer.draw( ctx );
  };
  
  this.damage = function( value )
  {
    PlayerActor.super_class.damage.call( this, value );
    this.update_hp();
  };
  
  this.update_stats = function()
  {
    this.update_hp();
    this.update_mana();
  };
  
  this.update_hp = function( id )
  {
    var div = "#" + ( id == undefined ? "hp" : id );
    
    $(div).text( this.current_hp + "/" + this.max_hp );
    $(div).css( "color", ( this.current_hp / this.max_hp ) <= 0.25 ? "red" : "#333" );
  };
  
  this.update_mana = function( id )
  {
    $("#" + ( id == undefined ? "mana" : id )).text( this.current_mana + "/" + this.max_mana );
  };
  
  function get_main_stat_ix( stat )
  {
    if( stat == "str" )
      return STR;
    if( stat == "int" )
      return INT;
    else if( stat == "dex" )
      return DEX;
    else if( stat == "con" )
      return CON;
    else
    {
      Log.debug( "Invalid stat requested: " + stat );
      return NUM_STATS; // Error case
    }
  }
  
  function apply_single_stat_change( actor, stat, value, callback )
  {
    var stat_ix = get_main_stat_ix( stat );
    
    if( stat_ix != NUM_STATS )
    {
      actor.stats[stat_ix].current_value = callback( actor.stats[stat_ix].current_value, value );
      // TODO LIKELY NEED TO MAKE SOME CHANGES HERE TO HANDLE MAX STAT CHANGING (I.E FOR CURSES )
    }
  }
  
  function apply_stat_changes( actor, xml, callback )
  {
    xml.children().each( function() {
      var $this = $(this);
      var stat = $this[0].nodeName.toLowerCase();
      var value = parseInt( $this.text() );
      apply_single_stat_change( actor, stat, value, callback );
    });
  }
  
  this.apply_effect = function( xml )
  {
    apply_stat_changes( this, xml, add_stat );
  };
  
  this.remove_effect = function( xml )
  {
    apply_stat_changes( this, xml, remove_stat );
  };
}
extend( PlayerActor, Actor );

function add_stat   ( a, b ) { return a + b; }
function remove_stat( a, b ) { return a - b; }

PlayerActor.prototype.load = function( obj )
{
  PlayerActor.super_class.load.call( this, obj );
  this.bag = Storage.load_collection( obj.bag, Item );
};

function CharStat()
{
  this.current_value = 0;  // Current value (base stat +/- effects)
  this.base_value    = 0;  // Base stat (remains constant except when levelling up)
}

