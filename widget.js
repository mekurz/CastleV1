function Widget( stat_id, pos )
{
  Widget.base_constructor.call( this );
  this.stat_id = stat_id;  
  this.location = null;
  this.frame_ix = 0;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
  }
  
  if( stat_id != undefined )
  {
    var data = Loader.get_widget_data( this.stat_id );
    this.description = data.find("Description").text();

    this.tile_id = data.attr("tile_id").split(",");
  }
    
  this.draw = function( ctx )
  {
    if( this.should_draw_widget() )
    {
      var view_pos = Map.translate_map_coord_to_viewport( this.location );
      var img_loc = convert_tile_ix_to_point( this.tile_id[this.frame_ix] );
      ctx.drawImage( Images.TILE_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH,  convert_ix_to_raw_coord( view_pos.x ),  convert_ix_to_raw_coord( view_pos.y ), TILE_WIDTH, TILE_WIDTH );

      this.advance_frame();
    }
  };
  
  this.get_tooltip = function()
  {
    if( this.should_show_tooltip() )
    {
      return this.get_tooltip_text();
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

Widget.prototype.get_tooltip_text = function()
{
  return "<li>" + this.description + "</li>";
};

Widget.prototype.advance_frame = function()
{
  if( this.tile_id.length > 1 )
  {
    this.frame_ix++;

    if( this.frame_ix >= this.tile_id.length )
    {
      this.frame_ix = 0;
    }
  }
}

Widget.prototype.load = function( obj )
{
  Widget.super_class.load.call( this, obj );
  this.location = Storage.load_point( obj.location );
};