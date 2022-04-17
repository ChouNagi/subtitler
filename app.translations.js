
Subtitler = window.Subtitler || { };
Subtitler.Translations = Subtitler.Translations || { };

Subtitler.Translations.fallbackLanguage = 'en';

window.addEventListener('languagechange', function() {
	Subtitler.Translations.applyToApp()
});

Subtitler.Translations.getBrowserLanguage = function() {
	var langCode = (navigator.language || navigator.userLanguage || '').replace(/-.*$/g, '');
	if(Subtitler.Translations.hasOwnProperty(langCode)) {
		return langCode;
	}
	if(navigator.languages) {
		for(var n=0; n<navigator.languages.length; n++) {
			langCode = navigator.languages[n].replace(/-.*$/g, '');
			if(Subtitler.Translations.hasOwnProperty(langCode)) {
				return langCode;
			}
		}
	}
	return Subtitler.Translations.fallbackLanguage;
}

Subtitler.Translations.get = function( key, language ) {
	if(language == undefined) {
		language = Subtitler.Settings.language;
	}
	if(language == undefined || language == 'browser') {
		language = Subtitler.Translations.getBrowserLanguage();
	}
	if(Subtitler.Translations.hasOwnProperty(language)
		&& Subtitler.Translations[language].hasOwnProperty(key)) {
		return Subtitler.Translations[language][key];
	}
	return null;
}
Subtitler.Translations.applyToApp = function( language ) {
	if(language == undefined) {
		language = Subtitler.Settings.language;
	}
	if(language == undefined || language == 'browser') {
		language = Subtitler.Translations.getBrowserLanguage();
	}
	var translateableElements = document.querySelectorAll('[data-translation-key]');
	for(var e=0; e<translateableElements.length; e++) {
		var element = translateableElements[e];
		
		if(element.hasAttribute('data-translation-key')) {
			var translation = Subtitler.Translations.get(element.getAttribute('data-translation-key'), language);
			element.innerHTML = translation;
		}
	}
}

