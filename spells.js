var SPELL_WIDTH = 12;
var AREA_SPELL_WIDTH = 144;
var SPELL_BOUNDING = ( TILE_WIDTH - SPELL_WIDTH ) / 2;

var SPELL_DATA =  [  "{\"description\":\"Death Splat\",\"src\":\"splat.png\"}"
                    ,"{\"description\":\"Spell Fizzle\",\"src\":\"fizzle.png\"}"
                    ,"{\"description\":\"Magic Missile\",\"src\":\"missile.png\",\"mana_cost\":1,\"damage\":2,\"verb\":\"slams into\"}"
                    ,"{\"description\":\"Lightning Bolt\",\"src\":\"lightning.png\",\"mana_cost\":2,\"damage\":4,\"verb\":\"fries\"}"
                    ,"{\"description\":\"Firebolt\",\"src\":\"firebolt.png\",\"mana_cost\":4,\"damage\":7,\"verb\":\"scorches\"}"
                    ,"{\"description\":\"Fireball\",\"src\":\"fireball.png\",\"mana_cost\":8,\"damage\":10,\"splash\":5,\"verb\":\"engulfs\"}"
                    ,"{\"description\":\"Boulder\",\"src\":\"boulder.png\",\"mana_cost\":0,\"damage\":4,\"verb\":\"crashes into\",\"action\":\"hurls\"}"
                    ,"{\"description\":\"Fire Breath\",\"src\":\"cone_fire.png\",\"mana_cost\":0,\"damage\":10,\"splash\":5,\"verb\":\"blasts\"}"
                    ,"{\"description\":\"Fire Breath\",\"src\":\"cone_fire_d.png\",\"mana_cost\":0,\"damage\":8,\"verb\":\"blasts\"}"
                  ];



function cast_spell( spell )
{
	if( !is_processing() )
	{
	  crosshairs_cursor();
	  set_command( spell );
	}
}

function add_spell_effect( effect, spell )
{
  // TODO Do mana check here.
  if( spell != undefined )
  {
    effect.set_spell_action( spell );  
  }
  
  //Log.debug( "Adding new effect for spell " + effect.spell_id );
  document.game.animation_queue.push( effect );
}

function draw_spells_for_interval( ctx )
{
  //Log.debug( "Spell draw loop" );
  
  for( var x = document.game.animation_queue.length - 1; x >= 0; --x )
  {
    document.game.animation_queue[x].draw( ctx );
    
    if( document.game.animation_queue[x].is_finished() )
    {
      Log.debug( "Spell " + document.game.animation_queue[x].spell_id + " is finished!" );
      document.game.animation_queue[x].resolve();
      document.game.animation_queue[x] = null;
      document.game.animation_queue.splice( x, 1 );    
    }
  }
}

function process_cone_spell( spell_id, source_actor, target )
{
  var vector = source_actor.location.get_unit_vector( target );
  target.assign( source_actor.location );
  target.add_vector( vector );
  
  if( vector.neither_coord_is_zero() )  
  {
    add_spell_effect( new DiagonalConeSpellEffect( spell_id + 1, source_actor.location, target ), new ConeEffectSpell( spell_id, source_actor, target ) );
  }
  else
  {
    add_spell_effect( new ConeSpellEffect( spell_id, source_actor.location, target ), new ConeEffectSpell( spell_id, source_actor, target ) );
  }
}

function Spell( spell_id, source_actor, target_tile )
{
  this.spell_id = spell_id;
  this.source_actor = source_actor;
  this.target_tile = new Point( target_tile.x, target_tile.y );
  this.parse_JSON( SPELL_DATA[this.spell_id] );
}

Spell.prototype.parse_JSON = function( json )
{
  var obj = $.evalJSON( json );
  this.description = obj.description;
  this.mana_cost   = obj.mana_cost;
  this.damage      = obj.damage;
  this.splash      = obj.splash;
  this.verb        = obj.verb;
  this.action      = obj.action;
};

Spell.prototype.resolve_miss = function()
{
  // Monsters can't miss with spells (yet) so no need to add anything here right now.
  Log.add( "Your " + this.description + " hits an obstacle and fizzles!" ); 
};

