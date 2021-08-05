
Subtitler = window.Subtitler || { };
Subtitler.Info = Subtitler.Info || { };

Subtitler.Info.Defaults = {
	playResX: 0,
	playResY: 0,
	delay: 0,
	wrapStyle: 0,
	title: '',
	scaledBorderAndShadow: true,
	matrix: 'None',
	filename: Subtitler.Translations.get('initialFileName')
};

Subtitler.Info.showPopup = function() {
	
	
	document.querySelector('.webapp-info-filename').value = Subtitler.Info.filename || '';
	document.querySelector('.webapp-info-title').value = Subtitler.Info.title || '';
	
	document.querySelector('.webapp-info-credits-original-script').value = Subtitler.Info.originalScript || '';
	document.querySelector('.webapp-info-credits-translation').value = Subtitler.Info.translation || '';
	document.querySelector('.webapp-info-credits-editing').value = Subtitler.Info.editing || '';
	document.querySelector('.webapp-info-credits-timing').value = Subtitler.Info.timing || '';
	
	document.querySelector('.webapp-info-updated-by').value = Subtitler.Info.updatedBy || '';
	document.querySelector('.webapp-info-update-details').value = Subtitler.Info.updateDetails || '';
	
	document.querySelector('.webapp-info-delay').value = (Subtitler.Info.delay || 0) + '';
	document.querySelector('.webapp-info-delay').setAttribute('data-value', (Subtitler.Info.delay || 0)+'');
	
	document.querySelector('.webapp-info-resolution-x').value = (Subtitler.Info.playResX || 0) + '';
	document.querySelector('.webapp-info-resolution-x').setAttribute('data-value', (Subtitler.Info.playResX || 0)+'');
	document.querySelector('.webapp-info-resolution-y').value = (Subtitler.Info.playResY || 0) + '';
	document.querySelector('.webapp-info-resolution-y').setAttribute('data-value', (Subtitler.Info.playResY || 0)+'');
	document.querySelector('.webapp-info-ycbcr-matrix').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Info.matrix || 'None' }}));
	
	document.querySelector('.webapp-info-wrap-style-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: (Subtitler.Info.wrapStyle || 0) + '' }}));
	document.querySelector('.webapp-info-scaled-border-and-shadow').checked = Subtitler.Info.scaledBorderAndShadow;
	
	document.querySelector('.info-popup').classList.add('visible');
	document.querySelector('.info-popup .popup-content').scrollTop = 0;
}

Subtitler.Info.hidePopup = function() {
	document.querySelector('.info-popup').classList.remove('visible');
}

document.querySelector('.webapp-info-close-without-saving').addEventListener('click', function() {
	Subtitler.Info.hidePopup();
});

document.querySelector('.webapp-info-save-and-close').addEventListener('click', function() {
		
	Subtitler.Info.filename = document.querySelector('.webapp-info-filename').value;
	Subtitler.Info.title = document.querySelector('.webapp-info-title').value;
	
	Subtitler.Info.originalScript = document.querySelector('.webapp-info-credits-original-script').value;
	Subtitler.Info.translation = document.querySelector('.webapp-info-credits-translation').value;
	Subtitler.Info.editing = document.querySelector('.webapp-info-credits-editing').value;
	Subtitler.Info.timing = document.querySelector('.webapp-info-credits-timing').value;
	
	Subtitler.Info.updatedBy = document.querySelector('.webapp-info-updated-by').value;
	Subtitler.Info.updateDetails = document.querySelector('.webapp-info-update-details').value;
	
	Subtitler.Info.delay = document.querySelector('.webapp-info-delay').value * 1;
	
	Subtitler.Info.playResX = document.querySelector('.webapp-info-resolution-x').value * 1;
	Subtitler.Info.playResY = document.querySelector('.webapp-info-resolution-y').value * 1;
	Subtitler.Info.matrix = document.querySelector('.webapp-info-ycbcr-matrix').value;
	
	Subtitler.Info.wrapStyle = document.querySelector('.webapp-info-wrap-style-dropdown').getAttribute('data-value') * 1;
	Subtitler.Info.scaledBorderAndShadow = document.querySelector('.webapp-info-scaled-border-and-shadow').checked;
	
	Subtitler.Info.hidePopup();
	
	document.querySelector('.subtitle-file-name').textContent = Subtitler.Info.filename;
	Subtitler.Video.__updateVisibleSubtitles(true);
});

Subtitler.Info.reset = function() {
	for(var prop in Subtitler.Info) {
		if(prop != 'Defaults' && Subtitler.Info.hasOwnProperty(prop) && typeof Subtitler.Info[prop] != 'function') {
			delete Subtitler.Info[prop];
		}
	}
	for(var prop in Subtitler.Info.Defaults) {
		if(Subtitler.Info.Defaults.hasOwnProperty(prop)) {
			Subtitler.Info[prop] = Subtitler.Info.Defaults[prop];
		}
	}
}
Subtitler.Info.reset();

document.querySelector('.subtitle-file-name').textContent = Subtitler.Info.filename || '';
