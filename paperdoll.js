function Paperdoll()
{
  var BASE_PLAYER_IMAGE = 0;
  
  this.layer_order = [ "back", "base", "chest", "feet", "hat", "hands", "weapon", "shield" ];
  
  this.buffer = document.createElement("canvas");
  this.buffer.width = TILE_WIDTH;
  this.buffer.height = TILE_WIDTH;
  this.buffer_ctx = this.buffer.getContext("2d");
  
  this.draw = function( ctx )
  {
    var view_pos = Map.translate_map_coord_to_viewport( Player.location );
    ctx.drawImage( this.buffer, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) );
    delete view_pos;
  };
  
  this.construct_paperdoll = function()
  {
    this.buffer_ctx.clearRect( 0, 0, this.buffer.width, this.buffer.height );
    
    for( var i = 0; i < this.layer_order.length; ++i )
    {
      if( this.layer_order[i] == "base" )
      {
        this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES, 0, 0, TILE_WIDTH, TILE_WIDTH, 0, 0, TILE_WIDTH, TILE_WIDTH );
      }
      else
      {
        this.apply_layer( Inventory.find_equipped_item_for_slot( this.layer_order[i] ) );
      }
    }
  };
  
  this.apply_layer = function( item )
  {
    if( item )
    {
      var img_loc = null;

      if( item.slot == "chest" && item.legs_id )  // Some armour also needs to draw legs.
      {
        img_loc = convert_tile_ix_to_point( item.legs_id );
        this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH, 0, 0, TILE_WIDTH, TILE_WIDTH );
      }
      
      img_loc = convert_tile_ix_to_point( item.doll_id );
      this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH, 0, 0, TILE_WIDTH, TILE_WIDTH );
    }
  };
  
  this.get_data_url = function()
  {
    return this.buffer.toDataURL();
  };

}