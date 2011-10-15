var FREEZE_MONSTERS = 0;      // Stop all monsters from moving and attacking
var MONSTER_SPELLS = 1;       // Allow applicable monsters to cast spells

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
  }
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
    add_spell_effect( new Splat( new Point( 5, 5 ) ) );
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
  for( i = monsters.length - 1; i >= 0; --i )
  {
    monsters[i].kill();
  }
  
  document.game.do_turn();
}