var VIEWPORT_WIDTH  = 30;
var VIEWPORT_HEIGHT = 15;
var VIEWPORT_SHIFT  = 2;
var MIN_X = 0;
var MIN_Y = 0;
var TILE_WIDTH = 32;
var TILE_DRAG_BUFFER = 12;
var MAX_X = VIEWPORT_WIDTH * TILE_WIDTH;
var MAX_Y = VIEWPORT_HEIGHT * TILE_WIDTH;
var Log = null;
var Loader = null;
var Images = null;
var Map = null;
var Player = null;
var Inventory = null;

var NO_COMMAND     = "0";
var SPLAT          = 0;
var FIZZLE         = 1;
var MAGIC_MISSILE  = 2;
var LIGHTNING_BOLT = 3;
var FIREBOLT       = 4;
var FIREBALL       = 5;
var BOULDER        = 6;
var FIRE_BREATH    = 7;
var FIRE_BREATH_D  = 8;

var RATMAN = 0;
var HILLGIANT = 1;

var map1      = [ [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 3, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 3 ],
                  [ 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2, 2, 3, 3, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3 ],
                  [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ]
                ];

var map_tiles = map1;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to)
{
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.shuffle = function() {
  for (var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
  return this;
};

function set_command( value )
{
  $("#command").val( value );
}

function get_command()
{
  return $("#command").val();
}

function set_processing()
{
  $("#processing").val( 1 );
}

function set_finished()
{
  $("#processing").val( 0 );
}

function is_processing()
{
  return $("#processing").val() == "1";
}

function convert_raw_coord_to_ix( value )
{
  return Math.floor( parseInt( value ) / TILE_WIDTH );
}

function convert_ix_to_raw_coord( value )
{
  return value * TILE_WIDTH;
}

function extend( sub_class, base_class )
{
  function inheritance() { return; }
  inheritance.prototype = base_class.prototype;

  sub_class.prototype = new inheritance();
  sub_class.prototype.constructor = sub_class;
  sub_class.base_constructor = base_class;
  sub_class.super_class = base_class.prototype;
}

function Point( x, y )
{
  this.assign = function( point )
  {
    this.x = point.x;
    this.y = point.y;
  };
  
  this.x = 0;
  this.y = 0;
  
  if( y != undefined )
  {
    this.x = x;
    this.y = y;
  }
  else if( x != undefined )
  {
    this.assign( x );    
  }
  
  this.distance_to = function( end )
  {
    return Math.floor( Math.sqrt( Math.pow( this.x - end.x, 2 ) + Math.pow( this.y - end.y, 2 ) ) ); 
  };
  
  this.equals = function( rhs )
  {
    return ( this.x == rhs.x && this.y == rhs.y );   
  };
  
  this.to_string = function()
  {
    return "(" + this.x + ", " + this.y + ")";
  };
  
  this.adjacent_to = function( target )
  {
    return ( Math.abs( this.x - target.x ) <= 1 ) && ( Math.abs( this.y - target.y ) <= 1 ) && !this.equals( target );
  };
  
  this.add_vector = function( vector )
  {
    this.x += vector.x;
    this.y += vector.y;
  };
  
  this.neither_coord_is_zero = function()
  {
    return this.x != 0 && this.y != 0; 
  };
  
  this.invert = function()
  {
    var point = new Point();
    point.x = this.x * -1;
    point.y = this.y * -1;
    
    return point;
  };
  
  this.get_transform_vector = function( point )
  {
    var transform = new Point();
    
    transform.x = point.x - this.x;
    transform.y = point.y - this.y;
    
    return transform;
  };
  
  this.get_unit_vector = function( point )
  {
    var transform = this.get_transform_vector( point );
    
    transform.x = ( transform.x > 0 ) ? 1 : ( transform.x < 0 ) ? -1 : 0;
    transform.y = ( transform.y > 0 ) ? 1 : ( transform.y < 0 ) ? -1 : 0;
    
    return transform;
  };
  
  this.convert_to_raw = function()
  {
    this.x = convert_ix_to_raw_coord( this.x - Map.top_left.x );
    this.y = convert_ix_to_raw_coord( this.y - Map.top_left.y ); 
  };
  
  this.convert_to_raw_tile_center = function()
  {
    this.x = convert_ix_to_raw_coord( this.x - Map.top_left.x ) + ( TILE_WIDTH / 2 );
    this.y = convert_ix_to_raw_coord( this.y - Map.top_left.y ) + ( TILE_WIDTH / 2 ); 
  };
  
  this.convert_to_tile_coord = function()
  {
   this.x = Math.floor( this.x / TILE_WIDTH ) + Map.top_left.x;
   this.y = Math.floor( this.y / TILE_WIDTH ) + Map.top_left.y; 
  };
}

function get_element_by_id( id, collection )
{
  for( var i = 0; i < collection.length; ++i )
  {
    if( collection[i].id == id )
    {
      return collection[i];
    }
  } 
}

function get_element_ix( id, collection )
{
  for( var i = 0; i < collection.length; ++i )
  {
    if( collection[i].id == id )
    {
      return i;
    }
  }
  
  return -1;
}
