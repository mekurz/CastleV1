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
  this.popup.on( "hide", function() { 
                close_dialog();
                document.game.draw();
          });
  
  this.refresh_ui = function()
  {
    this.pool_bar = $("#ng_pool");
    this.str_bar = $("#ng_str");
    this.int_bar = $("#ng_int");
    this.dex_bar = $("#ng_dex");
    this.con_bar = $("#ng_con");
    this.learn_div = $("#learn_spells");
    
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
  
  this.ok = function()
  { 
    this.popup.modal("hide");
  };
}