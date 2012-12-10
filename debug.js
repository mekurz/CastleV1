var DEBUGGING = 0;
var FREEZE_MONSTERS = 0;      // Stop all monsters from moving and attacking
var MONSTER_SPELLS = 1;       // Allow applicable monsters to cast spells
var DETECT_MONSTERS = 0;      // Detect all monsters

var MAGIC_MISSILE = 2;
var FIREBALL = 5;
var FIRE_BREATH = 7;
var FIRE_BREATH_D = 8;

var RATMAN = 0;
var HILLGIANT = 1;

function run_test()
{
  var test = parseInt( $("#test_menu").val() );
  
  switch( test )
  {
    case 0: test_fizzle(); break;
    case 1: test_splat(); break;
    case 2: test_projectiles(); break;
    case 3: test_aoe(); break;
    case 4: kill_all_monsters(); break;
    case 5: document.game.do_turn(); break;
    case 6: test_cones(); break;
    case 7: test_diagonal_cones(); break;
    case 8: reveal_map(); break;
    case 9: test_game_over(); break;
    case 10: reveal_secret_doors(); break;
    case 11: Storage.erase(); break;
    case 12: reveal_traps(); break;
    case 13: learn_all_spells(); break;
  }
}

function cast_spell_by_id( spell )
{
  if( !is_processing() )
  {
    crosshairs_cursor();
    toggle_spell( SpellBar.get_button_ix( spell ) );
    set_command( spell );
  }
}

function get_debug_spellbar()
{
 return ["p1","p2","p3","u2"]; 
}

function test_fizzle()
{
  if( !is_processing() )
  {
    add_spell_effect( new SinglePointFadingSpellEffect( FIZZLE, new Point(100,100) ) );
    add_spell_effect( new SinglePointFadingSpellEffect( FIZZLE, new Point(500,100) ) );
    add_spell_effect( new SinglePointFadingSpellEffect( FIZZLE, new Point(250,250) ) );
    document.game.draw_spells();
  }
}

function test_projectiles()
{
  if( !is_processing() )
  {
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, Map.top_left ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x + Math.floor(VIEWPORT_WIDTH/2), Map.top_left.y ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x + VIEWPORT_WIDTH - 1, Map.top_left.y ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x, Map.top_left.y + Math.floor(VIEWPORT_HEIGHT/2) ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x + VIEWPORT_WIDTH - 1, Map.top_left.y + Math.floor(VIEWPORT_HEIGHT/2) ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x, Map.top_left.y + VIEWPORT_HEIGHT - 1 ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x + Math.floor(VIEWPORT_WIDTH/2), Map.top_left.y + VIEWPORT_HEIGHT - 1 ) ) );
    add_spell_effect( new ProjectileSpellEffect( MAGIC_MISSILE, Player.location, new Point( Map.top_left.x + VIEWPORT_WIDTH - 1, Map.top_left.y + VIEWPORT_HEIGHT - 1 ) ) );
    document.game.draw_spells();
  }
}

function test_splat()
{
  if( !is_processing() )
  {
    add_spell_effect( new SinglePointRotatingFadingSpellEffect( SPLAT, new Point( 5, 5 ) ) );
    document.game.draw_spells();
  }
}

function test_aoe()
{
  if( !is_processing() )
  {
    add_spell_effect( new ScalingRotatingFadingSpellEffect( FIREBALL, new Point( 7, 7 ) ) );
    document.game.draw_spells();
  }
}

function kill_all_monsters()
{
  var monsters = Dungeon.get_monsters();
  
  for( i = monsters.length - 1; i >= 0; --i )
  {
    monsters[i].kill();
  }
  
  document.game.do_turn();
}

function learn_all_spells()
{
  Loader.xml.find("Spell").each( function() {
          Player.spellbook.push( this.attributes[0].value );
      });
}

function test_cones()
{
  if( !is_processing() )
  {
    add_spell_effect( new ConeSpellEffect( FIRE_BREATH, Player.location, new Point( Player.location.x, Player.location.y - 1 ) ) );
    add_spell_effect( new ConeSpellEffect( FIRE_BREATH, Player.location, new Point( Player.location.x, Player.location.y + 1 ) ) );
    add_spell_effect( new ConeSpellEffect( FIRE_BREATH, Player.location, new Point( Player.location.x - 1, Player.location.y ) ) );
    add_spell_effect( new ConeSpellEffect( FIRE_BREATH, Player.location, new Point( Player.location.x + 1, Player.location.y ) ) );
    document.game.draw_spells();
  }
}

function test_diagonal_cones()
{
  if( !is_processing() )
  {
    add_spell_effect( new DiagonalConeSpellEffect( FIRE_BREATH_D, Player.location, new Point( Player.location.x + 1, Player.location.y - 1 ) ) );
    add_spell_effect( new DiagonalConeSpellEffect( FIRE_BREATH_D, Player.location, new Point( Player.location.x - 1, Player.location.y - 1 ) ) );
    add_spell_effect( new DiagonalConeSpellEffect( FIRE_BREATH_D, Player.location, new Point( Player.location.x - 1, Player.location.y + 1 ) ) );
    add_spell_effect( new DiagonalConeSpellEffect( FIRE_BREATH_D, Player.location, new Point( Player.location.x + 1, Player.location.y + 1) ) );
    document.game.draw_spells();
  }
}

