var MAP_WIDTH  = 100;
var MAP_HEIGHT = 100;
var MIN_ROOM_SIZE = 5;
var MAX_ROOM_SIZE = 13;
var TUNNEL_LENGTH = 3;

var BLOCKED_CHAR = "B";
var NOTHING_CHAR = "#";
var ROOM_CHAR    = ".";
var PERIMETER_CHAR = "#";
var ENTRANCE_CHAR = "E";
var TUNNEL_CHAR = " ";
var DEADEND_CHAR = "X";

var NORTH = new Point( -1,  0 );
var SOUTH = new Point(  1,  0 );
var EAST  = new Point(  0, -1 );
var WEST  = new Point(  0,  1 );

var max_room_id = 0;

function Cell()
{
  this.blocked = false;
  this.room_id = -1;
  this.is_perimeter = false;
  this.is_corridor = false;
  this.is_entrance = false;
  this.is_deadend = false;
  
  this.is_a_room = function()
  {
    return this.room_id != -1;
  };
  
  this.set_as_perimeter = function()
  {
    if( !this.blocked && !this.is_a_room() )
    {
      this.is_perimeter = true;
    }
  };
  
  this.is_clear_for_tunnel = function()
  {
    return !this.blocked && !this.is_perimeter && !this.is_corridor;
  };
  
  this.is_corridor_neighbour = function()
  {
    return this.is_corridor || this.is_entrance;
  };
}

function Room()
{
  this.generate_random_dimension = function()
  {
    var size = Math.floor( Math.random() * MAX_ROOM_SIZE );
    
    if( size < MIN_ROOM_SIZE )
    {
      size = MIN_ROOM_SIZE; 
    }
    
    if( size % 2 == 0 )
    {
      size++; 
    }
    
    return size;
  };
  
  this.top_left = new Point();
  this.height = this.generate_random_dimension();
  this.width  = this.generate_random_dimension();
  
  this.room_id = max_room_id;
  max_room_id++;
  
  this.contains_point = function( x, y )
  {
    return x >= this.top_left.x && x <= this.top_left.x + this.width && y >= this.top_left.y && y <= this.top_left.y + this.height;
  };
  
  this.contains_any_blocked_cell = function( map )
  {
    for( var row = this.top_left.y; row <= this.top_left.y + this.height; row++ )
    {
      for( var col = this.top_left.x; col <= this.top_left.x + this.width; col++ )
      {
        if( map[row][col].blocked || map[row][col].is_a_room() )
        {
          return true;
        }
      }
    }
    
    return false;
  };
  
  this.fits_on_map = function()
  {
    return this.top_left.x >= 0 
        && this.top_left.x + this.width < MAP_WIDTH
        && this.top_left.y >= 0
        && this.top_left.y + this.height < MAP_HEIGHT; 
  };
  
  this.place_room = function( map )
  {
    this.draw_perimeter( map );
    this.fill_room( map );
    this.block_corners( map );
  };
  
  this.draw_perimeter = function( map )
  {
    for( var col = this.top_left.x - 1; col < this.top_left.x + this.width + 1; col++ )
    {
      map[this.top_left.y - 1][col].set_as_perimeter();
      map[this.top_left.y + this.height][col].set_as_perimeter();
    }
    
    for( var row = this.top_left.y - 1; row < this.top_left.y + this.height + 1; row++ )
    {
      map[row][this.top_left.x - 1].set_as_perimeter();
      map[row][this.top_left.x + this.width].set_as_perimeter();
    }
  };
  
  this.fill_room = function( map )
  {
    for( var row = 0; row < this.height; row++ )
    {
      for( var col = 0; col < this.width; col++ )
      {
        map[row + this.top_left.y][col + this.top_left.x].room_id = this.room_id;
      }
    }
  };
  
  this.block_corners = function( map )  // TODO UNIT TEST
  {
    map[this.top_left.y - 1][this.top_left.x - 1].blocked = true;
    map[this.top_left.y - 1][this.top_left.x + this.width].blocked = true;
    map[this.top_left.y + this.height][this.top_left.x - 1].blocked = true;
    map[this.top_left.y + this.height][this.top_left.x + this.width].blocked = true;
  };
}

