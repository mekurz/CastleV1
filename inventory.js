var items = new Array();

var MULTIPLE_IMG = 17;

function create_items()
{
  create_single_item( "neck1", new Point( 1, 1 ) );
  create_single_item( "neck2", new Point( 11, 7 ) );
  create_single_item( "feet1", new Point( 18, 10 ) );
  create_single_item( "back1", new Point( 11, 7 ) );
  create_single_item( "head1", new Point( 5, 5 ) );
  create_single_item( "hands1", new Point( 26, 14 ) );
  create_single_item( "chest1", new Point( 6, 4 ) );
  create_single_item( "weapon1", new Point( 6, 14 ) );
  create_single_item( "weapon2", new Point( 26, 14 ) );
  create_single_item( "shield1", new Point( 16, 8 ) );
  create_single_item( "shield2", new Point( 24, 5 ) );
}

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

function create_single_item( stat_id, point )
{
  var item = new Item( stat_id, point );
  items.push( item );
}

function get_items_in_tile( point )
{
  var loot = new Array();
  
  for( var i = 0; i < items.length; ++i )
  {
    if( items[i].location.equals( point ) )
    {
      loot.push( items[i] );
    }
  }
  
  return loot;
}

function count_items_in_tile( point )
{
  var num = 0;
  
  for( var i = 0; i < items.length; ++i )
  {
    if( items[i].location.equals( point ) )
    {
      num++;
    }
  }
  
  return num;
}

function Item( stat_id, pos )
{
  this.id        = Item.max_item_id;
  this.stat_id   = stat_id;
  this.slot      = "";
  this.description = "";
  this.location  = null;
  this.icon      = null;
  this.doll_icon = null;
  this.legs_icon = null;
  this.equipped  = false;
  
  if( pos != undefined )
  {
    this.location = new Point( pos.x, pos.y );
  }
  
  this.initialize = function()
  {
    var data = Loader.get_item_data( this.stat_id );
    
    this.description = data.find("Description").text();
    this.slot = data.parent()[0].nodeName.toLowerCase();
    
    // TODO Handle special case for Rings here (need to set RightRing and LeftRing)
    
    var img_id = data.attr("img_id");
    this.icon = Images.ITEM_IMAGES[img_id];
    
    var doll_id = data.attr("doll_id");
    if( doll_id != undefined )
    {
      this.doll_icon = Images.PAPERDOLL_IMAGES[doll_id];   
    }
    
    // Special case for Chest items. We could have a Leg image to go with it.
    if( this.slot == "chest" )
    {
      var legs_id = data.attr("legs_id");
      if( legs_id != undefined )
      {
        this.legs_icon = Images.PAPERDOLL_IMAGES[legs_id];   
      }
    }
  };
  
  this.initialize();
  Item.max_item_id++;
  
  this.draw = function( ctx )
  {
    if( Map.is_location_visible( this.location ) )
    {
      var view_pos = Map.translate_map_coord_to_viewport( this.location );
      
      if( count_items_in_tile( this.location ) > 1 )
      {
        ctx.drawImage( Images.ITEM_IMAGES[MULTIPLE_IMG], convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) );
      }
      else
      {
        ctx.drawImage( this.icon, convert_ix_to_raw_coord( view_pos.x ), convert_ix_to_raw_coord( view_pos.y ) );
      }
      
      delete view_pos;
    }   
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

Item.max_item_id = 0;

function InventoryManager()
{
  this.popup = $("#inventory");
  this.bag   = $("#bag");
  this.floor = $("#floor");
  
  this.initialize = function()
  {
    Log.debug("Initializing InventoryManager...");
    
    $( "#inventory" ).dialog({ autoOpen: false,
                               resizable: false,
                               modal: true,
                               width: 870,
                               height: 550,
                               close: function(event, ui) {
                                        Player.paperdoll.construct_paperdoll();
                                        document.game.draw();
                                      }
                            }); 
    
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
    
    $(".ItemSlot").each( function() {
                 $(this).sortable( item_slot_options );
             });
    
    Log.debug("Done.");
  };
  
  this.open = function()
  {
    if( !is_processing() )
    {
      set_command( NO_COMMAND );
      this.floor.empty();
      this.update_floor_items();
      this.popup.dialog("open");
    }
  };
  
  this.update_floor_items = function()
  {
    var floor_items = get_items_in_tile( Player.location );
    
    for( var i = 0; i < floor_items.length; ++i )
    {
      this.floor.append( this.create_item_box( floor_items[i] ) );
    } 
    
    floor_items = [];
  };
     
  this.create_item_box = function( item )
  {
    var html = "<div id=\"item" + item.id +"\" class=\"Item " + item.slot + "\">";
    html += "<img src=\"" + item.icon.src + "\"/><br/>";
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
    var floor_items = get_items_in_tile( Player.location );
    
    for( var i = 0; i < floor_items.length; ++i )
    {
      $("#item"  +floor_items[i].id).remove(); 
      this.bag.append( this.create_item_box( floor_items[i] ) );
      
      floor_items[i].take();
      Player.bag.push( floor_items[i] );
      Log.debug( "Picking up item" + floor_items[i].id + " from " + Player.location.to_string() );
      items.splice( get_element_ix( floor_items[i].id, items ), 1 );
    }
    
    floor_items = [];
  };
  
  this.drop = function( item_id )
  {
    var item_ix = this.convert_html_id_to_item_ix( item_id, Player.bag );
    
    if( item_ix > -1 )
    {
      Player.bag[item_ix].drop( Player.location ); // Monster drops are handled by direct Item creations
      items.push( Player.bag[item_ix] );
      Player.bag.splice( item_ix, 1 );
      Log.debug( "Dropping " + item_id + " at " + Player.location.to_string() );
    }
  };
  
  this.equip_item = function( item_id, equip )
  {
    var item_ix = this.convert_html_id_to_item_ix( item_id, Player.bag );
    
    if( item_ix > -1 )
    {
      Player.bag[item_ix].equipped = equip;
      Log.debug( "Item " + item_id + " is equipped: " + equip );
    }
  };
  
  this.find_equipped_item_for_slot = function( slot )
  {
    for( var i = 0; i < Player.bag.length; ++i )
    {
      if( Player.bag[i].equipped && Player.bag[i].slot == slot )
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
        this.equip_item( item_id, true );
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
        this.equip_item( item_id, false );
      }
      else if( sender_id = "bag" )
      {
        // When the sender is the Bag, it means we are equipping an item
        this.equip_item( item_id, true );
      }
      else
      {
        // All other cases are swaps between equipped items into valid slots
        // TODO Handle tracking moving swaps between slots (i.e. track the slot name we're equipped in)
      }
    }
  };
}