Spell.prototype.resolve_hit = function()
{
  var target_item = Map.get_target_item_in_tile( this.target_tile );

  if( target_item == undefined )
  {
    Log.add( "Your " + this.description + " hits nothing." ); // Spell targeted an empty tile
  }
  else
  {
    if( this.source_actor.is_monster )
    {
      Log.add( "The " + this.source_actor.description + "'s " + this.description + " " + this.verb + " you!" );   // Monster hits player
    }
    else
    {
      Log.add( "Your " + this.description + " " + this.verb + " the " + target_item.description + "!" ); // Player hits monster
    }
    
    target_item.damage( this.damage );
  }
};

Spell.prototype.reassign_target = function( new_target )
{
  this.target_tile.assign( new_target ); 
};

function AreaEffectSpell( spell_id, source_actor, target_tile )
{
  AreaEffectSpell.base_constructor.call( this, spell_id, source_actor, target_tile );
}
extend( AreaEffectSpell, Spell );

AreaEffectSpell.prototype.show_no_primary_target_message = function()
{
  // Monsters can't miss with spells (yet) so no need to add anything here right now.
  Log.add( "Your " + this.description + " explodes in mid-air!" );
};

AreaEffectSpell.prototype.show_hit_message = function( target_item )
{
  if( target_item.is_monster )
  {
    Log.add( "Your " + this.description + " " + this.verb + " the " + target_item.description + "!" );  // Player hits monster
  }
  else
  {
    if( this.source_actor.is_monster )
    {
      Log.add( "The " + this.source_actor.description + "'s " + this.description + " " + this.verb + "you!" ); // Monster hits player
    }
    else
    {
      Log.add( "You are caught in the blast from your own " + this.description + "!" );  // Player hits self
    }
  }
};

AreaEffectSpell.prototype.resolve_miss = function()
{
  this.show_no_primary_target_message();
  this.resolve_splash();
};

AreaEffectSpell.prototype.resolve_hit = function()
{
  var target_item = Map.get_target_item_in_tile( this.target_tile );

  if( target_item == undefined )
  {
    this.show_no_primary_target_message();
  }
  else
  {
    this.show_hit_message( target_item );
    target_item.damage( this.damage );
  }
  
  this.resolve_splash();
};

AreaEffectSpell.prototype.resolve_splash = function()
{
  for( var y = this.target_tile.y - 1; y <= this.target_tile.y + 1; y++ )
  {
    if( y >= 0 && y <= map_tiles.length )
    {
      for( var x = this.target_tile.x - 1; x <= this.target_tile.x + 1; x++ )
      {
        if( x >= 0 && x <= map_tiles[0].length && !( x == this.target_tile.x && y == this.target_tile.y ) )
        {
          var target_item = Map.get_target_item_in_tile( new Point( x, y ) );
          
          if( target_item != undefined )
          {
            this.show_hit_message( target_item );
            target_item.damage( this.splash );
          }
        }
      }
    }
  }
};

function ConeEffectSpell( spell_id, source_actor, target_tile )
{
  ConeEffectSpell.base_constructor.call( this, spell_id, source_actor, target_tile );
  
  this.num_hits = 0;
}
extend( ConeEffectSpell, Spell );

ConeEffectSpell.prototype.show_no_primary_target_message = function()
{
  // Monsters can't miss with spells (yet) so no need to add anything here right now.
  Log.add( "Your " + this.description + " hits nothing!" );
};

ConeEffectSpell.prototype.show_hit_message = function( target_item )
{
  if( target_item.is_monster )
  {
    Log.add( "Your " + this.description + " " + this.verb + " the " + target_item.description + "!" );  // Player hits monster
  }
  else if( this.source_actor.is_monster )
  {
    Log.add( "The " + this.source_actor.description + "'s " + this.description + " " + this.verb + "you!" ); // Monster hits player
  }
};

ConeEffectSpell.prototype.resolve_miss = function()
{
  // Cones don't miss.
};

