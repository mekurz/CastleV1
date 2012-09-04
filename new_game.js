var MAX_STAT = 100;
var MIN_STAT = 20;

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
  
  function set_pct_on_bar( bar, pct )
  {
    bar.css( "height", pct + "%" );
  }
  
  function get_bar_value( bar )
  {
    return parseInt( bar.css( "height" ) );
  }
  
  this.initialize = function()
  {
    this.known_spells = [];
    this.pool = 50;
    this.str = 20;
    this.int = 20;
    this.dex = 20;
    this.con = 20;
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
  };
  
  this.fill_combos = function()
  {
    var spells = this.spells;
    var xml = Loader.get_data_by_level( "Spell", 1 );
    
    spells.empty();
    $("<option>").text("").appendTo( spells );
     
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
    var bar = this.get_bar( bar_id );
    var value = get_bar_value( bar );
    
    if( this.pool > 0 && value < MAX_STAT )
    {
      this.pool -= 2;
      set_pct_on_bar( this.pool_bar, this.pool );
      set_pct_on_bar( bar, value + 2 );
    }
  };
  
  this.minus = function( bar_id )
  {
    var bar = this.get_bar( bar_id );
    var value = get_bar_value( bar );
    
    if( this.pool < 100 && value > MIN_STAT ) // Don't let the user go below the min stat value
    {
      this.pool += 2;
      set_pct_on_bar( this.pool_bar, this.pool );
      set_pct_on_bar( bar, value - 2 );
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
    
    if( this.validate() )   // TODO check for active game flag and ask confirmation before actually creating a new game
    {
      Player = new PlayerActor();
      Player.description = this.name.val();
      Player.spellbook = this.known_spells.slice();
      // TODO ASSIGN PLAYER STATS HERE
      
      default_inventory();
      
      SpellBar.update_list( this.known_spells );
      
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