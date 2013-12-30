function ImageCache()
{
  var need_to_load = 0;
  var loaded = 0;
  var load_bar = $("#load_bar");
  var load_pct = $("#load_pct");
  
  this.TILE_IMAGES = null;
  this.MONSTER_IMAGES = null;
  this.SPELL_IMAGES = null;
  this.BIG_SPELL_IMAGES = null;
  this.ITEM_IMAGES = null;
  this.PAPERDOLL_IMAGES = null;
  
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
          var pct = Math.floor( loaded / need_to_load * 100 );
          load_bar.css( "width", "" + pct + "%" );
          load_pct.html( pct );
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
  
  this.load_tile_images = function()
  {
    this.TILE_IMAGES = load_single_image( "tiles_full.png" );
  };
  
  this.load_spell_images = function()
  {
    this.SPELL_IMAGES = load_single_image( "spells_small.png" );
    this.BIG_SPELL_IMAGES = load_single_image( "spells_big.png" );
  };
 
  this.load_monster_images = function()
  {
    this.MONSTER_IMAGES = load_single_image( "monsters_full.png" );
  };
  
  this.load_item_images = function()
  {
    this.ITEM_IMAGES = load_single_image( "items_full.png" );
  };
  
  this.load_paperdoll_images = function()
  {
    this.PAPERDOLL_IMAGES = load_single_image( "paperdoll_full.png" );
  };
};