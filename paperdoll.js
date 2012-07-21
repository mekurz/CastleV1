function Paperdoll()
{
  var BASE_PLAYER_IMAGE = 0;
  
  this.layer_order = [ "back", "base", "chest", "feet", "head", "hands", "weapon", "shield" ];
  
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
        this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES[BASE_PLAYER_IMAGE], 0, 0 );
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
      if( item.slot == "chest" && item.legs_id )  // Some armour also needs to draw legs.
      {
        this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES[item.legs_id], 0, 0 );
      }
      
      this.buffer_ctx.drawImage( Images.PAPERDOLL_IMAGES[item.doll_id], 0, 0 );
    }
  };
  
  this.get_data_url = function()
  {
    return this.buffer.toDataURL();
  };

}