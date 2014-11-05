/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
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
	
}());