function CustomizeSpellsDialog()
{
  this.popup = $("#customize_spells");
  
  this.popup.modal({ 
                show: false,
                remote: "html/spellbook.html"
          });
  this.popup.on( "show", open_dialog );
  this.popup.on( "shown", function() {
                CustomizeSpellBar.refresh_ui();
          });
  this.popup.on( "hide", close_dialog );
  
  function fill_combos()
  {
    $("#customize_spells select").empty().each( function() {
          $("<option>").text("").appendTo( this );
        });
   
    for( var ix = 0; ix < Player.spellbook.length; ++ix )
    {
      var xml = Loader.get_spell_data( Player.spellbook[ix] );
      var description = xml.find("Description").text();
      
      $("#customize_spells select").each( function() {
          $("<option>").val( Player.spellbook[ix] ).text( description ).appendTo( this );
        });
    } 
  }
  
  function load_combo_values()
  {
    $("#customize_spells select")
        .each( function( ix ) {
          $(this).val( SpellBar.spell_list[ix] );
        })
        .trigger("liszt:updated")
        .attr( "data-placeholder", "Select a spell..." )
        .chosen({
              allow_single_deselect: true
        });
  }
  
  function validate_selections()
  {
    var valid = true;
    var spells = [];
    
    $("#customize_spells select").each( function( ix ) {
          var value = $(this).val();
          if( value != "" )
          {
            if( spells.indexOf( value ) == -1 )
              spells.push( value );
            else
              valid = false;
          }
        });
          
    return valid;
  }
  
  this.refresh_ui = function()
  {
    $("#dup_spells").hide();
    fill_combos();
    load_combo_values();
  };
  
  this.save = function()
  {
    if( validate_selections() )
    {
      $("#customize_spells select").each( function( ix ) {
            SpellBar.spell_list[ix] = $(this).val();
          });
      return true;
    }
    else
    {
      $("#dup_spells").show();
      return false;
    }
  };

  this.ok = function()
  {
    if( this.save() )
    {
      SpellBar.update_toolbar();
      set_dirty();
      this.popup.modal("hide");
    }
  };
}