function DoorMaker( map, room )
{
  this.map = map;
  this.room = room;
  this.sills = new Array();
  
  this.get_num_doors = function()
  {
    var width = Math.floor( this.room.width / 2 );
    var height = Math.floor( this.room.height / 2 );
    var min_doors = Math.floor( Math.sqrt( width * height ) );
    return Math.max( 0, min_doors + Math.floor( Math.random() * min_doors ) - this.count_existing_doors_for_room() );
  };
  
  this.count_existing_doors_for_room = function()
  {
    var existing_doors = 0;
    
    for( var col = this.room.top_left.x; col < this.room.top_left.x + this.room.width; col++ )
    {
      existing_doors += map[this.room.top_left.y - 1][col].is_entrance;
      existing_doors += map[this.room.top_left.y + this.room.height][col].is_entrance;
    }
    
    for( var row = this.room.top_left.y; row < this.room.top_left.y + this.room.height; row++ )
    {
      existing_doors += map[row][this.room.top_left.x - 1].is_entrance;
      existing_doors += map[row][this.room.top_left.x + this.room.width].is_entrance;
    }
    
    return existing_doors;
  };
  
  this.get_possible_door_sills = function()
  {
    this.add_north_sills();
    this.add_south_sills();
    this.add_east_sills();
    this.add_west_sills();
  };
  
  this.add_north_sills = function()
  {
    this.add_valid_horizontal_sills( this.room.top_left.y - 1, -1 ); 
  };
  
  this.add_south_sills = function()
  {
    this.add_valid_horizontal_sills( this.room.top_left.y + this.room.height, 1 ); 
  };
  
  this.add_east_sills = function()
  {
    this.add_valid_vertical_sills( this.room.top_left.x + this.room.width, 1 ); 
  };
  
  this.add_west_sills = function()
  {
    this.add_valid_vertical_sills( this.room.top_left.x - 1, -1 ); 
  };
  
  this.add_valid_horizontal_sills = function( row, direction )
  {
    if( row <= 1 || row >= MAP_HEIGHT-1 ) return;
    
    for( var col = this.room.top_left.x; col < this.room.top_left.x + this.room.width; col += 2 )
    {
      if( !this.map[row][col].blocked && !this.map[row][col].is_entrance && !this.map[row + direction][col].blocked )
      {
        this.sills.push( this.map[row][col] );
      }
    }
  };
  
  this.add_valid_vertical_sills = function( col, direction )
  {
    if( col <= 1 || col >= MAP_WIDTH-1 ) return;
    
    for( var row = this.room.top_left.y; row < this.room.top_left.y + this.room.height; row += 2 )
    {
      if( !this.map[row][col].blocked && !this.map[row][col].is_entrance && !this.map[row][col + direction].blocked )
      {
        this.sills.push( this.map[row][col] );
      }
    }
  };
  
  this.create_doors = function()
  {    
    var num_doors = this.get_num_doors();
    this.get_possible_door_sills();
    
    for( var i = 0; i < num_doors; i++ )
    {
      var sill_num = Math.floor( Math.random() * this.sills.length );
      this.sills[sill_num].is_entrance = true;
    }
  };
}

