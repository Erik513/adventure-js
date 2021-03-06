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
}());;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* Comtainer holds a collection of items
* It is not currently used and some troubleshooting will be required (this came from an earlier version that did use containers)
* The player's inventory is a container as is a toolbox or set of shelves
*/
(function() {
	"use strict";

	var Container = function(options) {
		this.initialize(options);
	};
	var p = Container.prototype;
	


	p.initialize = function(options) {
		if(!options.name) {
			throw "No name set for container";
		}
		this.slots = options.numSlots || 10;
		this.items = options.items || [];
		this.name = options.name;
		// If there are more items than slots resize the container to fit them all
		if(this.items.length > this.slots) {
			this.slots = options.items.length;
		}
		var itemIndex = 0;
		for(itemIndex=0; itemIndex < this.items.length; itemIndex++) {
			this.addItem(options.items[itemIndex]);
		}
	};

	p.addItem = function(item) {
		var returnVal = -1, i;
		if(!item instanceof AdventureGame.Item) {
			console.log(item);
			throw "Invalid item";
		}
		if(this.items.length < this.slots) {
			// Find the next empty slot in the inventory
			for(i=0; i < this.items.length; i++) {
				if(this.items[i] === null) {
					console.log("Using inventory slot "+i);
					item.slot = i;
					this.items[i] = item;
					return i;
				}
			}
			console.log("Using inventory slot "+i);
			item.slot = i;
			item.parentContainer = this;
			this.items[i] = item;
			returnVal = i;
		} else {
			console.log("Container full");
		}
		return returnVal;
	};
	/**
	* Remove the given item from this array 
	* The item will only be removed if it correctly references its slot in the array
	*/
	p.removeItem = function(item) {
		var 
			returnVal = -1,
			slot = item.slot;
		if(item.currentContainer === this && this.items[item.slot] === item) {
			this.items[item.slot] = null;
			item.currentContainer = null;
			item.slot = null;
			returnVal = slot;
		}
		return returnVal;
	};
	p.refresh = function() {
		console.log("To be implemented");
	};
	/**
	* Show dialog for open container
	* Load container from container array and create a div mirroring the items in there. 
	*
	*/
	p.open = function() {
		var containerDiv, i, slotDiv, itemImg, dialog;
		console.log("Opening container "+this.name);
		containerDiv = document.createElement('div');
		containerDiv.id = 'container'+this.name;
		containerDiv.className = 'container';
		for(i=0; i<this.slots; i++) {
			slotDiv = document.createElement('div');
			slotDiv.id = "container_slot_"+i;
			slotDiv.className = 'slot';
			containerDiv.appendChild(slotDiv);
			if(this.items.length >= i+1 && this.items[i] !== null) {
				itemImg = document.createElement('img');
				itemImg.src = this.items[i].image.src;
				slotDiv.appendChild(itemImg);
				$(itemImg).on('click', {item:this.items[i]}, this.setClickHandler());
			}
		}

		dialog = new AdventureGame.Dialog({
			text: '<h3>'+this.name+'</h3>',
			domContent: containerDiv
		});
		dialog.show();
		
		AdventureGame.stage.on('click', function() {
		});	
	};
	
	p.setClickHandler = function() {
		return function(event) {
			event.data.item.activate();
		};
	};
	
	AdventureGame.Container = Container;
}());
	;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* Dialog is a model dialog that displays over the game convas displaying a message to the user.
