function StatusEffectsManager()
{
  this.effects = [];
  
  function create_label( effect )
  {
    // TODO GET REAL EFFECT DESCRIPTION AND COLOR
    $("#effects").append( "<span id=\"effect" + effect.id + "\" class=\"label label-info\">TEST " + effect.id + "</span>" ); 
  }
  
  this.add_effect = function( effect )
  {
    this.effects.unshift( effect );
    create_label( effect );
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
};

function StatusEffect( type )
{
  StatusEffect.max_status_id++;
  
  this.id          = StatusEffect.max_status_id;
  this.type        = type;
  this.finish_time = 0;
  
  //this.load_from_xml();
}

StatusEffect.max_status_id = 0;

StatusEffect.prototype.start  = function() {};
StatusEffect.prototype.tick   = function() {};
StatusEffect.prototype.finish = function() {};