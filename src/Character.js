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
	 * @name id
	 * @type String
	 * @memberof AdventureGame.Character
	 **/
	p.id = null;

	/**
	 * Display name of the character
	 * @name name
	 * @type String
	 * @memberof AdventureGame.Character
	 **/
	p.name = null;

	/**
	 * Profile picture of the character to show in dialogs
	 * @name profile
	 * @type Image
	 * @memberof AdventureGame.Character
	 **/
	p.profile = null;
	
	/**
	 * Marker image for this charcter to show where they are walking (generally only used for player characters)
	 * @name marker
	 * @type Image
	 * @memberof AdventureGame.Character
	 **/
	p.marker = null;
	
	/**
	 * Object containing x and y coordinates for location this character should walk to
	 * @name nextPosition
	 * @type Object
	 * @memberof AdventureGame.Character
	 **/
	p.nextPosition = null;
	
	/**
	 * Function to call when this character reaches their destination (as indicated in nextPosition)
	 * @name destinationCallback
	 * @type Function
	 * @memberof AdventureGame.Character
	 **/
	p.destinationCallback = null;
	
	/**
	 * Distance in pixels for this character to move in a single step
	 * @name moveDistance
	 * @type integer
	 * @memberof AdventureGame.Character
	 **/
	p.moveDistance = 5; // 

	/**
	 * Container object holding the inventory items for this character
	 * @name inventory
	 * @type Container
	 * @memberof AdventureGame.Character
	 **/
	p.inventory = null;
	
	/**
	 * The base height of the character image
	 * @name baseHeight
	 * @type int
	 * @memberof AdventureGame.Character
	 **/
	p.baseHeight = null;

	/**
	 * The base width of the character image
	 * @name baseWidth
	 * @type int
	 * @memberof AdventureGame.Character
	 **/
	p.baseWidth = null;
	
	/**
	 * Flag to indicate if we are debugging the character
	 * @name baseWidth
	 * @type int
	 * @memberof AdventureGame.Character
	 **/
	p.debug = false;
	
	/**
	 * List of all animations for this character. Objects should reference their spritesheet animation and if they are flipped or not.
	 * @name animationList
	 * @type Object
	 * @memberof AdventureGame.Character
	 **/
	p.animationList = {};
	
	/**
	 * The "Base location" for this character. The x and y coordinate of the image that is treated as the character's standing location
	 * @name baseWidth
	 * @type Object
	 * @memberof AdventureGame.Character
	 **/
	p.baseLocation = {x:0, y:0};
	
	/**
	 * The dimensions for the character's base. This is how large of an area around the baseLocation should be excluded from overlapping other objects.
	 * Height and width values properties should be set indicating area the character cannot overlay with objects around the baseLocation. Defaults to a point.
	 * @name baseDimensions
	 * @type Object
	 * @memberof AdventureGame.Character
	 **/
	p.baseDimensions = {width: 0, height: 0};
	
	/**
	 * Constructor for parent Sprite object
	 * @name Sprite_initialize
	 * @type function
	 **/
	p.Sprite_initialize = p.initialize;
	
	/**
	 * Function to setup character from given options. Usually callsed by the constructor
	 * @param options Object containing configuration options for this character
	 * @return void
	 **/
	p.initialize = function(options) {
		var
			spritesheet,
			animationKey;
		
		if(this.debug) {
			console.log(options);
		}
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
		
		// Create a spritesheet according to the given settings
		spritesheet = new createjs.SpriteSheet(options.spritesheet);
		createjs.SpriteSheetUtils.addFlippedFrames(spritesheet, true, false, false);
		if(this.debug) {
			console.log(spritesheet);
		}
		this.Sprite_initialize(spritesheet);
		
		// Now store all animations in an array so we can name flipped animations as well as standard ones
		for(animationKey in options.spritesheet.animations) {
			if(options.spritesheet.animations.hasOwnProperty(animationKey)) {
				this.animationList[animationKey] = {animation: animationKey, flipped: false};
			}
		}
		if(options.flippedAnimations) {
			for(animationKey in options.flippedAnimations) {
				if(options.flippedAnimations.hasOwnProperty(animationKey)) {
					this.animationList[animationKey] = {animation: options.flippedAnimations[animationKey], flipped: true};
				}
			}
		}
		
		this.x = options.x ? AdventureGame.getXCoord(options.x) : 0;
		this.y = options.y ?  AdventureGame.getYCoord(options.y) : 0;
		if(options.scale) {
			var scale = AdventureGame.getScaleToFit(options.scale, this);
			if(this.debug) {
				console.log(scale);
			}
			this.scaleX = scale;
			this.scaleY = scale;
		}
		
		// Set base location converting percentage values to pixels based on the character's current size
		if(options.basePoint) {
			this.baseLocation = {x: this.getWidth() * (options.basePoint.x / 100), y: this.getHeight() * (options.basePoint.y / 100)};
		} else {
			// Default to the bottom middle of the character
			this.baseLocation = {x: this.getWidth() / 2, y: this.getHeight()};
		}
		// Set base shape converting percentage values to pixels based on the character's current size
		if(options.baseDimensions) {
			this.baseDimensions = {width: this.getWidth() * (options.baseDimensions.width / 100), height: this.getHeight() * (options.baseDimensions.height / 100)};
		}
		
		this.profile = options.profile || null;
		this.marker = options.marker || null;	// Marker to show for walking destination
		this.nextPosition = null; // Next location to walk to
		this.destinationCallback = null; // Function to call when character reaches their destination
		if(options.moveDistance) {
			this.moveDistance = options.moveDistance;
		}
		if(this.debug) {
			console.log("Creating inventory for "+this.name);
		}
		this.inventory = options.inventory || new AdventureGame.Container({
			id: 'inventory',
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
		this.setAnimation('idle');
		
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
		return this.baseWidth * (this.scaleX > 0 ? this.scaleX : - this.scaleX);
	};
	
	/**
	 * Get the X coordinate of where the character is standing. This is the object x coordinate plus half their width
	 * @return The number of pixes from the left of the screen where the character is standing
	 */
	p.getXLocation = function() {
		var x;
		if(this.scaleX > 0) {
			x = this.x + this.baseLocation.x;
		} else {
			x = this.x - this.baseLocation.x;
		}
		return x;
	};
	
	/**
	 * Get the Y coordinate of where the character is standing. This is the object y coordinate plus their height
	 * @return The number of pixes from the top of the screen where the character is standing
	 */
	p.getYLocation = function() {
		return this.y + this.baseLocation.y;
	};

	/**
	 * Move character to the given coordinates. This is preferable to directly setting x and y coordinates as it accounts for the image width and height
	 * @param x The x xoordinate in pixels to move this character to
	 * @param y the y coordinate in pixels to move this character to
	 * @return void
	 **/
	p.setCharacterPosition = function(x,y) {
		if(x) {
			if(this.scaleX > 0) {
				this.x = x - this.baseLocation.x;
			} else {
				this.x = x + this.baseLocation.x;
			}
		}
		if(y) {
			this.y = y - this.baseLocation.y;
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
				distanceY = characterPosition.y - this.nextPosition.y,
				direction = {left: 0, right: 0, up: 0, down: 0};
			
			if(distanceX > 0) {
				// Move left
				characterPosition.x = distanceX > this.moveDistance ? characterPosition.x - this.moveDistance : this.nextPosition.x;
				direction.left = 1;
			} else if(distanceX < 0 ) {
				// Move right
				characterPosition.x = -distanceX > this.moveDistance ?  characterPosition.x + this.moveDistance : this.nextPosition.x;
				direction.right = 1;
			}
			if(distanceY > 0) {
				// Move up
				characterPosition.y = distanceY > this.moveDistance ? characterPosition.y - this.moveDistance : this.nextPosition.y;
				direction.up = 1;
			} else if(distanceY < 0 ) {
				// Move Down
				characterPosition.y = -distanceY > this.moveDistance ?  characterPosition.y + this.moveDistance : this.nextPosition.y;
				direction.down = 1;
			}
			
			// Now set animation
			if(direction.left) {
				if(direction.up) {
					this.setAnimation('upleft');
				} else if(direction.down) {
					this.setAnimation('downleft');
				} else {
					this.setAnimation('left');
				}
			} else if(direction.right) {
				if(direction.up) {
					this.setAnimation('upright');
				} else if(direction.down) {
					this.setAnimation('downright');
				} else {
					this.setAnimation('right');
				}
			} else if(direction.up) {
				this.setAnimation('up');
			} else if(direction.down) {
				this.setAnimation('down');
			} else {
				this.setAnimation('idle');
			}
			
			// If we are at the destination
			this.setCharacterPosition(characterPosition.x,characterPosition.y);
			if(characterPosition.x === this.nextPosition.x && characterPosition.y === this.nextPosition.y) {
				this.setAnimation('idle');
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
	
	
	p.setAnimation = function(animation) {
		var thisAnimation = this.animationList[animation];
		console.log("Setting animation to "+animation);
		if(this.currentAnimation !== thisAnimation.animation) {
			this.gotoAndPlay(thisAnimation.animation);
		}
		// Flip if we need it
		if((thisAnimation.flipped && this.scaleX > 0) || (!thisAnimation.flipped && this.scaleX < 0)) {
			if(this.scaleX > 0) {
				this.x = this.x + this.getWidth();
			} else {
				this.x = this.x - this.getWidth();
			}
			this.scaleX = - this.scaleX;
		}
	};
	

	AdventureGame.Character = Character;
}());