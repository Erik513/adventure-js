/*jslint white: true, browser: true, plusplus: true, nomen: true */
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
	* The stage used for this game
	*/
	AdventureGame.stage = null;

	/**
	* Player object used in the game
	*/
	AdventureGame.player = null;

	/**
	* Flag indicating if user input should be accepted (allows game loop to continue animating but block new user actions)
	*/
	AdventureGame.inputDisabled = false;

	/**
	* The save document for this game
	*/
	AdventureGame.saveGame = {
						_id: 'game_unknown_'+Date.now(),
						name: 'undefined',
						points: 0,
						inventory: [],
						items: {},
						flags: {},
						character: {}
	};
	
	/**
	* PouchDB database connction
	*/
	AdventureGame.db = null;


	/**
	* Load assets for room and containing items from array describing room
	* function percentToStageCoord
	* @param x The X coordinate in percent to convert to pixels
	* @param y the Y coordinate in percent to convert to pixels
	* @return object with stage coordinates in pixels for x and y dimenstions. 
	* @deprecated Use getXCoord and getYCoord instead
	* @memberof AdventureGame
	*/
	AdventureGame.percentToStageCoord = function(x, y) {
		return {x: AdventureGame.stage.canvas.width * (x / 100), y: AdventureGame.stage.canvas.height * (y/100)};
	};
	
	/**
	* Scale image to fit in a box by either pixel or percent values 
	* function getScaleToFit
	* @param getScaleToFit string size of the (sqare) box to scale this image to fit. The size may be in pixels (end in 'px') or percentage (end in '%')
	* @param object The object to be scaled (should implement createjs.DisplayObject prototype)
	* @return double value indicating the new scale for the object (where 1 is the default size)
	* @memberof AdventureGame
	*/
	AdventureGame.getScaleToFit = function(boxSize, object) {
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
	};
	
	/**
	* Get the X coordinate in pixels for a point on the stage.
	* Percent and pixel values are accepted (while a pixel value will return the same value it allows them to be treated together)
	* function getXCoord
	* @param x string distance to get coordinate from left. The distance may be in pixels (end in 'px') or percentage (end in '%')
	* @return integer indicating the the distance in pixels from the left of the screen for this coordinate
	* @memberof AdventureGame
	*/
	AdventureGame.getXCoord = function(x) {
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
	};
	
	/**
	* Get the Y coordinate in pixels for a point on the stage.
	* Percent and pixel values are accepted (while a pixel value will return the same value it allows them to be treated together)
	* function getYCoord
	* @param x string distance to get coordinate from top of the screen. The distance may be in pixels (end in 'px') or percentage (end in '%')
	* @return integer indicating the the distance in pixels from the top of the screen for this coordinate
	* @memberof AdventureGame
	*/
	AdventureGame.getYCoord = function(y) {
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
	};
	
	/**
	* Set a game flag to the given value
	* function setGameFlag
	* @param key String flagname to set value for
	* @param value Value to store for this flag
	* @memberof AdventureGame
	*/
	AdventureGame.setGameFlag = function(key, value) {
		var 
			saveGame = AdventureGame.saveGame,
			db = AdventureGame.db;
		saveGame.flags[key] = value;
		db.put(saveGame, function(err, response) {
			if(err) {
				console.error("Error updating game flags");
				console.log(err);
				console.log(response);
			}
		});	
	};
	
	/**
	* Get the value for a given gameflag
	* function getGameFlag
	* @param key String flagname to get value for
	* @return Value stored in this flag
	* @memberof AdventureGame
	*/
	AdventureGame.getGameFlag = function(key) {
		return AdventureGame.saveGame.flags[key];
	};
	
}());
