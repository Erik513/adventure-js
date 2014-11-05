/*jslint white: true, browser: true, plusplus: true, nomen: true */
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
