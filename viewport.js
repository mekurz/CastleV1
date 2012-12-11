function Tooltip()
{
  this.tooltip = $("#tooltip");
  this.header = $("#tooltip_header");
  this.contents = $("#tooltip_contents");
  this.map_location = $("#map").position();
  this.num_items = 0;
  this.visible = false;
  this.has_los = false;
  var TOOLTIP_FADE_SPEED = 150;

  this.tooltip.hide();
  
  this.show_tooltip = function( location )
  {
    this.num_items = 0;
    this.visible = true;
    this.has_los = Map.does_line_of_sight_exist( Player.location, location );
    
    this.contents.empty();
    this.fill_content( location );
    this.fill_header( location );    
    
    this.adjust_position( location );
    this.tooltip.stop( true, true ).fadeIn( TOOLTIP_FADE_SPEED ); 
  };
  
  this.hide_tooltip = function()
  {
    this.tooltip.fadeOut( TOOLTIP_FADE_SPEED );
    this.visible = false;
  };
  
  this.adjust_position = function( location )
  {
    // TODO FANCIER WAY OF SETTING THE LOCATION IN CASE WE GO OFF THE EDGE OF THE WINDOW
    location.convert_to_raw();
    this.tooltip.css( "top", parseInt( location.y ) + this.map_location.top + TILE_WIDTH );
    this.tooltip.css( "left", location.x + this.map_location.left );
  };
  
  this.fill_content = function( location )
  {
    if( ( this.has_los && ( Dungeon.is_location_lit( location ) || Player.location.adjacent_to( location ) ) ) || DETECT_MONSTERS )
    { 
      this.fill_tooltip_with_single_object( Dungeon.get_monster_in_tile( location ) );
    }
    
    if( Dungeon.is_location_explored( location ) )
    {
      this.fill_tooltip_with_single_object( Dungeon.get_door_in_tile( location ) );
      this.fill_tooltip_with_widgets( location );
      this.fill_tooltip_with_items( location );
    }
  };
  
  this.fill_tooltip_with_single_object = function( obj )
  {
    if( obj != null )
    {
      var text = obj.get_tooltip();
      
      if( text != "" )
      {
        this.contents.append( obj.get_tooltip() );
        this.num_items++;
      }
    }
  };
    
  this.fill_tooltip_with_items = function( location )
  {
    var floor_items = Dungeon.get_items_in_tile( location );
    
    for( var i = 0; i < floor_items.length; ++i )
    {
      this.contents.append( floor_items[i].get_tooltip() );
    }
    
    this.num_items += floor_items.length;
    floor_items = [];
  };
  
  this.fill_tooltip_with_widgets = function( location )
  {
    var level = Dungeon.get_current_level();
    
    this.fill_tooltip_from_collection( level.stairs_up, location );
    this.fill_tooltip_from_collection( level.stairs_down, location );
    this.fill_tooltip_from_collection( level.traps, location );
  };
  
  this.fill_tooltip_from_collection = function( collection, location )
  {
    this.fill_tooltip_with_single_object( get_single_item_at_location( collection, location ) );
  };
  
  this.fill_header = function( location )
  {
    var str = "";
    
    if( this.num_items > 0 )
    {
      if( this.has_los )
      {
        str = "You see:";
      }
      else if( DETECT_MONSTERS )
      {
        str = "You detect:";
      }
      else
      {
        str = "Your map shows:";
      }
    }
    else
    {
      if( Dungeon.is_location_explored( location ) )
      {
        if( this.has_los )
        {
          if( Dungeon.is_location_lit( location ) || Player.location.adjacent_to( location ) )
          {
            str = "You see nothing.";
          }
          else
          {
            str = "It is too dark to see that!";
          }
        }
        else
        {
          str = "Your map shows nothing.";
        }
      }
      else
      {
        str = "You haven't seen that location!";
      }
    }
    
    this.header.text( str );
  };
};


function Tile( ix )
{
  Tile.base_constructor.call( this );
  this.tile_ix   = ix;
  this.passable  = false;
  this.explored  = false;
  this.is_lit    = false;
  this.room_id   = -1;
  this.is_entrance = false;
  
  this.is_lit_room = function()
  {
    return this.is_lit && this.room_id != -1;
  };
  
  this.is_darkened = function()
  {
    return this.passable && !this.is_lit;
  };
  
  this.is_lit_unexplored = function()
  {
    return this.is_lit && !this.explored;
  };
  
  this.is_a_room = function()
  {
    return this.room_id != -1;
  };
};
extend( Tile, Serializable );

