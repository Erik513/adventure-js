/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AventureGame = this.AdventureGame || {};

/**
* A character in the game
* This can be used for both 
*/
(function() {
	"use strict";

	var Character = function(options) {
		this.initialize(options);
	};
	
	
	var p = Character.prototype = new createjs.Sprite();
	
	// Public Properties
	
	/**
	 * Identification string for this character
	 * @property id
	 * @type String
	 **/
	p.id = null;

	/**
	 * Display name of the character
	 * @property name
	 * @type String
	 **/
	p.name = null;

	/**
	 * Profile picture of the character to show in dialogs
	 * @property profile
	 * @type Image
	 **/
	p.profile = null;
	
	/**
	 * Marker image for this charcter to show where they are walking (generally only used for player characters)
	 * @property marker
	 * @type Image
	 **/
	p.marker = null;
	
	/**
	 * Object containing x and y coordinates for location this character should walk to
	 * @property nextPosition
	 * @type Object
	 **/
	p.nextPosition = null;
	
	/**
	 * Function to call when this character reaches their destination (as indicated in nextPosition)
	 * @property destinationCallback
	 * @type Function
	 **/
	p.destinationCallback = null;
	
	/**
	 * Distance in pixels for this character to move in a single step
	 * @property moveDistance
	 * @type integer
	 **/
	p.moveDistance = 5; // 

	/**
	 * Container object holding the inventory items for this character
	 * @property inventory
	 * @type Container
	 **/
	p.inventory = null;
	
	/**
	 * The base height of the character image
	 * @property baseHeight
	 * @type int
	 **/
	p.baseHeight = null;

	/**
	 * The base width of the character image
	 * @property baseWidth
	 * @type int
	 **/
	p.baseWidth = null;
	
	/**
	 * Constructor for parent Sprite object
	 * @property Sprite_initialize
	 * @type function
	 **/
	p.Sprite_initialize = p.initialize;
	
	/**
	 * Function to setup character from given options. Usually callsed by the constructor
	 * @param options Object containing configuration options for this character
	 * @return void
	 **/
	p.initialize = function(options) {
		console.log(options);
		if(!options.id) {
			throw "No ID set for character";
		} else if(!options.name) {
			throw "No name set for character";
		} else if(!options.src) {
			throw "No image source set";
		}
		
		
		this.id = options.id;
		this.name = options.name;
		this.src = options.src;
		
		if(options.spritesheet) {
			options.spritesheet.images = [this.src];
			this.baseHeight = options.spritesheet.frames.height;
			this.baseWidth = options.spritesheet.frames.width;
		} else {
			// The height and width settings here may not work if the image hasn't been loaded
			var img = new Image(this.src);
			options.spritesheet = {
				images: [this.src],
				frames:  {width: img.width, height: img.height, count: 1},
				animations: {
					idle: [0]
				}
			};
			this.baseHeight = img.height;
			this.baseWidth = img.width;
		}
		var spritesheet = new createjs.SpriteSheet(options.spritesheet);
		console.log(spritesheet);
		this.Sprite_initialize(spritesheet);
		
		this.x = options.x ? AdventureGame.getXCoord(options.x) : 0;
		this.y = options.y ?  AdventureGame.getYCoord(options.y) : 0;
		if(options.scale) {
			var scale = AdventureGame.getScaleToFit(options.scale, this);
			console.log(scale);
			this.scaleX = scale;
			this.scaleY = scale;
		}
		this.profile = options.profile || null;
		this.marker = options.marker || null;	// Marker to show for walking destination
		this.nextPosition = null; // Next location to walk to
		this.destinationCallback = null; // Function to call when character reaches their destination
		if(options.moveDistance) {
			this.moveDistance = options.moveDistance;
		}
		this.inventory = options.inventory || new AdventureGame.Container({
			name: this.name+'\'s Inventory',
			slots: 5
		});
		if(options.onClick) {
			this.onClick = options.onClick;
		}
		this.on('click', this.onClick);
		if(options.activate) {
			this.activate = options.activate;
		}
		this.gotoAndPlay('idle');
		
	};
	
	/**
	 * Function to bind to click event for this character
	 * @return boolean indicating if an action has been performed
	 **/
	p.onClick = function() {
		var returnVal;
		if(AdventureGame.player) {
			AdventureGame.player.walkToPosition(this.x, this.y + this.getHeight());
			AdventureGame.player.destinationCallback = this.activate;
			returnVal = true;
		} else {
			returnVal = this.activate();
		}
		return returnVal;
	};
	
	/**
	 * Function to call to active character actions. Either by clicking or some other game mechanicism. 
	 * This should be overridden if the character is to perform actions like speaking or moving
	 * @return false indicating no action has been performed
	 **/
	p.activate = function() {
		return true;
	};

	/**
	 * Get the current height that this character has been scaled to
	 * @return The current height in pixes of the character
	 **/
	p.getHeight = function(){
		return this.baseHeight * this.scaleY;
	};

	/**
	 * Get the current width that this character has been scaled to
	 * @return The current width in pixes of the character
	 **/
	p.getWidth = function() {
		return this.baseWidth * this.scaleX;
	};
	
	/**
	 * Get the X coordinate of where the character is standing. This is the object x coordinate plus half their width
	 * @return The number of pixes from the left of the screen where the character is standing
	 */
	p.getXLocation = function() {
		return this.x + (this.getWidth() / 2);
	};
	
	/**
	 * Get the Y coordinate of where the character is standing. This is the object y coordinate plus their height
	 * @return The number of pixes from the top of the screen where the character is standing
	 */
	p.getYLocation = function() {
		return this.y + this.getHeight();
	};

	/**
	 * Move character to the given coordinates. This is preferable to directly setting x and y coordinates as it accounts for the image width and height
	 * @param x The x xoordinate in pixels to move this character to
	 * @param y the y coordinate in pixels to move this character to
	 * @return void
	 **/
	p.setCharacterPosition = function(x,y) {
		var bounds = this.getBounds();
		if(x) {
			this.x = x - (bounds.width / 2);
		}
		if(y) {
			this.y = y - bounds.height;
		}
	};

	/**
	 * Set the character to walk to the given location by setting next position and drawing marker if appropriate
	 * @param x The x xoordinate in pixels to move this character to
	 * @param y the y coordinate in pixels to move this character to
	 * @return void
	 **/
	p.walkToPosition = function(x, y) {
		this.nextPosition = {x: x, y: y};
		if(this.marker) {
			this.marker.x = x;
			this.marker.y = x;
			if(!AdventureGame.stage.hasChild(this.marker)) {
				AdventureGame.stage.addChild(this.marker);
			}
		}
	};
	
	/**
	 * Take a single step towards the nextPosition. This function is intended to be called by the game loop making the character walk
	 * Once the character reaches their destination the destinationCallback is called and set to null
	 * @return void
	 **/
	p.step = function() {
		if(this.nextPosition !== null) {
			var characterPosition = {x:this.getXLocation(), y:this.getYLocation()},
				distanceX = characterPosition.x - this.nextPosition.x,
				distanceY = characterPosition.y - this.nextPosition.y;
			
			if(distanceX > 0) {
				// Move left
				characterPosition.x = distanceX > this.moveDistance ? characterPosition.x - this.moveDistance : this.nextPosition.x;
				if(this.currentAnimation !== 'left') {
					console.log("Animating left");
					console.log("setting animation to left");
					this.gotoAndPlay('left');
				}
			} else if(distanceX < 0 ) {
				// Move right
				characterPosition.x = -distanceX > this.moveDistance ?  characterPosition.x + this.moveDistance : this.nextPosition.x;
				if(this.currentAnimation !== 'right') {
					console.log("setting animation to right");
					this.gotoAndPlay('right');
				}
			} else {
				if(this.currentAnimation !== 'idle') {
					console.log("setting animation to idle");
					this.gotoAndPlay('idle');
				}
			}
			if(distanceY > 0) {
				// Move up
				characterPosition.y = distanceY > this.moveDistance ? characterPosition.y - this.moveDistance : this.nextPosition.y;
			} else if(distanceY < 0 ) {
				// Move Down
				characterPosition.y = -distanceY > this.moveDistance ?  characterPosition.y + this.moveDistance : this.nextPosition.y;
			}
			
			// If we are at the destination
			this.setCharacterPosition(characterPosition.x,characterPosition.y);
			if(characterPosition.x === this.nextPosition.x && characterPosition.y === this.nextPosition.y) {
				this.gotoAndPlay('idle');
				console.log("At destination");
				if(this.marker && AdventureGame.stage.hasChild(this.marker.obj)) {
					AdventureGame.stage.removeChild(this.marker.obj);
				}
				if(this.destinationCallback !== null) {
					this.destinationCallback();
					this.destinationCallback = null;
				}
				this.nextPosition = null;
			}
		} // End if nextPosition !== null
	}; // End function
	

	AdventureGame.Character = Character;
}());