*
* The constructor takes an array accepting the following configuration options
* text: The text content to display in the dialog
* image: An optional image that will be displayed on the left of the dialog
* question: If this dialog should present a question the type of question should be set. Accepted values are 'radio' and 'text'
* answers: An array of valid answers to this question
* domContent: A DOM object to be displayed in this dialog. It will be shown after the text if both are set
* disableClose: Indicates the close button should not be displayed. It is important the dialog may be closed through another means. Either as a question or adding a DOM element that calls close on this dialog
*/
(function() {
	"use strict";

	var Dialog = function(options) {
		this.initialize(options);
	};
	var p = Dialog.prototype;
	
	// Public Properties
	
	/**
	 * Div object for the dialog
	 * @property div
	 * @type HTMLObject
	 **/
	p.div = null;
	
	/**
	 * Callback function when the dialog is closed
	 * @property onClose
	 * @type function
	 **/
	p.onClose = null;
	
	/**
	 * Flag indicating if this is a question and if so what type of input (radio or text)
	 * @property questionType
	 * @type String
	 **/
	p.questionType = null;

	/**
	 * Array of acceptable answer values
	 * @property answers
	 * @type String[]
	 **/
	p.answers = null;
	
	/**
	 * Setup dialog object according to the supplied options. Generally called by the constructor
	 * @param options Object containing configuration paramaters
	 * @return void
	 **/
	p.initialize = function(options) {
		console.log(options);
		var 
			imageDiv, 
			img, 
			contentDiv, 
			closeIcon,
			// Variables for question dialogs
			questionForm,
			answerIndex,
			inputDiv,
			inputLabel,
			inputElem,
			inputID,
			// Set stage as it is used by this function
			stage = AdventureGame.stage;
			
		if(options.div) {
			this.div = options.div.cloneNode(true);	// In case this is already in the div clone it so we don't accidently delete it later
		} else {
			this.div = document.createElement('div');
			this.div.className = 'gamedialog';
			
			if(!this.disableClose) {
				closeIcon = document.createElement('i');
				closeIcon.className = 'fa fa-close fa-2x';
				$(closeIcon).on('click', this.close.bind(this));
				this.div.appendChild(closeIcon);
			}
			
			// Add image
			if(options.image) {
				imageDiv = document.createElement('div');
				img = document.createElement('img');
				imageDiv.className = 'dialogimage';
				img.src = options.image;
				imageDiv.appendChild(img);
				this.div.appendChild(imageDiv);
			}
			
			// Add content
			contentDiv = document.createElement('div');
			contentDiv.className = 'dialogcontent';
			contentDiv.innerHTML = options.text;
			
			// If this is a multiple choice question create form
			if(options.question === 'radio' && options.answers) {
				this.questionType = 'radio';
				this.answers = [];
				questionForm = document.createElement('form');
				inputID = 'radio'+Date.now();
				for(answerIndex = 0; answerIndex < options.answers.length; answerIndex++) {
					inputDiv = document.createElement('div');
					inputDiv.className = 'radio';
					inputLabel = document.createElement('label');
					inputElem = document.createElement('input');
					inputElem.type = 'radio';
					inputElem.name = inputID;
					inputElem.className = 'inputElem';
					inputElem.value = options.answers[answerIndex].value;
					inputLabel.appendChild(inputElem);
					inputLabel.appendChild(document.createTextNode(options.answers[answerIndex].text));
					inputDiv.appendChild(inputLabel);
					questionForm.appendChild(inputDiv);
					if(options.answers[answerIndex].correct === true) {
						this.answers.push(options.answers[answerIndex].value.toString());
					}
				}
				inputElem = document.createElement('input');
				inputElem.type = 'button';
				inputElem.value = 'OK';
				inputElem.className = 'btn';
				$(inputElem).on('click', this.evaluateAnswer.bind(this));
				questionForm.appendChild(inputElem);
				
				contentDiv.appendChild(questionForm);
			}
			
			// Add extra DOM content if supplied
			if(options.domContent) {
				contentDiv.appendChild(options.domContent);
			}
			this.div.appendChild(contentDiv);
		}
		this.div.style.width = (60 / 100 * stage.canvas.width)+'px';
		this.div.style.left = (20 / 100 * stage.canvas.width)+'px';
		this.div.style.top = (20 / 100 * stage.canvas.height)+'px';
		this.div.style.maxHeight = (40/100 * stage.canvas.height)+'px';
	};

	/**
	 * Display this dialog
	 * @return void
	 **/
	p.show = function() {
		var 
			stage = AdventureGame.stage,
			divHeight;
		document.body.appendChild(this.div);

		// Having a scrollable element inside an max-height one doesn't work so use JS to find height for the children
		divHeight = $(this.div).height();
		$(this.div).find('.dialogcontent').height(divHeight);
		
		this.domElem = new createjs.DOMElement(this.div);
		stage.addChild(this.domElem);
	};
	p.close = function() {
		AdventureGame.stage.removeChild(this.domElem);
		document.body.removeChild(this.div);
		if(this.onClose) {
			this.onClose();
		}
	};

	/**
	 * If this dialog has a question evaluate if the selected answer is correct
	 * Should be fired in the click event of the submit button in the question form
	 * @return true if the answer is correct else false
	 */
	p.evaluateAnswer = function() {
		this.close();
		var 
			correct = false,
			inputs,
			inputIndex;
		if(this.questionType === 'radio') {
			inputs = this.div.getElementsByClassName('inputElem');
			for(inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
				if($(inputs[inputIndex]).is(':checked')) {
					console.log(inputs[inputIndex]);
					console.log(this.answers);
					console.log($.inArray(inputs[inputIndex].value, this.answers));
					if($.inArray(inputs[inputIndex].value, this.answers)>=0) {
						console.log("Correct");
						correct = true;
					}
					break;
				}
			}
		}
		if(correct) {
			this.correctCallback();
		} else {
			this.incorrectCallback();
		}
		return correct;
	};

	/**
	 * Default callback function if the correct answer is selected.
	 * This may be overwritten by the constructor/initialize with the correctCallback configuration option
	 * @return void
	 */	
	p.correctCallback = function() {
		var correctDialog = new Dialog({
			image: this.image,
			text:'Correct'
		});
		correctDialog.show();
	};

	/**
	 * Default callback function if the incorrect answer is selected.
	 * This may be overwritten by the constructor/initialize with the incorrectCallback configuration option
	 * @return void
	 */
	p.incorrectCallback = function() {
		var incorrectCallback = new Dialog({
			image: this.image,
			text:'Sorry, that\'s incorrect'
		});
		incorrectCallback.show();		
	};
	
	AdventureGame.Dialog = Dialog;
}());;/*jslint white: true, browser: true, plusplus: true, nomen: true */
/*global console, createjs, $, AdventureGame */

this.AdventureGame = this.AdventureGame || {};

