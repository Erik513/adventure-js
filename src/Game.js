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
	 * @type Object
	 * @memberof AdventureGame.Game
	 **/
	p.itemList = {};

	/**
	 * Object containing all items loaded into the game identified by their id
	 * @name items
	 * @type Object
	 * @memberof AdventureGame.Game
	 **/
	p.items = {};
	
	/**
	 * Configuration options to create player character if a character object is not given
	 * @name playerData
	 * @type Object
	 * @memberof AdventureGame.Game
	 **/
	p.playerData = null;
	
	/**
	 * Text element showing score to users
	 * @name scoreText
	 * @type createjs.Text
	 * @memberof AdventureGame.Game
	 **/
	p.scoreText = null;
	
	/**
	 * Array of images and their positions to be overlayed on the game
	 * @name overlayImages
	 * @type Object[]
	 * @memberof AdventureGame.Game
	 **/
	p.overlayImages = [];
	
	/**
	* Callback function after game has fully loaded
	* @name loadedCallback
	* @type function
	* @memberof AdventureGame.game
	**/
	p.loadedCallback = null;
	
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
	* * overlayImages Object[] Array of objects containing image source and coordinates ({src: sourch, x: xCoord, y: yCoord})
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
		if(options.overlayImages) {
			this.overlayImages = options.overlayImages;
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
		queue.on('error', function(e) {
			console.error(e.title+":"+e.message+" on "+e.data.src);
		});
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
			overlayIndex,
			assetIndex,
			character,
			$bar;
			
		// Load extra assets
		for(assetIndex = 0; assetIndex > this.extraAssets.length; assetIndex++) {
			manifest.push({src: this.extraAssets[assetIndex], id: 'extraAsset'+assetIndex});
			this.assets.images['extraAsset'+assetIndex] = {src: this.extraAssets[assetIndex]};
		}
		
		// Load game overlay images
		for(overlayIndex = 0; overlayIndex < this.overlayImages.length; overlayIndex++) {
			manifest.push({src: this.overlayImages[overlayIndex].src, id:'overlay'+overlayIndex});
			this.assets.images['overlay'+overlayIndex] = this.overlayImages[overlayIndex];
		}
						
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
			$bar = $('#loadingDiv .progress-bar');
			$bar.width((evt.loaded*100)+'%');
			$bar.text(Math.floor(evt.loaded*100)+ "%");
			console.log('Loaded: '+evt.loaded+'%');
		});
		queue.on('fileload', this.assetLoaded.bind(this));
		queue.on('complete', this.start.bind(this));			
		queue.on('error', function(e) {
			console.error(e.title+":"+e.message+" on "+e.data.src);
		});
		queue.loadManifest(manifest);
		$('#loadingDiv').show();
	};
	
	/**
	* Function to start the game after all assets have loaded. This should be triggered by the complete event of the CreateJS Queue
	* @function start
	* @memberof AdventureGame.Game
	* @return void
	**/
	p.start = function() {
		var 
			_this = this,
			player = AdventureGame.player,
			items,
			characters,
			tmpImage,
			overlayIndex;
		
		// Phonegap really struggles loading the large spritesheet so check it is loaded before continuing
		tmpImage = new Image();
		tmpImage.src = this.playerData.src;
		AdventureGame.waitUntilLoaded(tmpImage, 2000).then(function() {
			var 
				item,
				charID;
			// Load player if not yet loaded
			if(!player) {
				player = new AdventureGame.Character(_this.playerData);
				AdventureGame.player = player;
			}

			// Set player inventory to use the game inventory
			var game = _this;
			AdventureGame.player.inventory.addItem = function(item) {
				AdventureGame.Container.prototype.addItem.call(AdventureGame.player.inventory,item);
				game.addToInventory(item);
			};

			$('#loadingDiv').hide();
			console.log(AdventureGame.player.inventory.items);
			console.log(_this.itemList);
			// Load this room if not yet loaded
			if(_this.roomData) {
				items = _this.roomData.items;
				_this.roomData.items = [];
				console.log(AdventureGame.saveGame.inventory);
				for(item in items) {
					if(items.hasOwnProperty(item) && 
						AdventureGame.player.inventory.findItemWithId(item) === -1 &&
						AdventureGame.saveGame.inventory.indexOf(item) < 0
					) {
						// This item both in the item placeholder and in the configuration to pass to the room later
						_this.items[item] = new AdventureGame.Item(items[item]);
						console.log('Item scale '+items[item].scale+" set to "+_this.items[item].scaleX);
						_this.roomData.items[item] = _this.items[item];
					}
				}
			
				characters = _this.roomData.characters;
				for(charID in characters) {
					if(characters.hasOwnProperty(charID)) {
						_this.roomData.characters[charID] = new AdventureGame.Character(characters[charID]);
					}
				}
				_this.currentRoom = new AdventureGame.Room(_this.roomData);
				_this.door = _this.roomData.entrance;
				_this.roomData = null;	// Remove this as we now have an actual room
			}
			console.log("Fully loaded!");
			if(!player.hasEventListener('click')) {
				player.addEventListener('click', player.onClick.bind('player'));
			}
		
			_this.scoreText = new createjs.Text(AdventureGame.saveGame.points.toString(), "30px 'Coming Soon'", "#FFFFFF");	// Create score counter before loading room in case initial event wants to use it
			_this.currentRoom.load(AdventureGame.player, _this.door).then(function() {
				console.log("Room loaded");
				
				var overlayPromises = [];
				
				for(overlayIndex=0; overlayIndex < _this.overlayImages.length; overlayIndex++) {
					tmpImage = new Image();
					tmpImage.src = _this.overlayImages[overlayIndex].src;
					overlayPromises.push(AdventureGame.waitUntilLoaded(tmpImage));
				}
				return Promise.all(overlayPromises);
			}).then(function() {
				// Add overlay
				_this.gameOverlay = new createjs.Container();
				for(overlayIndex = 0; overlayIndex < _this.overlayImages.length; overlayIndex++) {
					_this.overlayImages[overlayIndex].img = new createjs.Bitmap(_this.overlayImages[overlayIndex].src);
					console.log(_this.overlayImages[overlayIndex].img.scaleX);
					_this.gameOverlay.addChild(_this.overlayImages[overlayIndex].img);
				}
				console.log("Background scale: "+_this.currentRoom.background.scaleX);
				_this.gameOverlay.scaleX = _this.currentRoom.background.scaleX;
				_this.gameOverlay.scaleY = _this.currentRoom.background.scaleY;
				_this.stage.addChild(_this.gameOverlay);
			
				// Now draw score timer on top of the room (this goes in the promise as it has to follow the overylay to be placed on top)
				_this.scoreText.scaleX = AdventureGame.getScaleToFit('10%',_this.scoreText);
				_this.scoreText.scaleY = _this.scoreText.scaleX;
				_this.scoreText.x = AdventureGame.getXCoord('2%');
				_this.scoreText.y = AdventureGame.getYCoord('1%');
				console.log(_this.scoreText.text);
				console.log(_this.scoreText);
				_this.stage.addChild(_this.scoreText);
			
			}).catch(function(e) {
				console.error(e.message+": "+e.stack);
			});
		
		
		
		
			console.log(AdventureGame.player.inventory);
			console.log(AdventureGame.saveGame.inventory);
			_this.showInventory();
					// Now the room is loaded add inventory items from save
			for(item in AdventureGame.saveGame.inventory) {
				// Only add items if they are not already in the inventory (when loading from an object the inventory will already be populated)
				if(AdventureGame.saveGame.inventory.hasOwnProperty(item)) {
					var itemIndex = AdventureGame.player.inventory.findItemWithId(AdventureGame.saveGame.inventory[item]);
					if(itemIndex === -1) {
						console.log("Adding "+AdventureGame.saveGame.inventory[item]+" to inventory");
						if(_this.itemList[AdventureGame.saveGame.inventory[item]]) {
							// Add items to the inventory using the container prototype so as to avoid redrawing the inventory as calls to tween don't stack well
							AdventureGame.Container.prototype.addItem.call(
								AdventureGame.player.inventory,
								new AdventureGame.Item(_this.itemList[AdventureGame.saveGame.inventory[item]])
							);
						} else {
							console.error("ERROR: "+AdventureGame.saveGame.inventory[item]+" does not exist in item list");
							console.log(_this.itemList);
						}
					}
				}
			}
			_this.showInventory();
			_this.stage.update();
		
			_this.loaded = true;

			_this.tickerCallback = createjs.Ticker.addEventListener('tick', _this.loop.bind(_this));
		
			if(_this.loadedCallback) {
				_this.loadedCallback();
			}
		}).catch(function(e) {
			console.error(e.message);
			console.error(e.stack || e.message || e);
		});
	};
	
	/**
	* Get the index for the overlay on the stage.
	* This can then be used with createjs.Stage.addChildAdd to add elements under the overlay
	* @function getOverlayIndex
	* @memberof AdventureGame.Game
	* @return the stage index of the overlay
	**/
	p.getOverlayIndex = function() {
		var index = AdventureGame.stage.children.indexOf(this.gameOverlay);
		console.log(index);
		return index;
	};
	
	/**
	* Game loop for this game
	* @function loop
	* @memberof AdventureGame.Game
	* @return void
	*/
	p.loop = function(evt) {
		if(this.loaded && this.currentRoom) {
			this.currentRoom.loop();
		}
		AdventureGame.player.step();
		this.stage.update(evt);
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
			imageOffsetY,
			_this = this;
		
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
		console.log("Scaling box");
		item.scale(imageBoxsizePx+"px").then(function() {
			imageOffsetX = (boxWidthPx - item.getWidth()) / 2;
			imageOffsetY = (boxWidthPx - item.getHeight()) / 2;
			item.x = currentMarginL + imageOffsetX;
			item.y = _this.slotBoxes[itemIndex].y + imageOffsetY;
			stage.addChild(item);
			stage.update();
		}).catch(function(e) {
			console.error(e.message);
		});

		// Make this item draggable after a delay so this doesn't conflcit with the user's current action
		setTimeout(function() {
			item.setDraggable(true);
		}, 200);

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
			currentItem,
			imageOffsetX;

		// Move all existing boxes to the left
		for(itemIndex = 0; itemIndex < this.slotBoxes.length; itemIndex++) {
			currentItem = AdventureGame.player.inventory.items[itemIndex];
			
			this.slotBoxes[itemIndex].x = currentMarginL;
			createjs.Tween.get(this.slotBoxes[itemIndex]).to({x:currentMarginL},100);
			imageOffsetX = (boxWidthPx - currentItem.getWidth()) / 2;
//			AdventureGame.player.inventory.items[itemIndex].x = currentMarginL + imageOffsetX;
			createjs.Tween.get(currentItem).to({x:currentMarginL + imageOffsetX},100);
			currentMarginL = currentMarginL + boxWidthPx + boxMarginPx ;
		}
		// Add new box
		currentMarginL = this.drawNewInventoryBox(itemIndex, currentMarginL);
		

		// Add to player inventory in save
		if(AdventureGame.saveGame.inventory.indexOf(item.id) < 0) {
			AdventureGame.saveGame.inventory.push(item.id);
			if(AdventureGame.db) {
				AdventureGame.saveGameToDB();
			}
		}
	};
	
	p.populateContainerFromSave = function(container) {
		var 
			items = AdventureGame.saveGame.containers[container.id],
			i;
		for(i=0; i<items.length; i++) {
			container.addItem(this.items[items[i]]);
		}
	};
	
	
	AdventureGame.Game = Game;
	
}());