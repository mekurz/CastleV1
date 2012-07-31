function Widget( stat_id, pos )
{
  Widget.base_constructor.call( this );
  this.stat_id = stat_id;  
  this.location = null;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
  }
  
  if( stat_id != undefined )
  {
    var data = Loader.get_widget_data( this.stat_id );
    this.tile_id = data.attr("tile_id");
    this.description = data.find("Description").text();
  }
    
  this.draw = function( ctx )
  {
    if( this.should_draw_widget() )
    {
      var view_pos = Map.translate_map_coord_to_viewport( this.location );
      ctx.drawImage( Images.TILE_IMAGES[this.tile_id], convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) ); 
    }
  };
  
  this.get_tooltip = function()
  {
    if( this.should_show_tooltip() )
    {
      return "<li>" + this.description + "</li>";
    }
    else
    {
      return "";
    }
  };
}
extend( Widget, Serializable );

Widget.prototype.should_draw_widget = function()
{
  return this.location != null && Map.is_location_visible( this.location ) && Dungeon.is_location_explored( this.location );
};

Widget.prototype.should_show_tooltip = function()
{
  return true;
};

Widget.prototype.load = function( obj )
{
  Widget.super_class.load.call( this, obj );
  this.location = Storage.load_point( obj.location );
};