/**
* Base functions to load a game.
* Provides functions to load and store a game and defines base functions for initial setup, gameloop and exit
*/
(function() {
	"use strict";
	
	var 
		percentRegex = /(\d+\.?\d*)%/,
		pixelRegex = /(\d+)px/;
	
	/**
	* @deprecated Use getXCoord and getYCoord instead
	*/
	function percentToStageCoord(x, y) {
		return {x: AdventureGame.stage.canvas.width * (x / 100), y: AdventureGame.stage.canvas.height * (y/100)};
	}
	
	/**
	* Scale image to fit in a box by either pixel or percent values 
	*/
	function getScaleToFit(boxSize, object) {
		var
			matchesPercent =  boxSize.match(percentRegex),
			matchesPixels = boxSize.match(pixelRegex),
			canvas,
			bounds,
			scaleX,
			scaleY;
		if(object.getBounds) {
			bounds = object.getBounds();
		} else {
			bounds = {width: object.width, height: object.height};
		}
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			scaleX = (canvas.height * (parseInt(matchesPercent[1], 10) / 100) ) / bounds.height;
			scaleY = (canvas.width * (parseInt(matchesPercent[1], 10) / 100) ) / bounds.width;
		} else if (matchesPixels) {
			scaleX = (parseInt(matchesPercent[1], 10) / bounds.width);
			scaleY = (parseInt(matchesPercent[1], 10) / bounds.height);
		} else {
			throw "Invalid scale synatx";
		}
		return scaleX < scaleY ? scaleX : scaleY;
	}
	
	function getXCoord(x) {
		var
			matchesPercent =  x.match(percentRegex),
			matchesPixels = x.match(pixelRegex),
			canvas,
			pxValue;
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			pxValue = canvas.width * (matchesPercent[1] / 100);
		} else if (matchesPixels) {
			pxValue = matchesPercent[1];
		} else {
			throw "Invalid scale synatx";
		}
		return pxValue;
	}
	
	function getYCoord(y) {
		var
			matchesPercent =  y.match(percentRegex),
			matchesPixels = y.match(pixelRegex),
			canvas,
			pxValue;
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			pxValue = canvas.height * (matchesPercent[1] / 100);
		} else if (matchesPixels) {
			pxValue = matchesPercent[1];
		} else {
			throw "Invalid scale synatx";
		}
		return pxValue;
	}
	
	
	AdventureGame.stage = null;
	AdventureGame.player = null;
	AdventureGame.inputDisabled = false;
	AdventureGame.flags = {};
	
	AdventureGame.percentToStageCoord = percentToStageCoord;
	AdventureGame.getScaleToFit = getScaleToFit;
	AdventureGame.getXCoord = getXCoord;
	AdventureGame.getYCoord = getYCoord;
	
	
}());
;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* The main point and click game
* Implements prototype from GameBase and loads each room object
*/
(function() {
	"use strict";

	var Game = function(options) {
		this.initialize(options);
	};
	var p = Game.prototype = Object.create(AdventureGame.GameBase.prototype);
	Game.prototype.constructor = Game;
	
	/**
	 * Array of assets to load with attributes src and id
	 * @property assets
	 * @type Object
	 **/
	p.assets = null;

	/**
	 * The currently loaded room
	 * @property currentRoom
	 * @type AdventureGame.Room
	 **/
	p.currentRoom = null;

	/**
	 * Flag indicating if the game has been loaded
	 * @property loaded
	 * @type Boolean
	 **/
	p.loaded = false;
	
	/**
	 * The size in percent to draw inventory boxes
	 * @property inventoryBoxsize
	 * @type int
	 **/
	p.inventoryBoxsize = 8;

	/**
	 * The size in percent to draw margins between the inventory boxes
	 * @property inventoryMarginsize
	 * @type int
	 **/
	p.inventoryMarginsize = 2;

	/**
	 * Array of inventory box shapes that are drawn at the top of the screen
	 * @property slotBoxes
	 * @type createjs.Shape[]
	 **/
	p.slotBoxes = [];
	
	/**
	 * Configuration options to create player character if a character object is not given
	 * @property playerData
	 * @type Object
	 **/
	p.playerData = null;
	
	
	/**
	 * Initlization function of parent GameBase class
	 * @property GameBase_initialize
	 * @type fucntion
	 **/
	p.GameBase_initialize = p.initialize;
	
	/**
	* Setup function called by constructor
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		if(!options.stage) {
			throw "Stage is not set";
		}
		if(!options.player) {
			throw "Player is not set";
		}
		this.GameBase_initialize(options);	// Call parent setup
		AdventureGame.stage = options.stage;
		// Load player if set otherwise store array for loading with other assets
		if(options.player instanceof AdventureGame.Character) {
			AdventureGame.player = options.player;
		} else {
			this.playerData = options.player;
		}
		console.log("Seting up game");
		this.assets = {images:[], audio:[]};
		this.currentRoom = null;
		this.loaded = false;
		// Special variables for game inventory items
		this.inventoryBoxsize = 8;
		this.inventoryMarginsize = 2;
		this.slotBoxes = [];
		// Set inventory to use the inventory boxes for the game
	};

	/**
	* Load a room into the game
	* @param room Room object to load or object describing room
	* @param door Optional object containing x and y coordinates along with the diraction (N,S,E,W) to introduce the character from
	* @return void
	*/
	p.loadRoom = function(room, door) {	
		AdventureGame.loadedGame = this;
		this.door = door || null;
		if(room instanceof AdventureGame.Room) {
			this.loadRoomFromObject(room); 
		} else {
			this.loadRoomAssets(room);
		}
	};
	
	/**
	* Load the room from a Room object
	* @param room The room object to load
	* @return void
	*/
	p.loadRoomFromObject = function(room) {
		console.log("Loading room from object");
		console.log(room);
		var manifest = [],
			queue = new createjs.LoadQueue();
		if(!room instanceof AdventureGame.Room) {
			throw "Game cannot load room. Invalid parameter type";
		}
		if(!AdventureGame.player) {
			this.assets.images.playerImg = AdventureGame.player.image;
			manifest.push({src:AdventureGame.player.image.src, id:'playerImg'});
		}	
		
		this.currentRoom = room;
		room.stage = this.stage;
		this.assets.images.roomBG = {id:'roomBG'};
		manifest.push({src:room.background.image.src, id:'roomBG'});
		
		queue.on('progress', function(evt) {
			console.log('Loaded: '+evt.loaded+'%');
		});
		queue.on('fileload', this.assetLoaded.bind(this));
		queue.on('complete', this.start.bind(this));
		queue.loadManifest(manifest);
		console.log(manifest);
		console.log(queue);
		console.log("Loading items");
	};
	
	/**
	* Load assets for room and containing items from array describing room
	* @param array Object describing room configuration
	* @return void 
	*/
	p.loadRoomAssets = function(array) {
		var manifest = [],
			queue = new createjs.LoadQueue(),
			item,
			character;
		this.roomData = array;
		// Load room background and player image
		this.assets.images.roomBG = {src: array.background};
		if(!AdventureGame.player && this.playerData) {
			this.assets.images.playerImg = {src: this.playerData.src};
			manifest.push({src:this.playerData.src, id:'playerImg'});
		}
		// Load items
		manifest.push({src: array.background, id:'roomBG'});
		for(item in array.items) {
			if(array.items.hasOwnProperty(item)) {
				this.assets.images[item] = {src: array.background};
				manifest.push({src: array.items[item].src, id: item});
			}
		}
		for(character in array.characters) {
			if(array.characters.hasOwnProperty(character)) {
				console.log(array.characters[character]);
				this.assets.images[character] = {src: array.characters[character].src};
				manifest.push({src: array.characters[character].src, id: character});
			}
		}		
		queue.on('progress', function(evt) {
			console.log('Loaded: '+evt.loaded+'%');
		});
		queue.on('fileload', this.assetLoaded.bind(this));
		queue.on('complete', this.start.bind(this));			
		queue.loadManifest(manifest);
	};
	
	/**
	* Function to start the game after all assets have loaded. This should be triggered by the complete event of the CreateJS Queue
	* @return void
	**/
	p.start = function() {
		var 
			player = AdventureGame.player,
			items,
			item,
			characters,
			charID;
		// Load player if not yet loaded
		if(!player) {
			player = new AdventureGame.Character(this.playerData);
			AdventureGame.player = player;
		}
		// Set player inventory to use the game inventory
		var game = this;
		AdventureGame.player.inventory.addItem = function(item) {
			AdventureGame.Container.prototype.addItem.call(this,item);
			game.addToInventory(item);
		};
		// Load this room if not yet loaded
		if(this.roomData) {
			items = this.roomData.items;
			this.roomData.items = [];
			for(item in items) {
				if(items.hasOwnProperty(item)) {
					this.roomData.items[item] = new AdventureGame.Item(items[item]);
				}
			}
			
			characters = this.roomData.characters;
			for(charID in characters) {
				if(characters.hasOwnProperty(charID)) {
					this.roomData.characters[charID] = new AdventureGame.Character(characters[charID]);
					console.log(this.roomData.characters[charID]);
					console.log(this.assets);
				}
			}
			this.currentRoom = new AdventureGame.Room(this.roomData);
			this.door = this.roomData.entrance;
			this.roomData = null;	// Remove this as we now have an actual room
			console.log(this.currentRoom);
		}
		console.log("Fully loaded!");
		if(!player.hasEventListener('click')) {
			player.addEventListener('click', player.onClick.bind('player'));
		}
		
		this.currentRoom.load(AdventureGame.player, this.door);
		this.loaded = true;
		this.showInventory();
		this.tickerCallback = createjs.Ticker.addEventListener('tick', this.loop.bind(this));
	};
	
	/**
	* Game loop for this game
	* @return void
	*/
	p.loop = function() {
		if(this.loaded && this.currentRoom) {
			this.currentRoom.loop();
		}
		AdventureGame.player.step();
		this.stage.update();
	};
	
	/**
	* Draw boxes at the top of the screen containing the player's current inventory
	* @return void
	()*/
	p.showInventory = function() {
		var inventory = AdventureGame.player.inventory,
			stage = this.stage,
			itemCount = inventory.items.length,
			boxWidthPx = (this.inventoryBoxsize / 100) * stage.canvas.width,
			boxMarginPx = (this.inventoryMarginsize / 100) * stage.canvas.width,
			totalWidth = (boxWidthPx * itemCount) + (boxMarginPx * (itemCount - 1)),
			marginLR = (stage.canvas.width - totalWidth) / 2,
			currentMarginL = marginLR,
			itemIndex = 0;
			for(itemIndex = 0; itemIndex < itemCount; itemIndex++) {
				this.slotBoxes[itemIndex] = new createjs.Shape();
				this.slotBoxes[itemIndex].graphics.beginFill("rgba(255, 255, 255, 0.21)").beginStroke("black").setStrokeStyle(1).drawRoundRect(0,0,boxWidthPx,boxWidthPx,10);
				this.slotBoxes[itemIndex].x = currentMarginL;
				this.slotBoxes[itemIndex].y = 10;
				stage.addChild(this.slotBoxes[itemIndex]);
				currentMarginL = currentMarginL + boxWidthPx + boxMarginPx ;
			}
	};
	
	/**
	* Draw the specified item in the inventory boxes at the top of the screen
	* Note that this function does not actually add the item to the player's inventory and should be called from the inventory 
	* containers addItem function (which is set in the initialize function for game
	*/
	p.addToInventory = function(item) {
		var stage = this.stage,
			itemCount = this.slotBoxes.length + 1,
			boxWidthPx = (this.inventoryBoxsize / 100) * stage.canvas.width,
			boxMarginPx = (this.inventoryMarginsize / 100) * stage.canvas.width,
			totalWidth = (boxWidthPx * itemCount) + (boxMarginPx * (itemCount - 1)),
			marginLR = (stage.canvas.width - totalWidth) / 2,
			currentMarginL = marginLR,
			itemIndex = 0,
			imageBoxsizePx,
			imageOffsetX,
			imageOffsetY;
			// Move all existing boxes to the left
			for(itemIndex = 0; itemIndex < this.slotBoxes.length; itemIndex++) {
				createjs.Tween.get(this.slotBoxes[itemIndex]).to({x:currentMarginL},100);
				imageOffsetX = (boxWidthPx - item.getWidth()) / 2;
				createjs.Tween.get(AdventureGame.player.inventory.items[itemIndex]).to({x:currentMarginL + imageOffsetX},100);
				currentMarginL = currentMarginL + boxWidthPx + boxMarginPx ;
			}
			// Add new box
			this.slotBoxes[itemIndex] = new createjs.Shape();
			this.slotBoxes[itemIndex].graphics.beginFill("rgba(255, 255, 255, 0.21)").beginStroke("black").setStrokeStyle(1).drawRoundRect(0,0,boxWidthPx,boxWidthPx,10);
			this.slotBoxes[itemIndex].x = currentMarginL;
			this.slotBoxes[itemIndex].y = 10;
			this.slotBoxes[itemIndex].scaleX = 0;
			this.slotBoxes[itemIndex].scaleY = 0;
			stage.addChild(this.slotBoxes[itemIndex]);
			// Scale and move image to sit inside this box
			imageBoxsizePx = boxWidthPx * 0.8;	// Image is 80% of box size
			item.scale(imageBoxsizePx+"px");
			
			imageOffsetX = (boxWidthPx - item.getWidth()) / 2;
			imageOffsetY = (boxWidthPx - item.getHeight()) / 2;
			item.x = currentMarginL + imageOffsetX;
			item.y = this.slotBoxes[itemIndex].y + imageOffsetY;
			item.setDraggable(true);
			stage.addChild(item);
			createjs.Tween.get(this.slotBoxes[itemIndex]).to({scaleX:1, scaleY: 1},100);
			currentMarginL = currentMarginL + boxWidthPx + boxMarginPx ;
	};
	
	
	AdventureGame.Game = Game;
	
}());;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AventureGame = this.AdventureGame || {};

