function equipped( obj )
{
  obj.css("border-color", "white");
}

function unequipped( obj )
{
  obj.css("border-color", "blue");
}

function set_border_based_on_container( container, obj )
{
  if( container.hasClass("NonEquipped") )
  {
    unequipped( obj );
  }
  else
  {
    equipped( obj );
  }
}

function Item( stat_id, pos )
{
  Item.base_constructor.call( this );
  this.id        = Item.max_item_id;
  this.stat_id   = stat_id;
  this.slot      = "";
  this.description = "";
  this.location  = null;
  this.icon_id   = null;
  this.doll_id   = null;
  this.legs_id   = null;
  this.equipped  = false;
  var MULTIPLE_IMG = 17;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
  }
  
  this.initialize = function()
  {
    var data = Loader.get_item_data( this.stat_id );
    
    this.description = data.find("Description").text();
    this.slot = data.parent()[0].nodeName.toLowerCase();
    this.icon_id = data.attr("img_id");
    this.doll_id = data.attr("doll_id");
    
    // Special case for Rings (can be equipped in multiple slots)
    if( this.slot == "ring" )
    {
      this.slot = "rightring leftring";
    }
    
    // Special case for Chest items. We could have a Leg image to go with it.
    if( this.slot == "chest" )
    {
      this.legs_id = data.attr("legs_id");
    }
  };
  
  if( stat_id != undefined )
  {
    this.initialize();
    Item.max_item_id = Math.max( this.id, Item.max_item_id + 1 );
  }
  
  this.draw = function( ctx )
  {
    if( this.should_draw_item() )
    {
      var view_pos = Map.translate_map_coord_to_viewport( this.location );
      var img_loc = null;

      if( Dungeon.count_items_in_tile( this.location ) > 1 )
      {
        img_loc = convert_tile_ix_to_point( MULTIPLE_IMG );
      }
      else
      {
        img_loc = convert_tile_ix_to_point( this.icon_id );
      }

      ctx.drawImage( Images.ITEM_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ), TILE_WIDTH, TILE_WIDTH );
    }   
  };
  
  this.should_draw_item = function()
  {
    return Map.is_location_visible( this.location ) && Dungeon.is_location_explored( this.location );
  };
  
  this.drop = function( point )
  {
    this.equipped = false;
    this.location = new Point( point.x, point.y );
    Log.add( "You drop " + this.description + "." );
  };
  
  this.take = function()
  {
    this.location = null;
    Log.add( "You pick up " + this.description + "." );
  };
  
  this.get_tooltip = function()
  {
    return "<li>" + this.description + "</li>";
  };
}
extend( Item, Serializable );

Item.prototype.load = function( obj )
{
  Item.super_class.load.call( this, obj );
  this.location = Storage.load_point( obj.location );
};

Item.max_item_id = 0;

