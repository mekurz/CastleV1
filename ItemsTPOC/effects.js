var TILE_WIDTH = 32;
var MAX_INDEX = TILE_WIDTH * TILE_WIDTH * 4;

function Color( r, g, b, a)
{
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
}

var NORMAL = new Color( 0, 0, 0, 0 );
var MAGIC  = new Color( 0, 255, 255, 255 );
var CURSED = new Color( 255, 0, 0, 255 );

function ImageEffect( source, effect )
{
  function get_index( row, col )
  {
    return ( col + row * TILE_WIDTH ) * 4;
  }
  
  function is_transparent( row, col, source )
  {
    if( row >= 0 && row < TILE_WIDTH && col >= 0 && col < TILE_WIDTH )
    {
      var i = get_index( row, col );
      return source.data[i+3] == 0;
    }
    return true;
  }
  
  function is_any_cardinal_neighbour_filled( row, col, source )
  {
    return !is_transparent( row-1,   col, source )
        || !is_transparent( row+1,   col, source )
        || !is_transparent(   row, col-1, source )
        || !is_transparent(   row, col+1, source );
  }
  
  function set_pixel( i, dest )
  {
    dest.data[i]   = effect.r;
    dest.data[i+1] = effect.g;
    dest.data[i+2] = effect.b;
    dest.data[i+3] = effect.a;
  }
  
  function copy_pixel( i, source, dest )
  {
    dest.data[i]   = source.data[i];     // Red
    dest.data[i+1] = source.data[i+1];   // Green
    dest.data[i+2] = source.data[i+2];   // Blue
    dest.data[i+3] = source.data[i+3];   // Alpha
  }
  
  function apply_effect()
  {
    var orig = create_canvas();
    var orig_ctx = orig.getContext("2d");
    var magic = create_canvas();
    var magic_ctx = magic.getContext("2d"); 
    
    orig_ctx.drawImage( source, 0, 0 );
    var orig_data  = orig_ctx.getImageData( 0, 0, TILE_WIDTH, TILE_WIDTH );
    var magic_data = magic_ctx.getImageData( 0, 0, TILE_WIDTH, TILE_WIDTH );
    
    for( var row = 0; row < TILE_WIDTH; ++row )
    {
      for( var col = 0; col < TILE_WIDTH; ++col )
      {
        var ix = get_index( row, col );
        
        if( is_transparent( row, col, orig_data ) && is_any_cardinal_neighbour_filled( row, col, orig_data ) )
        {
          set_pixel( ix, magic_data, effect );
        }
        else
        {
          copy_pixel( ix, orig_data, magic_data );
        }
      }
    }
    
    magic_ctx.clearRect( 0, 0, TILE_WIDTH, TILE_WIDTH );  
    magic_ctx.putImageData( magic_data, 0, 0 );
    return magic.toDataURL();
  }
  
  function create_canvas()
  {
    var canvas = document.createElement("canvas");
    canvas.width = TILE_WIDTH;
    canvas.height = TILE_WIDTH;
    return canvas;
  }
  
  return apply_effect();
}