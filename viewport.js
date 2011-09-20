var TILE_DATA  = [ "{\"src\":\"grass.png\",\"passable\":1}",  // 0
                   "{\"src\":\"dirt.png\",\"passable\":1}",   // 1
                   "{\"src\":\"stones.png\",\"passable\":1}", // 2
                   "{\"src\":\"wall.png\",\"passable\":0}",   // 3
                 ];
var TOOLTIP_FADE_SPEED = 150;
var TOOLTIP_SLIDE_SPEED = 200;

var loaded = 0;

function show_tooltip( location )
{
  var tooltip = $("#tooltip");
  var contents = $("#tooltip_contents");
  var map_location = $("#map").position();
  
  var num_items = fill_tooltip_with_monster( contents, location );
  // TODO LOOP THROUGH OTHER COLLECTIONS OF STUFF (ITEMS, ETC)
  
  if( num_items == 0 )
  {
    contents.append( "<li>nothing</li>" ); 
  }
  
  // TODO FANCIER WAY OF SETTING THE LOCATION IN CASE WE GO OFF THE EDGE OF THE WINDOW
  location.convert_to_raw();
  tooltip.css( "top", parseInt( location.y ) + map_location.top + TILE_WIDTH );
  tooltip.css( "left", location.x + map_location.left );
  
  tooltip.fadeIn( TOOLTIP_FADE_SPEED, function(){
    contents.slideDown( TOOLTIP_SLIDE_SPEED );
  }); 
}

function fill_tooltip_with_monster( contents, location )
{
  var monster = get_monster_in_tile( location );
  
  if( monster != null )
  {
    contents.append( monster.get_tooltip() );
    return 1;
  }
  
  return 0;
}

function hide_tooltip()
{
  $("#tooltip_contents").slideUp( TOOLTIP_SLIDE_SPEED, function(){
    $("#tooltip").fadeOut( TOOLTIP_FADE_SPEED );
    $("#tooltip_contents").children().remove();
  });
}

function Tile( ix )
{
  var obj = $.evalJSON( TILE_DATA[ix] );
  this.src       = obj.src;
  this.passable  = obj.passable;
  this.img       = Images.TILE_IMAGES[ix];
};


function ViewPort()
{
  this.tiles     = new Array();
  this.top_left  = new Point( 0, 0 );
  
  this.initialize = function()
  {
    this.create_tiles();
    $("#tooltip").hide();
    $("#tooltip_contents").hide();
  };
  
  this.create_tiles = function()
  {
    Log.debug( "Creating tiles..." );
    
    for( var x = 0; x < TILE_DATA.length; ++x )
    {
      var new_tile = new Tile( x ); 
      this.tiles.push( new_tile );
    }
    
    Log.debug( "Done creating tiles" );
  };
    
  this.draw_map = function( ctx )
  {
    var canvas_x = 0;
    var canvas_y = 0;
 
    for( var y = 0; y < VIEWPORT_HEIGHT; y++ )
    {
      canvas_x = 0;
   
      for( var x = 0; x < VIEWPORT_WIDTH; x++ )
      {
        var tile_ix = map_tiles[this.top_left.y + y][this.top_left.x + x];
        
        ctx.drawImage( this.tiles[tile_ix].img, canvas_x, canvas_y );
        canvas_x += TILE_WIDTH;
      }
   
      canvas_y += TILE_WIDTH;
    }
  };
  
  this.is_valid_move = function( point, vector )
  {
    var new_pos = new Point( point.x, point.y );
    
    if( vector != undefined )
    {
      new_pos.add_vector( vector );
    }
    
    if( this.is_location_visible( new_pos ) ) 
    {
      var tile_ix = map_tiles[new_pos.y][new_pos.x];
      return this.tiles[tile_ix].passable; 
    }
    
    return false;
  };
  
  this.is_location_visible = function( point )
  {
    return ( point.x >= this.top_left.x )
            && ( point.y >= this.top_left.y )
            && ( point.x < this.top_left.x + VIEWPORT_WIDTH )
            && ( point.y < this.top_left.y + VIEWPORT_HEIGHT );
  };
  
  this.translate_map_coord_to_viewport = function( map_coord )
  {
    var view_coord = new Point( map_coord.x, map_coord.y );
    view_coord.x -= this.top_left.x;
    view_coord.y -= this.top_left.y;
    
    return view_coord;
  };
  
  this.center_map_on_location = function( center )
  {
    var new_corner = new Point();
    
    new_corner.x = Math.max( 0, center.x - Math.floor( VIEWPORT_WIDTH / 2 ) );
    new_corner.y = Math.max( 0, center.y - Math.floor( VIEWPORT_HEIGHT / 2 ) );
    
    if( new_corner.x > map_tiles[0].length - VIEWPORT_WIDTH )
    {
      new_corner.x = map_tiles[0].length - VIEWPORT_WIDTH; 
    }
    
    if( new_corner.y > map_tiles.length - VIEWPORT_HEIGHT )
    {
      new_corner.y = map_tiles.length - VIEWPORT_HEIGHT; 
    }
    
    //Log.debug( "Adjusting map corner to " + new_corner.to_string() );
    this.top_left.assign( new_corner );
  };
  
  this.is_location_on_an_edge = function( location )
  {
    var to_return = false;
    var view_pos = this.translate_map_coord_to_viewport( location );
    
    if( view_pos.x == 0 || view_pos.y == 0 || view_pos.x == VIEWPORT_WIDTH - 1 || view_pos.y == VIEWPORT_HEIGHT - 1 )
    {
      to_return = true;
    }
    
    delete view_pos;
    return to_return;
  };
  
};