function ViewPort()
{
  this.top_left  = new Point( 0, 0 );
    
  this.draw_map = function( ctx )
  {
    ctx.save();
 
    for( var row = 0; row < VIEWPORT_HEIGHT; ++row )
    {
      for( var col = 0; col < VIEWPORT_WIDTH; ++col )
      {
        this.draw_single_tile( row, col, ctx );
      }
    }
    
    ctx.restore();
  };
  
  this.draw_single_tile = function( row, col, ctx, force_draw )
  {
    var map_tiles = Dungeon.get_map_tiles();
    
    if( this.top_left.y + row >= map_tiles.length || this.top_left.x + col >= map_tiles[0].length )
    {
      return;
    }
    
    var tile = map_tiles[this.top_left.y + row][this.top_left.x + col];
    var canvas_x = convert_ix_to_raw_coord( col );
    var canvas_y = convert_ix_to_raw_coord( row );
        
    if( tile.explored || force_draw != undefined )
    {
      ctx.drawImage( Images.TILE_IMAGES[tile.tile_ix], canvas_x, canvas_y );
      
      if( tile.is_darkened() )
      {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect( canvas_x, canvas_y, TILE_WIDTH, TILE_WIDTH );
      }
    }
    else
    {
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.fillRect( canvas_x, canvas_y, TILE_WIDTH, TILE_WIDTH );
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
    var map_tiles = Dungeon.get_map_tiles();
    
    if( map_tiles[location.y][location.x].passable )
    {
      if( map_tiles[location.y][location.x].is_entrance )
      {
        // Can't go through secret doors that have not been found yet
        var door = Dungeon.get_door_in_tile( location );
        if( door && !door.is_visible() )
        {
          return false;
        }
      }
      
      return true;
    }
    
    return false;
  };
  
  this.is_location_transparent = function( location )
  {
    if( Dungeon.get_map_tiles()[location.y][location.x].passable )
    {
      // Can't see through closed doors
      var door = Dungeon.get_door_in_tile( location );
      if( door && !door.is_open() )
      {
        return false;
      }
      
      return true;
    }
    
    return false;
  };
  
  this.is_location_inbounds = function ( point )
  {
    return point.x >= 0 && point.y >= 0 && point.x < MAP_WIDTH && point.y < MAP_HEIGHT;
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
    var map_tiles = Dungeon.get_map_tiles();
    
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
    var current_tile = new Point();
    var last_tile = new Point( -1, -1 );
    raw_start.convert_to_raw_tile_center();
    raw_end.convert_to_raw_tile_center();
    
    var steps    = Math.floor( raw_start.distance_to( raw_end ) / 5 ); // Check every 5 pixels
    var slope_x  = ( raw_end.x - raw_start.x ) / steps;
    var slope_y  = ( raw_end.y - raw_start.y ) / steps;
    
    for( var ix = 0; ix <= steps; ix++ )
    {
      raw_start.x += slope_x;
      raw_start.y += slope_y;
      
      current_tile.x = raw_start.x;
      current_tile.y = raw_start.y;
      current_tile.convert_to_tile_coord();
      
      if( !current_tile.equals( last_tile ) )
      {
        if( !this.is_location_transparent( current_tile ) && !current_tile.equals( end ) )
        {
          to_return = false;
          break;
        }
        else
        {
          last_tile.assign( current_tile );
        }
      }
    }
    
    return to_return;
  };
  
  this.get_target_item_in_tile = function( target )
  {
    if( target.equals( Player.location ) )
    {
      return Player;
    }
    
    var target_item = Dungeon.get_monster_in_tile( target );
    
    if( target_item == null && Dungeon.get_map_tiles()[target.y][target.x].is_entrance )    // No monster, try looking for a door
    {
      target_item = Dungeon.get_door_in_tile( target );
      
      if( target_item && ( !target_item.is_visible() || target_item.is_broken() ) )
      {
        target_item = null;   // Broken and secret doors cannot be targetted by anything
      }
    }

    return target_item;    
  };
};
