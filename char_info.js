var MAX_STAT_BAR = 0;
var CUR_STAT_BAR = 1;

function CharacterInfoDialog()
{
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
  
  function set_pct_on_bar( bar, stat )
  {
    $("#ci_" + bar + "_max").css( "height", Player.stats[stat] + "%" );
    $("#ci_" + bar + "_current").css( "height", Player.stats[stat+1] + "%" );
  }
  
  function get_bar_value( bar )
  {
    return parseInt( bar.css( "height" ) );
  }
  
  this.refresh_ui = function()
  {
    set_pct_on_bar( "str", MAX_STR );
    set_pct_on_bar( "int", MAX_INT );
    set_pct_on_bar( "dex", MAX_DEX );
    set_pct_on_bar( "con", MAX_CON );
    
    $("#ci_img").attr("src", DrawPlayer.get_data_url() );
    $("#ci_name").text( Player.description );
    $("#ci_lvl").text( Player.level );
    $("#ci_xp").text( Player.xp.toCommas() );
    $("#ci_next").text( (1234567).toCommas() ); // TODO THIS NEEDS TO BE CALCULATED
    Player.update_hp("ci_hp");
    Player.update_mana("ci_mana");
    $("#ci_ac").text( Player.ac );
    $("#ci_gold").text( (1234567).toCommas() ); // TODO THIS NEEDS TO COME FROM PLAYER
    $("#ci_time").text( Time.get_time() );
  };
}