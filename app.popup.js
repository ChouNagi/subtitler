Subtitler = window.Subtitler || { };
Subtitler.Popup = Subtitler.Popup || { };

Subtitler.Popup.defaultButtonLabel = 'OK';
Subtitler.Popup.defaultButtonClassName = 'popup-button';
Subtitler.Popup.defaultButtonCallback = function() { };


/**
	Hides any open popups
*/
Subtitler.Popup.hide = function( ) {
	var openPopups = document.querySelectorAll('.popup-overlay');
	for(var p=0; p<openPopups.length; p++) {
		openPopups[p].parentNode.removeChild(openPopups[p]);
	}
}

/**
	Creates a Popup for the user to interact with
	
	@param title - title in the popup header
	@param message - message in the popup body (html)
	@param buttons - array of buttons, if ommitted a simple 'OK' button that closes the popup will be shown
	
	button: {
		label,			(text to display in the button. required)
		className,		(class to assign the button. optional. defaults to 'popup-button')
		callback		(action to take when button is clicked, return false to prevent the popup closing. optional. defaults to nop)
	}
*/
Subtitler.Popup.show = function( title, message, buttons ) {
	if(buttons == null || !(buttons instanceof Array)) {
		buttons = [{ 'label': Subtitler.Popup.defaultButtonLabel }];
	}
	
	var copiedButtons = [ ];
	for(var b=0; b<buttons.length; b++) {
		var copy = {
			label: buttons[b].label
		};
		copy.className = (typeof buttons[b].className == 'string') ? buttons[b].className : Subtitler.Popup.defaultButtonClassName;
		copy.callback = (typeof buttons[b].callback == 'function') ? buttons[b].callback : Subtitler.Popup.defaultButtonCallback;
		copiedButtons[b] = copy;
	}
	
	var popupOverlay = document.createElement('DIV');
	popupOverlay.className = 'popup-overlay';
	document.body.appendChild(popupOverlay);
	
	var popupOverlayFade = document.createElement('DIV');
	popupOverlayFade.className = 'popup-overlay-fade';
	popupOverlay.appendChild(popupOverlayFade);
	
	var popupWrapper = document.createElement('DIV');
	popupWrapper.className = 'popup-wrapper';
	popupOverlay.appendChild(popupWrapper);
	
	var popup = document.createElement('DIV');
	popup.className = 'popup';
	popupWrapper.appendChild(popup);
	
	if(title) {
		var popupHeader = document.createElement('DIV');
		popupHeader.className = 'popup-header';
		popup.appendChild(popupHeader);
		var popupTitle = document.createElement('DIV');
		popupTitle.className = 'popup-title';
		popupTitle.textContent = title;
		popupHeader.appendChild(popupTitle);
	}
	var popupBody = document.createElement('DIV');
	popupBody.className = 'popup-body';
	popup.appendChild(popupBody);
	var popupContent = document.createElement('DIV');
	popupContent.className = 'popup-content';
	popupBody.appendChild(popupContent);
	var popupText = document.createElement('DIV');
	popupText.className = 'popup-text';
	popupText.textContent = message || '';
	if(message.indexOf('\n') != -1) {
		popupText.innerHTML = popupText.innerHTML.replace(/\n/g, '<br/>');
	}
	popupContent.appendChild(popupText);
	
	if(copiedButtons.length > 0) {
		var popupButtons = document.createElement('DIV');
		popupButtons.className = 'popup-buttons';
		popupBody.appendChild(popupButtons);
		for(var b=0; b<copiedButtons.length; b++) {
			(function(button) {
				var buttonElement = document.createElement('DIV');
				buttonElement.textContent = button.label;
				buttonElement.className = button.className;
				buttonElement.addEventListener('click', function() {
					try {
						var result = button.callback();
						if(result !== false) {
							Subtitler.Popup.hide();
						}
					}
					catch(e) {
						Subtitler.Popup.hide();
						throw e;
					}
				});
				popupButtons.appendChild(buttonElement);
			})(copiedButtons[b]);
		}
	}
}