ConeEffectSpell.prototype.resolve_hit = function()
{
  var current_tile = this.get_top_left_for_cone();
  
  for( var y = current_tile.y; y <= current_tile.y + 2; y++ )
  {
    if( y >= 0 && y <= map_tiles.length )
    {
      for( var x = current_tile.x; x <= current_tile.x + 2; x++ )
      {
        if( x >= 0 && x <= map_tiles[0].length )
        {
          var target_item = Map.get_target_item_in_tile( new Point( x, y ) );
          
          if( target_item != undefined )
          {
            this.show_hit_message( target_item );
            target_item.damage( this.splash );
          }
        }
      }
    }
  }
};

ConeEffectSpell.prototype.get_top_left_for_cone = function()
{
  var top_left = this.source_actor.location.get_unit_vector( this.target_tile );
  top_left.x = this.adjust_cone_vector_coord( top_left.x );
  top_left.y = this.adjust_cone_vector_coord( top_left.y );
  top_left.add_vector( this.source_actor.location );
  
  return top_left;
};

ConeEffectSpell.prototype.adjust_cone_vector_coord = function( value )
{
  if( value < 0 )
  {
    value = -3; 
  }
  else if( value == 0 )
  {
    value = -1; 
  }

  return value; 
};

//
//
// ANIMATIONS BELOW HERE
//
//

function SpellEffect( spell_id )
{
  this.spell_id = spell_id;
  this.canvas_x = 0;
  this.canvas_y = 0;
  this.img = Images.SPELL_IMAGES[spell_id];
}

SpellEffect.prototype.set_spell_action = function( spell_action )
{
  this.spell_action = spell_action;
};

SpellEffect.prototype.draw = function( ctx )
{
  ctx.save();
  
  //Log.debug( "Drawing frame for spell " + this.spell_id );
  this.update_frame( ctx );
  ctx.drawImage( this.img, this.canvas_x, this.canvas_y );
  
  ctx.restore();
};

// Overload this function to define how the animation knows if it is done.
SpellEffect.prototype.is_finished = function()
{
  return true; 
};

// Overload this function to update animation details before we draw this particular spell effect.
SpellEffect.prototype.update_frame = function( ctx )
{
  return; 
};

// Overload this function to perform any actions when the spell finishes (i.e. chaining effects)
SpellEffect.prototype.resolve = function()
{
  return; 
};

SpellEffect.prototype.resolve_miss = function()
{
  if( this.spell_action != undefined )
  {
    this.spell_action.resolve_miss(); 
  }
};

SpellEffect.prototype.resolve_hit = function()
{
  if( this.spell_action != undefined )
  {
    this.spell_action.resolve_hit(); 
  }
};

function SinglePointFadingSpellEffect( spell_id, raw_target )
{
  SinglePointFadingSpellEffect.base_constructor.call( this, spell_id );
  this.alpha      = 1.0;
  
  this.canvas_x = raw_target.x;
  this.canvas_y = raw_target.y;
}
extend( SinglePointFadingSpellEffect, SpellEffect );

SinglePointFadingSpellEffect.prototype.is_finished = function()
{
  return this.alpha <= 0.0; 
};

SinglePointFadingSpellEffect.prototype.update_frame = function( ctx )
{
  this.alpha = Math.max( 0, this.alpha - 0.15 );
  ctx.globalAlpha = this.alpha;
};

function SinglePointRotatingFadingSpellEffect( spell_id, raw_target )
{
  SinglePointRotatingFadingSpellEffect.base_constructor.call( this, spell_id, raw_target );
  this.angle = 0;
  this.target_x = 0;
  this.target_y = 0;
}
extend( SinglePointRotatingFadingSpellEffect, SinglePointFadingSpellEffect );

SinglePointRotatingFadingSpellEffect.prototype.update_frame = function( ctx )
{
  SinglePointFadingSpellEffect.prototype.update_frame.call( this, ctx );
  
  this.angle += 5;
  ctx.translate( this.canvas_x, this.canvas_y );
  ctx.rotate( this.angle * Math.PI / 180 );
};

