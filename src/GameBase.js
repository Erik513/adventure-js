/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */

this.AdventureGame = this.AdventureGame || {};


(function() {
	"use strict";

	/**
	* Provides functions to load and store a game and defines base functions for initial setup, gameloop and exit
	* @class AdventureGame.GameBase
	* @summary Base functions to load a game.
	**/
	var GameBase = function(options) {
		this.initialize(options);
	};
	var p = GameBase.prototype;
	
	/**
	* Array of additional assets required by this game that are not automatically loaded
	* @name extraAssets
	* @type String[]
	* @memberof AdventureGame.GameBase
	**/
	p.extraAssets = [];

	/**
	* Setup function called by constructor.
	* ### Expected options are
	* * stage createjs.Stage The stage to draw this game on (required)
	* * saveGame Object Save document for this game (from which data will be loaded and saved to pouchdb throughout gameplay)
	* * saveGame PouchDB PouchDB databaes connection for saving data
	* * assets Object passing array of AdventureGame.ImageInfo objects in options.images and options.audio
	* * setup function Setup function for this game
	* * loop function Gameloop functio for this game
	* * exit function Callback function when the game exits
	* * defaultSize Object The default size of this game in options.defaultSize.x and options.defaultSize.y
	* * pageScale int The amount to scale all images in this game (defaults to 1) (depcrecated: use percent sizing instead)
	* * extraAssets String[] Array of additional assets that are not autoloaded
	* @function initialize
	* @memberof AdventureGame.GameBase
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		if(!options.stage) {
			throw "Stage is not set";
		}
		this.stage = options.stage;
		AdventureGame.stage = this.stage;
		if(options.saveGame) {
			AdventureGame.saveGame = options.saveGame;
		}
		if(options.db) {
			AdventureGame.db = options.db;
		}
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
		if(options.extraAssets) {
			this.extraAssets = options.extraAssets;
		}
		this.defaultSize = options.defaultSize || null;
		this.pageScale = 1;		// Scale all images by this amount (used to set to page scale)
		if(this.defaultSize && this.defaultSize.x) {
			this.pageScale = this.stage.canvas.width / this.defaultSize.x;
		}
		if(this.defaultSize && this.defaultSize.y && this.pageScale > this.stage.canvas.height / this.defaultSize.y) {
			this.pageScale = this.stage.canvas.height / this.defaultSize.y;
		}
	};
	
	/**
	* Default initial setup for the game. 
	* Sets ticket to run gameloop. This may be overridden by passing the setup option to the constructor
	* @function setup
	* @memberof AdventureGame.GameBase
	**/
	p.setup = function() {
		this.tickerCallback = createjs.Ticker.addEventListener('tick', this.loop.bind(this));
		return true;
	};

	/**
	* Default game loop
	* Updates the screen and returns true to indicate success
	* @function loop
	* @memberof AdventureGame.GameBase
	* @return true
	**/
	p.loop = function() {
		this.stage.update();
		return true;
	};

	/**
	* Default exit function
	* Disables ticker (which calls loop by default unless setup() has been replaced)
	* @function exit
	* @memberof AdventureGame.GameBase
	* @return true
	**/
	p.exit = function() {
		createjs.Ticker.removeEventListener('tick', this.tickerCallback);
		this.stage.removeAllChildren();
		return true;
	};

	/**
	* Build a manifest file from supplied assets.
	* @function assetsToManifest
	* @memberof AdventureGame.GameBase
	* @param assets Object containing two arrays of asset information. assets.images and assets.audio
	* @return manifest file
	**/
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

	/**
	* Callback function when an asset is loaded
	* @function assetLoaded
	* @memberof AdventureGame.GameBase
	* @param event Event information containing the loaded asset
	**/
	p.assetLoaded = function(event) {
		console.log("Loaded asset "+event.item.id);
		var item = event.item,
			img = null;
//			thisImage = this.assets.images[event.item.id];
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


	/**
	* Add points to the score counter displayed on the stage.
	* This is a recursive function used to show the counter incrementing (or decrementing) the target score.
	* It does not update the actual score. If this is desired AdventureGame.GameBase.addPoints should be used instead
	* @function addPointsToCounter
	* @param target integer The target score to increment or decrement counter to
	* @param countInterval integer The amount of time to wait in miliseconds between each count step
	* @memberof AdventureGame.Game
	**/
	p.addPointsToCounter = function(target,countInterval) {
		var 
			current = parseInt(this.scoreText.text, 10),
			increment = target > current ? 1 : -1;
		this.scoreText.text = current + increment;
		if(current + increment !== target) {
			setTimeout(function() {
				this.addPointsToCounter(target, countInterval);
			}.bind(this), countInterval);
		}
	};
	
	/**
	* Add the indicated number of points to the players score and increment the counter
	* @function addPoints
	* @param points integer The number of points to add
	* @memberof AdventureGame.Game
	**/
	p.addPoints = function(points) {
		AdventureGame.addPoints(points);
		this.addPointsToCounter(AdventureGame.saveGame.points, 100);
	};
	
	AdventureGame.GameBase = GameBase;
	
}());