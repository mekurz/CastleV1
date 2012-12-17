var STATUS_EFFECT_TYPE_POISON = 0;
var STATUS_EFFECT_TYPE_PASSIVE_BUFF = 1;
var STATUS_EFFECT_TYPE_CURSE  = 2;

function StatusEffectsManager()
{
  this.effects = [];
  
  function get_label_color( type )
  {
    switch( type )
    {
      case STATUS_EFFECT_TYPE_POISON:       return "label-success";
      case STATUS_EFFECT_TYPE_CURSE:        return "label-important";
      case STATUS_EFFECT_TYPE_PASSIVE_BUFF: 
      default:                              return "label-info";
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
  
  this.get_existing_poison_for_target = function( target_id )
  {
    for( var ix = 0; ix < this.effects.length; ++ix )
    {
      if( this.effects[ix].type == STATUS_EFFECT_TYPE_POISON && this.effects[ix].target_id == target_id )
      {
        return this.effects[ix];
      }
    }
    
    return null;
  };
  
  this.load = function( obj )
  {
    this.effects = [];
    if( obj == undefined ) return;
    
    for( var ix = obj.length - 1; ix >= 0; --ix )
    {
      var effect = null;
      var type = obj[ix].type;
      
      switch( type )
      {
        case STATUS_EFFECT_TYPE_POISON:
          effect = new PeriodicStatusEffect( type ); break;
        default:
          effect = new StatusEffect( type );
      }
      
      effect.load( obj[ix] );
      this.add_effect_no_start( effect );
    }
  };
};

function create_poison_effect( xml, target_actor )
{
  var original_effect = StatusEffects.get_existing_poison_for_target( target_actor.id );
  var new_dmg = parseInt( xml.find("Damage").text() );
  
  if( !original_effect || new_dmg > original_effect.damage )
  {
    // No existing poison on the actor OR the new poison is stronger!
    var effect = original_effect ? original_effect: new PeriodicStatusEffect( STATUS_EFFECT_TYPE_POISON );
    
    effect.damage = new_dmg;
    effect.finish_time = Time.time + ( parseInt( xml.find("Rounds").text() ) * TIME_STANDARD_MOVE );
    effect.target_id   = target_actor.id;
    effect.description = xml.find("Description").text();
    
    if( !original_effect )
    {
      StatusEffects.add_effect( effect );
    }
    else
    {
      effect.start();
      $("#effect" + effect.id).text( effect.description ); // Update the text on the existing label
      Log.debug( "Upgrading existing poison to stronger version." );
    }
  }
  else if( original_effect.damage == new_dmg )
  {
    // Being hit with the same poison, so extend the duration
    original_effect.finish_time = Time.time + ( parseInt( xml.find("Rounds").text() ) * TIME_STANDARD_MOVE );
    Log.debug( "Extending duration of existing poison." );
  }
}

function create_status_effect( status_id, target_actor )
{
  var xml = Loader.get_status_effect_data( status_id );
  var type = parseInt( xml.attr("type") );
  var effect = null;
  
  if( type == STATUS_EFFECT_TYPE_POISON )
  {
    create_poison_effect( xml, target_actor );
  }
  else
  {
    effect = new StatusEffect( type );
    effect.target_id   = target_actor.id;
    effect.description = xml.find("Description").text();
    
    StatusEffects.add_effect( effect );
  }
}

function StatusEffect( type )
{
  StatusEffect.base_constructor.call( this );
    
  this.id          = StatusEffect.max_status_id;
  this.description = "";
  this.type        = type;
  this.finish_time = Number.MAX_VALUE;
  this.target_id   = null;
  
  StatusEffect.max_status_id = Math.max( this.id + 1, StatusEffect.max_status_id + 1 );
}
extend( StatusEffect, Serializable );

StatusEffect.max_status_id = 0;

StatusEffect.prototype.start  = function() {};
StatusEffect.prototype.tick   = function() {};
StatusEffect.prototype.finish = function() {};

function PeriodicStatusEffect( type )
{
  PeriodicStatusEffect.base_constructor.call( this, type );
  
  this.damage = 0;
}
extend( PeriodicStatusEffect, StatusEffect );

PeriodicStatusEffect.prototype.start = function()
{
  if( this.target_id == "man" )
  {
    Log.add( "You are affected by " + this.description + "!" );
  }
};

PeriodicStatusEffect.prototype.tick = function()
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

PeriodicStatusEffect.prototype.finish = function()
{
  if( this.target_id == "man" )
  {
    Log.add( "The effects of the " + this.description + " wear off." );
  }
};