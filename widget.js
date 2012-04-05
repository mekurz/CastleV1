function Widget( stat_id, pos )
{
  this.stat_id = stat_id;  
  this.location = null;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
  }
  
  var data = Loader.get_widget_data( this.stat_id );
  var tile_id = data.attr("tile_id");
  
  this.description = data.find("Description").text();
  this.icon = Images.TILE_IMAGES[tile_id];
    
  this.draw = function( ctx )
  {
    if( this.should_draw_widget() )
    {
      var view_pos = Map.translate_map_coord_to_viewport( this.location );
      ctx.drawImage( this.icon, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) ); 
    }
  };
  
  this.should_draw_widget = function()
  {
    return this.location != null && Map.is_location_visible( this.location ) && Dungeon.is_location_explored( this.location );
  };
}