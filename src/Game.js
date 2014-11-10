/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, db, AdventureGame */

/** @namespace **/
this.AdventureGame = this.AdventureGame || {};

(function() {
	"use strict";
	/* @namespace AdventureGame */

	/**
	* The main point and click game.
	* Implements prototype from GameBase and loads each room object
	* @class AdventureGame.Game
	* @augments AdventureGame.GameBase
	*/
	var Game = function(options) {
		this.initialize(options);
	};
	var p = Game.prototype = Object.create(AdventureGame.GameBase.prototype);
	Game.prototype.constructor = Game;
	
	/**
	 * Array of assets to load with attributes src and id
	 * @name assets
	 * @type Object
	 * @memberof AdventureGame.Game
	 **/
	p.assets = null;

	/**
	 * The currently loaded room
	 * @name currentRoom
	 * @type AdventureGame.Room
	 * @memberof AdventureGame.Game
	 **/
	p.currentRoom = null;

	/**
	 * Flag indicating if the game has been loaded
	 * @name loaded
	 * @type Boolean
	 * @memberof AdventureGame.Game
	 **/
	p.loaded = false;
	
	/**
	 * The size in percent to draw inventory boxes
	 * @name inventoryBoxsize
	 * @type int
	 * @memberof AdventureGame.Game
	 **/
	p.inventoryBoxsize = 8;

	/**
	 * The size in percent to draw margins between the inventory boxes
	 * @name inventoryMarginsize
	 * @type int
	 * @memberof AdventureGame.Game
	 **/
	p.inventoryMarginsize = 2;

	/**
	 * Array of inventory box shapes that are drawn at the top of the screen
	 * @name slotBoxes
	 * @type createjs.Shape[]
	 * @memberof AdventureGame.Game
	 **/
	p.slotBoxes = [];

	/**
	 * Object containing configuration for items as key value pairs
	 * @name itemList
	 * @type Object[]
	 * @memberof AdventureGame.Game
	 **/
	p.itemList = {};

	
	/**
	 * Configuration options to create player character if a character object is not given
	 * @name playerData
	 * @type Object
	 * @memberof AdventureGame.Game
	 **/
	p.playerData = null;
	
	/**
	 * Initlization function of parent GameBase class
	 * @name GameBase_initialize
	 * @type fucntion
	 * @memberof AdventureGame.Game
	 **/
	p.GameBase_initialize = p.initialize;
	
	/**
	* Setup function called by constructor
	* ## In addition to those from AdventureGame.GameBase the following options are accepted:
	* * player AdventureGame.Character The player character for this game
	* * itemList AdventureGame.Item[] Array of items used in this game (used when )
	* @function initialize
	* @memberof AdventureGame.Game
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
		if(options.itemList) {
			this.itemList = options.itemList;
		}
		console.log("Seting up game");
	};

	/**
	* Load a room into the game
	* @function loadRoom
	* @memberof AdventureGame.Game
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
	* Load the room from a Room object (intended to be called internally)
	* @function loadRoomFromObject
	* @memberof AdventureGame.Game
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
		console.log("Loading items");
	};
	
	/**
	* Load assets for room and containing items from array describing room
	* function loadRoomAsssets
	* @memberof AdventureGame.Game
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
	* @function start
	* @memberof AdventureGame.Game
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


		console.log(AdventureGame.player.inventory.items);
		console.log(this.itemList);
		// Load this room if not yet loaded
		if(this.roomData) {
			items = this.roomData.items;
			this.roomData.items = [];
			console.log(AdventureGame.saveGame.inventory);
			for(item in items) {
				if(items.hasOwnProperty(item) 
					&& AdventureGame.player.inventory.findItemWithId(item) === -1
					&& AdventureGame.saveGame.inventory.indexOf(item) < 0
				) {
					this.roomData.items[item] = new AdventureGame.Item(items[item]);
				}
			}
			
			characters = this.roomData.characters;
			for(charID in characters) {
				if(characters.hasOwnProperty(charID)) {
					this.roomData.characters[charID] = new AdventureGame.Character(characters[charID]);
				}
			}
			this.currentRoom = new AdventureGame.Room(this.roomData);
			this.door = this.roomData.entrance;
			this.roomData = null;	// Remove this as we now have an actual room
		}
		console.log("Fully loaded!");
		if(!player.hasEventListener('click')) {
			player.addEventListener('click', player.onClick.bind('player'));
		}
		
		this.currentRoom.load(AdventureGame.player, this.door);
		console.log(AdventureGame.player.inventory);
		console.log(AdventureGame.saveGame.inventory);
		this.showInventory();
				// Now the room is loaded add inventory items from save
		for(item in AdventureGame.saveGame.inventory) {
			// Only add items if they are not already in the inventory (when loading from an object the inventory will already be populated)
			if(AdventureGame.saveGame.inventory.hasOwnProperty(item)) {
				var itemIndex = AdventureGame.player.inventory.findItemWithId(AdventureGame.saveGame.inventory[item]);
				if(itemIndex === -1) {
					console.log("Adding "+AdventureGame.saveGame.inventory[item]+" to inventory");
					if(this.itemList[AdventureGame.saveGame.inventory[item]]) {
						AdventureGame.player.inventory.addItem(new AdventureGame.Item(this.itemList[AdventureGame.saveGame.inventory[item]]));
					} else {
						console.error("ERROR: "+AdventureGame.saveGame.inventory[item]+" does not exist in item list");
						console.log(this.itemList);
					}
				}
			}
		}
		this.stage.update();
		
		this.loaded = true;

		this.tickerCallback = createjs.Ticker.addEventListener('tick', this.loop.bind(this));
	};
	
	/**
	* Game loop for this game
	* @function loop
	* @memberof AdventureGame.Game
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
	* Draw the inventory box and item image at top of screen
	* @function drawNewInventoryBox
	* @param itemIndex integer index for item in inventory array
	* @param currentMarginL The margin from the left to draw this box
	* @return New margin in px that the next box should be drawn at
	* @memberof AdventureGame.Game
	* @return void
	*/
	p.drawNewInventoryBox = function(itemIndex, currentMarginL) {
		var 
			stage = this.stage,
			boxWidthPx = (this.inventoryBoxsize / 100) * stage.canvas.width,
			boxMarginPx = (this.inventoryMarginsize / 100) * stage.canvas.width,
			item,
			imageBoxsizePx,
			imageOffsetX,
			imageOffsetY;
		
		// Draw inventory box;
		this.slotBoxes[itemIndex] = new createjs.Shape();
		this.slotBoxes[itemIndex].graphics.beginFill("rgba(255, 255, 255, 0.21)").beginStroke("black").setStrokeStyle(1).drawRoundRect(0,0,boxWidthPx,boxWidthPx,10);
		this.slotBoxes[itemIndex].x = currentMarginL;
		this.slotBoxes[itemIndex].y = 10;
		// Set scale to 0 so we can have it bubble out with a nice animation
		this.slotBoxes[itemIndex].scaleX = 0;
		this.slotBoxes[itemIndex].scaleY = 0;
		stage.addChild(this.slotBoxes[itemIndex]);
		createjs.Tween.get(this.slotBoxes[itemIndex]).to({scaleX:1, scaleY: 1},100);
		
		// Scale and move image to sit inside this box
		item = AdventureGame.player.inventory.items[itemIndex];
		imageBoxsizePx = boxWidthPx * 0.8;	// Image is 80% of box size
		item.scale(imageBoxsizePx+"px");
		imageOffsetX = (boxWidthPx - item.getWidth()) / 2;
		imageOffsetY = (boxWidthPx - item.getHeight()) / 2;
		item.x = currentMarginL + imageOffsetX;
		item.y = this.slotBoxes[itemIndex].y + imageOffsetY;
		item.setDraggable(true);
		stage.addChild(item);
		
		// Return new margin left
		return currentMarginL + boxWidthPx + boxMarginPx ;
	};
	
	/**
	* Draw boxes at the top of the screen containing the player's current inventory
	* @function showInventory
	* @memberof AdventureGame.Game
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
			currentMarginL = this.drawNewInventoryBox(itemIndex, currentMarginL);
		}
	};
	
	/**
	* Draw the specified item in the inventory boxes at the top of the screen.
	* Note that this function does not actually add the item to the player's inventory and should be called from the inventory.
	* containers addItem function (which is set in the initialize function for game.
	* @function addToInventory
	* @memberof AdventureGame.Game
	* @param item AdventureGame.Item The item to add the the player inventory
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
			imageOffsetX;

		// Move all existing boxes to the left
		for(itemIndex = 0; itemIndex < this.slotBoxes.length; itemIndex++) {
			createjs.Tween.get(this.slotBoxes[itemIndex]).to({x:currentMarginL},100);
			imageOffsetX = (boxWidthPx - item.getWidth()) / 2;
			createjs.Tween.get(AdventureGame.player.inventory.items[itemIndex]).to({x:currentMarginL + imageOffsetX},100);
			currentMarginL = currentMarginL + boxWidthPx + boxMarginPx ;
		}
		// Add new box
		currentMarginL = this.drawNewInventoryBox(itemIndex, currentMarginL);
		

		// Add to player inventory in save
		if(AdventureGame.saveGame.inventory.indexOf(item.id) < 0) {
			AdventureGame.saveGame.inventory.push(item.id);
			if(AdventureGame.db) {
				AdventureGame.db.put(AdventureGame.saveGame, function(err, doc) {
					if(err) {
						console.error("Error saving game after adding item to inventory");
						console.log(err);
						console.log(doc);
					}
				});
			}
		}
	};
	
	
	AdventureGame.Game = Game;
	
}());