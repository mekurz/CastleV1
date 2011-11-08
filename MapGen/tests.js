function run_unit_tests()
{
  MapGenerator_allocate_map();
  MapGenerator_get_cell_character();
  MapGenerator_block_map_edge();
 
  Cell_is_a_room();
  Cell_set_as_perimeter();
  
  Room_contains_point();
  Room_fits_on_map();
  Room_contains_any_blocked_cell();
}

function MapGenerator_allocate_map()
{
  module( "MapGenerator - allocate_map" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  
  test( "Map Dimensions", function()  
  {  
    equals( mapgen.map.length, MAP_HEIGHT, "Check height" );
    equals( mapgen.map[0].length, MAP_WIDTH, "Check width" );
  });
  
  test( "Map Contents", function()  
  {  
    var all_cells = true;
     
    for( var row = 0; row < MAP_HEIGHT && all_cells; row++ )
    {
      for( var col = 0; col < MAP_WIDTH && all_cells; col++ )
      {
        if( mapgen.map[row][col] instanceof Cell == false )
        {
          all_cells = false;
        }
      }
    }
    
    ok( all_cells, "Check that all Cells have been created" );
  });
}

function MapGenerator_get_cell_character()
{
  module( "MapGenerator - get_cell_character" );
  var mapgen = new MapGenerator();
  
  test( "Blocked Cell", function()  
  {  
    var cell = new Cell();
    cell.blocked = true;
    equals( mapgen.get_cell_character( cell ), BLOCKED_CHAR, "Check Cell character - Blocked" );
  });
  
  test( "Perimeter Cell", function()  
  {  
    var cell = new Cell();
    cell.is_perimeter = true;
    equals( mapgen.get_cell_character( cell ), PERIMETER_CHAR, "Check Cell character - Perimeter" );
  });
  
  test( "Room Cell", function()  
  {  
    var cell = new Cell();
    cell.room_id = 999;
    equals( mapgen.get_cell_character( cell ), ROOM_CHAR, "Check Cell character - Room" );
  });
  
  test( "Nothing Cell", function()  
  {  
    var cell = new Cell();
    equals( mapgen.get_cell_character( cell ), NOTHING_CHAR, "Check Cell character - Nothing" );
  });
}

function MapGenerator_block_map_edge()
{
  module( "MapGenerator - block_map_edge" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  mapgen.block_map_edge();
  
  test( "Horizontals", function()  
  {  
    var all_cells = true;
     
    for( var col = 0; col < MAP_WIDTH; col++ )
    {
      if( !mapgen.map[0][col].blocked || !mapgen.map[MAP_HEIGHT-1][col].blocked )
      {
        all_cells = false;
        break;
      }
    }
    
    ok( all_cells, "Check that top and bottom rows are blocked" );
  });
  
  test( "Verticals", function()  
  {  
    var all_cells = true;
     
    for( var row = 0; row < MAP_HEIGHT; row++ )
    {
      if( !mapgen.map[row][0].blocked || !mapgen.map[row][MAP_WIDTH-1].blocked )
      {
        all_cells = false;
        break;
      }
    }
    
    ok( all_cells, "Check that left and right columns are blocked" );
  });
}

function Cell_is_a_room()
{
  module( "Cell - is_a_room" );
    
  test( "Default", function()  
  {  
    var cell = new Cell();
    equals( cell.room_id, -1, "Default room_id is -1" );
    ok( !cell.is_a_room(), "New cells are not rooms" );
  });

  test( "Room ID set", function()  
  {  
    var cell = new Cell();
    cell.room_id = 999;
    ok( cell.is_a_room(), "Check that cell is a room" );
  });
}

function Cell_set_as_perimeter()
{
  module( "Cell - set_as_perimeter" );
    
  test( "Default", function()  
  {  
    var cell = new Cell();
    equals( cell.room_id, -1, "Default room_id is -1" );
    equals( cell.blocked, false, "Cell is not blocked" );
    
    cell.set_as_perimeter();
    ok( cell.is_perimeter, "Unblocked non-room cells can be marked as a perimeter" );
  });
  
  test( "Blocked Cells", function()  
  {  
    var cell = new Cell();
    equals( cell.room_id, -1, "Default room_id is -1" );
    cell.blocked = true;    
    cell.set_as_perimeter();
    ok( !cell.is_perimeter, "Blocked cells cannot be marked as a perimeter" );
  });

  test( "Room Cells", function()  
  {  
    var cell = new Cell();
    equals( cell.blocked, false, "Cell is not blocked" );
    
    cell.room_id = 999;
    cell.set_as_perimeter();
    ok( !cell.is_perimeter, "Blocked cells cannot be marked as a perimeter" );
  });
}

function Room_contains_point()
{
  module( "Room - contains_point" );
  var room = new Room();
  room.top_left = new Point( 1, 1 );
  room.width = 5;
  room.height = 7;
  
  test( "Outer cells", function()  
  {  
    ok( !room.contains_point( 7, 9 ), "Check (7,9)" );
    ok( !room.contains_point( 0, 0 ), "Check (0,0)" );
    ok( !room.contains_point( 100, 100 ), "Check (100,100)" );
    ok( !room.contains_point( -10, -10 ), "Check (-10,-10)" );
  });
  
  test( "Contains all internal cells", function()  
  {  
    var all_cells = true;
     
    for( var row = room.top_left.y; row < room.top_left.y + room.height && all_cells; row++ )
    {
      for( var col = room.top_left.x; col < room.top_left.x + room.width && all_cells; col++ )
      {
        if( !room.contains_point( col, row ) )
        {
          all_cells = false;
        }
      }
    }
    
    ok( all_cells, "Check that all cells inside the room count as contained by the room" );
  });
}

function Room_fits_on_map()
{
  module( "Room - fits_on_map" );
  
  test( "Room fits completely", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 1, 1 );
    room.width = 5;
    room.height = 7;
    
    ok( room.fits_on_map(), "Room fits on map" );
  });
  
  test( "Room overlaps TOP", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 51, -1 );
    room.width = 5;
    room.height = 7; 
    ok( !room.fits_on_map(), "Room fits on map" );
  });

  test( "Room overlaps BOTTOM", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 51, MAP_HEIGHT - 11 );
    room.width = 5;
    room.height = 13; 
    ok( !room.fits_on_map(), "Room fits on map" );
  });
  
  test( "Room overlaps RIGHT", function()  
  {  
    var room = new Room();
    room.top_left = new Point( -2, 51 );
    room.width = 5;
    room.height = 7; 
    ok( !room.fits_on_map(), "Room fits on map" );
  });
  
  test( "Room overlaps LEFT", function()  
  {  
    var room = new Room();
    room.top_left = new Point( MAP_WIDTH - 7, 51 );
    room.width = 13;
    room.height = 7; 
    ok( !room.fits_on_map(), "Room fits on map" );
  });
  
  test( "Room overlaps BOTTOM and LEFT", function()  
  {  
    var room = new Room();
    room.top_left = new Point( MAP_WIDTH - 7, MAP_HEIGHT - 7 );
    room.width = 13;
    room.height = 13; 
    ok( !room.fits_on_map(), "Room fits on map" );
  });
}

function Room_contains_any_blocked_cell()
{
  module( "Room - contains_any_blocked_cell" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  mapgen.map[10][10].blocked = true;  // Block a cell  
  mapgen.map[10][30].room_id = 999;  // Make a cell part of a room  
  
  test( "Room is unblocked", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 20, 20 );
    room.width = 5;
    room.height = 5; 
    ok( !room.contains_any_blocked_cell( mapgen.map ), "All cells are unblocked" );
  });
  
  test( "Blocked cell", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 8, 8 );
    room.width = 5;
    room.height = 5; 
    ok( room.contains_any_blocked_cell( mapgen.map ), "Check that room is blocked" );
  });
  
  test( "Blocked by another room", function()  
  {  
    var room = new Room();
    room.top_left = new Point( 28, 8 );
    room.width = 5;
    room.height = 5; 
    ok( room.contains_any_blocked_cell( mapgen.map ), "Check that room is blocked" );
  });
}
