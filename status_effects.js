var STATUS_EFFECT_TYPE_POISON = 0;
var STATUS_EFFECT_TYPE_PASSIVE_BUFF = 1;
var STATUS_EFFECT_TYPE_PASSIVE_DEBUFF = 2;

function StatusEffectsManager()
{
  this.effects = [];
  
  function get_label_color( type )
  {
    switch( type )
    {
      case STATUS_EFFECT_TYPE_POISON:         return "label-success";
      case STATUS_EFFECT_TYPE_PASSIVE_DEBUFF: return "label-important";
      case STATUS_EFFECT_TYPE_PASSIVE_BUFF: 
      default:                                return "label-info";
    };
  }
  
  function create_label( div, effect )
  {
    $(div).prepend( "<span id=\"effect" + effect.id + "\" class=\"label " + get_label_color( effect.type ) + "\">" + effect.description + "</span>" ); 
  }
  
  this.add_effect_no_start = function( effect )
  {
    this.effects.unshift( effect );
    
    if( effect.target_id == "man" )
    {
      create_label( "#effects", effect );
    }
  };
  
  this.add_effect = function( effect )
  {
    this.add_effect_no_start( effect );    
    effect.start();
  };
  
  this.remove_effect = function( ix )
  {
    var effect = this.effects[ix];
    effect.finish();
    $("#effect" + effect.id).remove();
    this.effects.remove( ix );
  };
  
  this.remove_effects_for_target = function( target_id )
  {
    for( var ix = this.effects.length - 1; ix >= 0; --ix )
    {
      if( this.effects[ix].target_id == target_id )
      {
        this.effects.remove( ix );
      }
    }
  };
  
  this.replace_effect = function( old_effect, new_effect )
  {
    for( var ix = 0; ix < this.effects.length; ++ix )
    {
      if( this.effects[ix].id == old_effect.id )
      {
        new_effect.id = old_effect.id;
        this.effects[ix] = new_effect;
        break;
      }
    }
  };
  
  this.run_effects = function( clock )
  {
    for( var ix = this.effects.length - 1; ix >= 0; --ix )
    {
      this.effects[ix].tick();
      
      if( clock.time >= this.effects[ix].finish_time )
      {
        this.remove_effect( ix );        
      }
    }
  };
  
  this.get_existing_effect_for_target = function( target_id, status_id, type )
  {
    for( var ix = 0; ix < this.effects.length; ++ix )
    {
      if( this.effects[ix].target_id == target_id && this.effects[ix].type == type && ( type == STATUS_EFFECT_TYPE_POISON || this.effects[ix].status_id == status_id ) )
      {
        return this.effects[ix];
      }
    }
    
    return null;
  };
  
  this.load = function( obj )
  {
    this.effects = [];
    $("#effects").empty();
    if( obj == undefined ) return;
    
    for( var ix = obj.length - 1; ix >= 0; --ix )
    {
      var xml = Loader.get_status_effect_data( obj[ix].status_id );
      var effect = null;
      
      switch( obj[ix].type )
      {
        case STATUS_EFFECT_TYPE_POISON:
          effect = new PeriodicDamageStatusEffect( xml ); break;
        case STATUS_EFFECT_TYPE_PASSIVE_BUFF:
        case STATUS_EFFECT_TYPE_PASSIVE_DEBUFF:
          effect = new PassiveStatChangeStatusEffect( xml ); break;
        default:
          effect = new StatusEffect( xml );
      }
      
      effect.load( obj[ix] );
      this.add_effect_no_start( effect );
    }
  };
};

function create_or_replace_status_effect( xml, target_actor, OBJ_TYPE )
{
  var new_effect = new OBJ_TYPE( xml );
  var old_effect = StatusEffects.get_existing_effect_for_target( target_actor.id, new_effect.status_id, new_effect.type );
  new_effect.target_id   = target_actor.id;
  
  if( !old_effect )
  {
    StatusEffects.add_effect( new_effect );
    Log.debug( "Adding new effect." );
  }
  else if( new_effect.is_stronger( old_effect ) )
  {
    StatusEffects.replace_effect( old_effect, new_effect );
    new_effect.start();
    $("#effect" + new_effect.id).text( new_effect.description ); // Update the text on the existing label
    Log.debug( "Upgrading existing effect to stronger version." );
  }
  else if( old_effect.status_id == new_effect.status_id )
  {
    old_effect.reset_time( xml );
    Log.debug( "Extending duration of existing effect." );
  }
}

