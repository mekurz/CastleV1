function run_unit_tests()
{
  MapGenerator_allocate_map();
  MapGenerator_get_cell_character();
  
  
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