Subtitler.Translations['en'] = {
	
	languageName: 'English',
	browserDetectedLanguage: 'Browser Default',
	
	initialFileName: 'untitled.ass',
	
	webappName: 'Subtitler',
	webappMenuNewSubtitles: 'New Subtitles',
	webappMenuLoadSubtitles: 'Load Subtitles',
	webappMenuLoadVideo: 'Load Video',
	webappMenuLoadAudio: 'Load Audio',
	webappMenuUseDummyVideo: 'Use Dummy Video',
	webappMenuTiming: 'Shift Timing',
	webappMenuStyles: 'Edit Styles',
	webappMenuProperties: 'Edit Properties',
	webappMenuExport: 'Export...',
	webappMenuExportASS: 'Export to ASS',
	webappMenuExportSBV: 'Export to SBV',
	webappMenuExportSRT: 'Export to SRT',
	webappMenuExportVTT: 'Export to VTT (Experimental)',
	webappMenuExportTXT: 'Export to TXT',
	webappMenuSettings: 'Settings',
	webappMenuAbout: 'About',
	
	videoScaleAuto: 'Auto',
	videoScaleCustom: 'Custom',
	
	linesInsertNewAtEnd: 'Insert New Line',
	
	lineCommentCheckboxLabel: 'Comment',
	
	lineContextMenuInsertBefore: 'Insert (before)',
	lineContextMenuInsertAfter: 'Insert (after)',
	lineContextMenuInsertAtVideoTimeBefore: 'Insert at video time (before)',
	lineContextMenuInsertAtVideoTimeAfter: 'Insert at video time (after)',
	lineContextMenuDuplicateLine: 'Duplicate Line',
	lineContextMenuSplitLineAtVideoTime: 'Split Line at video time',
	lineContextMenuCopyLine: 'Copy Lines',
	lineContextMenuCutLine: 'Cut Lines',
	lineContextMenuPasteLineBefore: 'Paste Lines (before)',
	lineContextMenuPasteLineAfter: 'Paste Lines (after)',
	lineContextMenuPasteLineOver: 'Paste Lines (over)',
	lineContextMenuDeleteLine: 'Delete Lines',
	
	aboutPopupTitle: 'About',
	aboutPopupMessage: 'Despite the similarities in appearance and function, this webapp is not affiliated with Aegisub, nor does it share any code with Aegisub. (In retrospect if it did, I\'d have saved several days on the spectrogram and it\'d work a lot better). Even ignoring the multiple bugs and unfinished state of the webapp, for most purposes the finished webapp will be objectively inferior to Aegisub due to the limitations of html+javascript. If you have the opportunity, I\'d highly recommend installing Aegisub and using that instead.\n\nThis webapp is open source, and the source code is hosted on github if for some reason you want to help, make your own copy, or question my sanity.',
	aboutPopupButtonAegisub: 'Aegisub',
	aboutPopupButtonSrc: 'Source',
	aboutPopupButtonClose: 'Close',
	
	fatalImportErrorPopupTitle: 'Error',
	fatalImportErrorPopupMessage: 'Errors were detected in the subtitle file during import, at least one of which could not be automatically corrected, and so the import was aborted. The list of errors encountered so far is as follows: \n\n{errorList}',
	fatalImportErrorPopupButtonAbort: 'OK',
	
	recoverableImportErrorPopupTitle: 'Warning',
	recoverableImportErrorPopupMessage: 'Errors in the subtitle file were detected during import and can been corrected. A full list of errors encountered is as follows:\n\n{errorList}',
	recoverableImportErrorPopupButtonProceed: 'Proceed',
	recoverableImportErrorPopupButtonAbort: 'Abort',
	
	actorWarningPopupTitle: 'Warning',
	actorWarningPopupMessage: 'A significant number of lines start with the text ">> " but do not appear to specify an actor, which may be a mistake. Do you wish to alter these lines to remove the prefix?',
	actorWarningPopupButtonNo: 'No',
	actorWarningPopupButtonYes: 'Yes',
	
	autotranscribedWarningPopupTitle: 'Warning',
	autotranscribedWarningPopupMessage: 'A significant number of lines appear to be comments indicating the confidence of an automated transcription process. Do you wish to remove these comments to reduce clutter?',
	autotranscribedWarningPopupButtonNo: 'No',
	autotranscribedWarningPopupButtonYes: 'Yes',
	
	unknownImportWarningPopupTitle: 'Warning',
	unknownImportWarningPopupMessage: 'The subtitle format could not be inferred.\nDo you want to import every line as a separate subtitle without any timing information?',
	unknownImportWarningPopupButtonProceed: 'Proceed',
	unknownImportWarningPopupButtonAbort: 'Abort',
	
	videoLoadErrorPopupTitle: 'Error',
	videoLoadErrorPopupMessage: 'The video could not be loaded.\nPerhaps the file type is unsupported.',
	videoLoadErrorPopupButtonText: 'OK',
	
	videoAudioConflictPopupTitle: 'Load Audio?',
	videoAudioConflictPopupMessage: 'Do you wish to load the audio from this video?',
	videoAudioConflictPopupButtonDoNothing: 'No',
	videoAudioConflictPopupButtonReplace: 'Yes',
	
	videoResMismatchPopupTitle: 'Resolution Mismatch',
	videoResMismatchPopupMessage: 'You\'ve loaded a video with resolution ({videoResolution}), but the subtitles are intended for a different resolution ({scriptResolution}). Do you wish to change the subtitles resolution to match?',
	videoResMismatchPopupButtonNo: 'No',
	videoResMismatchPopupButtonYes: 'Yes',
	videoResMismatchPopupButtonAlways: 'Always',
	
	webappSettingsPopupTitle: 'Settings',
	webappSettingsPopupLanguage: 'Language',
	webappSettingsPopupVideoPaneLabel: 'Video Pane',
	webappSettingsPopupVideoPaneHide: 'Hide',
	webappSettingsPopupVideoPaneMinimise: 'Minimise',
	webappSettingsPopupVideoPaneShow: 'Show',
	
	webappSettingsPopupLineRecoverableImportErrorLabel: 'On Recoverable Import Error:',
	webappSettingsPopupLineRecoverableImportErrorAbort: 'Abort',
	webappSettingsPopupLineRecoverableImportErrorPopup: 'Show Popup',
	webappSettingsPopupLineRecoverableImportErrorAutocorrect: 'Autocorrect',
	webappSettingsPopupLineRecoverableImportErrorDescription: 'When loading a subtitle file with errors, it may still be possible to infer the correct form of the line (for example an SRT file using periods to separate milliseconds instead of commas).',
	
	webappSettingsPopupLineComparisonModeLabel: 'Comparison Mode',
	webappSettingsPopupLineComparisonModeDescription: 'Comparison Mode shows an additional textbox above the line textbox in the Line Editor, showing a previous version of the line. This can be useful when doing translations. Recent shows how the line was when you selected it. Original shows how the line was when you loaded the subtitle file (or when it was created).',
	webappSettingsPopupLineComparisonModeDisabled: 'Disabled',
	webappSettingsPopupLineComparisonModeRecent: 'Compare with Recent',
	webappSettingsPopupLineComparisonModeOriginal: 'Compare with Original',
	webappSettingsPopupSyntaxHighlightingLabel: 'Enable Syntax Highlighting',
	webappSettingsPopupSyntaxHighlightingDescription: 'When enabled, the Line Editor line textbox will highlight ASS syntax. Note that this may not work well on older browsers. If you have trouble seeing the caret or feel it\'s slow to respond to keypresses, consider unchecking this option.',
	webappSettingsPopupCaptionModeLabel: 'Enable Captions Mode',
	webappSettingsPopupCaptionModeDescription: 'Captions Mode emulates the look and feel of the default YouTube captions, suppressing certain properties of the "Default" style, and placing a hard limit on the minimum font size and margin regardless of video player size. Additionally, when exporting files to SBV or VTT while in Captions Mode, no styling information will be included. Importing an ASS file will automatically exit Captions Mode.',

	webappSettingsPopupVisualiserModeLabel: 'Audio Visualiser',
	webappSettingsPopupVisualiserModeHide: 'Hide',
	webappSettingsPopupVisualiserModeNoSpectrogram: 'Disable Spectrogram',
	webappSettingsPopupVisualiserModeEnable: 'Enable',
	webappSettingsPopupVisualiserModeDescription: 'The Audio Visualiser displays a visual representation of the timeline, and allows for retiming the current line with simple guestures. It also shows a Spectrogram with a Fast Fourier Transform of the Audio, allowing you to visually identify speech. However, rendering the spectrogram may negatively affect performance on slower machines, and just showing the interface at all may take up valuable screen space on small devices.',
	
	webappSettingsPopupVideoPaneLabel: 'Video Pane',
	webappSettingsPopupVideoPaneHide: 'Hide',
	webappSettingsPopupVideoPaneShow: 'Show',
	webappSettingsPopupVideoPaneDescription: 'The Video Pane displays the currently loaded video and renders the subtitles at the current video time on top, as well as providing controls for video playback. However, it can take up a significant amount of screen space, especially on mobile devices, so you may wish to temporarily disable it, especially if the Audio Visualiser is enabled.',
	
	webappSettingsPopupVisualiserModeLabel: 'Audio Visualiser',
	webappSettingsPopupVisualiserModeHide: 'Hide',
	webappSettingsPopupVisualiserModeNoSpectrogram: 'Disable Spectrogram',
	webappSettingsPopupVisualiserModeEnable: 'Enable',
	webappSettingsPopupVisualiserModeDescription: 'The Audio Visualiser displays a visual representation of the timeline, and allows for retiming the current line with simple guestures. It also shows a Spectrogram with a Fast Fourier Transform of the Audio, allowing you to visually identify speech. However, rendering the spectrogram may negatively affect performance on slower machines, and just showing the interface at all may take up valuable screen space on small devices.',
	
	webappSettingsPopupShowActorColumnLabel: 'Show Actor Column',
	webappSettingsPopupShowActorColumnNever: 'Never',
	webappSettingsPopupShowActorColumnIfPresent: 'If Present',
	webappSettingsPopupShowActorColumnAlways: 'Always',
	
	webappSettingsPopupVideoResMismatchLabel: 'On Video Load Res Mismatch',
	webappSettingsPopupVideoResMismatchIgnore: 'Ignore',
	webappSettingsPopupVideoResMismatchPopup: 'Show Popup',
	webappSettingsPopupVideoResMismatchAutoChange: 'Automatically Change to Match',
	webappSettingsPopupVideoResMismatchDescription: 'When loading a Video, it might be that the video resolution doesn\'t match the size of the video that the subtitles were intended for.',
	
	webappSettingsPopupLoadVideoAudioLabel: 'On Loading a Video with Audio',
	webappSettingsPopupLoadVideoAudioDoNothing: 'Do Nothing',
	webappSettingsPopupLoadVideoAudioShowPopup: 'Show Popup',
	webappSettingsPopupLoadVideoAudioReplace: 'Replace Audio',
	webappSettingsPopupLoadVideoAudioDescription: 'When loading a Video, it\'s often the case that the video being loaded has an Audio track. If no audio is currently loaded, or the current audio was from the previous video, it will be automatically set to the new video\'s audio. In the event that neither of these are true, the default behaviour is to show a popup. If you\'d prefer to not see the popup and to have it automatically replaced, or just ignored, you can adjust that here.',
	
	webappSettingsPopupActorMixupLabel: 'On Possible Actor Mixup',
	webappSettingsPopupActorMixupIgnore: 'Ignore',
	webappSettingsPopupActorMixupPopup: 'Show Popup',
	webappSettingsPopupActorMixupAutocorrect: 'Autocorrect',
	
	webappSettingsLeadIn: 'Lead In (ms)',
	webappSettingsLeadOut: 'Lead Out (ms)',
	webappSettingsLeadsDescription: '',
	
	webappSettingsPopupButtonCancel: 'Cancel',
	webappSettingsPopupButtonReset: 'Reset',
	webappSettingsPopupButtonSave: 'Save',
	
	webappSettingsPopupResetConfirmationPopupTitle: 'Confirm Reset',
	webappSettingsPopupResetConfirmationPopupMessage: 'Are you sure you wish to revert your settings to the defaults?',
	webappSettingsPopupResetConfirmationPopupButtonCancel: 'Cancel',
	webappSettingsPopupResetConfirmationPopupButtonProceed: 'Proceed',
	
	
	webappStylesPopupTitle: 'Styles',
	
	webappStylesPopupCatalog: 'Catalog of available Storages',
	webappStylesPopupCatalogButtonNew: 'New',
	webappStylesPopupCatalogButtonDelete: 'Delete',
	webappStylesPopupDefaultCatalogName: 'Default',
	
	webappStylesPopupStorage: 'Storage',
	webappStylesPopupCurrentScript: 'Current Script',
	
	webappStylesPopupButtonStyleNew: 'New',
	webappStylesPopupButtonStyleEdit: 'Edit',
	webappStylesPopupButtonStyleCopy: 'Copy',
	webappStylesPopupButtonStyleDelete: 'Delete',
	
	webappStylesPopupButtonStyleCopyToStorage: '<- Copy To Storage',
	webappStylesPopupButtonStyleCopyToScript: 'Copy To Current Script ->',
	webappStylesPopupButtonStyleImportFromScript: 'Import From Script...',
	
	webappStylesPopupButtonMoveTop: 'Move Style to Top',
	webappStylesPopupButtonMoveUp: 'Move Style Up',
	webappStylesPopupButtonMoveDown: 'Move Style Down',
	webappStylesPopupButtonMoveBottom: 'Move Style to Bottom',
	webappStylesPopupButtonSortAlphabetically: 'Sort Styles Alphabetically',
	
	webappStylesPopupButtonClose: 'Close',
	webappStylesPopupButtonHelp: 'Help',
	
	
	webappPropertiesPopupTitle: 'Script Properties',
	webappPropertiesPopupScriptFileName: 'File Name',
	webappPropertiesPopupScriptTitle: 'Title',
	webappPropertiesPopupCreditsOriginalScript: 'Original Script',
	webappPropertiesPopupCreditsTranslation: 'Translation',
	webappPropertiesPopupCreditsEditing: 'Editing',
	webappPropertiesPopupCreditsTiming: 'Timing',
	webappPropertiesPopupSyncPoint: 'Sync Point',
	webappPropertiesPopupUpdatedBy: 'Updated By',
	webappPropertiesPopupUpdateDetails: 'Update Details',
	webappPropertiesPopupDelay: 'Delay (for SBV)',
	webappPropertiesPopupDelayMilliseconds: 'milliseconds',
	webappPropertiesPopupDelayMillisecondsShort: 'ms',
	webappPropertiesPopupResolution: 'Resolution',
	webappPropertiesPopupYcbcrMatrix: 'YCbCr Matrix',	
	webappPropertiesPopupWrapStyle: 'Wrap Style',
	webappPropertiesPopupWrapStyleZero: 'Smart Wrapping (top line wider)',
	webappPropertiesPopupWrapStyleOne: 'End of Line Wrapping (only \\N breaks)',
	webappPropertiesPopupWrapStyleTwo: 'No Word Wrapping (both \\n and \\N break)',
	webappPropertiesPopupWrapStyleThree: 'Smart Wrapping (bottom line wider)',
	
	webappPropertiesPopupScaleBorderAndShadow: 'Scale Border and Shadow',
	
	webappPropertiesPopupButtonClose: 'Close',
	webappPropertiesPopupButtonSave: 'Save',
	
	ycbcrMatrixNone: 'None',
	ycbcrMatrixTV601: 'TV.601',
	ycbcrMatrixPC601: 'PC.601',
	ycbcrMatrixTV709: 'TV.709',
	ycbcrMatrixPC709: 'PC.709',
	ycbcrMatrixTVFCC: 'TV.FCC',
	ycbcrMatrixPCFCC: 'PC.FCC',
	ycbcrMatrixTV240M: 'TV.240M',
	ycbcrMatrixPC240M: 'PC.240M',
	
	webappStyleEditorPopupTitle: 'Style Editor',
	
	webappStyleEditorPopupStyleName: 'Style Name',
	
	webappStyleEditorPopupFont: 'Font',
	webappStyleEditorPopupFontFamily: 'Font Family',
	webappStyleEditorPopupFontSize: 'Font Size',
	webappStyleEditorPopupFontBold: 'Bold',
	webappStyleEditorPopupFontItalic: 'Italic',
	webappStyleEditorPopupFontUnderline: 'Underline',
	webappStyleEditorPopupFontStrikeout: 'Strikeout',
	
	webappStyleEditorPopupColours: 'Colours',
	webappStyleEditorPopupColourPrimary: 'Primary',
	webappStyleEditorPopupColourSecondary: 'Secondary',
	webappStyleEditorPopupColourOutline: 'Outline',
	webappStyleEditorPopupColourShadow: 'Shadow',
	
	webappStyleEditorPopupMargins: 'Margins',
	webappStyleEditorPopupMarginLeft: 'Left',
	webappStyleEditorPopupMarginRight: 'Right',
	webappStyleEditorPopupMarginVertical: 'Vertical',
	
	webappStyleEditorPopupMarginAlignment: 'Alignment',
	
	webappStyleEditorPopupOutlineAndShadow: 'Outline & Shadow',
	webappStyleEditorPopupOutlineShape: 'Outline Shape',
	webappStyleEditorPopupOutlineShapeNormal: 'Default',
	webappStyleEditorPopupOutlineShapeRectangle: 'Rectangle',
	webappStyleEditorPopupOutlineWidth: 'Outline Width',
	webappStyleEditorPopupShadowOffset: 'Shadow Offset',
	
	webappStyleEditorPopupMisc: 'Miscellaneous',
	webappStyleEditorPopupScaleX: 'Scale X (%)',
	webappStyleEditorPopupScaleY: 'Scale Y (%)',
	webappStyleEditorPopupRotation: 'Rotation (degs)',
	webappStyleEditorPopupSpacing: 'Spacing',
	webappStyleEditorPopupEncoding: 'Encoding',
	webappStyleEditorPopupOutlineEncoding0: '0 - ANSI',
	webappStyleEditorPopupOutlineEncoding1: '1 - Default',
	webappStyleEditorPopupOutlineEncoding2: '2 - Symbol',
	webappStyleEditorPopupOutlineEncoding77: '77 - Mac',
	webappStyleEditorPopupOutlineEncoding128: '128 - Shift_JIS',
	webappStyleEditorPopupOutlineEncoding129: '129 - Hangeul',
	webappStyleEditorPopupOutlineEncoding130: '130 - Johab',
	webappStyleEditorPopupOutlineEncoding134: '134 - GB2312',
	webappStyleEditorPopupOutlineEncoding136: '136 - Chinese BIG5',
	webappStyleEditorPopupOutlineEncoding161: '161 - Greek',
	webappStyleEditorPopupOutlineEncoding162: '162 - Turkish',
	webappStyleEditorPopupOutlineEncoding163: '163 - Vietnamese',
	webappStyleEditorPopupOutlineEncoding177: '177 - Hebrew',
	webappStyleEditorPopupOutlineEncoding178: '178 - Arabic',
	webappStyleEditorPopupOutlineEncoding186: '186 - Baltic',
	webappStyleEditorPopupOutlineEncoding204: '204 - Russian',
	webappStyleEditorPopupOutlineEncoding222: '222 - Thai',
	webappStyleEditorPopupOutlineEncoding238: '238 - East European',
	webappStyleEditorPopupOutlineEncoding255: '255 - OEM',
	
	webappStyleEditorPopupPreview: 'Preview',
	
	webappStyleEditorPopupButtonSave: 'Save',
	webappStyleEditorPopupButtonCancel: 'Cancel',
	
	webappEditStylePopupNewStyleName: 'New Style',
	webappEditStylePopupCopiedStylePrefix: '',
	webappEditStylePopupCopiedStyleSuffix: ' - Copy',
	
	webappColourChooserPopupTitle: 'Select Colour',
	
	webappColourChooserPopupRGB: 'RGB',
	webappColourChooserPopupHSL: 'HSL',
	webappColourChooserPopupHSV: 'HSV',
	
	webappColourChooserPopupRed: 'Red',
	webappColourChooserPopupGreen: 'Green',
	webappColourChooserPopupBlue: 'Blue',
	webappColourChooserPopupAlpha: 'Alpha',
	webappColourChooserPopupHtml: 'HTML',
	webappColourChooserPopupAegisubBGR: 'ASS',
	webappColourChooserPopupHue: 'Hue',
	webappColourChooserPopupSaturation: 'Sat',
	webappColourChooserPopupLuminosity: 'Lum',
	webappColourChooserPopupValue: 'Value',
	
	webappColourChooserPopupButtonCancel: 'Cancel',
	webappColourChooserPopupButtonOK: 'OK',
	
	
	webappDummyVideoPopupTitle: 'Dummy Video Options',
							
	webappDummyVideoPopupResolution: 'Resolution',
	webappDummyVideoPopupResolution640x480: '640x480 (SD fullscreen)',
	webappDummyVideoPopupResolution704x480: '704x480 (SD anamorphic)',
	webappDummyVideoPopupResolution640x360: '640x360 (SD widescreen)',
	webappDummyVideoPopupResolution704x396: '704x396 (SD widescreen)',
	webappDummyVideoPopupResolution640x352: '640x352 (SD widescreen MOD 16)',
	webappDummyVideoPopupResolution704x400: '704x400 (SD widescreen MOD 16)',
	webappDummyVideoPopupResolution1280x720: '1280x720 (HD 720p)',
	webappDummyVideoPopupResolution1920x1080: '1920x1080 (HD 1080p)',
	webappDummyVideoPopupResolution1024x576: '1024x576 (SuperPAL widescreen)',
	webappDummyVideoPopupResolutionCustom: 'Custom',
	
	
	webappDummyVideoPopupColour: 'Colour',
	webappDummyVideoPopupCheckerboardPattern: 'Checkerboard Pattern',
	webappDummyVideoPopupFrameRate: 'Frame Rate',
	webappDummyVideoPopupDuration: 'Duration',
	webappDummyVideoPopupDurationInSeconds: 'Duration',
	webappDummyVideoPopupDurationInFrames: '# Frames',
	
	webappDummyVideoPopupButtonOK: 'OK',
	webappDummyVideoPopupButtonCancel: 'Cancel',
	
	
	webappShiftTimingPopupTitle: 'Shift Timing',
	webappShiftTimingPopupTime: 'Time',
	webappShiftTimingPopupFrame: 'Frame',
	webappShiftTimingPopupDirectionForwards: 'Forwards',
	webappShiftTimingPopupDirectionForwardsTooltip: 'Shifts subs forwards, making them appear later. Use if they are appearing too soon.',
	webappShiftTimingPopupDirectionBackwards: 'Backwards',
	webappShiftTimingPopupDirectionBackwardsTooltip: 'Shifts subs backwards, making them appear earlier. Use if they are appearing too late.',
	webappShiftTimingPopupLinesAffected: 'Affect',
	webappShiftTimingPopupLinesAffectedAll: 'All Lines',
	webappShiftTimingPopupLinesAffectedSelection: 'Selected Lines',
	webappShiftTimingPopupLinesAffectedSelectionOnwards: 'Selection Onwards',
	webappShiftTimingPopupShift: 'Shift Times',
	webappShiftTimingPopupShiftStartAndEndTimes: 'Start and End Times',
	webappShiftTimingPopupShiftStartTimes: 'Start Times only',
	webappShiftTimingPopupShiftEndTimes: 'End Times only',
	
	webappShiftTimingPopupButtonCancel: 'Cancel',
	webappShiftTimingPopupButtonApply: 'Apply',
	
	
	webappFileBrowserPopupTitleBrowse: 'Browse',
	webappFileBrowserPopupTitleSave: 'Save',
	webappFileBrowserPopupStorage: 'Storage',
	
	webappFileBrowserPopupButtonCancel: 'Cancel',
	webappFileBrowserPopupButtonOpen: 'Open',
	webappFileBrowserPopupButtonSave: 'Save',
}


// TODO - additional translations in other languages


Subtitler.Translations.applyToApp();