function create_status_effect( status_id, target_actor )
{
  var xml = Loader.get_status_effect_data( status_id );
  var type = parseInt( xml.attr("type") );
  
  switch( type )
  {
    case STATUS_EFFECT_TYPE_POISON:
      create_or_replace_status_effect( xml, target_actor, PeriodicDamageStatusEffect ); break;
    case STATUS_EFFECT_TYPE_PASSIVE_BUFF:
    case STATUS_EFFECT_TYPE_PASSIVE_DEBUFF:
      create_or_replace_status_effect( xml, target_actor, PassiveStatChangeStatusEffect ); break;
    default:
    {
      var effect = new StatusEffect( xml );
      effect.target_id   = target_actor.id;
      StatusEffects.add_effect( effect );
    }
  }
}

function StatusEffect( xml )
{
  StatusEffect.base_constructor.call( this );
  
  this.reset_time = function( xml )
  {
    this.finish_time = xml.has("Rounds").length ? Time.time + ( parseInt( xml.find("Rounds").text() ) * TIME_STANDARD_MOVE ) : Number.MAX_VALUE;
  };
  
  this.id          = StatusEffect.max_status_id;
  this.status_id   = parseInt( xml.attr("id") );
  this.description = xml.find("Description").text();
  this.type        = parseInt( xml.attr("type") );
  this.finish_time = Number.MAX_VALUE;
  this.target_id   = null;
  
  this.reset_time( xml );
  StatusEffect.max_status_id = Math.max( this.id + 1, StatusEffect.max_status_id + 1 );
}
extend( StatusEffect, Serializable );

StatusEffect.max_status_id = 0;

StatusEffect.prototype.start  = function() {};
StatusEffect.prototype.tick   = function() {};
StatusEffect.prototype.finish = function() {};
StatusEffect.prototype.is_stronger = function( that ) { return false; };

function PeriodicDamageStatusEffect( xml )
{
  PeriodicDamageStatusEffect.base_constructor.call( this, xml );
  
  this.damage = parseInt( xml.find("Damage").text() );
}
extend( PeriodicDamageStatusEffect, StatusEffect );

PeriodicDamageStatusEffect.prototype.start = function()
{
  if( this.target_id == "man" )
  {
    Log.add( "You are affected by " + this.description + "!" );
  }
};

PeriodicDamageStatusEffect.prototype.tick = function()
{
  if( this.target_id == "man" )
  {
    Player.damage( this.damage );
    Log.add( "The " + this.description + " continues to hurt you!" );
  }
  else
  {
    var monster = Dungeon.get_monster_by_id( this.target_id );
    if( monster )
    {
      monster.damage( this.damage );
      Log.add( "The " + this.description + " continues to hurt the " + monster.description + "!" );
    }
  }
};

PeriodicDamageStatusEffect.prototype.finish = function()
{
  if( this.target_id == "man" )
  {
    Log.add( "The effects of the " + this.description + " wear off." );
  }
};

PeriodicDamageStatusEffect.prototype.is_stronger = function( that )
{
  return this.damage > that.damage;
};

function PassiveStatChangeStatusEffect( xml )
{
  PassiveStatChangeStatusEffect.base_constructor.call( this, xml );
  
  this.get_effect = function()
  {
    return Loader.get_status_effect_data( this.status_id ).find("Effect");
  };
}
extend( PassiveStatChangeStatusEffect, StatusEffect );

PassiveStatChangeStatusEffect.prototype.start = function()
{
  if( this.target_id == "man" )
  {
    Player.apply_effect( this.get_effect() );
    Log.add( "You are affected by " + this.description + "!" );
  }
};

PassiveStatChangeStatusEffect.prototype.finish = function()
{
  if( this.target_id == "man" )
  {
    Player.remove_effect( this.get_effect() );
    Log.add( "The effects of the " + this.description + " wear off." );
  }
};

PassiveStatChangeStatusEffect.prototype.is_stronger = function( that )
{
  return true;
};