SinglePointRotatingFadingSpellEffect.prototype.draw = function( ctx )
{
  ctx.save();
  
  this.update_frame( ctx );
  ctx.drawImage( this.img, -(TILE_WIDTH/2), -(TILE_WIDTH/2), TILE_WIDTH, TILE_WIDTH );
  
  ctx.restore();
};

function Splat( target )
{
  var view_pos = new Point();
  view_pos.assign( target );
  view_pos.convert_to_raw_tile_center();
  
  Splat.base_constructor.call( this, SPLAT, view_pos );
}
extend( Splat, SinglePointRotatingFadingSpellEffect );


function ProjectileSpellEffect( spell_id, source, target )
{
  this.MAX_VELOCITY = 15;
  this.MIN_VELOCITY = 3;
  this.ACCELERATION = 2;
  
  ProjectileSpellEffect.base_constructor.call( this, spell_id );
  this.source = new Point( source.x, source.y );
  this.target = new Point( target.x, target.y );
  
  this.raw_source = new Point( this.source.x, this.source.y );
  this.raw_source.convert_to_raw_tile_center();
  
  this.raw_target = new Point( this.target.x, this.target.y );
  this.raw_target.convert_to_raw_tile_center();
  
  this.canvas_x = this.raw_source.x;
  this.canvas_y = this.raw_source.y;
  
  this.dx = this.raw_target.x - this.raw_source.x;
  this.dy = this.raw_target.y - this.raw_source.y;
  this.rotation = this.get_spell_rotation();
  
  this.distance = this.raw_source.distance_to( this.raw_target );
  this.velocity = this.MIN_VELOCITY;
  
  this.slope_x = this.dx / this.distance;
  this.slope_y = this.dy / this.distance;
  
  //Log.debug( "slope_x = " + this.slope_x + "  slope_y = " + this.slope_y );
  //Log.debug( "rotation = " + this.rotation );
  //Log.debug( "angle = " + this.angle );
}
extend( ProjectileSpellEffect, SpellEffect );

ProjectileSpellEffect.prototype.is_finished = function()
{
  var current_tile = new Point( this.canvas_x, this.canvas_y );
  current_tile.convert_to_tile_coord();
  
  if( this.distance <= 0 )
  {
    this.handle_arrived_at_target( current_tile );
    return true; 
  }
  else if( this.has_collided_with_map_obstacle( current_tile ) )
  {   
    this.handle_obstacle_collision();
    return true;
  }
  else if( this.spell_action != undefined && this.has_collided_with_unexpected_obstacle( current_tile ) )
  {
    this.handle_unexpected_target_collision( current_tile );
    return true;
  }
  
  return false;
};

ProjectileSpellEffect.prototype.handle_arrived_at_target = function( current_tile )
{
  this.resolve_hit();
};

ProjectileSpellEffect.prototype.handle_obstacle_collision = function()
{
  add_spell_effect( new SinglePointFadingSpellEffect( FIZZLE, new Point( this.canvas_x - (TILE_WIDTH/2), this.canvas_y - (TILE_WIDTH/2) ) ) );
  this.resolve_miss();
};

ProjectileSpellEffect.prototype.handle_unexpected_target_collision = function( current_tile )
{
  this.spell_action.reassign_target( current_tile );
  this.resolve_hit();
};

ProjectileSpellEffect.prototype.update_frame = function( ctx )
{
  this.update_velocity();
  this.update_distance_remaining();
  this.update_canvas_location();
  
  ctx.translate( this.canvas_x, this.canvas_y );
  ctx.rotate( this.rotation * Math.PI / 180 );
};

ProjectileSpellEffect.prototype.update_velocity = function()
{
  if( this.velocity < this.MAX_VELOCITY )
  {
    this.velocity = Math.min( this.velocity + this.ACCELERATION, this.MAX_VELOCITY );
  }

  return this.velocity;
};

ProjectileSpellEffect.prototype.update_distance_remaining = function()
{
  this.distance -= this.velocity;
  //Log.debug( "distance remaining = " + this.distance );
};

