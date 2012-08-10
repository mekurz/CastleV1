var SPELL_WIDTH = 12;
var AREA_SPELL_WIDTH = TILE_WIDTH * 3;

function SpellToolbar()
{
  SpellToolbar.base_constructor.call( this );
  this.spell_list = ["p1","p2","p3","","","",""];
  
  this.update_toolbar = function()
  {
    for( var ix = 0; ix < this.spell_list.length; ++ix )
    {
      var spell_btn = $("#spell"+ix);
      var html = "";
      var title = "";
      
      if( this.spell_list != "" )
      {
        var xml = Loader.get_spell_data( this.spell_list[ix] );
        var toolbar_img = parseInt( xml.attr("toolbar_id") );
        
        if( !isNaN( toolbar_img ) )
        {
          html = "<img src=\"" + Images.SPELL_IMAGES[toolbar_img].src + "\"/>";
          title = ( ix + 1 ) + " - " + xml.find("Description").text();
        }
      }
      
      if( html == "" )
      {
        html = "<img src=\"images/blank.png\"/>";
        spell_btn.button("toggle");
      }
      
      spell_btn.empty().html( html ).attr( "title", title );
    }
  };
  
  this.get_button_ix = function( spell_id )
  {
    for( var ix = 0; ix < this.spell_list.length; ++ix )
    {
      if( this.spell_list[ix] == spell_id )
        return ix;
    }
    
    return -1;
  };
}
extend( SpellToolbar, Serializable );

function cast_spell( btn_ix )
{
  if( !is_processing() && SpellBar.spell_list[btn_ix] != "" && SpellBar.spell_list[btn_ix] != undefined  )
  {
    if( get_command() != NO_COMMAND )
    {      
      cancel_action();
    }
	  
    crosshairs_cursor();
    set_command( SpellBar.spell_list[btn_ix] );
    toggle_spell( btn_ix );
  }
}

function toggle_spell( btn_ix )
{
  $("#spell" + btn_ix).button("toggle");
}

function create_spell( spell_id, source_actor, target )
{
  var xml = Loader.get_spell_data( spell_id );
  var type = xml.parent()[0].nodeName.toLowerCase();
  var success = false;
  
  if( type == "projectile" )
  {
    success = add_spell_effect( new ProjectileSpellEffect( xml.attr("projectile_id"), source_actor.location, target ),  new Spell( spell_id, source_actor, target ) );
  }
  else if( type == "areaeffect" )
  {
    success = add_spell_effect( new AreaSpellEffect( xml.attr("projectile_id"), xml.attr("area_id"), source_actor.location, target ),  new AreaEffectSpell( spell_id, source_actor, target ) );
  }
  else if( type == "coneeffect" )
  {
    success = process_cone_spell( xml, source_actor, target );
  }
  else if( type == "utility" )
  {
    if( spell_id == "u1" )
    {
      success = add_spell_effect( new ProjectileSpellEffect( xml.attr("projectile_id"), source_actor.location, target ),  new LightSpell( spell_id, source_actor, target ) );
    }
  }
  else
  {
    Log.debug( "Unrecognized command." );
  }
  
  return success;
}

function add_spell_effect( effect, spell )
{
  if( spell != undefined )
  {
    effect.set_spell_action( spell );  
  }
    
  if( spell == undefined || spell.consume_mana() )
  {
    document.game.animation_queue.push( effect );
    return true;
  }
  
  return false;
}

function draw_spells_for_interval( ctx )
{
  //Log.debug( "Spell draw loop" );
  
  for( var x = document.game.animation_queue.length - 1; x >= 0; --x )
  {
    document.game.animation_queue[x].draw( ctx );
    
    if( document.game.animation_queue[x].is_finished() )
    {
      //Log.debug( "Spell " + document.game.animation_queue[x].spell_id + " is finished!" );
      document.game.animation_queue[x].resolve();
      document.game.animation_queue[x] = null;
      document.game.animation_queue.splice( x, 1 );    
    }
  }
}

function process_cone_spell( xml, source_actor, target )
{
  var vector = source_actor.location.get_unit_vector( target );
  target.assign( source_actor.location );
  target.add_vector( vector );
  
  if( vector.neither_coord_is_zero() )  
  {
    add_spell_effect( new DiagonalConeSpellEffect( xml.attr("diagonal_id"), source_actor.location, target ), new ConeEffectSpell( xml.attr("id"), source_actor, target ) );
  }
  else
  {
    add_spell_effect( new ConeSpellEffect( xml.attr("cardinal_id"), source_actor.location, target ), new ConeEffectSpell( xml.attr("id"), source_actor, target ) );
  }
  
  return true;
}

function Spell( spell_id, source_actor, target_tile )
{
  this.spell_id = spell_id;
  this.source_actor = source_actor;
  this.target_tile = new Point( target_tile.x, target_tile.y );
  this.load_from_xml();
}

Spell.prototype.load_from_xml = function()
{
  var xml = Loader.get_spell_data( this.spell_id );

  this.description = xml.find("Description").text();
  this.mana_cost   = xml.find("Mana").text();
  this.damage      = xml.find("Damage").text();
  this.splash      = xml.find("Splash").text();
  this.verb        = xml.find("Verb").text();
  this.action      = xml.find("Action").text();
};

