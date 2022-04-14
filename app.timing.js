Subtitler = window.Subtitler || { };
Subtitler.TimingPopup = Subtitler.TimingPopup || { };

Subtitler.TimingPopup.popup = document.querySelector('.shift-timing-popup');


Subtitler.TimingPopup.Inputs = { };
Subtitler.TimingPopup.Buttons = { };

Subtitler.TimingPopup.Buttons.apply = Subtitler.TimingPopup.popup.querySelector('.shift-timing-popup-apply');
Subtitler.TimingPopup.Buttons.close = Subtitler.TimingPopup.popup.querySelector('.shift-timing-popup-close');


Subtitler.TimingPopup.Inputs.shiftAmount = Subtitler.TimingPopup.popup.querySelector('.webapp-shift-timing-time');
Subtitler.TimingPopup.Inputs.shiftDirection = Subtitler.TimingPopup.popup.querySelector('.webapp-shift-timing-shift-direction');
Subtitler.TimingPopup.Inputs.linesAffected = Subtitler.TimingPopup.popup.querySelector('.webapp-shift-timing-lines-affected');
Subtitler.TimingPopup.Inputs.propertiesAffected = Subtitler.TimingPopup.popup.querySelector('.webapp-shift-timing-times-shifted');


Subtitler.TimingPopup.hide = function( ) {
	Subtitler.TimingPopup.popup.classList.remove('visible');
}

Subtitler.TimingPopup.show = function( ) {
	Subtitler.TimingPopup.popup.classList.add('visible');
}

Subtitler.TimingPopup.Buttons.close.addEventListener('click', function() {
	Subtitler.TimingPopup.hide();
	if(Subtitler.TimingPopup.closeCallback) {
		Subtitler.TimingPopup.closeCallback(null);
	}
	Subtitler.TimingPopup.closeCallback = null;
});

Subtitler.TimingPopup.Buttons.apply.addEventListener('click', function() {
	var successful = Subtitler.TimingPopup.apply();
	if(successful) {
		Subtitler.TimingPopup.hide();
		if(Subtitler.TimingPopup.closeCallback) {
			Subtitler.TimingPopup.closeCallback(successful);
		}
		Subtitler.TimingPopup.closeCallback = null;
	}
});


Subtitler.TimingPopup.apply = function( ) {
	
	
	var shiftAmount = Subtitler.TimingPopup.Inputs.shiftAmount.getAttribute('data-value') * 1;
	var shiftDirection = null;
	var linesAffected = null;
	var affectedProperties = null;
	
	var shiftDirectionRadios = Subtitler.TimingPopup.Inputs.shiftDirection.querySelectorAll('input[type=radio]');
	for(var r=0; r<shiftDirectionRadios.length; r++) {
		if(shiftDirectionRadios[r].checked) {
			shiftDirection = shiftDirectionRadios[r].value;
		}
	}
	
	var linesAffectedRadios = Subtitler.TimingPopup.Inputs.linesAffected.querySelectorAll('input[type=radio]');
	for(var r=0; r<linesAffectedRadios.length; r++) {
		if(linesAffectedRadios[r].checked) {
			linesAffected = linesAffectedRadios[r].value;
		}
	}
	
	var propertiesAffectedRadios = Subtitler.TimingPopup.Inputs.propertiesAffected.querySelectorAll('input[type=radio]');
	for(var r=0; r<propertiesAffectedRadios.length; r++) {
		if(propertiesAffectedRadios[r].checked) {
			affectedProperties = propertiesAffectedRadios[r].value;
		}
	}
	
	var linesToShift = [ ];
	
	var reachedSelectedLine = false;
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(linesAffected == 'all-lines') {
			linesToShift.push(line);
		}
		else if(linesAffected == 'selection-onwards' && reachedSelectedLine) {
			linesToShift.push(line);
		}
		else if((linesAffected == 'selection-only' || linesAffected == 'selection-onwards') && Subtitler.Lines.isSelected(line)) {
			linesToShift.push(line);
			reachedSelectedLine = true;
		}
	}
	
	if(shiftDirection == 'backwards') {
		shiftAmount = 0 - shiftAmount;
	}
	
	for(var n=0; n<linesToShift.length; n++) {
		var line = linesToShift[n];
		if(affectedProperties == 'start-times-only' || affectedProperties == 'start-and-end-times') {
			line.start = Math.max(0, line.start + shiftAmount);
		}
		if(affectedProperties == 'end-times-only' || affectedProperties == 'start-and-end-times') {
			line.end = Math.max(0, line.end + shiftAmount);
		}
		line.duration = line.end - line.start;
	}
	
	// update html to reflect new state of line object
	Subtitler.Lines.listElement.innerHTML = Subtitler.Lines.renderLines();
	Subtitler.Lines.selectLine(Subtitler.LineEditor.lineId);
	Subtitler.Video.__updateVisibleSubtitles(true);
	return true;
}