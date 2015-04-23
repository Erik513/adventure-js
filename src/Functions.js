/*jslint white: true, browser: true, plusplus: true, nomen: true */
/*global console, Promise, createjs, $, AdventureGame */

this.AdventureGame = this.AdventureGame || {};

/**
* Base functions to load a game.
* Provides functions to load and store a game and defines base functions for initial setup, gameloop and exit
*/
(function() {
	"use strict";
	
	var 
		negativeRegex = /\-\d*/,
		percentRegex = /([0-9\.]+\.?\d*)%/,
		pixelRegex = /([0-9\.]+)px/;

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
	* Due to problems with phonegap some assets are reported as loaded but image dimensions are not yet available
	* This promise waits until the image is loaded or the timeout is reached before reporting success or failure
	* @param image The image to wait for width and height values for
	* @param timeout The number of miliseconds to wait until treating this as a failed loading
	* @return Promise
	**/
	AdventureGame.waitUntilLoaded = function(image, timeout) {
		console.log("Loading image "+image.src);
		timeout = timeout || 500;
		return new Promise(function(resolve, reject) {
			var 
				defaultSleepTime = 200,
				waitRecurse;

			// Recursive function to handle timeout callbacks. Created as a variable to ensure access to function variables and resolve() and reject()
			waitRecurse = function(remaining) {
				var sleepTime = remaining < defaultSleepTime ? remaining : defaultSleepTime;
				if(image.width && image.height) {
					resolve();
				} else {
					setTimeout(function() {
						remaining = remaining - sleepTime;
						console.log("Waiting "+remaining+" for "+image.src+" to load");
						if(remaining === 0) {
							reject(new Error("Image "+image.src+" failed to load in given time"));
						} else {
							waitRecurse(remaining);
						}
					}, sleepTime);
				}
			};
			
			waitRecurse(timeout);
		});
	};
	
	
	
	/**
	* Scale image to fit in a box by either pixel or percent values 
	* function getScaleToFit
	* @param boxSize string size of the (sqare) box to scale this image to fit. The size may be in pixels (end in 'px') or percentage (end in '%')
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
		}
		// In case getBounds() fails (as seems to happen a bit in phonegap)
		if(!bounds) {
			console.error("Getbounds returned a null or undefined response. Setting width and height manually");
			bounds = {width: object.width || object.baseWidth , height: object.height || object.baseHeight};
		}
		if (matchesPercent) {
			if(!AdventureGame.stage) {
				throw "Unable to size item by percent as stage is not avilable";
			}
			canvas = AdventureGame.stage.canvas;
			scaleX = (canvas.height * (parseFloat(matchesPercent[1]) / 100) ) / bounds.height;
			scaleY = (canvas.width * (parseFloat(matchesPercent[1]) / 100) ) / bounds.width;
		} else if (matchesPixels) {
			scaleX = (parseFloat(matchesPercent[1]) / bounds.width);
			scaleY = (parseFloat(matchesPercent[1]) / bounds.height);
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
			isNegative = x.match(negativeRegex),
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
		// We this is a negative value we should probably make it one
		if(isNegative) {
			pxValue = pxValue * -1;
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
			isNegative = y.match(negativeRegex),
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
		// We this is a negative value we should probably make it one
		if(isNegative) {
			pxValue = pxValue * -1;
		}
		return pxValue;
	};
	
	/**
	* Save the game file to the database (and hopefully synch to couchdb)
	* @function saveGameToDB
	* @return Save game document
	* @memberof AdventureGame
	*/
	AdventureGame.saveGameToDB = function() {
		var 
			db = AdventureGame.db,
			doc = AdventureGame.saveGame;
		return db.get(doc._id).then(function (origDoc) {
			doc._rev = origDoc._rev;
			return db.put(doc);
		}).catch(function (err) {
			if (err.status === 409) {
				return AdventureGame.saveGameToDB();
			} else { // new doc
				return db.put(doc);
			}
		});
	};
	
	/**
	* Set a game flag to the given value
	* @function setGameFlag
	* @param key String flagname to set value for
	* @param value Value to store for this flag
	* @memberof AdventureGame
	*/
	AdventureGame.setGameFlag = function(key, value) {
		var 
			saveGame = AdventureGame.saveGame;
		saveGame.flags[key] = value;
		console.log(saveGame);
		AdventureGame.saveGameToDB(saveGame);
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
	
	/**
	* Get all game flags set for this game
	* function getAllGameFlags
	* @return Array of all flag key/value pairs
	* @memberof AdventureGame
	*/
	AdventureGame.getAllGameFlags = function() {
		return AdventureGame.saveGame.flags;
	};
	
	
	/**
	* Add points to the players game record and save
	* @function addPoints
	* @param points integer the number of points to add
	* @memberof AdventureGame
	*/
	AdventureGame.addPoints = function(points) {
		var 
			saveGame = AdventureGame.saveGame;
		saveGame.points = saveGame.points + points;
		console.log(saveGame);
		AdventureGame.saveGameToDB(saveGame);
	};


}());