function InventoryManager()
{
  this.popup = $("#inventory");
  this.is_open = false;
  
  this.popup.modal({ 
                show: false,
                remote: "html/inventory.html"
          });
  this.popup.on( "show.bs.modal", function() { 
                open_dialog();
                Inventory.is_open = true;
          });
  this.popup.on( "shown.bs.modal", function() {
                Inventory.refresh_ui();
          });
  this.popup.on( "hide.bs.modal", function() { 
                DrawPlayer.construct_paperdoll();
                close_dialog();
                Inventory.is_open = false;
                set_dirty();
                document.game.draw();
          });
  //this.popup.css("margin-left", -415);
  
  this.refresh_ui = function()
  {
    var do_load = this.bag == undefined;
    this.bag   = $("#bag");
    this.floor = $("#floor");
    
    if( do_load )   // Loading a saved game may not have been able to populate bags and slots if the user hadn't opened the Inventory popup yet.
    {
      this.load();
    }
    
    this.floor.empty();
    this.update_floor_items();

    $("#inv_gold").text( (1234567).toCommas() ); // TODO THIS NEEDS TO COME FROM PLAYER
    
    var item_slot_options = { items: ".Item",
                              placeholder: "BlankItemSlot",
                              connectWith: ".ItemContainer",
                              tolerance: "pointer",
                              cursor: "move",
                              receive: function(event, ui) {
                                          var $this = $(this);
                                          if( !ui.item.hasClass( $this.attr("id") ) ) // Doesn't belong in this slot
                                          {
                                            ui.sender.sortable("cancel");
                                            set_border_based_on_container( ui.sender, ui.item );
                                            return;
                                          }
                                          else if( $this.children().length > 1 ) // Already something here, so perform a swap
                                          {
                                            var item = $this.children( "div:not(#" + ui.item[0].id + ")" ).detach();
                                            ui.sender.append( item );
                                            Inventory.move_item_between_collections( item[0].id, $this, ui.sender );
                                            set_border_based_on_container( ui.sender, item );
                                          }
                                          
                                          Inventory.move_item_between_collections( ui.item[0].id, ui.sender, $this );
                                          set_border_based_on_container( $this, ui.item );
                                        },
                              start: function(event, ui) {
                                          unequipped( ui.item );                                                
                                        },
                              stop: function(event, ui) {
                                          set_border_based_on_container( ui.item.parent(), ui.item );
                                        }
                            };
    
    var item_container_options = { items: ".Item",
                                   placeholder: "BlankItemSlot",
                                   connectWith: ".ItemContainer",
                                   tolerance: "pointer",
                                   cursor: "move",
                                   receive: function(event, ui) {
                                              Inventory.move_item_between_collections( ui.item[0].id, ui.sender, ui.item.parent() );
                                      }
                           };
    
    this.bag.sortable( item_container_options );
    this.floor.sortable( item_container_options );
    
    $(".ItemSlot").each( function() {
                 $(this).sortable( item_slot_options );
             });
  };
  
  this.open = function()
  {
    if( !is_processing() )
    {
      set_command( NO_COMMAND );
      this.popup.modal("show");
    }
  };
  
  this.update_floor_items = function()
  {
    var floor_items = Dungeon.get_items_in_tile( Player.location );
    this.update_section_items( this.floor, floor_items );
    floor_items = [];
  };
  
  this.update_section_items = function( section, items )
  {
    if( section == undefined ) return;
    
    for( var ix = 0; ix < items.length; ++ix )
    {
      if( $("#item" + items[ix].id).size() > 0 ) continue;
      
      section.append( this.create_item_box( items[ix] ) );
      this.update_item_box_canvas( items[ix] );

      $("#item" + items[ix].id).dblclick( function() {
                                            var sender_id = $(this).parent().attr("id");
                                            if( sender_id == "floor" || sender_id == "bag" )
                                            {
                                              var sender = $(this).parent();
                                              var receiver = ( sender_id == "floor" ) ? Inventory.bag : Inventory.floor;
                                              $(this).detach().appendTo( receiver );
                                              Inventory.move_item_between_collections( $(this).attr("id"), sender, receiver );
                                            }
                                          });
    } 
  };

  this.update_item_box_canvas = function( item )
  {
    var ctx = $("#item" + item.id + " canvas")[0].getContext("2d");
    var img_loc = convert_tile_ix_to_point( item.icon_id );
    ctx.drawImage( Images.ITEM_IMAGES, img_loc.x, img_loc.y, TILE_WIDTH, TILE_WIDTH, 0, 0, TILE_WIDTH, TILE_WIDTH );
  };
     
  this.create_item_box = function( item )
  {
    var html = "<div id=\"item" + item.id +"\" class=\"Item " + item.slot + "\">";
    html += "<canvas width=\"" + TILE_WIDTH + "\" height=\"" + TILE_WIDTH + "\"></canvas><br/>";
    html += "<h1>" + item.description + "</h1>";
    html += "</div>";
    return html;
  };
  
  this.convert_html_id_to_item_ix = function( item_id, collection )
  {
    return get_element_ix( item_id.replace(/[^\d]/g, ""), collection );
  };
  
  this.take = function( item_id )
  {
    var items = Dungeon.get_items();
    var item_ix = this.convert_html_id_to_item_ix( item_id, items );
    
    if( item_ix > -1 )
    {
      items[item_ix].take();
      Player.bag.push( items[item_ix] );
      Log.debug( "Picking up item" + items[item_ix].id + " from " + Player.location.to_string() );
      items.splice( item_ix, 1 );
    }
  };
  
  this.take_all = function()
  {
    var items = Dungeon.get_items();
    var floor_items = Dungeon.get_items_in_tile( Player.location );
    this.update_section_items( this.floor, floor_items );
    
    for( var i = 0; i < floor_items.length; ++i )
    {
      $("#item" + floor_items[i].id).detach().appendTo( this.bag );
      
      floor_items[i].take();
      Player.bag.push( floor_items[i] );
      Log.debug( "Picking up item" + floor_items[i].id + " from " + Player.location.to_string() );
      items.splice( get_element_ix( floor_items[i].id, items ), 1 );
    }
    
    floor_items = [];
  };
  
  this.drop = function( item_id )
  {
    var items = Dungeon.get_items();
    var item_ix = this.convert_html_id_to_item_ix( item_id, Player.bag );
    
    if( item_ix > -1 )
    {
      Player.bag[item_ix].drop( Player.location ); // Monster drops are handled by direct Item creations
      items.push( Player.bag[item_ix] );
      Player.bag.splice( item_ix, 1 );
      Log.debug( "Dropping " + item_id + " at " + Player.location.to_string() );
    }
  };
  
  this.equip_item = function( item_id, slot )
  {
    var item_ix = this.convert_html_id_to_item_ix( item_id, Player.bag );
    
    if( item_ix > -1 )
    {
      Player.bag[item_ix].equipped = slot;
      Log.debug( "Item " + item_id + " is equipped: " + slot );
    }
  };
  
  this.find_equipped_item_for_slot = function( slot )
  {
    for( var i = 0; i < Player.bag.length; ++i )
    {
      if( Player.bag[i].equipped == slot )
      {
        return Player.bag[i];
      }      
    }
    
    return null;
  };
  
  this.move_item_between_collections = function( item_id, $sender, $receiver )
  {
    var sender_id = $sender.attr("id");
    var receiver_id = $receiver.attr("id");
    
    if( sender_id == "floor" )
    {
      // When the sender is the Floor, it means we are picking up a new item.
      this.take( item_id );
      
      if( receiver_id != "bag" )
      {
        // Any receiver other than the Bag means that an item has been moved into a Slot and therefore is equipped.
        this.equip_item( item_id, receiver_id );
      }
    }
    else
    {
      // Any other sender means we're moving an item that the Player already has in the Bag
      if( receiver_id == "floor" )
      {
        // When the receiver is the Floor, it means we are dropping an item
        this.drop( item_id );
      }
      else if( receiver_id == "bag" )
      {
        // When the receiver is the Bag, it means we are unequipping an item
        this.equip_item( item_id, "" );
      }
      else
      {
        // Any other receiver means we're swapping two equipped items (i.e. Rings)
        this.equip_item( item_id, receiver_id );
      }
    }
  };
  
  this.load = function()
  {
    if( this.bag != undefined )
    {
      this.bag.empty();
      this.update_section_items( this.bag, Player.bag );
      
      $(".ItemSlot").each( function() {
                   var $this = $(this);
                   $this.empty();
                   var item = Inventory.find_equipped_item_for_slot( $this.attr("id") );
                   if( item )
                   {
                     var $item_div = $("#item" + item.id);
                     $item_div.detach().appendTo( $this );
                     equipped( $item_div );
                   }
               });
    }
  };
}