/**
* Base functions to load a game.
* Provides functions to load and store a game and defines base functions for initial setup, gameloop and exit
*/
(function() {
	"use strict";

	var GameBase = function(options) {
		this.initialize(options);
	};
	var p = GameBase.prototype;
	


	p.initialize = function(options) {
		if(!options.stage) {
			throw "Stage is not set";
		}
		this.stage = options.stage;
		AdventureGame.stage = this.stage;
		this.assets = options.assets || {images:[], audio:[]};
		if(options.setup) {
			this.setup = options.setup;
		}
		if(options.loop) {
			this.setup = options.loop;
		}
		if(options.exit) {
			this.setup = options.exit;
		}
		this.defaultSize = options.defaultSize || null;
		this.pageScale = 1;		// Scale all images by this amount (used to set to page scale)
		if(this.defaultSize && this.defaultSize.x) {
			this.pageScale = this.stage.canvas.width / this.defaultSize.x;
		}
		if(this.defaultSize && this.defaultSize.y && this.pageScale > this.stage.canvas.height / this.defaultSize.y) {
			this.pageScale = this.stage.canvas.height / this.defaultSize.y;
		}
		console.log(this.defaultSize);
		console.log("Page Scale: "+this.pageScale);
	};
	
	p.setup = function() {
		this.tickerCallback = createjs.Ticker.addEventListener('tick', this.loop.bind(this));
		return true;
	};
	p.loop = function() {
		this.stage.update();
		return true;
	};
	p.exit = function() {
		createjs.Ticker.removeEventListener('tick', this.tickerCallback);
		this.stage.removeAllChildren();
		return true;
	};
	p.assetsToManifest = function(assets) {
		console.log(assets);
		var manifest = [], key;
		for(key in assets.images) {
			if(assets.images.hasOwnProperty(key)) {
				manifest.push({src:assets.images[key].src, id: key});
			}
		}
		for(key in assets.audio) {
			if(assets.audio.hasOwnProperty(key)) {
				manifest.push({src:assets.audio[key].src, id: key});
			}
		}
		return manifest;
	};
	p.assetLoaded = function(event) {
		console.log("Loaded asset "+event.item.id);
		var item = event.item,
			img = null,
			thisImage = this.assets.images[event.item.id];
		switch(item.type) {
			case createjs.LoadQueue.IMAGE:
				// Scale any loaded images to the game scale if set
				/*
				if(!thisImage.gamescale && this.pageScale) {
					thisImage.scale = thisImage.scale * this.pageScale;
					thisImage.gamescale = true;
				}
				*/
				if(this.assets.images[event.item.id].spritesheet) {
					img = new createjs.SpriteSheet({
						images: [item.src],
						frames: this.assets.images[event.item.id].frames,
						animations: this.assets.images[event.item.id].animations
					});
					this.assets.images[event.item.id].loaded = true;
					this.assets.images[event.item.id].obj = new createjs.Sprite(img, 'idle');
					this.assets.images[event.item.id].obj.scaleX = this.assets.images[event.item.id].scale;
					this.assets.images[event.item.id].obj.scaleY = this.assets.images[event.item.id].scale;
				} else {
					img = new Image();
					img.src = item.src;
					console.log(this.assets.images[event.item.id]);
					this.assets.images[event.item.id].loaded = true;
					this.assets.images[event.item.id].obj = new createjs.Bitmap(img);
					this.assets.images[event.item.id].obj.scaleX = this.assets.images[event.item.id].scale;
					this.assets.images[event.item.id].obj.scaleY = this.assets.images[event.item.id].scale;
				}
				break;
			case createjs.LoadQueue.AUDIO:
				throw "Audio files not yet supported";
			default:
				console.error("Unhandled file type: "+item.type);
		}
	};
	
	AdventureGame.GameBase = GameBase;
	
}());;/*jslint white: true, browser: true, plusplus: true, nomen: true */
/*global console, createjs, $ */

