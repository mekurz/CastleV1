var MAX_STAT_BAR = 0;
var CUR_STAT_BAR = 1;

function CharacterInfoDialog()
{
  this.str_bar = [];
  this.int_bar = [];
  this.dex_bar = [];
  this.con_bar = [];
    
  this.popup = $("#char_info");
  this.popup.modal({ 
                show: false,
                remote: "html/character_info.html"
          });
  this.popup.on( "show", open_dialog );
  this.popup.on( "shown", function() {
                CharInfo.refresh_ui();
          });
  this.popup.on( "hide", close_dialog );
  
  this.refresh_ui = function()
  {
    this.str_bar[MAX_STAT_BAR] = $("#ci_str_max");
    this.str_bar[CUR_STAT_BAR] = $("#ci_str_current");
    this.int_bar[MAX_STAT_BAR] = $("#ci_int_max");
    this.int_bar[CUR_STAT_BAR] = $("#ci_int_current");
    this.dex_bar[MAX_STAT_BAR] = $("#ci_dex_max");
    this.dex_bar[CUR_STAT_BAR] = $("#ci_dex_current");
    this.con_bar[MAX_STAT_BAR] = $("#ci_con_max");
    this.con_bar[CUR_STAT_BAR] = $("#ci_con_current");
    
    this.initialize();
  };
  
  function set_pct_on_bar( bar, max_pct, cur_pct )
  {
    bar[MAX_STAT_BAR].css( "height", max_pct + "%" );
    bar[CUR_STAT_BAR].css( "height", cur_pct + "%" );
  }
  
  function get_bar_value( bar )
  {
    return parseInt( bar.css( "height" ) );
  }
  
  this.initialize = function()
  {
    this.str = 20;
    this.int = 50;
    this.dex = 75;
    this.con = 60;
    set_pct_on_bar( this.str_bar, this.str, this.str );
    set_pct_on_bar( this.int_bar, this.int, this.int+20 );
    set_pct_on_bar( this.dex_bar, this.dex, this.dex );
    set_pct_on_bar( this.con_bar, this.con, this.con -10 );
  };
  
}