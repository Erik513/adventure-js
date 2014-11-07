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

	/**
	* Container object. Can hold many other objects
	* @class AdventureGame.Container
	*/
	var Container = function(options) {
		this.initialize(options);
	};
	var p = Container.prototype;
	
	/**
	 * The unique name for this container
	 * @name name
	 * @type string
	 * @memberof AdventureGame.Container
	 **/
	p.name = null;
	
	/**
	 * The number of item slots in this container
	 * @name slots
	 * @type int
	 * @memberof AdventureGame.Container
	 **/
	p.slots = 10;
	
	/**
	 * The items currently held in this container
	 * @name items
	 * @type AdventureGame.Item[]
	 * @memberof AdventureGame.Container
	 **/
	p.items = [];
		
	/**
	* Setup function called by constructor
	* ## The following options are accepted:
	* * name string The container name (required)
	* * numSlows int The number of item slots in this container (Default: 10)
	* * items AdventureGame.Item[] The items currently held in this container
	* @function initialize
	* @memberof AdventureGame.Container
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		if(!options.name) {
			throw "No name set for container";
		}
		this.name = options.name;
		if(options.numSlots) {
			this.slots = options.numSlots;
		}
		if(options.items) {
			this.items = options.items;
		}
		// If there are more items than slots resize the container to fit them all
		if(this.items.length > this.slots) {
			this.slots = options.items.length;
		}
	};

	/**
	* Add an item to the container
	* @function addItem
	* @memberof AdventureGame.Container
	* @param item AdventureGame.Item The item to add to this container
	* @return void
	*/
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
					item.slot = i;
					this.items[i] = item;
					return i;
				}
			}
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
	* Remove the given item from this array.
	* The item will only be removed if it correctly references its slot in the array.
	* @function removeItem
	* @memberof AdventureGame.Container
	* @param item AdventureGame.Item The item to remove from this container
	* @return void
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
	
	
	/**
	* Show dialog for open container.
	* Load container from container array and create a div mirroring the items in there. 
	* @function open
	* @memberof AdventureGame.Container
	* @return void
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
	
	/**
	* Check if an item exists with the given ID in this container
	* @function hasItemWithId
	* @memberof AdventureGame.Container
	* @param id string The id of the item we are trying to match
	* @return true if this item exists in the container. Otherwise false
	**/
	p.hasItemWithId = function(id) {
		var 
			returnVal = false,
			itemIndex;
		for(itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
			if(this.items[itemIndex].id === id) {
				returnVal = true;
				break;
			}
		}
		return returnVal;
	};
	
	/**
	* Create click handler for an item
	* @function setClickHandler
	* @memberof AdventureGame.Container
	* @return function Click handler for this tiem
	*/
	p.setClickHandler = function() {
		return function(event) {
			event.data.item.activate();
		};
	};
	
	AdventureGame.Container = Container;
}());
	