/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */

/**
 * Item Object
 * Any item in the game that the user can interact with
 * Options include:
 *   id: The ID to identify this item (mandatory)
 *   name: The name of this item that will be shown to users (mandatory)
 *   image: Impage path or object to display for this image
 *   lescription: Text description for this item
 *   location: An object with x and y values describing the x and y coordinates to place this item on the stage
 *   onClick: Function to call when this item is clicked
 *   onDrop: Function to call when this item is dropped
 *   stage: The stage object this image is in (it will be automatically set if placed in a room)
 */
this.AdventureGame = this.AdventureGame || {};

(function() {
	"use strict";

	var Item = function(options) {
		this.initialize(options);
	};
	var p = Item.prototype = new createjs.Bitmap();
	Item.prototype.constructor = Item;
	
	// Public Properties
	
	/**
	 * Identification string for this item
	 * @property id
	 * @type String
	 **/
	p.id = null;
	
	/**
	 * Display name of the item
	 * @property name
	 * @type String
	 **/
	p.name = null;
	
	/**
	 * Description of this item that will be shown to users
	 * @property description
	 * @type String
	 **/
	p.description = "";
	
	/**
	 * Flag indicating if this item can be collected by the player
	 * @property collecatable
	 * @type Boolean
	 **/
	p.collecatable = false;
	
	/**
	 * Container holding this item
	 * @property parentContainer
	 * @type Container
	 **/
	p.parentContainer = null;
	
	/**
	 * Container holding contents of this item (used only if this item should act as a container itself)
	 * @property container
	 * @type Container
	 **/
	p.container = null;
	
	/**
	* Flag indicating if activation of this item is enabled
	* @property enabled
	* @type Boolean
	**/
	p.enabled = true;
	
	/**
	 * @property Bitmap_initialize
	 * @type Function
	 **/
	p.Bitmap_initialize = p.initialize;
	
	
	
	/**
	* Setup this open from options
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
	* Default item clicked behaviour is for the player to walk over to the item and activate it
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
	* Default item dropped behaviour is to report success (which will leave the item where it is)
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
	* Activate this item
	* If it is a container open it to show the contents
	* Otherwise show the description of this item
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
	
	p.addToContainer = function(container) {
		if(this.parentContainer) {
			this.parentContainer.removeItem(this);
		}
		this.parentContainer = container;
	};
	
	p.getHeight = function(){
		return this.image.height * this.scaleY;
	};
	
	p.getWidth = function() {
		return this.image.width * this.scaleX;
	};
	
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
	p.itemDragged = function(evt) {
		this.enabled = false;	// Disable activating this item when dragging
		evt.target.x = evt.stageX - (evt.target.image.width * evt.target.scaleX / 2);
		evt.target.y = evt.stageY - (evt.target.image.height * evt.target.scaleY / 2);
	};
	
	/**
	* Scale image to fit in a box by either pixel or percent values 
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
		var
			matchesPercent =  scale.match(/(\d+)%/),
			matchesPixels = scale.match(/(\d+)px/),
			canvas,
			scaleX,
			scaleY;
		if (matchesPercent) {
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
			console.log("Pixels");
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
	
	p.setX = function(x) {
		var
			matchesPercent =  x.match(/(\d+)%/),
			matchesPixels = x.match(/(\d+)px/),
			canvas,
			pxValue;
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			pxValue = canvas.width * (matchesPercent[1] / 100);
			this.x = pxValue;
		} else if (matchesPixels) {
			console.log("Pixels");
			this.x = matchesPercent[1];
		} else {
			throw "Invalid scale synatx";
		}
	};
	
	p.setY = function(y) {
		var
			matchesPercent =  y.match(/(\d+)%/),
			matchesPixels = y.match(/(\d+)px/),
			canvas,
			pxValue;
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			pxValue = canvas.height * (matchesPercent[1] / 100);
			this.y = pxValue;
		} else if (matchesPixels) {
			console.log("Pixels");
			this.y = matchesPercent[1];
		} else {
			throw "Invalid scale synatx";
		}
	};
	
	p.gotoLastLocation = function() {
		createjs.Tween.get(this).to(this.lastLocation,100);
	};

	
	AdventureGame.Item = Item;
}());
