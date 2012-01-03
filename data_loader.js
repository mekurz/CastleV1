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
    
    Images.load_tile_images( this.xml.find("Tile") );
    Images.load_spell_images( this.xml.find("Spell") );
    Images.load_monster_images( this.xml.find("Monster") );
    Images.load_item_images( this.xml.find("Items").find("Image") );
    
    Images.load_player();
  };
  
  this.get_data = function( node, id )
  {
    return this.xml.find( node + "[id='" + id + "']" );
  };
  
  this.get_spell_data = function( id )
  {
    return this.get_data( "Spell", id );
  };
  
  this.get_monster_data = function( id )
  {
    return this.get_data( "Monster", id );
  };
  
  this.get_item_data = function( id )
  {
    return this.get_data( "Item", id );
  };
  
}