function TunnelMaker( map )
{
  this.map = map;
  this.count = 0;
  
  this.create_tunnels = function()
  {
    for( var row = 0; row < MAP_HEIGHT/2; row++ )
    {
      for( var col = 0; col < MAP_WIDTH/2; col++ )
      {
        var next_row = ( row * 2 ) + 1;
        var next_col = ( col * 2 ) + 1;
        
        if( this.map[next_row][next_col].is_clear_for_tunnel() )
        {
          this.tunnel( next_row, next_col );
        }
      }
    }
  };
  
  this.tunnel = function( row, col )
  {
    var directions = this.get_tunnel_directions();
    
    for( var dir = 0; dir < 4; dir++ )
    {
      if( this.make_tunnel( row, col, directions[dir] ) )
      {
        var next_row = this.get_next_tunnel_position( row, directions[dir].x );
        var next_col = this.get_next_tunnel_position( col, directions[dir].y );
        this.tunnel( next_row, next_col );
      }
    }
  };
  
  this.get_next_tunnel_position = function( value, move )
  {
    return value + ( move * TUNNEL_LENGTH ) + -move;
  };
  
  this.get_tunnel_directions = function()
  {
    return [ NORTH, SOUTH, EAST, WEST ].shuffle(); 
  };
  
  this.make_tunnel = function( row, col, direction )
  {
    if( this.is_tunnel_clear( row, col, direction ) )
    {
      this.dig_tunnel( row, col, direction );
      return true;
    }
    
    return false;
  };
  
  this.is_tunnel_clear = function( row, col, direction )
  {
    if( this.map[row][col].is_a_room() )
    {
      return false;
    }
    
    for( var ix = 1; ix < TUNNEL_LENGTH; ix++ )
    {
      var next_row = row + ( direction.x * ix );
      var next_col = col + ( direction.y * ix );
      
      if( next_row <= 0 || next_row >= MAP_HEIGHT || next_col <= 0 || next_col >= MAP_WIDTH )
      {
        return false;
      }
      
      if( !this.map[next_row][next_col].is_clear_for_tunnel() )
      {
        return false;
      }
    }
    
    return true;
  };
  
  this.dig_tunnel = function( row, col, direction )
  {
    for( var ix = 0; ix < TUNNEL_LENGTH; ix++ )
    {
      var next_row = row + ( direction.x * ix );
      var next_col = col + ( direction.y * ix );
      
      if( !this.map[next_row][next_col].is_a_room() && !this.map[next_row][next_col].is_entrance )
      {
        this.map[next_row][next_col].is_corridor = true;
      }
    }
  };
}

function TunnelCrusher( map )
{
  this.map = map;
  this.deadends = new Array();
  this.directions = [ NORTH, SOUTH, EAST, WEST ];
  
  this.crush_tunnels = function()
  {
    this.gather_deadends();
    this.collapse_tunnels();    
  };
  
  this.gather_deadends = function()
  {
    for( var row = 1; row < MAP_HEIGHT; row++ )
    {
      for( var col = 1; col < MAP_WIDTH; col++ )
      {
        var location = new Point( row, col );
        
        if( this.map[row][col].is_corridor && this.is_cell_a_deadend( location ) )
        {
          this.deadends.push( location );
          this.map[row][col].is_deadend = true;
        }
      }
    }
  };
  
  this.is_cell_a_deadend = function( location )
  {
    var neighbours = 0;
    
    for( var ix = 0; ix < this.directions.length; ix++ )
    {
      var current_cell = new Point( location.x, location.y );
      current_cell.add_vector( this.directions[ix] );
      
      if( this.map[current_cell.x] != undefined 
       && this.map[current_cell.x][current_cell.y] != undefined 
       && this.map[current_cell.x][current_cell.y].is_corridor_neighbour()
       )
      {
        neighbours++;
      }
    }
    
    return neighbours <= 1;
  };
  
  this.collapse_tunnels = function()
  {
    var num_deadends = this.deadends.length;
    
    for( var ix = 0; ix < num_deadends; ix++ )
    {
      if( Math.floor( Math.random() * 100 ) > 50 )
      {
        this.collapse_single_tunnel( this.deadends[ix] );
      }
    }
  };
  
  this.collapse_single_tunnel = function( start )
  {
    var current_cell = new Point( start.x, start.y );
    
    while( this.is_cell_a_deadend( current_cell ) )
    {
      this.map[current_cell.x][current_cell.y].is_corridor = false;
      
      var next_cell = this.get_next_tunnel_cell( current_cell );
      
      if( next_cell != null )
      {
        current_cell.assign( next_cell );
        next_cell = null;
      }
      else
      {
        break; 
      }
    }
  };
  
  this.get_next_tunnel_cell = function( location )
  {
    for( var ix = 0; ix < this.directions.length; ix++ )
    {
      var current_cell = new Point( location.x, location.y );
      current_cell.add_vector( this.directions[ix] );
      
      if( this.map[current_cell.x] != undefined 
       && this.map[current_cell.x][current_cell.y] != undefined 
       && this.map[current_cell.x][current_cell.y].is_corridor
       )
      {
        return new Point( current_cell.x, current_cell.y );
      }
    }
  };
};