Spell.prototype.consume_mana = function()
{
  // Can't cast the spell if the actor doesn't have enough mana (only a problem for Player)
  if( this.source_actor.current_mana >= this.mana_cost )
  {
    this.source_actor.current_mana -= this.mana_cost;
    return true;
  }
  else
  {
    Log.add( "You do not have enough mana to cast " + this.description + "!" );
    set_finished();
    return false;
  }
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
      if( target_item.is_monster )
      {
        Log.add( "The " + this.source_actor.description + "'s " + this.description + " " + this.verb + " the " + target_item.description + "!" );   // Monster hits monster
      }
      else
      {
        Log.add( "The " + this.source_actor.description + "'s " + this.description + " " + this.verb + " you!" );   // Monster hits player
      }
    }
    else
    {
      if( target_item.is_door )
      {
        Log.add( "Your " + this.description + " blasts open the door!" );
      }
      else
      {
        Log.add( "Your " + this.description + " " + this.verb + " the " + target_item.description + "!" ); // Player hits monster
      }
    }
    
    target_item.damage( this.damage );
  }
};

Spell.prototype.reassign_target = function( new_target )
{
  this.target_tile.assign( new_target ); 
};

function LightSpell( spell_id, source_actor, target_tile )
{
  LightSpell.base_constructor.call( this, spell_id, source_actor, target_tile );
  
  this.light_target = function()
  {
    var map_tiles = Dungeon.get_map_tiles();
    
    if( map_tiles[this.target_tile.y][this.target_tile.x].is_a_room() )
    {
      // Light up and explore the entire room
      var room_id = map_tiles[this.target_tile.y][this.target_tile.x].room_id;
      Dungeon.update_room_tiles( map_tiles, room_id, explore_tile );
      Dungeon.update_room_tiles( map_tiles, room_id, light_tile );
    }
    else
    {
      // Light up the square and its neigbours
      Dungeon.update_adjacent_tiles( map_tiles, this.target_tile, explore_tile );
      Dungeon.update_adjacent_tiles( map_tiles, this.target_tile, light_tile );
    }
  };
}
extend( LightSpell, Spell );

LightSpell.prototype.resolve_miss = function()
{
  this.light_target();
};

LightSpell.prototype.resolve_hit = function()
{
  this.light_target();
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
  else if( target_item.is_door )
  {
    Log.add( "Your " + this.description + " blasts open the door!" );
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
  var map_tiles = Dungeon.get_map_tiles();
  
  for( var row = this.target_tile.y - 1; row <= this.target_tile.y + 1; ++row )
  {
    for( var col = this.target_tile.x - 1; col <= this.target_tile.x + 1; ++col )
    {
      var location = new Point( col, row );
      
      if( row >= 0 && row <= map_tiles.length && col >= 0 && col <= map_tiles[0].length && !this.target_tile.equals( location ) )
      {
        var target_item = Map.get_target_item_in_tile( location );
        
        if( target_item != undefined )
        {
          this.show_hit_message( target_item );
          target_item.damage( this.splash );
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
  else if( target_item.is_door )
  {
    Log.add( "Your " + this.description + " blasts open the door!" );
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
  var map_tiles = Dungeon.get_map_tiles();
  var current_tile = this.get_top_left_for_cone();
  
  for( var row = current_tile.y; row <= current_tile.y + 2; ++row )
  {
    for( var col = current_tile.x; col <= current_tile.x + 2; ++col )
    {
      if( row >= 0 && row <= map_tiles.length && col >= 0 && col <= map_tiles[0].length )
      {
        var target_item = Map.get_target_item_in_tile( new Point( col, row ) );
        
        if( target_item != undefined )
        {
          this.show_hit_message( target_item );
          target_item.damage( this.damage );
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


function MapFadeOut()
{
  MapFadeOut.base_constructor.call( this, 0 );
  this.alpha = 0.0;
}
extend( MapFadeOut, SpellEffect );

MapFadeOut.prototype.is_finished = function()
{
  return this.alpha >= 1.0; 
};

MapFadeOut.prototype.update_frame = function( ctx )
{
  this.alpha = Math.min( 1.0, this.alpha + 0.10 );
  ctx.fillStyle = "rgba(0,0,0," + this.alpha + ")";
};

MapFadeOut.prototype.draw = function( ctx )
{
  ctx.save();
  
  this.update_frame( ctx );
  ctx.fillRect( 0, 0, VIEWPORT_WIDTH * TILE_WIDTH, VIEWPORT_HEIGHT * TILE_WIDTH );
  
  ctx.restore();
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
  this.last_clear_cell = new Point();
  
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
    this.handle_obstacle_collision( current_tile );
    return true;
  }
  else if( this.spell_action != undefined && this.has_collided_with_unexpected_obstacle( current_tile ) )
  {
    this.handle_unexpected_target_collision( current_tile );
    return true;
  }
  
  this.last_clear_cell.assign( current_tile );
  return false;
};

ProjectileSpellEffect.prototype.handle_arrived_at_target = function( current_tile )
{
  this.resolve_hit();
};

ProjectileSpellEffect.prototype.handle_obstacle_collision = function( current_tile )
{
  add_spell_effect( new SinglePointFadingSpellEffect( FIZZLE, new Point( this.canvas_x - (TILE_WIDTH/2), this.canvas_y - (TILE_WIDTH/2) ) ) );
  
  if( this.spell_action )
  {
    this.spell_action.reassign_target( current_tile );
  }
  
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
  var current_item = Map.get_target_item_in_tile( current_tile );
  
  if( current_item != undefined && !current_item.location.equals( this.source ) && !current_item.location.equals( this.spell_action.target_tile ) )
  {
    if( current_item.is_door && current_item.is_open() )    // Open doors do not count as obstacles for projectiles
    {
      return false;
    }
    else
    {
      Log.debug( "Current tile is occupied. Resetting target to " + current_tile.to_string() );
      return true;
    }
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
  add_spell_effect( new ScalingRotatingFadingSpellEffect( this.area_id, this.last_clear_cell ) );
  this.resolve_hit();
};

AreaSpellEffect.prototype.handle_obstacle_collision = function()
{
  add_spell_effect( new ScalingRotatingFadingSpellEffect( this.area_id, this.last_clear_cell ) );
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
