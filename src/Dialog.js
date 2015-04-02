/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* Dialog is a model dialog that displays over the game convas displaying a message to the user.
*
* The constructor takes an array accepting the following configuration options
* text: The text content to display in the dialog
* image: An optional image that will be displayed on the left of the dialog
* question: If this dialog should present a question the type of question should be set. Accepted values are 'radio' and 'text'
* answers: An array of valid answers to this question
* domContent: A DOM object to be displayed in this dialog. It will be shown after the text if both are set
* disableClose: Indicates the close button should not be displayed. It is important the dialog may be closed through another means. Either as a question or adding a DOM element that calls close on this dialog
*/
(function() {
	"use strict";

	/**
	* Dialog shown to user
	* @class AdventureGame.Dialog
	*/
	var Dialog = function(options) {
		this.initialize(options);
	};
	var p = Dialog.prototype;
	
	// Private static properties
	var activeDialogs = [];
	
	// Public Properties
	
	/**
	 * Div object for the dialog
	 * @name div
	 * @type HTMLObject
	 * @memberof AdventureGame.Dialog
	 **/
	p.div = null;
	
	/**
	 * Callback function when the dialog is closed
	 * @name onClose
	 * @type function
	 * @memberof AdventureGame.Dialog
	 **/
	p.onClose = null;
	
	/**
	 * Flag indicating if this is a question and if so what type of input (radio or text)
	 * @name questionType
	 * @type function
	 * @memberof AdventureGame.Dialog
	 **/
	p.questionType = null;

	/**
	 * Array of acceptable answer values
	 * @name answers
	 * @type String[]
	 * @memberof AdventureGame.Dialog
	 **/
	p.answers = null;
	
	/**
	 * CSS class to set on dialog div
	 * @name dialogClass
	 * @type String
	 * @memberof AdventureGame.Dialog
	 **/
	p.dialogClass = 'gamedialog';
	
	/**
	 * The distance in percent to position the dialog from top 
	 * @name distanceFromTop
	 * @type int
	 * @memberof AdventureGame.Dialog
	 **/
	p.distanceFromTop = 20;

	/**
	 * The distance in percent to position the dialog from left
	 * @name distanceFromLeft
	 * @type int
	 * @memberof AdventureGame.Dialog
	 **/
	p.distanceFromLeft = 20;

	/**
	 * The width in percent to draw the dialog
	 * @name width
	 * @type int
	 * @memberof AdventureGame.Dialog
	 **/
	p.width = 60;

	/**
	 * The maximum permitted height in percent (before scrolling) allowed for dialog
	 * @name maxHeight
	 * @type int
	 * @memberof AdventureGame.Dialog
	 **/
	p.maxHeight = 40;
	
	/**
	 * Flag indicating if the close option for the dialog should be disabled
	 * @name disableClose
	 * @type boolean
	 * @memberof AdventureGame.Dialog
	 **/
	p.disableClose = false;
	
	p.closeIconClass = 'fa fa-close fa-2x';
	
	/**
	 * Setup dialog object according to the supplied options. Generally called by the constructor
	* ## The following options are accepted:
	* * div HTMLDom object to show instead of dialog
	* * image URI Path to image to be shown in this dialog
	* * question string Flag indicating if a form asking the player a question should be shown. Valid values are 'radio' and 'text'
	* * answers Object[] Array of valid answers for this question. Each object should have a value and text set. Valid answers should have the correct property evalute to true
	* * onClose function Callback function when dialog is closed
	* * dialogClass String CSS class(es) to add to the top dialog container (default 'gameDialog')
	* * top int Distance to show dialog from the top of screen in percent
	* * domContent HTMLDom Additional DOM content to be shown in this dialog
	* * distanceFromTop int the distance in percent to position the dialog from top (default 20)
	* * distanceFromLeft int the distance in percent to position the dialog from left (default 20)
	* * width int the width in percent to draw the dialog (default 60)
	* * maxHeight the maximum permitted height in percent (before scrolling) allowed for dialog (default 40)
	* @function initialize
	* @memberof AdventureGame.Dialog
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		console.log(options);
		var 
			imageDiv, 
			img, 
			contentDiv, 
			closeIcon,
			// Variables for question dialogs
			questionForm,
			answerIndex,
			inputDiv,
			inputLabel,
			inputElem,
			inputID,
			// Set stage as it is used by this function
			stage = AdventureGame.stage;
			
		if(options.div) {
			this.div = options.div.cloneNode(true);	// In case this is already in the div clone it so we don't accidently delete it later
		} else {
			this.div = document.createElement('div');
			
			// Set class
			if(options.dialogClass) {
				this.dialogClass = options.dialogClass;
			}
			this.div.className = this.dialogClass;
			
			// Setup close link
			if(options.disableClose) {
				this.disableClose = options.disableClose;
			}
			if(options.closeIconClass) {
				this.closeIconClass = options.closeIconClass;
			}
			if(!this.disableClose) {
				closeIcon = document.createElement('i');
				closeIcon.className = 'dialogClose '+this.closeIconClass;
				$(closeIcon).on('click', this.close.bind(this));
				this.div.appendChild(closeIcon);
			}
			
			// Add image
			if(options.image) {
				imageDiv = document.createElement('div');
				img = document.createElement('img');
				imageDiv.className = 'dialogimage';
				img.src = options.image;
				imageDiv.appendChild(img);
				this.div.appendChild(imageDiv);
			}
			
			// Add content
			contentDiv = document.createElement('div');
			contentDiv.className = 'dialogcontent';
			contentDiv.innerHTML = options.text;
			
			// If this is a multiple choice question create form
			if(options.question === 'radio' && options.answers) {
				this.questionType = 'radio';
				this.answers = [];
				questionForm = document.createElement('form');
				inputID = 'radio'+Date.now();
				for(answerIndex = 0; answerIndex < options.answers.length; answerIndex++) {
					inputDiv = document.createElement('div');
					inputDiv.className = 'radio';
					inputLabel = document.createElement('label');
					inputElem = document.createElement('input');
					inputElem.type = 'radio';
					inputElem.name = inputID;
					inputElem.className = 'inputElem';
					inputElem.value = options.answers[answerIndex].value;
					inputLabel.appendChild(inputElem);
					inputLabel.appendChild(document.createTextNode(options.answers[answerIndex].text));
					inputDiv.appendChild(inputLabel);
					questionForm.appendChild(inputDiv);
					if(options.answers[answerIndex].correct === true) {
						this.answers.push(options.answers[answerIndex].value.toString());
					}
				}
				inputElem = document.createElement('input');
				inputElem.type = 'button';
				inputElem.value = 'OK';
				inputElem.className = 'btn';
				$(inputElem).on('click', this.evaluateAnswer.bind(this));
				questionForm.appendChild(inputElem);
				
				contentDiv.appendChild(questionForm);
			}
			
			if(options.onClose) {
				this.onClose = options.onClose;
			}
			
			// Add extra DOM content if supplied
			if(options.domContent) {
				contentDiv.appendChild(options.domContent);
			}
			this.div.appendChild(contentDiv);
		}
		
		// Set positioning and dimensions
		if(options.width) {
			this.width = options.width;
		}
		if(options.distanceFromLeft !== undefined) {
			this.distanceFromLeft = options.distanceFromLeft;
		}
		if(options.distanceFromTop !== undefined) {
			this.distanceFromTop = options.distanceFromTop;
		}
		if(options.maxHeight) {
			this.maxHeight = options.maxHeight;
		}
		/*
		this.div.style.width = AdventureGame.getXCoord(this.width);
		this.div.style.left = AdventureGame.getXCoord(this.left);
		this.div.style.top = AdventureGame.getYCoord(this.top);
		this.div.style.maxHeight = AdventureGame.getYCoord(this.maxHeight);
		*/
		
		this.div.style.width = (this.width / 100 * stage.canvas.width)+'px';
		this.div.style.left = (this.distanceFromLeft / 100 * stage.canvas.width)+'px';
		this.div.style.top = (this.distanceFromTop / 100 * stage.canvas.height)+'px';
		this.div.style.maxHeight = (this.maxHeight / 100 * stage.canvas.height)+'px';
	};

	/**
	 * Display this dialog
	 * @memberof AdventureGame.Dialog
	 * @return void
	 * TODO: Remove JQuery references as the library should not require jQuery
	 **/
	p.show = function() {
		var 
			stage = AdventureGame.stage,
			divHeight;
		document.body.appendChild(this.div);

		// Having a scrollable element inside an max-height one doesn't work so use JS to find height for the children
		divHeight = $(this.div).height();
		$(this.div).find('.dialogcontent').height(divHeight);
		
		this.domElem = new createjs.DOMElement(this.div);
		stage.addChild(this.domElem);
		
		activeDialogs.push(this);
	};
	/**
	* @memberof AdventureGame.Dialog
	*/
	p.close = function(evt) {
		console.log("Closing dialog");
		AdventureGame.stage.removeChild(this.domElem);
		if(this.div.parentNode !== null) {
			document.body.removeChild(this.div);
		}
		var dialogIndex = activeDialogs.indexOf(this);
		if(dialogIndex > -1) {
			activeDialogs.splice(dialogIndex, 1);
		}
		if(this.onClose) {
			this.onClose({
				type: evt.type,
				answer: evt.answer || null,
				correct: evt.correct || null,
				dialog: this
			});
		}
	};
	
	p.closeAll = function(evt) {
		console.log('Closing all dialogs');
		evt = evt || {type: 'forceclose'};
		activeDialogs.forEach(function(dialog) {
			dialog.close(evt);
		});
	};

	/**
	 * If this dialog has a question evaluate if the selected answer is correct
	 * Should be fired in the click event of the submit button in the question form
	 * @memberof AdventureGame.Dialog
	 * @return true if the answer is correct else false
	 */
	p.evaluateAnswer = function() {
		var 
			correct = false,
			inputs,
			inputIndex;
		if(this.questionType === 'radio') {
			inputs = this.div.getElementsByClassName('inputElem');
			for(inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
				if($(inputs[inputIndex]).is(':checked')) {
					console.log(inputs[inputIndex]);
					console.log(this.answers);
					console.log($.inArray(inputs[inputIndex].value, this.answers));
					if($.inArray(inputs[inputIndex].value, this.answers)>=0) {
						console.log("Correct");
						correct = true;
					}
					break;
				}
			}
		}
		this.close({
			type: 'answered',
			answer: inputs[inputIndex].value,
			correct: correct
		});
		
		return correct;
	};


	/**
	 * Default callback function when the dialog is closed.
	 * If the dialog was a question shows a new dialog with the results
	 * This may be overwritten by the constructor/initialize with the correctCallback configuration option
	 * @memberof AdventureGame.Dialog
	 * @return void
	 */	
	p.onClose = function(evt) {
		if(evt.correct) {
			(new Dialog({
				image: this.image,
				text:'Correct'
			})).show();
		} else if(evt.correct === false) {
			(new Dialog({
				image: this.image,
				text:'Sorry, that\'s incorrect'
			})).show();
		}
	};

	
	AdventureGame.Dialog = Dialog;
}());