//----------------------------------------------------------------------------------------------
// MAP GENERATOR


function MapGenerator()
{
  this.div = $("#map");
  this.map = null;
  this.rooms_list = new Array();
  
  this.generate_map = function()
  {
    this.allocate_map();
    this.block_map_edge();
    this.place_rooms();
    this.build_tunnels();
    this.collapse_tunnels();
  };
  
  this.allocate_map = function()
  {
    this.map = new Array();
    
    for( var y = 0; y < MAP_HEIGHT; y++ )
    {
      this.map[y] = new Array();
      
      for( var x = 0; x < MAP_WIDTH; x++ )
      {
        this.map[y][x] = new Cell(); 
      }
    }
  };
  
  this.block_map_edge = function()
  {
    for( var col = 0; col < MAP_WIDTH; col++ )
    {
      this.map[0][col].blocked = true;
      this.map[MAP_HEIGHT-1][col].blocked = true;
    }
    
    for( var row = 0; row < MAP_HEIGHT; row++ )
    {
      this.map[row][0].blocked = true;
      this.map[row][MAP_WIDTH-1].blocked = true;
    }
  };
  
  this.place_rooms = function()
  {
    // Pack Rooms algorithm
    for( var row = 0; row < MAP_HEIGHT/2; row++ )
    {
      for( var col = 0; col < MAP_WIDTH/2; col++ )
      {
        if( this.map[row][col].room_id == -1 && Math.floor( Math.random() * 100 ) > 50 )
        {
          var room = new Room();
          room.top_left.x = ( col * 2 ) + 1;
          room.top_left.y = ( row * 2 ) + 1;
          
          if( room.fits_on_map() && !room.contains_any_blocked_cell( this.map ) )     // TODO check for doors on the corners... don't allow!
          {
            room.place_room( this.map );
            this.rooms_list.push( room );
            
            var doors = new DoorMaker( this.map, room );
            doors.create_doors();
          }
        }
      }
    }
  };
  
  this.build_tunnels = function()
  {
    var tunnels = new TunnelMaker( this.map );
    tunnels.create_tunnels();
  };
  
  this.collapse_tunnels = function()
  {
    var tunnels = new TunnelCrusher( this.map );
    tunnels.crush_tunnels();
  };
  
// PRELIMINARY CONVERSION FUNCTION
  this.convert_to_tiles = function()
  {
    var tiles = new Array();
    
    for( var y = 0; y < MAP_HEIGHT; y++ )
    {
      tiles[y] = new Array();
      
      for( var x = 0; x < MAP_WIDTH; x++ )
      {
        if( this.map[y][x].is_a_room() || this.map[y][x].is_corridor || this.map[y][x].is_entrance )
        {
          tiles[y][x] = 2;  // Floor
        }
        else
        {
          tiles[y][x] = 3; // Wall
        }
      }
    }
    
    return tiles;
  };
  
// DRAW MAP FUNCTIONS (FOR DEBUGGING) BELOW
  this.draw_map = function()
  {
    for( var row = 0; row < MAP_HEIGHT; row++ )
    {
      var row_output = "";
      
      for( var col = 0; col < MAP_WIDTH; col++ )
      {
        row_output += this.get_cell_character( this.map[row][col] );
      }
      
      this.div.append( row_output + "<br/>" );
    }
  };
  
  this.get_cell_character = function( cell )
  {
    if( cell.is_deadend )
    {
      return DEADEND_CHAR;
    }
    else if( cell.is_corridor )
    {
      return TUNNEL_CHAR;
    }
    else if( cell.blocked )
    {
      return BLOCKED_CHAR;
    }
    else if( cell.is_entrance )
    {
      return ENTRANCE_CHAR;
    }
    else if( cell.is_perimeter )
    {
      return PERIMETER_CHAR; 
    }
    else if( cell.room_id != -1 )
    {
      return ROOM_CHAR; 
    }
    
    else
    {
      return NOTHING_CHAR;
    }
  };
}