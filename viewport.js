var TILE_DATA  = [ "{\"src\":\"grass.png\",\"passable\":1}",  // 0
                   "{\"src\":\"dirt.png\",\"passable\":1}",   // 1
                   "{\"src\":\"stones.png\",\"passable\":1}", // 2
                   "{\"src\":\"wall.png\",\"passable\":0}",   // 3
                 ];

var TOOLTIP_FADE_SPEED = 150;

function Tooltip()
{
  this.tooltip = $("#tooltip");
  this.header = $("#tooltip_header");
  this.contents = $("#tooltip_contents");
  this.map_location = $("#map").position();
  this.num_items = 0;
  this.visible = false;
  this.has_los = false;
  
  this.tooltip.hide();
  
  this.show_tooltip = function( location )
  {
    this.num_items = 0;
    this.visible = true;
    this.has_los = Map.does_line_of_sight_exist( Player.location, location );
    
    if( this.has_los )   // TODO Detection could skip this check OR debug flag
    { 
      this.fill_tooltip_with_monster( location );
      this.fill_tooltip_with_items( location );
      this.display_empty_message_if_necessary();
    }
    else
    {
      this.header.text( "You cannot see that." );
    }        
    
    this.adjust_position( location );
    
    this.tooltip.fadeIn( TOOLTIP_FADE_SPEED ); 
  };
  
  this.hide_tooltip = function()
  {
    this.tooltip.fadeOut( TOOLTIP_FADE_SPEED, function(){
      document.game.tooltip.contents.empty();
    });
    this.visible = false;
  };
  
  this.adjust_position = function( location )
  {
    // TODO FANCIER WAY OF SETTING THE LOCATION IN CASE WE GO OFF THE EDGE OF THE WINDOW
    location.convert_to_raw();
    this.tooltip.css( "top", parseInt( location.y ) + this.map_location.top + TILE_WIDTH );
    this.tooltip.css( "left", location.x + this.map_location.left );
  };
  
  this.fill_tooltip_with_monster = function( location )
  {
    var monster = get_monster_in_tile( location );
    
    if( monster != null )
    {
      this.contents.append( monster.get_tooltip() );
      this.num_items++;
    }
  };
  
  this.fill_tooltip_with_items = function( location )
  {
    var floor_items = get_items_in_tile( location );
    
    for( var i = 0; i < floor_items.length; ++i )
    {
      this.contents.append( floor_items[i].get_tooltip() );
      this.num_items++;
    }
    
    this.num_items += floor_items.length;
    floor_items = [];
  };
  
  this.display_empty_message_if_necessary = function()
  {
    if( this.num_items > 0 )
    {
      this.header.text( "You see:" );
    }
    else
    {
      this.header.text( "You see nothing." );
    }
  };
};


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
      return this.is_location_passable( new_pos );
    }
    
    return false;
  };
  
  this.is_location_passable = function( location )
  {
    var tile_ix = map_tiles[location.y][location.x];
    return this.tiles[tile_ix].passable;  
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
  
  this.does_line_of_sight_exist = function( start, end )
  {
    if( start.equals( end ) )
    {
      return true;
    }
    
    var to_return = true;
    
    var raw_start = new Point( start.x, start.y );
    var raw_end   = new Point( end.x, end.y );
    raw_start.convert_to_raw_tile_center();
    raw_end.convert_to_raw_tile_center();
    
    var steps    = Math.floor( raw_start.distance_to( raw_end ) / 5 ); // Check every 5 pixels
    var slope_x  = ( raw_end.x - raw_start.x ) / steps;
    var slope_y  = ( raw_end.y - raw_start.y ) / steps;
    
    for( var ix = 0; ix <= steps; ix++ )
    {
      raw_start.x += slope_x;
      raw_start.y += slope_y;
      
      var current_tile = new Point( raw_start.x, raw_start.y );
      current_tile.convert_to_tile_coord();
      
      if( !this.is_location_passable( current_tile ) && !current_tile.equals( end ) )
      {
        to_return = false;
        break;
      }
    }
    
    return to_return;
  };
  
  this.get_target_item_in_tile = function( target )
  {
    var target_item = get_monster_in_tile( target );
    
    if( target_item == null && target.equals( Player.location ) )
    {
      return Player;
    }
    
    return target_item;
  };
};
