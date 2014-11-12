/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */

this.AdventureGame = this.AdventureGame || {};

(function() {
	"use strict";

	/**
	 * Any item in the game that the user can interact with<br/>
	 * Options include:<br/>
	 * <ul>
	 *   <li>id: The ID to identify this item (mandatory)</li>
	 *   <li>name: The name of this item that will be shown to users (mandatory)</li>
	 *   <li>image: Impage path or object to display for this image</li>
	 *   <li>description: Text description for this item</li>
	 *   <li>location: An object with x and y values describing the x and y coordinates to place this item on the stage</li>
	 *   <li>onClick: Function to call when this item is clicked</li>
	 *   <li>onDrop: Function to call when this item is dropped</li>
	 *   <li>stage: The stage object this image is in (it will be automatically set if placed in a room)</li>
	 * </ul>
	 * @class AdventureGame.Item
	 * @summary An Item object
	 * @augments createjs.Bitmap
	 */
	var Item = function(options) {
		this.initialize(options);
	};
	var p = Item.prototype = new createjs.Bitmap();
	Item.prototype.constructor = Item;
	
	// Public Properties
	
	/**
	 * Identification string for this item
	 * @name id
	 * @type String
	 * @memberof AdventureGame.Item
	 **/
	p.id = null;
	
	/**
	 * Display name of the item
	 * @name name
	 * @type String
	 * @memberof AdventureGame.Item
	 **/
	p.name = null;
	
	/**
	 * Description of this item that will be shown to users
	 * @name description
	 * @type String
	 * @memberof AdventureGame.Item
	 **/
	p.description = "";
	
	/**
	 * Flag indicating if this item can be collected by the player
	 * @name collecatable
	 * @type Boolean
	 * @memberof AdventureGame.Item
	 **/
	p.collecatable = false;
	
	/**
	 * Container holding this item
	 * @name parentContainer
	 * @type Container
	 * @memberof AdventureGame.Item
	 **/
	p.parentContainer = null;
	
	/**
	 * Container holding contents of this item (used only if this item should act as a container itself)
	 * @name container
	 * @type Container
	 * @memberof AdventureGame.Item
	 **/
	p.container = null;
	
	/**
	* Flag indicating if activation of this item is enabled
	* @name enabled
	* @type Boolean
	* @memberof AdventureGame.Item
	**/
	p.enabled = true;
	
	/**
	 * @name Bitmap_initialize
	 * @type Function
	 * @memberof AdventureGame.Item
	 **/
	p.Bitmap_initialize = p.initialize;
	
	
	
	/**
	* Setup this open from options
	* @function initialize
	* @memberof AdventureGame.Item
	* @param options An object containing the settings for the item
	*/
	p.initialize = function(options) {
		if(!options.id) {
			throw "No ID set for Item";
		} else if(!options.name) {
			throw "No name set for item";
		} else if(!options.src) {
			throw "Image source is not set";
		}
		this.Bitmap_initialize(options.src);
		this.id = options.id;
		this.name = options.name;
		this.description = options.description || '';
		this.collectable = options.collectable || false;
		this.parentContainer = options.parentContainer || null;	// If this object is inside a container pass the container object
		if(options.onClick) {
			this.onClick = options.onClick;
			this.on('click', this.onClick);
		}
		if (options.onDrop) {
			this.onDrop = options.onDrop;
		}
		if(options.activate) {
			this.activate = options.activate;
		}
		this.container = options.container || null;		// If this item is a container (like a box) set the associated container object
		if (options.draggable) {
			this.setDraggable(true);
		}
		console.log("Scale: "+options.scale);
		if (options.scale) {
			this.initialScale = options.scale;
			this.scale(options.scale);
		}
		if (options.x) {
			this.setX(options.x);
		}
		if (options.y) {
			this.setY(options.y);
		}
		this.on('mousedown', function() {
			this.lastLocation = {x: this.x, y: this.y};
			this.enabled = true;	// Enable activation in case it has been previously disabled by dragging
		});
	};
	
	/**
	* Event handler for whent an item is clicked. Default behaviour is for the player to walk over to the item and activate it
	* @memberof AdventureGame.Item
	* @function onClick
	*/
	p.onClick = function() {
		if(this.enabled) {
			if(AdventureGame.player) {
				var player = AdventureGame.player,
					itemLocation = this.getLocationonStage();
				player.walkToPosition(itemLocation.x, itemLocation.y + this.getHeight());
				player.destinationCallback = this.activate;
			} else {
				this.activate();
			}
		}
	};
	
	/**
	* Event handler for when an item is dropped. Default behaviour is to do nothing report success (which will leave the item where it is)
	* @memberof AdventureGame.Item
	* @function onDrop
	* @param evt Event information
	* @returns True if the action was successful or false if it failed and associated actions should be reverted
	*/
	p.onDrop = function(evt) {
		var 
			objIndex, 
			response = false,
			objects = AdventureGame.stage.getObjectsUnderPoint(evt.stageX, evt.stageY);
		for(objIndex = 0; objIndex < objects.length; objIndex++) {
			if(objects[objIndex] !== this) {
				response = response || objects[objIndex].activate(this);
			}
		}
		if(!response) {
			this.gotoLastLocation();
		}
		console.log(objects);
	};
	
	/**
	* Event handler for when this item is activated.
	* Default behaviour is to open the container if one is set otherwise show a description of the item
	* @memberof AdventureGame.Item
	* @function activate
	* @param item The Item that has been used to activate this object. If no item was used this may be null
	* @returns True if this activation was successful or false if it failed and associated actions should be reverted
	*/
	p.activate = function(item) {
		var itemDialog,
			returnVal = false,
			player = AdventureGame.player;
		if(this.container) {
			if(item !== null && item instanceof Item) {
				this.container.addItem(item);
			}
			this.container.open();
			returnVal = true;
		} else if(item) {
			returnVal = false;
		} else {
			itemDialog = new AdventureGame.Dialog({
				image: this.image.src,
				text: '<h3>'+this.name+'</h3><p>'+this.description+"</p>"
			});
			itemDialog.show();
			if(this.collectable && player && this.parentContainer !== player.inventory) {
				player.inventory.addItem(this);
			}
			returnVal = true;
		}
		return returnVal;
	};
	
	/**
	* Add this item to the given container
	* @function addToContainer
	* @param container The container object to which this item should be added
	* @memberof AdventureGame.Item
	*/
	p.addToContainer = function(container) {
		if(this.parentContainer) {
			this.parentContainer.removeItem(this);
		}
		this.parentContainer = container;
	};
	
	/**
	* Get the height (in pixels) of this item. This is a cheaper solutions to getBounds which can be quite resource intensive
	* @function getHeight
	* @returns The current height of this item in pixels
	* @memberof AdventureGame.Item
	*/
	p.getHeight = function(){
		return this.image.height * this.scaleY;
	};
	
	/**
	* Get the width (in pixels) of this item. This is a cheaper solutions to getBounds which can be quite resource intensive
	* @function getWidth
	* @returns The current width of this item in pixels
	* @memberof AdventureGame.Item
	*/
	p.getWidth = function() {
		return this.image.width * this.scaleX;
	};
	
	/**
	* Enable or disable tragging on this function. 
	* Enables/Disables the pressmove and pressup events on this item
	* @function setDraggable
	* @param draggble Boolean indicating if dragging should be enabled or disabled on this item
	* @memberof AdventureGame.Item
	*/
	p.setDraggable = function(draggable) {
		if(draggable) {
			// Make this item draggable
			this.on('pressmove', this.itemDragged);
			this.on('pressup', this.onDrop);
			this.draggable = true;
		} else {
			// Disable drag events
			if(this.draggable) {
				this.off('pressmove', this.itemDragged);
				this.off('pressup', this.onDrop);
				this.draggable = false;
			}
		
		}
	};
	 
	/**
	* Event handler to move the item location when dragged
	* @function itemDragged
	* @param evt Event information containing the location of the mouse in evt.target.scaleX and evt.target.scaleY
	* @memberof AdventureGame.Item
	*/
	p.itemDragged = function(evt) {
		this.enabled = false;	// Disable activating this item when dragging
		evt.target.x = evt.stageX - (evt.target.image.width * evt.target.scaleX / 2);
		evt.target.y = evt.stageY - (evt.target.image.height * evt.target.scaleY / 2);
	};
	
	/**
	* Scale image to fit in a box by either pixel or percent values 
	* @function scale
	* @param scale The size in pixels or percent to scale this Item to. This must be a string ending with 'px' or '%' indicating how to scale the Item
	* @throws Error if the image has not been loaded fro this image, the stage has not yet been loaded or the input string is invalid
	* @deprecated Use AdventureGame.getScaleToFit for a more versitile solution
	* @memberof AdventureGame.Item
	*/
	p.scale = function(scale) {
		if(!this.image) {
			console.log(this);
			throw "Image is not yet loaded";
		}
		// If no scale is set default to initial scale
		if(!scale) {
			scale = this.initialScale;
		}
		// It would be nice to use AdventureGame.getBoxScale for this but it can't get the dimensions of the image (this.image.height and this.image.width)
		console.log(this.id+": "+scale);
		var
			matchesPercent =  scale.match(/([0-9\.]+)%/),
			matchesPixels = scale.match(/([0-9\.]+)px/),
			canvas,
			scaleX,
			scaleY;
		if (matchesPercent) {
			console.log("Scale by percent");
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			scaleX = (canvas.height * (matchesPercent[1] / 100) ) / this.image.height;
			scaleY = (canvas.width * (matchesPercent[1] / 100) ) / this.image.width;
			console.log(scaleX+","+scaleY);
			this.scaleX = scaleX < scaleY ? scaleX : scaleY;
			this.scaleY = this.scaleX;
		} else if (matchesPixels) {
			console.log("Pixels: "+matchesPixels[1]);
			scaleX = (matchesPixels[1] / this.image.width);
			scaleY = (matchesPixels[1] / this.image.height);
			this.scaleX = scaleX < scaleY ? scaleX : scaleY;
			this.scaleY = this.scaleX;
		} else {
			throw "Invalid scale synatx";
		}
		
//		this.scaleX = scale;
//		this.scaleY = scale;
	};
	
	/**
	* Set the X coordinate for this item by percent or pixel size
	* @function setX
	* @throws Error if the stage has not yet been loaded or the input string is invalid
	* @deprecated Use Item.x = AdventureGame.getXCoord for a more versitile solution
	* @param x The distaince from left in pixels or percent to positon this item at. This must be a string ending with 'px' or '%' indicating how to measure the distance
	* @memberof AdventureGame.Item
	*/
	p.setX = function(x) {
		this.x = AdventureGame.getXCoord(x);
	};
	
	/**
	* Set the Y coordinate for this item by percent or pixel size
	* @function setY
	* @throws Error if the stage has not yet been loaded or the input string is invalid
	* @deprecated Use Item.y = AdventureGame.getYCoord for a more versitile solution
	* @param x The distaince from top in pixels or percent to positon this item at. This must be a string ending with 'px' or '%' indicating how to measure the distance
	* @memberof AdventureGame.Item
	*/
	p.setY = function(y) {
		this.y = AdventureGame.getYCoord(y);
	};
	
	/**
	* Move this item back to the last location
	* @function gotoLastLocation
	* @memberof AdventureGame.Item
	**/
	p.gotoLastLocation = function() {
		createjs.Tween.get(this).to(this.lastLocation,100);
	};

	
	AdventureGame.Item = Item;
}());
