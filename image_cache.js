function ImageCache()
{
  var need_to_load = 0;
  var loaded = 0;
  
  this.TILE_IMAGES = new Array();
  this.MONSTER_IMAGES = new Array();
  this.SPELL_IMAGES = new Array();
  this.PLAYER_IMAGE = null;
  
  
  this.initialize = function()
  {
    loaded = 0;
    
    this.load_player();
    load_images( TILE_DATA, this.TILE_IMAGES );
    load_images( MONSTER_DATA, this.MONSTER_IMAGES );
    load_images( SPELL_DATA, this.SPELL_IMAGES );
  };
  
  this.is_loaded = function()
  {
    return loaded == need_to_load; 
  };

  function load_images( source, dest )
  {
    for( var x = 0; x < source.length; ++x )
    {
      dest.push( load_single_image( $.evalJSON( source[x] ).src ) );
    }
  }
  
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
  
  this.load_player = function()
  {
    this.PLAYER_IMAGE = load_single_image( "man.gif" ); 
  };
};