var MAX_STAT_BAR = 0;
var CUR_STAT_BAR = 1;

function CharacterInfoDialog()
{
  this.popup = $("#char_info");
  this.popup.modal({ 
                show: false,
                remote: "html/character_info.html"
          });
  this.popup.on( "show.bs.modal", open_dialog );
  this.popup.on( "shown.bs.modal", function() {
                CharInfo.refresh_ui();
          });
  this.popup.on( "hide.bs.modal", close_dialog );
  
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
    
    var max_xp = 123456;
    var xp_pct = Math.round( Player.xp / max_xp * 100 ) + "%" ;
    $("#ci_xp").text( Player.xp.toCommas() + "/" + max_xp.toCommas() );
    $("#xp_bar").css( "width", xp_pct ).attr( "title", xp_pct );
    
    $("#ci_img").attr("src", DrawPlayer.get_data_url() );
    $("#ci_name").text( Player.description );
    $("#ci_lvl").text( Player.level );
    Player.update_hp("ci_hp");
    Player.update_mana("ci_mana");
    $("#ci_ac").text( Player.ac );
    $("#ci_gold").text( (1234567).toCommas() ); // TODO THIS NEEDS TO COME FROM PLAYER
    $("#ci_time").text( Time.get_time() );
  };
}