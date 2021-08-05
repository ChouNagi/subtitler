
Subtitler = window.Subtitler || { };
Subtitler.Settings = Subtitler.Settings || { };

Subtitler.app = Subtitler.app || document.querySelector('.webapp');

Subtitler.Settings.Defaults = {
	language: 'browser',
	leadIn: 200,
	leadOut: 300,
	videoPane: 'show',
	onVideoResMismatch: 'popup',
	onVideoAudioConflict: 'popup',
	onRecoverableImportError: 'popup',
	onProbableActorError: 'popup',
	syntaxHighlighting: true,
	captionsMode: false,
	lineComparison: 'disabled',
	showActorColumn: 'if-present',
	stylePreviewBackgroundColour: '#8ac',
	stylePreviewText: 'Subtitling\\N123 \u6708\u8A9E',
	audioVisualiser: 'enabled',
};

Subtitler.Settings.save = function() {
	var settingsToSave = { };
	for(var prop in Subtitler.Settings) {
		if(Subtitler.Settings.hasOwnProperty(prop) && prop != 'Defaults' && (typeof Subtitler.Settings[prop] != 'function')) {
			settingsToSave[prop] = Subtitler.Settings[prop];
		}
	}
	localStorage['subtitlerSettings'] = JSON.stringify(settingsToSave);
}

Subtitler.Settings.updateAppAttributes = function() {
	var attributeNames = Subtitler.app.getAttributeNames();
	for(var a=0; a<attributeNames.length; a++) {
		if(attributeNames[a].startsWith('data-setting-')) {
			Subtitler.app.removeAttribute(attributeNames[a]);
		}
	}
	for(var prop in Subtitler.Settings) {
		if(Subtitler.Settings.hasOwnProperty(prop) && prop != 'Defaults' && (typeof Subtitler.Settings[prop] != 'function')) {
			Subtitler.app.setAttribute('data-setting-' + prop, Subtitler.Settings[prop]);
		}
	}
}

Subtitler.Settings.reset = function() {
	for(var prop in Subtitler.Settings) {
		if(Subtitler.Settings.hasOwnProperty(prop) && prop != 'Defaults' && (typeof Subtitler.Settings[prop] != 'function')) {
			delete Subtitler.Settings[prop];
		}
	}
	for(var prop in Subtitler.Settings.Defaults) {
		if(Subtitler.Settings.Defaults.hasOwnProperty(prop)) {
			Subtitler.Settings[prop] = Subtitler.Settings.Defaults[prop];
		}
	}
	Subtitler.Settings.updateAppAttributes();
}

Subtitler.Settings.load = function() {
	var savedSettings = null;
	try {
		savedSettings = JSON.parse(localStorage['subtitlerSettings'] || 'null');
	}
	catch(e) {
		// pass
	}
	Subtitler.Settings.reset();
	if(savedSettings) {
		for(var prop in Subtitler.Settings) {
			if(Subtitler.Settings.hasOwnProperty(prop) && prop != 'Defaults' && (typeof Subtitler.Settings[prop] != 'function')) {
				delete Subtitler.Settings[prop];
			}
		}
		for(var prop in savedSettings) {
			if(savedSettings.hasOwnProperty(prop)) {
				Subtitler.Settings[prop] = savedSettings[prop];
			}
		}
	}
	Subtitler.Settings.updateAppAttributes();
}

Subtitler.Settings.load();

document.querySelector('.webapp-settings-close-without-saving').addEventListener('click', function() {
	document.querySelector('.settings-popup').classList.remove('visible');
});

document.querySelector('.webapp-settings-reset-to-default').addEventListener('click', function() {
	Subtitler.Popup.show(
		Subtitler.Translations.get('webappSettingsPopupResetConfirmationPopupTitle'),
		Subtitler.Translations.get('webappSettingsPopupResetConfirmationPopupMessage'),
		[
			{
				label: Subtitler.Translations.get('webappSettingsPopupResetConfirmationPopupButtonCancel')
			},
			{
				label: Subtitler.Translations.get('webappSettingsPopupResetConfirmationPopupButtonProceed'),
				callback: function() {
					document.querySelector('.settings-popup').classList.remove('visible');
					Subtitler.Settings.reset();
					Subtitler.Settings.save();
				}
			}
		]
	)
});

Subtitler.Settings.showPopup = function() {
	document.querySelector('.settings-popup').classList.add('visible');
	
	document.querySelector('.webapp-settings-language-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.language }}));
	
	document.querySelector('.webapp-settings-lead-in').value = Subtitler.Settings.leadIn;
	document.querySelector('.webapp-settings-lead-out').value = Subtitler.Settings.leadOut;
		
	document.querySelector('.webapp-settings-video-pane-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.videoPane }}));
	document.querySelector('.webapp-settings-video-res-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.onVideoResMismatch }}));
	document.querySelector('.webapp-settings-actor-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.onProbableActorError }}));
	document.querySelector('.webapp-settings-import-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.onRecoverableImportError }}));
	document.querySelector('.webapp-settings-visualiser-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: (Subtitler.Settings.audioVisualiser || 'enabled') }}));
	document.querySelector('.webapp-settings-syntax-highlighting-checkbox').checked = Subtitler.Settings.syntaxHighlighting;
	document.querySelector('.webapp-settings-captions-mode-checkbox').checked = Subtitler.Settings.captionsMode;
	document.querySelector('.webapp-settings-line-comparison-mode-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Settings.lineComparison }}));
	document.querySelector('.webapp-settings-show-actor-column-dropdown').dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: (Subtitler.Settings.showActorColumn || 'if-present') }}));
	

	document.querySelector('.settings-popup').querySelector('.popup-content').scrollTop = 0;
}

document.querySelector('.webapp-settings-save-and-close').addEventListener('click', function() {
	
	Subtitler.Settings.language = document.querySelector('.webapp-settings-language-dropdown').getAttribute('data-value');
	Subtitler.Settings.leadIn = document.querySelector('.webapp-settings-lead-in').value * 1;
	Subtitler.Settings.leadOut = document.querySelector('.webapp-settings-lead-out').value * 1;
	Subtitler.Settings.videoPane = document.querySelector('.webapp-settings-video-pane-dropdown').getAttribute('data-value');
	Subtitler.Settings.onVideoResMismatch = document.querySelector('.webapp-settings-video-res-dropdown').getAttribute('data-value');
	Subtitler.Settings.onProbableActorError = document.querySelector('.webapp-settings-actor-dropdown').getAttribute('data-value');
	Subtitler.Settings.onRecoverableImportError = document.querySelector('.webapp-settings-import-dropdown').getAttribute('data-value');
	Subtitler.Settings.audioVisualiser = document.querySelector('.webapp-settings-visualiser-dropdown').getAttribute('data-value');
	Subtitler.Settings.syntaxHighlighting = document.querySelector('.webapp-settings-syntax-highlighting-checkbox').checked;
	Subtitler.Settings.captionsMode = document.querySelector('.webapp-settings-captions-mode-checkbox').checked;
	Subtitler.Settings.lineComparison = document.querySelector('.webapp-settings-line-comparison-mode-dropdown').getAttribute('data-value');
	Subtitler.Settings.showActorColumn = document.querySelector('.webapp-settings-show-actor-column-dropdown').getAttribute('data-value');

	
	document.querySelector('.settings-popup').classList.remove('visible');
	
	Subtitler.Settings.updateAppAttributes();
	Subtitler.Settings.save();
	Subtitler.Video.__updateVisibleSubtitles(true);
});