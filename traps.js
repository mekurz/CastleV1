function Trap( stat_id, pos )
{
  Trap.base_constructor.call( this, undefined, undefined );
  this.stat_id = stat_id;
  this.found = false;
  this.tripped = false;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
    
    var data = Loader.get_trap_data( this.stat_id );
    this.tile_id = [].concat( data.attr("tile_id") );
    this.description = data.find("Description").text();
    this.damage = data.find("Damage").text();
    this.reset = data.find("Reset").text();
  }
  
  this.is_visible = function()
  {
    return this.found;
  };
  
  this.find = function()
  {
    this.found = true;
    Log.add( "You have uncovered a trap!" );
  };
  
  this.trigger = function()
  {
    if( !this.found || this.reset == "1" || !this.tripped )
    {
      this.found = true;
      Player.damage( this.damage );
      Log.add( "You have triggered a " + this.description + "!" );
      
      if( this.reset == "0" )
      {
        this.tripped = true;
        this.description = "tripped " + this.description;
      }
    }
  };
  
}
extend( Trap, Widget );

Trap.prototype.should_draw_widget = function()
{
  return this.found && Trap.super_class.should_draw_widget.call( this );
};

Trap.prototype.should_show_tooltip = function()
{
  return this.found;
};

Trap.prototype.get_tooltip_text = function()
{
  return "<li>a " + this.description + "</li>";
};

Trap.prototype.load = function( obj )
{
  Trap.super_class.load.call( this, obj );
  this.location = Storage.load_point( obj.location );
};