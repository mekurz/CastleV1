function DataLoader()
{
  var data = "";
  this.xml = "";
  
  this.initialize = function()
  {
    $.get( "game_data.xml", function( xml ) {
                  data = xml;
                  Loader.process_data();
        }).error( function() { 
            Log.debug( "AJAX error encountered!" ); 
        });
  };
  
  this.process_data = function()
  {
    this.xml = $( data );
    data = null;
    
    Log.debug( "Loading images..." );
    Images.load_tile_images( this.xml.find("Tile") );
    Images.load_spell_images( this.xml.find("SpellImage") );
    Images.load_monster_images( this.xml.find("Monster") );
    Images.load_item_images( this.xml.find("ItemImage") );
    Images.load_paperdoll_images( this.xml.find("DollImage") );
  };
  
  this.get_data = function( node, id )
  {
    return this.xml.find( node + "[id='" + id + "']" );
  };
  
  this.get_data_by_level = function( node, level )
  {
    return this.xml.find( node + "[level='" + level + "']" );
  };
  
  this.get_spell_data = function( id )
  {
    return this.get_data( "Spell", id );
  };
  
  this.get_monster_data = function( id )
  {
    return this.get_data( "Monster", id );
  };
  
  this.get_monster_quality_for_level = function( xml, level )
  {
    var quality = "";
    
    xml.find("Quality").children().each( function() {
              var $this = $(this);
              var max_level = $this.attr("max_level");
              if( parseInt( $this.attr("min_level") ) <= level && ( max_level == undefined || parseInt( max_level ) >= level ) )
              {
                quality = $this[0].nodeName.toLowerCase();
              }
            });
    
    return quality;
  };
  
  this.get_monsters_suitable_for_level = function( level )
  {
    return this.xml.find("Monster").clone().filter( function() {
                            return Loader.get_monster_quality_for_level( $(this), level ) != "";
                         });
  };
  
  this.get_item_data = function( id )
  {
    return this.get_data( "Item", id );
  };
  
  this.get_widget_data = function( id )
  {
    return this.get_data( "Widget", id );
  };
  
  this.get_trap_data = function( id )
  {
    return this.get_data( "Trap", id );
  };
  
  this.get_status_effect_data = function( id )
  {
    return this.get_data( "StatusEffect", id );
  };
  
  this.get_num_traps = function()
  {
    return this.xml.find("Trap").size();
  };
  
  this.get_texture = function( id )
  {
    return this.get_data( "Texture", id );
  };
  
}