function random_map()
{
  Dungeon.level_ix = 0;
  Dungeon.levels = new Array();
  Dungeon.create_level(0);
  Player.location.assign( Dungeon.levels[0].get_starting_location() );
  Dungeon.explore_at_location( Player.location );
  Map.center_map_on_location( Player.location );
  
  // Spawn monsters (start with one per room)
  for( var monster_ix = 0; monster_ix < Dungeon.levels[0].rooms.length; ++monster_ix )
  {
    Dungeon.levels[0].spawn_monster();
  }
  
  document.game.draw();
}

function switch_to_debug()
{
  setup_debug_level();
  Dungeon.explore_at_location( Player.location );
  Map.center_map_on_location( Player.location );
  document.game.draw();
}

function reveal_map()
{
  var map_tiles = Dungeon.get_map_tiles();
  
  for( var row = 0; row < map_tiles.length; ++row )
  {
    for( var col = 0; col < map_tiles[0].length; ++col )
    {
      map_tiles[row][col].explored = true;
    }
  }
  
  document.game.do_turn();
}

function reveal_secret_doors()
{
  var doors = Dungeon.get_current_level().doors;
  
  for( var ix = 0; ix < doors.length; ++ix )
  {
    doors[ix].find();
  }
  
  document.game.do_turn();
}

function reveal_traps()
{
  var traps = Dungeon.get_current_level().traps;
  
  for( var ix = 0; ix < traps.length; ++ix )
  {
    traps[ix].found = true;
  }
  
  document.game.do_turn();
}

function test_game_over()
{
  if( !is_processing() )
  {
    Player.current_hp = 0;
    add_spell_effect( new MapFadeOut() );
    document.game.draw_spells();
  }
}

function setup_debug_level()
{
  Player.move_to( new Point( 10, 7 ) );
  Dungeon.levels = new Array();
  create_debug_level();  
  create_debug_monsters();
  create_debug_items();
  create_debug_traps();
}

function create_debug_monsters()
{
  var level = Dungeon.get_current_level();
  level.create_single_monster( RATMAN, new Point(  3, 3 ) );
  level.create_single_monster( RATMAN, new Point( 10, 2 ) );
  level.create_single_monster( RATMAN, new Point(  6,14 ) );
  level.create_single_monster( RATMAN, new Point( 12,14 ) );
  level.create_single_monster( HILLGIANT, new Point( 19, 9 ) );
  level.create_single_monster( RATMAN, new Point( 22,20 ) );  // in dark
  level.create_single_monster( RATMAN, new Point( 10,20 ) );  // in unexplored
  level.create_single_monster( 2, new Point( 18, 3 ) );  // inert slime
}

function create_debug_items()
{
  var level = Dungeon.get_current_level();
  level.create_single_item( "neck1", new Point( 1, 1 ) );
  level.create_single_item( "neck2", new Point( 11, 7 ) );
  level.create_single_item( "feet1", new Point( 18, 10 ) );
  level.create_single_item( "back1", new Point( 11, 7 ) );
  level.create_single_item( "head1", new Point( 5, 5 ) );
  level.create_single_item( "hands1", new Point( 26, 14 ) );
  level.create_single_item( "chest1", new Point( 6, 4 ) );
  level.create_single_item( "weapon1", new Point( 6, 14 ) );
  level.create_single_item( "weapon2", new Point( 26, 14 ) );
  level.create_single_item( "shield1", new Point( 16, 8 ) );
  level.create_single_item( "shield2", new Point( 24, 5 ) );
  level.create_single_item( "shield2", new Point( 10, 20 ) ); // in unexplored
  level.create_single_item( "shield2", new Point( 19, 22 ) ); // in dark
  level.create_single_item( "ring1", new Point( 9, 7 ) );
  level.create_single_item( "ring2", new Point( 9, 7 ) );
}

function create_debug_traps()
{
  var level = Dungeon.get_current_level();
  level.traps.push( new Trap( 1, new Point( 4, 11 ) ) );    // Spear
  level.traps.push( new Trap( 2, new Point( 10, 18 ) ) );   // Rune (resets)
}

function create_debug_level()
{
  var new_level = new Level();
  
  var map_tiles = [ [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 3, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 3 ],
                    [ 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2, 2, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 5, 3, 1, 1, 1, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 5, 5, 5, 5, 3, 3, 3, 3, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 3, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 3, 5, 5, 5, 5, 5, 5, 5, 3, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 3, 5, 5, 5, 5, 5, 5, 5, 3, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 3, 5, 5, 5, 5, 5, 5, 5, 3, 1, 1, 3 ],
                    [ 3, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 3, 5, 5, 5, 5, 5, 5, 5, 3, 1, 1, 3 ],
                    [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ]
                  ];
 
  for( var row = 0; row < map_tiles.length; ++row )
  {
    new_level.map_tiles[row] = new Array();
    
    for( var col = 0; col < map_tiles[0].length; ++col )
    {
      new_level.map_tiles[row][col] = new Tile( map_tiles[row][col] );
      
      if( map_tiles[row][col] != 3 )
      {
        new_level.map_tiles[row][col].passable = true;
      }
      
      if( map_tiles[row][col] != 4 )
      {
        new_level.map_tiles[row][col].explored = true;
      }
      
      if( map_tiles[row][col] != 5 )
      {
        new_level.map_tiles[row][col].is_lit = true;
      }
    }
  }
  
  new_level.doors.push( new Door( CLOSED, 3, 16, 22 ) );
  new_level.map_tiles[16][22].is_entrance = true;
  new_level.doors.push( new Door( OPEN  , 3,  9, 21 ) );
  new_level.map_tiles[9][21].is_entrance = true;
  new_level.doors.push( new Door( SECRET, 3, 18, 18 ) );
  new_level.map_tiles[18][18].is_entrance = true;
  
  Dungeon.levels[0] = new_level;
}