var MAP_WIDTH  = 101;
var MAP_HEIGHT = 101;
var MIN_ROOM_SIZE = 5;
var MAX_ROOM_SIZE = 13;

var BLOCKED_CHAR = "#";
var NOTHING_CHAR = "#";
var ROOM_CHAR    = ".";
var PERIMETER_CHAR = "O";

function Cell()
{
  this.blocked = false;
  this.room_id = -1;
  this.is_perimeter = false;
  this.is_corridor = false;
  this.is_entrance = false;
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
  
  this.location = new Point();
  //this.height = this.generate_random_dimension();
  //this.width  = this.generate_random_dimension();
  this.height = 5;
  this.width  = 7;
  
  this.room_id = max_room_id;
  max_room_id++;
}

var max_room_id = 0;

function MapGenerator()
{
  this.div = $("#map");
  this.map = null;
  
  this.generate_map = function()
  {
    this.allocate_map();
    this.block_map_edge();
    this.place_rooms();
    
    this.draw_map();
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
    // TODO LOTS OF TEMP STUFF HERE
    var room = new Room();
    
    room.location.x = 5;
    room.location.y = 11;
    
    this.place_single_room( room );    
  };
  
  this.place_single_room = function( room )
  {
    // TODO NEED TO CHECK FOR ROOM COLLISION
    
    // Draw room perimeter
    for( var col = room.location.x - 1; col < room.location.x + room.width + 1; col++ )
    {
      this.map[room.location.y - 1][col].is_perimeter = true;
      this.map[room.location.y + room.height][col].is_perimeter = true;
    }
    
    for( var row = room.location.y - 1; row < room.location.y + room.height + 1; row++ )
    {
      this.map[row][room.location.x - 1].is_perimeter = true;
      this.map[row][room.location.x + room.width].is_perimeter = true;
    }
    
    // Fill room
    for( var row = 0; row < room.height; row++ )
    {
      for( var col = 0; col < room.width; col++ )
      {
        this.map[row + room.location.y][col + room.location.x].room_id = room.room_id;
      }
    }
  };
  
  
// DRAW MAP FUNCTIONS BELOW
  this.draw_map = function()
  {
    for( var y = 0; y < MAP_HEIGHT; y++ )
    {
      var row_output = "";
      
      for( var x = 0; x < MAP_WIDTH; x++ )
      {
        row_output += this.get_cell_character( y, x );
      }
      
      this.div.append( row_output + "<br/>" );
    }
  };
  
  this.get_cell_character = function( row, col )
  {
    var cell = this.map[row][col];
    
    if( cell.blocked )
    {
      return BLOCKED_CHAR;
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