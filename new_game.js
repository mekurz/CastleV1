var MAX_STAT = 75;
var MIN_STAT = 25;

function set_pct_on_bar( bar, pct )
{
  bar.css( "height", pct + "%" );
}

function get_bar_value( bar )
{
  return parseInt( bar.css( "height" ) );
}

function NewGameDialog()
{
  this.popup = $("#new_game");
  this.popup.modal({ 
                show: false,
                remote: "html/new_game.html"
          });
  this.popup.on( "show", open_dialog );
  this.popup.on( "shown", function() {
                NewGame.refresh_ui();
          });
  this.popup.on( "hide", close_dialog );
  
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
    this.pool = 100;
    this.str = 32;
    this.int = 32;
    this.dex = 32;
    this.con = 32;
    set_pct_on_bar( this.pool_bar, this.pool );
    set_pct_on_bar( this.str_bar, this.str );
    set_pct_on_bar( this.int_bar, this.int );
    set_pct_on_bar( this.dex_bar, this.dex );
    set_pct_on_bar( this.con_bar, this.con );
    
    this.name.val("");
    this.error.hide();
    this.fill_combos();
    
    this.spells
        .trigger("liszt:updated")
        .attr( "data-placeholder", "Select three spells..." )
        .chosen();
    
    $(".plus").each( function() {
        hold_it( $(this), NewGame.plus );
      });
    
    $(".minus").each( function() {
        hold_it( $(this), NewGame.minus );
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
      set_pct_on_bar( NewGame.pool_bar, NewGame.pool );
      set_pct_on_bar( bar, value + 1 );
    }
  };
  
  this.minus = function( bar_id )
  {
    var bar = NewGame.get_bar( bar_id );
    var value = get_bar_value( bar );
    
    if( NewGame.pool < 100 && value > MIN_STAT ) // Don't let the user go below the min stat value
    {
      NewGame.pool++;
      set_pct_on_bar( NewGame.pool_bar, NewGame.pool );
      set_pct_on_bar( bar, value - 1 );
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
      this.error.html("You must assign all remaining points to Strengh, Intelligence,<br/>Dexterity and Constitution.").show();
      return false;
    }
    
    if( this.known_spells.length != 3 )
    {
      this.error.text("You must choose three spells to learn.").show();
      return false;
    }
    
    if( Player != null && !confirm( "You are currently in a game. Any unsaved progress will be lost.\n\nDo you want to continue?" ) )
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
      // TODO ASSIGN PLAYER STATS HERE
      
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

function hold_it( btn, action )
{
  var t = 0;
  var start = 250; 
  
  var repeat = function () {
      action( btn.attr("stat") );
      t = setTimeout(repeat, start);
      start = Math.max( start / 2, 20 );
  };

  btn.off()
     .mousedown( function() {
       start = 250;
       repeat();
     })
     .on( "mouseup mouseleave", function() {
       clearTimeout( t );
     });
};