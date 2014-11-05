/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
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
	