ProjectileSpellEffect.prototype.update_canvas_location = function()
{
  this.canvas_x += ( this.slope_x * this.velocity );
  this.canvas_y += ( this.slope_y * this.velocity );
};

ProjectileSpellEffect.prototype.draw = function( ctx )
{
  ctx.save();
  
  this.update_frame( ctx );
  ctx.drawImage( this.img, -(TILE_WIDTH/2), -(TILE_WIDTH/2) );
  
  ctx.restore();
};

ProjectileSpellEffect.prototype.get_spell_rotation = function()
{
  if( Math.abs( this.dx ) > Math.abs( this.dy ) )
  {
    return this.dx <= 0 ? 0 : 180;
  }
  else
  {
    return this.dy <= 0 ? 90 : 270;
  }
};

ProjectileSpellEffect.prototype.has_collided_with_map_obstacle = function( current_tile )
{
  if( !Map.is_valid_move( current_tile ) )
  {      
    Log.debug( "Map collision detected with " + current_tile.to_string() );
    return true; 
  }
 
  return false;
};

ProjectileSpellEffect.prototype.has_collided_with_unexpected_obstacle = function( current_tile )
{
  var current_item = Movement.is_target_tile_occupied( current_tile );
  
  if( current_item != undefined && !current_item.location.equals( this.source ) && !current_item.location.equals( this.spell_action.target_tile ) )
  {
    Log.debug( "Current tile is occupied. Resetting target to " + current_tile.to_string() );
    return true;
  }
  
  return false;
};

function ScalingRotatingFadingSpellEffect( spell_id, target )
{
  var view_pos = new Point();
  view_pos.assign( target );
  view_pos.convert_to_raw_tile_center();
  
  this.scale = 0.25;
  this.alpha = 0;
  
  ScalingRotatingFadingSpellEffect.base_constructor.call( this, spell_id, view_pos );
}
extend( ScalingRotatingFadingSpellEffect, SinglePointRotatingFadingSpellEffect );

ScalingRotatingFadingSpellEffect.prototype.is_finished = function()
{
  return this.angle >= 180; 
};

ScalingRotatingFadingSpellEffect.prototype.update_frame = function( ctx )
{
  this.update_scale();
  this.update_angle();
  
  ctx.translate( this.canvas_x, this.canvas_y );
  ctx.scale( this.scale, this.scale );
  ctx.rotate( this.angle * Math.PI / 180 );
};

ScalingRotatingFadingSpellEffect.prototype.draw = function( ctx )
{
  ctx.save();
  
  this.update_frame( ctx );
  ctx.drawImage( this.img, -(AREA_SPELL_WIDTH/2), -(AREA_SPELL_WIDTH/2) );
  
  ctx.restore();
};

ScalingRotatingFadingSpellEffect.prototype.update_scale = function()
{
  this.scale = Math.min( 1.0, this.scale + 0.05 );
};

ScalingRotatingFadingSpellEffect.prototype.update_angle = function()
{
  this.angle += 10;
};

function AreaSpellEffect( projectile_id, area_id, source, target )
{
  AreaSpellEffect.base_constructor.call( this, projectile_id, source, target );
  this.area_id = area_id;
}
extend( AreaSpellEffect, ProjectileSpellEffect );

AreaSpellEffect.prototype.handle_arrived_at_target = function( current_tile )
{
  add_spell_effect( new ScalingRotatingFadingSpellEffect( this.area_id, current_tile ) );
  this.resolve_hit();
};

AreaSpellEffect.prototype.handle_obstacle_collision = function()
{
  // MEK TODO aoe spells need to blow up in the previous tile they were in, NOT the tile they encounter an obstacle
  var target = new Point( this.canvas_x, this.canvas_y );
  target.convert_to_tile_coord();
  add_spell_effect( new ScalingRotatingFadingSpellEffect( this.area_id, target ) );
  this.resolve_miss();
};

AreaSpellEffect.prototype.handle_unexpected_target_collision = function( current_tile )
{
  add_spell_effect( new ScalingRotatingFadingSpellEffect( this.area_id, current_tile ) );
  this.spell_action.reassign_target( current_tile );
  this.resolve_hit();
};

