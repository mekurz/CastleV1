function Minimap()
{
  this.popup = $("#minimap_popup");
  this.map_ctx = null;
  this.buffer = null;
  this.buffer_ctx = null;
  
  Log.debug("Initializing Mini-map...");
  
  this.popup.modal({ show: false });
  this.popup.on( "show.bs.modal", function() { 
                open_dialog();
                Minimap.draw_map();
          });
  this.popup.on( "hide.bs.modal", close_dialog );
      
  var canvas = $("#minimap");
  
  if( canvas && canvas[0].getContext )
  {
    this.map_ctx = canvas[0].getContext("2d");
    this.buffer = document.createElement("canvas");
    this.buffer.width = canvas[0].width;
    this.buffer.height = canvas[0].height;
    this.buffer_ctx = this.buffer.getContext("2d");
    this.buffer_ctx.scale( 0.375, 0.375 );      
  }
  
  Log.debug("Done.");
  
  this.open = function()
  {
    if( !is_processing() )
    {
      set_command( NO_COMMAND );
      this.popup.modal("show");
    }
  };
  
  this.draw_map = function()
  {
    var orig_width = VIEWPORT_WIDTH;
    var orig_height = VIEWPORT_HEIGHT;
    var orig_top_left = new Point();
    orig_top_left.assign( Map.top_left );
    
    // Resize the viewport to trick it into drawing the entire map
    VIEWPORT_WIDTH = MAP_WIDTH;
    VIEWPORT_HEIGHT = MAP_HEIGHT;
    Map.top_left = new Point();
    
    document.game.draw_map( this.buffer_ctx );
    this.map_ctx.drawImage( this.buffer, 0, 0 );
     
    VIEWPORT_WIDTH = orig_width;
    VIEWPORT_HEIGHT = orig_height;
    Map.top_left.assign( orig_top_left );
  };
}