this.AdventureGame = this.AdventureGame || {};


(function() {
	"use strict";
	

	function ImageInfo(options) {
		if(!options.src) {
			throw "No source set in image information";
		}
		this.src = options.src;
		this.scale = (options.scale !== undefined) ? options.scale : 1;
		this.loaded = false;
		this.obj = null;
		this.frames = options.frames || null;
		this.animations = options.animations || null;
		this.spritesheet = this.frames ? true : false;
	}
	/**
	* Find the largest scale that will fit both the width and hieght of the given box
	*/
	ImageInfo.prototype.getScaleForBox = function(widthPx, heightPx) {
		var scaleX, scaleY;
		scaleX = (widthPx / this.obj.image.width);
		scaleY = (heightPx / this.obj.image.height);
		return scaleX > scaleY ? scaleY: scaleX;
	};
	
	
	AdventureGame.ImageInfo = ImageInfo;
	
}());
;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
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
;/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* A single room containing items, characters and doors
* The room requires a background image, coordinates for the floor (walkable area) and any items or characters that will appear in it
*/
(function() {
	"use strict";

	var Room = function(options) {
		this.initialize(options);
	};
	var p = Room.prototype;
	
	// Public Properties
	
	/**
	 * Background image for room
	 * @property background
	 * @type String URI | Image
	 **/
	p.background = null;
	
	/**
	 * Area that player can click to walk
	 * @property floor
	 * @type createjs.Shape
	 **/
	p.floor = null;
	
	/**
	 * Associative array of objects to display in this room
	 * @property items
	 * @type Object
	 **/
	p.items = null;
	
	/**
	 * Associative array of characters to display in this room (note yet fully implemented)
	 * @property characters
	 * @type Object
	 **/
	p.characters = null;
	
	/**
	 * Array of doors to exit the room (not yet full implemented)
	 * @property doors
	 * @type Object
	 **/
	p.doors = null;
	
	/**
	 * Function to call when the room is loaded
	 * @property onLoad
	 * @type function
	 **/
	p.onLoad = null;
	
	/**
	 * Function to call when the player enters the room. Run after onLoad
	 * @property onEnter
	 * @type function
	 **/
	p.onEnter = null;

	/**
	 * Function to call when the player exits the room
	 * @property onExit
	 * @type function
	 **/
	p.onExit = null;
	
	/**
	 * Flag indicating if the room has been entered yet
	 * @property entered
	 * @type Boolean
	 **/
	p.entered = null;
	
	
	/**
	* Setup this room object from given options
	* @param options Object containing options to setup this room
	* @return null
	*/
	p.initialize = function(options) {
		if(!options.background) {
			throw "Background not set for room";
		}
		if(!options.floor) {
			throw "Floor is not set for room";
		}
		this.background = new createjs.Bitmap(options.background);
		this.floor = this.createFloor(options.floor);
		this.items = (options.items !== undefined ? options.items : {});
		this.characters = (options.characters !== undefined ? options.characters : {});
		this.doors = (options.doors !== undefined ? options.doors : {});
		this.onEnter = (options.onEnter !== undefined ? options.onEnter : function() {return true;});
		this.onLoad = (options.onLoad !== undefined ? options.onLoad : function() {return true;});
		this.onExit = (options.onExit !== undefined ? options.onExit : function() {return true;});
		this.entered = false;
	};

	/**
	* Create a floor shape from an array of coordinates
	* @param array Coordinates of shape to use for floor
	* @return The createjs.Shape object used to represent the form
	*/
	p.createFloor = function(points) {
		var floor = new createjs.Shape(),
			itemIndex;
		floor.graphics.beginFill("rgba(255, 255, 255, 0.21)");
		floor.graphics.moveTo(points[0][0], points[0][1]);	// Put cursor at first pint
		// Now draw lines to all remaining points
		for(itemIndex=1; itemIndex<points.length; itemIndex++) {
			floor.graphics.lineTo(points[itemIndex][0], points[itemIndex][1]);
		}
		floor.graphics.lineTo(points[0][0], points[0][1]);	// Draw line back to the start
		floor.x = 0;
		floor.y = 0;
		return floor;
	};

	/**
	* Load this room and draw on the stage
	* @param player Character object representing the playable character
	* @param door Object with x,y and direction information for player to enter from
	* @return null
	*/
	p.load = function(player, door) {
		console.log("Loading room");
		var 
			itemID,
			characterID,
			stage = AdventureGame.stage,
			characterHeight = player.getHeight(),
			characterWidth = player.getWidth(),
			aCharacter,
			doorCoord;
		// Scale and load background
		this.background.scaleX = stage.canvas.width / this.background.image.width;
		this.background.scaleY = stage.canvas.height / this.background.image.height;
		stage.addChild(this.background);
		// Make sure the floor scales with the background
		this.floor.scaleX = this.background.scaleX;
		this.floor.scaleY = this.background.scaleY;
		stage.addChild(this.floor);
		this.floor.on('click', function(event) {
			player.walkToPosition(event.stageX, event.stageY);
			player.destinationCallback = null;
		});

		for(itemID in this.items) {
			if(this.items.hasOwnProperty(itemID)) {
				this.items[itemID].room = this;
				stage.addChild(this.items[itemID]);
			}
		}


		console.log(this.characters);
		for(characterID in this.characters) {
			if(this.characters.hasOwnProperty(characterID)) {
				aCharacter = this.characters[characterID];
				stage.addChild(aCharacter);
			}
		}
	
		// Add characters
		// Add player first
		if(door) {
			// Convert door % value to px for the stage
			doorCoord = AdventureGame.percentToStageCoord(door.x, door.y, AdventureGame.stage);
			console.log(AdventureGame.stage.canvas.width+' * ('+door.x+'/100)');
			switch(door.location) {
				case 'N':
					player.setCharacterPosition(doorCoord.x, doorCoord.y-5);
					player.nextPosition = {x: doorCoord.x, y: doorCoord.y+characterHeight+5};
					break;
				case 'E':
					player.setCharacterPosition(doorCoord.x-characterWidth+5, doorCoord.y);
					player.nextPosition = {x: doorCoord.x+characterWidth+5, y: doorCoord.y};
					break;
				case 'S':
					player.setCharacterPosition(doorCoord.x, doorCoord.y+characterHeight+5);
					player.nextPosition = {x: doorCoord.x, y: doorCoord.y-5};
					break;
				case 'W':
					player.setCharacterPosition(doorCoord.x-characterWidth-5, doorCoord.y);
					player.nextPosition = {x: doorCoord.x+characterWidth+5, y: doorCoord.y};
					break;
				default:
					player.setCharacterPosition(doorCoord.x, doorCoord.y);
			}
		} else {
			// This is hardly necessecary now as the player is already standing here
			player.setCharacterPosition(player.getXLocation(), player.getYLocation());
		}
		stage.addChild(player);
			
		stage.update();
		if(this.onLoad) {
			this.onLoad();
		}
	};
	
	/**
	 * Get a walkable path across the floor from one given point to another
	 * @param startX The X coordinate for the starting location
	 * @param startY The Y coordinate for the starting lcoation
	 * @param endX X coordinate for the destination location
	 * @param endY Y coordinate for the destination location
	 * @param excludedObsticles Array of objects that should be ignored when evaluating obsticles
	 * @return array of points for walking path | false if no path can be found
	 */
	p.getPath = function(startX,startY,endX,endY,excludedObsticles) {
		var 
//			nodesPerStage = 100,
//			distanceBetweenNodes = AdventureGame.stage.width / nodesPerStage,
			distanceBetweenNodes = 100,		// the distance in pixels between each node
			map = [],						// 2 dimension array of all points on the map
			visited = [],					// Array of nodes that have been visited
			toVisit = [],					// Array of nodes to visit
			currentDistance = 0,			// How far we are from the starting point
			currentX = startX,				// The X dimension for the current node we're at
			currentY = startY,				// The Y dimension for the current node we're at
			xOffset,						// The X offset in neighbouring nodes to check
			yOffset,						// The Y offset in neighbouring nodes to check
			localObjects,					// Objects at the given point
			objIndex,						// Iterator index when walking through objects at a certain point
			isWalkable = false,				// Flag indicating if this is available floor
			tmpX,							// A temp storage of the neighbouring node's X index
			tmpY,							// Temp storage of the neighbouring node's Y index
			tmpCoord,						// Temp variable to hold array coordinates for next node when splitting to currentX and currentY
			visitedIndex,
			isVisited = false,				// Flag inticating if the node has been visited yet
			path,							// Array holding the path we have located
			closestX,						// The X coord for the current closest node when walking back down the path
			closestY;						// The Y coord for the current closest node when walking back down the path
		// Set start and end values to multiples of the node distance to ensure they fit node coordinates
		// If we ensure that is always a square of 10 we can use Math.round to get the cloest value rather than just rounding down as we do here
		startX = startX - (startX % distanceBetweenNodes);
		startY = startY - (startY % distanceBetweenNodes);
		endX = endX - (endX % distanceBetweenNodes);
		endY = endY - (endY % distanceBetweenNodes);
		// Draw the initial point on the map
		if (!map[currentX]) {
			map[currentX] = [];
		}
		map[currentX][currentY] = currentDistance;
		visited.push([currentX,currentY]);

		while (currentX !== endX && currentY !== endY) {
			currentDistance = map[currentX][currentY];
			// Check neighbouring nodes
			for (xOffset = -1; xOffset <= 1; xOffset++) {
				for (yOffset = -1; yOffset <= 1; yOffset++) {
					tmpX = currentX + xOffset;
					tmpY = currentY + yOffset;
					isWalkable = false;
					localObjects = AdventureGame.stage.getObjectsUnderPoint(tmpX, tmpY);
					for(objIndex =0; objIndex < localObjects.length; objIndex++) {
						console.log(localObjects[objIndex]);
						if(excludedObsticles.indexOf(localObjects[objIndex]) === -1) {
							// This item is not to be excluded
							if(excludedObsticles[objIndex] === this.floor) {
								// There is still floor here so can walk here unless we find another obsticle
								isWalkable = true;
							} else {
								// We found an obsticle and so cannot walk here
								isWalkable = false;
								break;
							}
						}
					}
					if (isWalkable) {
						// If we don't have an array for this X yet add it
						if(!map[tmpX]) {
							map[tmpX] = [];
						}
						// If this node hasn't been checked yet add it to the list to visit
						if (map[tmpX][tmpY] !== undefined) {
							// Now check if we've visited it
							isVisited = false;
							for(visitedIndex = 0; visitedIndex < visited.length; visitedIndex++) {
									if(visited[visitedIndex][0] === tmpX && visited[visitedIndex][1] === tmpY) {
										isVisited = true;
										break;
									}
							}
							if(!isVisited) {
								toVisit.push([tmpX,tmpY]);
							}
						}
						// If this path is the first or shortest path to the new node update the distance
						if (!map[tmpX][tmpY] || map[tmpX][tmpY] < currentDistance + distanceBetweenNodes) {
							map[tmpX][tmpY] = currentDistance + distanceBetweenNodes;
						}
					}
				}
			}
			// Now set new location to one from the list to visit
			tmpCoord = toVisit.shift();
			currentX = tmpCoord[0];
			currentY = tmpCoord[1];
			// If we're at the end finish the loop
			if(currentX === endX && currentY === endY) {
				break;
			}
		}
		// We have nodes with their distances so we just need to walk back and find the shortest path
		// Check neighbouring nodes
		path = [];
		while(currentX !== startX && currentY !== startY) {
			path.shift([currentX,currentY]);	// Store this point in our path
			// Start using our current node as the "closest" point for reference
			closestX = currentX;
			closestY = currentY;
			// Now check all surrounding nodes for a closer one
			for (xOffset = -1; xOffset <= 1; xOffset++) {
				for (yOffset = -1; yOffset <= 1; yOffset++) {
					tmpX = currentX + xOffset;
					tmpY = currentY + yOffset;
					// If this square is closer to the destination than the last hold on to it
					if(map[tmpX][tmpY] < map[closestX][closestY]) {
						closestX = tmpX;
						closestY = tmpY;
					}
				}
			}
			currentX = closestX;
			currentY = closestY;
		}
		return path;
	};
	
	
	
	/**
	* Gameloop for room
	*/
	p.loop = function() {
	
	};
	
	
	AdventureGame.Room = Room;
}());
