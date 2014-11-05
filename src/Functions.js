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
