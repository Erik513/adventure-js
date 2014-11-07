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
	 * Setup dialog object according to the supplied options. Generally called by the constructor
	* ## The following options are accepted:
	* * div HTMLDom object to show instead of dialog
	* * image URI Path to image to be shown in this dialog
	* * question string Flag indicating if a form asking the player a question should be shown. Valid values are 'radio' and 'text'
	* * answers Object[] Array of valid answers for this question. Each object should have a value and text set
	* * domContent HTMLDom Additional DOM content to be shown in this dialog
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
			this.div.className = 'gamedialog';
			
			if(!this.disableClose) {
				closeIcon = document.createElement('i');
				closeIcon.className = 'fa fa-close fa-2x';
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
			
			// Add extra DOM content if supplied
			if(options.domContent) {
				contentDiv.appendChild(options.domContent);
			}
			this.div.appendChild(contentDiv);
		}
		this.div.style.width = (60 / 100 * stage.canvas.width)+'px';
		this.div.style.left = (20 / 100 * stage.canvas.width)+'px';
		this.div.style.top = (20 / 100 * stage.canvas.height)+'px';
		this.div.style.maxHeight = (40/100 * stage.canvas.height)+'px';
	};

	/**
	 * Display this dialog
	 * @memberof AdventureGame.Dialog
	 * @return void
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
	};
	/**
	* @memberof AdventureGame.Dialog
	*/
	p.close = function() {
		AdventureGame.stage.removeChild(this.domElem);
		document.body.removeChild(this.div);
		if(this.onClose) {
			this.onClose();
		}
	};

	/**
	 * If this dialog has a question evaluate if the selected answer is correct
	 * Should be fired in the click event of the submit button in the question form
	 * @memberof AdventureGame.Dialog
	 * @return true if the answer is correct else false
	 */
	p.evaluateAnswer = function() {
		this.close();
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
		if(correct) {
			this.correctCallback();
		} else {
			this.incorrectCallback();
		}
		return correct;
	};

	/**
	 * Default callback function if the correct answer is selected.
	 * This may be overwritten by the constructor/initialize with the correctCallback configuration option
	 * @memberof AdventureGame.Dialog
	 * @return void
	 */	
	p.correctCallback = function() {
		var correctDialog = new Dialog({
			image: this.image,
			text:'Correct'
		});
		correctDialog.show();
	};

	/**
	 * Default callback function if the incorrect answer is selected.
	 * This may be overwritten by the constructor/initialize with the incorrectCallback configuration option
	 * @memberof AdventureGame.Dialog
	 * @return void
	 */
	p.incorrectCallback = function() {
		var incorrectCallback = new Dialog({
			image: this.image,
			text:'Sorry, that\'s incorrect'
		});
		incorrectCallback.show();		
	};
	
	AdventureGame.Dialog = Dialog;
}());