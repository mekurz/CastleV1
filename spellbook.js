function CustomizeSpellsDialog()
{
  this.popup = $("#customize_spells").dialog({ autoOpen: false,
                                                resizable: false,
                                                modal: true,
                                                open: function(event, ui) {
                                                        open_dialog();
                                                     },
                                                close: function(event, ui) {                                              
                                                        close_dialog();                                                        
                                                      },
                                                buttons: [
                                                      {
                                                        text: "OK",
                                                        "class": "btn btn-primary",
                                                        click: function() { 
                                                            CustomizeSpellBar.save();
                                                            SpellBar.update_toolbar();
                                                            CustomizeSpellBar.popup.dialog("close"); 
                                                          }
                                                      },
                                                      {
                                                        text: "Cancel",
                                                        "class": "btn",
                                                        click: function() {
                                                            CustomizeSpellBar.popup.dialog("close");
                                                          }
                                                      },
                                                  ]
                                             });
  
  function fill_combos()
  {
    $("#customize_spells select").empty().each( function() {
          $("<option>").text( "" ).appendTo( this );
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
    $("#customize_spells select").each( function( ix ) {
          $(this).val( SpellBar.spell_list[ix] );
        }).combobox();
  }
  
  this.save = function()
  {
    $("#customize_spells select").each( function( ix ) {
          SpellBar.spell_list[ix] = $(this).val();
        });
  };
  
  this.open = function()
  {
    fill_combos();
    load_combo_values();
    this.popup.dialog("open");
  };
}

(function( $ ) {
    $.widget( "ui.combobox", {
      _create: function() {
        var input,
          self = this,
          select = this.element.hide(),
          selected = select.children( ":selected" ),
          value = selected.val() ? selected.text() : "",
          wrapper = this.wrapper = $( "<span>" )
            .addClass( "ui-combobox" )
            .insertAfter( select );

        input = $( "<input>" )
          .appendTo( wrapper )
          .val( value )
          .addClass( "ui-state-default ui-combobox-input" )
          .autocomplete({
            delay: 0,
            minLength: 0,
            source: function( request, response ) {
              var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
              response( select.children( "option" ).map(function() {
                var text = $( this ).text();
                if ( this.value && ( !request.term || matcher.test(text) ) )
                  return {
                    label: text.replace(
                      new RegExp(
                        "(?![^&;]+;)(?!<[^<>]*)(" +
                        $.ui.autocomplete.escapeRegex(request.term) +
                        ")(?![^<>]*>)(?![^&;]+;)", "gi"
                      ), "<strong>$1</strong>" ),
                    value: text,
                    option: this
                  };
              }) );
            },
            select: function( event, ui ) {
              ui.item.option.selected = true;
              self._trigger( "selected", event, {
                item: ui.item.option
              });
            },
            change: function( event, ui ) {
              if ( !ui.item ) {
                var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
                  valid = false;
                select.children( "option" ).each(function() {
                  if ( $( this ).text().match( matcher ) ) {
                    this.selected = valid = true;
                    return false;
                  }
                });
                if ( !valid ) {
                  // remove invalid value, as it didn't match anything
                  $( this ).val( "" );
                  select.val( "" );
                  input.data( "autocomplete" ).term = "";
                  return false;
                }
              }
            }
          })
          .addClass( "ui-widget ui-widget-content ui-corner-left" );

        input.data( "autocomplete" )._renderItem = function( ul, item ) {
          return $( "<li></li>" )
            .data( "item.autocomplete", item )
            .append( "<a>" + item.label + "</a>" )
            .appendTo( ul );
        };

        $( "<a>" )
          .attr( "tabIndex", -1 )
          .attr( "title", "Show All Items" )
          .appendTo( wrapper )
          .html( "&#9660;" )
          .button()
          .removeClass( "ui-corner-all" )
          .addClass( "btn ui-combobox-toggle" )
          .css("border-bottom-left-radius","0px")
          .css("border-top-left-radius","0px")
          .click(function() {
            // close if already visible
            if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
              input.autocomplete( "close" );
              return;
            }

            // work around a bug (likely same cause as #5265)
            $( this ).blur();

            // pass empty string as value to search for, displaying all results
            input.autocomplete( "search", "" );
            input.focus();
          });
      },

      destroy: function() {
        this.wrapper.remove();
        this.element.show();
        $.Widget.prototype.destroy.call( this );
      }
    });
  })( jQuery );