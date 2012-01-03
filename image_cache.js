function ImageCache()
{
  var need_to_load = 0;
  var loaded = 0;
  
  this.TILE_IMAGES = new Array();
  this.MONSTER_IMAGES = new Array();
  this.SPELL_IMAGES = new Array();
  this.PLAYER_IMAGE = null;
  this.ITEM_IMAGES = new Array();
  
  this.is_loaded = function()
  {
    return loaded == need_to_load && need_to_load > 0; 
  };
  
  function load_single_image( src )
  {
    Log.debug( "Loading image: " + src );
    need_to_load++;
    
    var img = new Image();
    img.onload = function() {
          loaded++;
          Log.debug( "Loading finished: " + this.src + " (" + loaded + "/" + need_to_load + ")" );
        };
    img.src = ""; // Workaround for Chrome
    img.src = "images/" + src;
    
    return img;
  }
  
  function load_images_from_xml( xml, dest, folder )
  {
    if( folder == undefined )
    {
      folder = "";      
    }
    
    xml.each( function(){
      dest.push( load_single_image( folder + "/" + $(this).attr("src") ) );
    });
  }
  
  this.load_player = function()
  {
    this.PLAYER_IMAGE = load_single_image( "man.gif" ); 
  };
  
  this.load_tile_images = function( xml )
  {
    load_images_from_xml( xml, this.TILE_IMAGES ); 
  };
  
  this.load_spell_images = function( xml )
  {
    load_images_from_xml( xml, this.SPELL_IMAGES ); 
  };
  
  this.load_monster_images = function( xml )
  {
    load_images_from_xml( xml, this.MONSTER_IMAGES ); 
  };
  
  this.load_item_images = function( xml )
  {
    load_images_from_xml( xml, this.ITEM_IMAGES, "items" );
  };
};