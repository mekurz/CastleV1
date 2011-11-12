function run_unit_tests()
{
  MAP_HEIGHT = 100;
  MAP_WIDTH = 100;
  
  MapGenerator_allocate_map();
  MapGenerator_get_cell_character();
  MapGenerator_block_map_edge();
 
  Cell_is_a_room();
  Cell_set_as_perimeter();
  
  Room_contains_point();
  Room_fits_on_map();
  Room_contains_any_blocked_cell();
  Room_draw_perimeter();
  Room_fill_room();
  
  DoorMaker_count_existing_doors_for_room();
  DoorMaker_add_valid_horizontal_sills();
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
  
  test( "Entrance Cell", function()  
  {  
    var cell = new Cell();
    cell.is_entrance = true;
    equals( mapgen.get_cell_character( cell ), ENTRANCE_CHAR, "Check Cell character - Entrance" );
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

function Room_draw_perimeter()
{
  module( "Room - draw_perimeter" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  
  var room = new Room();
  room.top_left = new Point( 8, 8 );
  room.width = 5;
  room.height = 5;
  
  room.draw_perimeter( mapgen.map );
  
  test( "Perimeter is drawn", function()
  {
    var all_cells = true;
     
    for( var row = 0; row < MAP_HEIGHT && all_cells; row++ )
    {
      for( var col = 0; col < MAP_WIDTH && all_cells; col++ )
      {
        if( ( ( row == 7 || row == 13 ) && col >= 7 && col <= 13 )
          ||( ( col == 7 || col == 13 ) && row >= 7 && row <= 13 ) )
        {
          all_cells = mapgen.map[row][col].is_perimeter;
        }
        else
        {
          all_cells = !mapgen.map[row][col].is_perimeter; 
        }
      }
    }
    
    ok( all_cells, "Check that perimeter is drawn correctly" );
  });
}

function Room_fill_room()
{
  module( "Room - fill_room" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  
  var room = new Room();
  room.top_left = new Point( 8, 8 );
  room.width = 5;
  room.height = 5;
  
  room.fill_room( mapgen.map );
  
  test( "Room is filled", function()
  {
    var all_cells = true;
     
    for( var row = 0; row < MAP_HEIGHT && all_cells; row++ )
    {
      for( var col = 0; col < MAP_WIDTH && all_cells; col++ )
      {
        if( row >= 8 && row <= 12 && col >= 8 && col <= 12 )
        {
          all_cells = mapgen.map[row][col].is_a_room();
        }
        else
        {
          all_cells = !mapgen.map[row][col].is_a_room(); 
        }
      }
    }
    
    ok( all_cells, "Check that the room is filled correctly" );
  });
}

function DoorMaker_count_existing_doors_for_room()
{
  module( "DoorMaker - count_existing_doors_for_room" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  
  test( "Room has no doors", function()
  {
    var room = new Room();
    room.top_left = new Point( 8, 8 );
    room.width = 5;
    room.height = 5;
    room.place_room( mapgen.map );
    
    var doors = new DoorMaker( mapgen.map, room );
    
    equals( doors.count_existing_doors_for_room(), 0, "Check that there are no doors attached to a room" );
  });
  
  test( "Corner cells don't get counted", function()
  {
    var room = new Room();
    room.top_left = new Point( 8, 8 );
    room.width = 5;
    room.height = 5;
    room.place_room( mapgen.map );
    mapgen.map[7][7].is_entrance = true;
    mapgen.map[7][13].is_entrance = true;
    mapgen.map[13][7].is_entrance = true;
    mapgen.map[13][13].is_entrance = true;
    
    var doors = new DoorMaker( mapgen.map, room );
    
    equals( doors.count_existing_doors_for_room(), 0, "Check that corner cells don't get counted for doors" );
  });
  
  test( "Has 3 doors", function()
  {
    var room = new Room();
    room.top_left = new Point( 8, 8 );
    room.width = 5;
    room.height = 5;
    room.place_room( mapgen.map );
    mapgen.map[7][10].is_entrance = true;
    mapgen.map[10][13].is_entrance = true;
    mapgen.map[13][10].is_entrance = true;
    
    var doors = new DoorMaker( mapgen.map, room );
    
    equals( doors.count_existing_doors_for_room(), 3, "Check that Room has 3 doors" );
  });
}

function DoorMaker_add_valid_horizontal_sills()
{
  module( "DoorMaker - add_valid_horizontal_sills" );
  var mapgen = new MapGenerator();
  mapgen.allocate_map();
  
  test( "All NORTH is valid", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
    room.width = 5;
    
    room.top_left = new Point( 8, 3 );
    doors.add_north_sills();
    equals( doors.sills.length, 3, "Check that Room has 3 NORTH sills at ROW 3" );
    doors.sills = new Array();
    
    room.top_left = new Point( 8, 8 );
    doors.add_north_sills();
    equals( doors.sills.length, 3, "Check that Room has 3 NORTH sills at ROW 8" );
    doors.sills = new Array();
  });
  
  test( "No NORTH is valid", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
    room.width = 5;
    
    room.top_left = new Point( 8, 0 );
    doors.add_north_sills();
    equals( doors.sills.length, 0, "Check that Room has 0 NORTH sills at ROW 0" );
    doors.sills = new Array();
    
    room.top_left = new Point( 8, 1 );
    doors.add_north_sills();
    equals( doors.sills.length, 0, "Check that Room has 0 NORTH sills at ROW 1" );
    doors.sills = new Array();
    
    room.top_left = new Point( 8, 2 );
    doors.add_north_sills();
    equals( doors.sills.length, 0, "Check that Room has 0 NORTH sills at ROW 2" );
    doors.sills = new Array();
  });
  
  test( "NORTH has 1 sill", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
       
    room.top_left = new Point( 7, 7 );
    room.width = 7;
    
    mapgen.map[6][7].blocked = true;    // One perimeter cell is blocked
    mapgen.map[6][9].is_entrance = true;   // One perimeter cell is already an entrance (i.e. from a different room)
    mapgen.map[5][11].blocked = true;   // One possible entrance would open onto a blocked cell
    
    doors.add_north_sills();
    equals( doors.sills.length, 1, "Check that Room has 1 NORTH sill" );
  });
  
  test( "All SOUTH is valid", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
    room.width = 5;
    room.height = 0;
    
    room.top_left = new Point( 8, MAP_HEIGHT-2 );
    doors.add_south_sills();
    equals( doors.sills.length, 3, "Check that Room has 3 SOUTH sills at ROW MAP_HEIGHT-2" );
    doors.sills = new Array();
    
    room.top_left = new Point( 8, 8 );
    doors.add_south_sills();
    equals( doors.sills.length, 3, "Check that Room has 3 SOUTH sills at ROW 8" );
    doors.sills = new Array();
  });
  
  test( "No SOUTH is valid", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
    room.width = 5;
    room.height = 0;
    
    room.top_left = new Point( 8, MAP_HEIGHT-1 );
    doors.add_south_sills();
    equals( doors.sills.length, 0, "Check that Room has 0 SOUTH sills at ROW MAP_HEIGHT-1" );
    doors.sills = new Array();
    
    room.top_left = new Point( 8, MAP_HEIGHT );
    doors.add_south_sills();
    equals( doors.sills.length, 0, "Check that Room has 0 SOUTH sills at ROW MAP_HEIGHT" );
    doors.sills = new Array();
  });
  
  test( "SOUTH has 1 sill", function()
  {
    var room = new Room();
    var doors = new DoorMaker( mapgen.map, room );
       
    room.top_left = new Point( 7, 7 );
    room.width = 7;
    room.height = 5;
    
    mapgen.map[12][7].blocked = true;    // One perimeter cell is blocked
    mapgen.map[12][9].is_entrance = true;   // One perimeter cell is already an entrance (i.e. from a different room)
    mapgen.map[13][11].blocked = true;   // One possible entrance would open onto a blocked cell
    
    doors.add_south_sills();
    equals( doors.sills.length, 1, "Check that Room has 1 SOUTH sill" );
  });

}
