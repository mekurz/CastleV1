var MAX_STAT = 20;
var MIN_STAT = 6;
var DEFAULT_STAT = 8;

function set_value_on_bar( bar, value )
{
  bar.css( "height", ( value / MAX_STAT * 100 ) + "%" );
}

function get_bar_value( bar )
{
  return parseInt( bar.css( "height" ) ) / 100 * MAX_STAT;
}

function assign_player_stat( bar, stat )
{
  var value = get_bar_value( bar );
  Player.stats[stat].base_value = Player.stats[stat].current_value = value;
}

function NewGameDialog()
{
  this.popup = $("#new_game");
  this.popup.modal({ 
                show: false,
                remote: "html/new_game.html"
          });
  this.popup.on( "show.bs.modal", open_dialog );
  this.popup.on( "shown.bs.modal", function() {
                NewGame.refresh_ui();
          });
  this.popup.on( "hide.bs.modal", close_dialog );
  
  this.refresh_ui = function()
  {
    this.pool_bar = $("#ng_pool");
    this.str_bar = $("#ng_str");
    this.int_bar = $("#ng_int");
    this.dex_bar = $("#ng_dex");
    this.con_bar = $("#ng_con");
    this.name = $("#ng_name");
    this.spells = $("#ng_spells");
    this.error = $("#ng_error");
    
    this.initialize();
  };
  
  this.initialize = function()
  {
    this.known_spells = [];
    this.pool = 10;
    set_value_on_bar( this.pool_bar, this.pool );
    set_value_on_bar( this.str_bar, DEFAULT_STAT );
    set_value_on_bar( this.int_bar, DEFAULT_STAT );
    set_value_on_bar( this.dex_bar, DEFAULT_STAT );
    set_value_on_bar( this.con_bar, DEFAULT_STAT );
    
    this.name.val("");
    this.error.hide();
    this.fill_combos();
    
    this.spells.chosen();
    
    $(".plus").click( function( evt ) {
        NewGame.plus( $(this).attr("stat") );
        evt.stopPropagation();
      });
    
    $(".minus").click( function( evt ) {
        NewGame.minus( $(this).attr("stat") );
        evt.stopPropagation();
      });
  };
  
  this.fill_combos = function()
  {
    var spells = this.spells;
    var xml = Loader.get_data_by_level( "Spell", 1 );
    
    spells.empty().append( $("<option>").text("") );
     
    xml.each( function() {
        var $this = $(this);        
        $("<option>").text( $this.find("Description").text() ).val( $this.attr("id") ).appendTo( spells );
      });
  };
  
  this.get_bar = function( bar_id )
  {
    switch( bar_id )
    {
      case "str": return this.str_bar;
      case "int": return this.int_bar;
      case "dex": return this.dex_bar;
      case "con": return this.con_bar;
    }
  };
  
  this.plus = function( bar_id )
  {
    var bar = NewGame.get_bar( bar_id );
    var value = get_bar_value( bar );
    
    if( NewGame.pool > 0 && value < MAX_STAT )
    {
      NewGame.pool--;
      set_value_on_bar( NewGame.pool_bar, NewGame.pool );
      set_value_on_bar( bar, value + 1 );
    }
  };
  
  this.minus = function( bar_id )
  {
    var bar = NewGame.get_bar( bar_id );
    var value = get_bar_value( bar );
    
    if( NewGame.pool <= MAX_STAT && value > MIN_STAT ) // Don't let the user go below the min stat value
    {
      NewGame.pool++;
      set_value_on_bar( NewGame.pool_bar, NewGame.pool );
      set_value_on_bar( bar, value - 1 );
    }
  };
  
  this.validate = function()
  {
    if( $.trim( this.name.val() ) == "" )
    {
      this.error.text("You must enter a name.").show();
      return false;
    }
    
    if( this.pool != 0 )
    {
      this.error.html("You must assign all remaining points to Strength, Intelligence,<br/>Dexterity and Constitution.").show();
      return false;
    }
    
    if( this.known_spells.length != 3 )
    {
      this.error.text("You must choose three spells to learn.").show();
      return false;
    }
    
    if( document.game.dirty && Player != null && !confirm( "You are currently in a game. Any unsaved progress will be lost.\n\nDo you want to continue?" ) )
    {
      return false;
    }
    
    return true;
  };
  
  this.update_known_spells = function()
  {
    var known_spells = this.known_spells = [];
    
    $("#ng_spells option:selected").each( function() {
        known_spells.push( $(this).val() );
      });
  };
  
  this.ok = function()
  { 
    this.update_known_spells();
    
    if( this.validate() )
    {
      Player = new PlayerActor();
      Player.description = this.name.val();
      Player.spellbook = this.known_spells.slice();
      assign_player_stat( this.str_bar, STR );
      assign_player_stat( this.int_bar, INT );
      assign_player_stat( this.dex_bar, DEX );
      assign_player_stat( this.con_bar, CON );
      
      default_inventory();
      
      SpellBar.update_list( this.known_spells );
      
      document.game.bind_events();
      document.game.create_new_game();
      this.popup.modal("hide");
    }
  };
  
  this.open = function()
  {
    this.popup.modal("show");
  };
}

function default_inventory()
{
  // Puny Dagger (equipped)
  var weapon = new Item("weapon1");
  weapon.equipped = "weapon";
  Player.bag.push( weapon );
}