function ConeSpellEffect( spell_id, source, target )
{
  ConeSpellEffect.base_constructor.call( this, spell_id );
  
  this.GROWTH_RATE = 4;
  
  this.source = new Point( source.x, source.y );
  this.target = new Point( target.x, target.y );
  
  this.raw_target = new Point( this.target.x, this.target.y );
  this.raw_target.convert_to_raw_tile_center();
  
  this.canvas_x = this.raw_target.x;
  this.canvas_y = this.raw_target.y;
  
  this.scale = 0;
  this.alpha = 0.40;
  this.size = TILE_WIDTH;
  this.angle = this.get_spell_rotation();
}
extend( ConeSpellEffect, SpellEffect );

ConeSpellEffect.prototype.is_finished = function()
{
  if( this.scale >= 1.0 )
  {
    this.resolve_hit();
    return true;
  }
  
  return false;
};

ConeSpellEffect.prototype.update_frame = function( ctx )
{
  this.update_alpha( ctx );
  this.update_position();
  this.update_scale();
  
  ctx.translate( this.canvas_x, this.canvas_y );
  ctx.scale( this.scale, this.scale );
  ctx.rotate( this.angle * Math.PI / 180 );
};

ConeSpellEffect.prototype.update_alpha = function( ctx )
{
  this.alpha = Math.min( 1.0, this.alpha + 0.08 );
  ctx.globalAlpha = this.alpha;
};

ConeSpellEffect.prototype.update_position = function()
{
  switch( this.angle )
  {
    case 0:
      this.canvas_y -= this.GROWTH_RATE/2;
      break;
    case 180:
      this.canvas_y += this.GROWTH_RATE/2;
      break;
    case 90:
      this.canvas_x += this.GROWTH_RATE/2;
      break;
    case 270:
      this.canvas_x -= this.GROWTH_RATE/2;
      break;
  }
};

ConeSpellEffect.prototype.update_scale = function()
{  
  this.size += this.GROWTH_RATE;
  this.scale = this.size / AREA_SPELL_WIDTH;
};

ConeSpellEffect.prototype.draw = function( ctx )
{
  ctx.save();
  
  this.update_frame( ctx );
  ctx.drawImage( this.img, -(AREA_SPELL_WIDTH/2), -(AREA_SPELL_WIDTH/2) );
 
  ctx.restore();
};

ConeSpellEffect.prototype.get_spell_rotation = function()
{
  var direction = this.source.get_unit_vector( this.target );
  
  if( Math.abs( direction.x ) > Math.abs( direction.y ) )
  {
    return direction.x <= 0 ? 270 : 90;
  }
  else
  {
    return direction.y <= 0 ? 0 : 180;
  }
};

function DiagonalConeSpellEffect( spell_id, source, target )
{
  DiagonalConeSpellEffect.base_constructor.call( this, spell_id, source, target );
  
}
extend( DiagonalConeSpellEffect, ConeSpellEffect );

DiagonalConeSpellEffect.prototype.get_spell_rotation = function()
{
  var direction = this.source.get_unit_vector( this.target );
  
  if( direction.x >= 0 )
  {
    return direction.y >= 0 ? 90 : 0;
  }
  else
  {
    return direction.y <= 0 ? 270 : 180;
  }
};

DiagonalConeSpellEffect.prototype.update_position = function()
{
  switch( this.angle )
  {
    case 0:
      this.canvas_y -= this.GROWTH_RATE/2;
      this.canvas_x += this.GROWTH_RATE/2;
      break;
    case 180:
      this.canvas_y += this.GROWTH_RATE/2;
      this.canvas_x -= this.GROWTH_RATE/2;
      break;
    case 90:
      this.canvas_y += this.GROWTH_RATE/2;
      this.canvas_x += this.GROWTH_RATE/2;
      break;
    case 270:
      this.canvas_y -= this.GROWTH_RATE/2;
      this.canvas_x -= this.GROWTH_RATE/2;
      break;
  }
};
