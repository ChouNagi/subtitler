Subtitler = window.Subtitler || { };
Subtitler.StyleEditor = Subtitler.StyleEditor || { };

Subtitler.StyleEditor.popup = document.querySelector('.style-editor-popup');

Subtitler.StyleEditor.Buttons = { };

Subtitler.StyleEditor.Buttons.saveAndClose = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-save-and-close');
Subtitler.StyleEditor.Buttons.closeWithoutSaving = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-close-without-saving');

Subtitler.StyleEditor.Inputs = { };

Subtitler.StyleEditor.Inputs.styleName = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-style-name');

Subtitler.StyleEditor.Inputs.fontFamily = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-family');
Subtitler.StyleEditor.Inputs.fontSize = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-size');
Subtitler.StyleEditor.Inputs.bold = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-bold');
Subtitler.StyleEditor.Inputs.italic = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-italic');
Subtitler.StyleEditor.Inputs.underline = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-underline');
Subtitler.StyleEditor.Inputs.strikeout = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-font-strikeout');

Subtitler.StyleEditor.Inputs.colourPrimary = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-colour-primary');
Subtitler.StyleEditor.Inputs.colourSecondary = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-colour-secondary');
Subtitler.StyleEditor.Inputs.colourOutline = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-colour-outline');
Subtitler.StyleEditor.Inputs.colourShadow = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-colour-shadow');

Subtitler.StyleEditor.Inputs.marginLeft = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-margin-left');
Subtitler.StyleEditor.Inputs.marginRight = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-margin-right');
Subtitler.StyleEditor.Inputs.marginVertical = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-margin-vertical');

Subtitler.StyleEditor.Inputs.alignment = Subtitler.StyleEditor.popup.querySelector('.alignment-grid');

Subtitler.StyleEditor.Inputs.outlineWidth = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-outline-width');
Subtitler.StyleEditor.Inputs.outlineShape = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-outline-shape');
Subtitler.StyleEditor.Inputs.shadowOffset = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-shadow-offset');

Subtitler.StyleEditor.Inputs.scaleX = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-scale-x');
Subtitler.StyleEditor.Inputs.scaleY = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-scale-y');
Subtitler.StyleEditor.Inputs.rotation = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-rotation');
Subtitler.StyleEditor.Inputs.spacing = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-spacing');
Subtitler.StyleEditor.Inputs.encoding = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-encoding');

Subtitler.StyleEditor.Preview = { };

Subtitler.StyleEditor.Preview.renderBackground = Subtitler.StyleEditor.popup.querySelector('.preview');
Subtitler.StyleEditor.Preview.renderText = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-preview-render');
Subtitler.StyleEditor.Preview.textInput = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-preview-text');
Subtitler.StyleEditor.Preview.backgroundColourInput = Subtitler.StyleEditor.popup.querySelector('.webapp-style-editor-preview-background-colour');

Subtitler.StyleEditor.Buttons.closeWithoutSaving.addEventListener('click', function() {
	Subtitler.StyleEditor.hidePopup();
	if(Subtitler.StyleEditor.closeCallback) {
		Subtitler.StyleEditor.closeCallback(null);
	}
	Subtitler.StyleEditor.closeCallback = null;
});
Subtitler.StyleEditor.Buttons.saveAndClose.addEventListener('click', function() {
	var successful = Subtitler.StyleEditor.apply();
	if(successful) {
		Subtitler.StyleEditor.hidePopup();
	}
	Subtitler.Video.__updateVisibleSubtitles(true);
	if(Subtitler.StyleEditor.closeCallback) {
		Subtitler.StyleEditor.closeCallback(successful);
		Subtitler.LineEditor.updateStylesDropdown();
	}
	Subtitler.StyleEditor.closeCallback = null;
});

Subtitler.StyleEditor.Preview.textInput.addEventListener('input', function() {
	Subtitler.Settings.stylePreviewText = Subtitler.StyleEditor.Preview.textInput.value || '';
	Subtitler.StyleEditor.renderPreview();
	Subtitler.Settings.save();
});
Subtitler.StyleEditor.Preview.textInput.addEventListener('change', function() {
	Subtitler.Settings.stylePreviewText = Subtitler.StyleEditor.Preview.textInput.value || '';
	Subtitler.StyleEditor.renderPreview();
	Subtitler.Settings.save();
});

Subtitler.StyleEditor.hidePopup = function( ) {
	Subtitler.StyleEditor.popup.classList.remove('visible');
}

Subtitler.StyleEditor.getStyleForPreview = function( ) {
	
	var style = { };
	
	style.fontFamily = Subtitler.StyleEditor.Inputs.fontFamily.value;
	style.fontSize = Subtitler.StyleEditor.Inputs.fontSize.value * 1;
	style.bold = Subtitler.StyleEditor.Inputs.bold.checked;
	style.italic = Subtitler.StyleEditor.Inputs.italic.checked;
	style.underline = Subtitler.StyleEditor.Inputs.underline.checked;
	style.strikeout = Subtitler.StyleEditor.Inputs.strikeout.checked;

	style.colourPrimary = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourPrimary.getAttribute('data-value'));
	style.colourSecondary = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourSecondary.getAttribute('data-value'));
	style.colourOutline = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourOutline.getAttribute('data-value'));
	style.colourShadow = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourShadow.getAttribute('data-value'));

	style.marginLeft = Subtitler.StyleEditor.Inputs.marginLeft.value * 1;
	style.marginRight = Subtitler.StyleEditor.Inputs.marginRight.value * 1;
	style.marginVertical = Subtitler.StyleEditor.Inputs.marginVertical.value * 1;

	var alignmentRadios = Subtitler.StyleEditor.Inputs.alignment.querySelectorAll('input[type=radio]');
	for(var a=0; a<alignmentRadios.length; a++) {
		if(alignmentRadios[a].checked) {
			style.alignment = alignmentRadios[a].value * 1;
		}
	}

	style.outlineWidth = Subtitler.StyleEditor.Inputs.outlineWidth.value * 1;
	style.borderStyle = Subtitler.StyleEditor.Inputs.outlineShape.getAttribute('data-value');
	style.shadowOffset = Subtitler.StyleEditor.Inputs.shadowOffset.value * 1;
	
	style.scaleX = Subtitler.StyleEditor.Inputs.scaleX.value * 1;
	style.scaleY = Subtitler.StyleEditor.Inputs.scaleY.value * 1;
	style.rotation = Subtitler.StyleEditor.Inputs.rotation.value * 1;
	style.spacing = Subtitler.StyleEditor.Inputs.spacing.value * 1;
	style.encoding = Subtitler.StyleEditor.Inputs.encoding.getAttribute('data-value') * 1;
	
	return style;
}

Subtitler.StyleEditor.apply = function( ) {
	var newStyleName = Subtitler.StyleEditor.Inputs.styleName.value;
	var initialStyleName = Subtitler.StyleEditor.Inputs.styleName.getAttribute('data-initial-value');
	
	var style = Subtitler.Styles.map[initialStyleName];
	
	if(newStyleName != initialStyleName) {
		if(Subtitler.Styles.map[newStyleName] != null) {
			Subtitler.StyleEditor.Inputs.styleName.classList.add('invalid');
			return false;
		}
		for(var n=0; n<Subtitler.Lines.list.length; n++) {
			var line = Subtitler.Lines.list[n];
			if(line.style == initialStyleName) {
				line.style = newStyleName;
			}
		}
		delete Subtitler.Styles.map[initialStyleName];
	}
	
	if(!style) {
		var styleTemplate = { };
		for(var prop in Subtitler.Styles.DefaultStyle) {
			if(Subtitler.Styles.DefaultStyle.hasOwnProperty(prop)) {
				styleTemplate[prop] = Subtitler.Styles.DefaultStyle[prop];
			}
		}
		styleTemplate.name = newStyleName;
		style = Subtitler.Styles.newStyle(styleTemplate);
	}
	
	if(!Subtitler.Styles.map.hasOwnProperty(newStyleName)) {
		Subtitler.Styles.map[newStyleName] = style;
	}
	if(Subtitler.Styles.list.indexOf(style) == -1) {
		Subtitler.Styles.list.push(style);
	}
	
	style.fontFamily = Subtitler.StyleEditor.Inputs.fontFamily.value;
	style.fontSize = Subtitler.StyleEditor.Inputs.fontSize.value * 1;
	style.bold = Subtitler.StyleEditor.Inputs.bold.checked;
	style.italic = Subtitler.StyleEditor.Inputs.italic.checked;
	style.underline = Subtitler.StyleEditor.Inputs.underline.checked;
	style.strikeout = Subtitler.StyleEditor.Inputs.strikeout.checked;

	style.colourPrimary = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourPrimary.getAttribute('data-value'));
	style.colourSecondary = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourSecondary.getAttribute('data-value'));
	style.colourOutline = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourOutline.getAttribute('data-value'));
	style.colourShadow = Subtitler.Styles.Colour.aegisubABGR(Subtitler.StyleEditor.Inputs.colourShadow.getAttribute('data-value'));

	style.marginLeft = Subtitler.StyleEditor.Inputs.marginLeft.value * 1;
	style.marginRight = Subtitler.StyleEditor.Inputs.marginRight.value * 1;
	style.marginVertical = Subtitler.StyleEditor.Inputs.marginVertical.value * 1;

	delete style.alignment;
	var alignmentRadios = Subtitler.StyleEditor.Inputs.alignment.querySelectorAll('input[type=radio]');
	for(var a=0; a<alignmentRadios.length; a++) {
		if(alignmentRadios[a].checked) {
			style.alignment = alignmentRadios[a].value * 1;
		}
	}

	style.outlineWidth = Subtitler.StyleEditor.Inputs.outlineWidth.value * 1;
	style.borderStyle = Subtitler.StyleEditor.Inputs.outlineShape.getAttribute('data-value');
	style.shadowOffset = Subtitler.StyleEditor.Inputs.shadowOffset.value * 1;
	
	style.scaleX = Subtitler.StyleEditor.Inputs.scaleX.value * 1;
	style.scaleY = Subtitler.StyleEditor.Inputs.scaleY.value * 1;
	style.rotation = Subtitler.StyleEditor.Inputs.rotation.value * 1;
	style.spacing = Subtitler.StyleEditor.Inputs.spacing.value * 1;
	style.encoding = Subtitler.StyleEditor.Inputs.encoding.getAttribute('data-value') * 1;
	
	return style;
}

Subtitler.StyleEditor.showPopup = function( style, copy, callback ) {
	
	if(typeof style == 'string') {
		style = Subtitler.Styles.map[style];
	}
	
	copy = !!copy;
	callback = (typeof callback == 'function') ? callback : null;
	
	// new style = Default style with different name
	if(style == null) {
		style = { };
		for(var prop in Subtitler.Styles.DefaultStyle) {
			if(Subtitler.Styles.DefaultStyle.hasOwnProperty(prop)) {
				style[prop] = Subtitler.Styles.DefaultStyle[prop];
			}
		}
		style.name = Subtitler.Translations.get('webappEditStylePopupNewStyleName');
		if(Subtitler.Styles.map.hasOwnProperty(style.name)) {
			var n=2;
			while(true) {
				var alternativeName = style.name + ' (' + n + ')';
				if(Subtitler.Styles.map.hasOwnProperty(alternativeName)) {
					n += 1;
				}
				else {
					style.name = alternativeName;
					break;
				}
			}
		}
	}
	else if(copy) {
		var styleCopy = { };
		for(var prop in style) {
			if(style.hasOwnProperty(prop)) {
				styleCopy[prop] = style[prop];
			}
		}
		var baseName = Subtitler.Translations.get('webappEditStylePopupCopiedStylePrefix')
						+ style.name
						+ Subtitler.Translations.get('webappEditStylePopupCopiedStyleSuffix');
		styleCopy.name = baseName;
		if(Subtitler.Styles.map.hasOwnProperty(styleCopy.name)) {
			var n=2;
			while(true) {
				var alternativeName = baseName + ' (' + n + ')';
				if(Subtitler.Styles.map.hasOwnProperty(alternativeName)) {
					n += 1;
				}
				else {
					styleCopy.name = alternativeName;
					break;
				}
			}
		}
		style = styleCopy;
	}
	
	Subtitler.StyleEditor.Inputs.styleName.setAttribute('data-initial-value', style.name);
	Subtitler.StyleEditor.Inputs.styleName.value = style.name;
	
	Subtitler.StyleEditor.Inputs.fontFamily.value = style.fontFamily || '';
	Subtitler.StyleEditor.Inputs.fontSize.value = (style.fontSize || '0') + '';
	Subtitler.StyleEditor.Inputs.bold.checked = !!style.bold;
	Subtitler.StyleEditor.Inputs.italic.checked = !!style.italic;
	Subtitler.StyleEditor.Inputs.underline.checked = !!style.underline;
	Subtitler.StyleEditor.Inputs.strikeout.checked = !!style.strikeout;

	Subtitler.StyleEditor.Inputs.colourPrimary.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: style.colourPrimary }}));
	Subtitler.StyleEditor.Inputs.colourSecondary.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: style.colourSecondary }}));
	Subtitler.StyleEditor.Inputs.colourOutline.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: style.colourOutline }}));
	Subtitler.StyleEditor.Inputs.colourShadow.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: style.colourShadow }}));

	Subtitler.StyleEditor.Inputs.marginLeft.value = (style.marginLeft || '0') + '';
	Subtitler.StyleEditor.Inputs.marginRight.value = (style.marginRight || '0') + '';
	Subtitler.StyleEditor.Inputs.marginVertical.value = (style.marginVertical || '0') + '';

	var alignmentRadios = Subtitler.StyleEditor.Inputs.alignment.querySelectorAll('input[type=radio]');
	for(var a=0; a<alignmentRadios.length; a++) {
		alignmentRadios[a].checked = (alignmentRadios[a].value == (style.alignment + ''));
	}

	Subtitler.StyleEditor.Inputs.outlineWidth.value = (style.outlineWidth || '0') + '';
	Subtitler.StyleEditor.Inputs.outlineShape.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { 
		value: ((style.borderStyle == undefined) ? Subtitler.Styles.DefaultStyle.borderStyle : style.encoding) + '' }}));
	Subtitler.StyleEditor.Inputs.shadowOffset.value = (style.shadowOffset || '0') + '';

	Subtitler.StyleEditor.Inputs.scaleX.value = (style.scaleX == undefined ? 100 : style.scaleX) + '';
	Subtitler.StyleEditor.Inputs.scaleY.value = (style.scaleY == undefined ? 100 : style.scaleY) + '';
	Subtitler.StyleEditor.Inputs.rotation.value = (style.rotation || '0') + '';
	Subtitler.StyleEditor.Inputs.spacing.value = (style.spacing || '0') + '';
	Subtitler.StyleEditor.Inputs.encoding.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { 
		value: ((style.encoding == undefined) ? Subtitler.Styles.DefaultStyle.encoding : style.encoding) + '' }}));
	
	var previewBackgroundColour = new Subtitler.Styles.Colour(Subtitler.Settings.stylePreviewBackgroundColour);
	Subtitler.StyleEditor.Preview.renderBackground.style.backgroundColor = previewBackgroundColour.toRGBA();
	Subtitler.StyleEditor.Preview.backgroundColourInput.setAttribute('data-value', previewBackgroundColour.toRGBA());
	Subtitler.StyleEditor.Preview.backgroundColourInput.querySelector('.colour-preview').style.backgroundColor = previewBackgroundColour.toRGBA();
	Subtitler.StyleEditor.Preview.textInput.value = Subtitler.Settings.stylePreviewText || '';
	
	window.setTimeout(Subtitler.StyleEditor.renderPreview, 1);
	
	Subtitler.StyleEditor.closeCallback = callback;
	
	Subtitler.StyleEditor.popup.classList.add('visible');
	Subtitler.StylesPopup.popup.querySelector('.popup-content').scrollTop = 0;
}

Subtitler.StyleEditor.Preview.backgroundColourInput.addEventListener('value-modified', function(e) {
	if(e && e.detail && e.detail.value) {
		var previewBackgroundColour = e.detail.value;
		Subtitler.StyleEditor.Preview.renderBackground.style.backgroundColor = previewBackgroundColour.toRGBA();
		Subtitler.Settings.stylePreviewBackgroundColour = previewBackgroundColour.toRGBA();
		Subtitler.Settings.save();
	}
});

Subtitler.StyleEditor.renderPreview = function() {
	
	var line = {
		text_src: Subtitler.Settings.stylePreviewText
	};
	Subtitler.Lines.__computeAlternateTextForms(line);
	
	var renderOptions = { };
	renderOptions[Subtitler.Renderer.Options.SCALE] = 1;
	renderOptions[Subtitler.Renderer.Options.CAPTIONS_MODE] = false;
	renderOptions[Subtitler.Renderer.Options.IGNORE_POSITIONING] = true;
	renderOptions[Subtitler.Renderer.Options.STYLE_OVERRIDE] = Subtitler.StyleEditor.getStyleForPreview();
	
	while(Subtitler.StyleEditor.Preview.renderText.childNodes[0]) {
		Subtitler.StyleEditor.Preview.renderText.removeChild(Subtitler.StyleEditor.Preview.renderText.childNodes[0]);
	}
	
	var renderedSubtitle = Subtitler.Renderer.render(line, renderOptions);
	
	Subtitler.StyleEditor.Preview.renderText.appendChild(renderedSubtitle);
}

for(var i in Subtitler.StyleEditor.Inputs) {
	if(!Subtitler.StyleEditor.Inputs.hasOwnProperty(i)) {
		continue;
	}
	var input = Subtitler.StyleEditor.Inputs[i];
	if(input == Subtitler.StyleEditor.Inputs.styleName) {
		// changing this has no effect on the appearance of the text
		continue;
	}
	if(input == Subtitler.StyleEditor.Inputs.marginLeft
		|| input == Subtitler.StyleEditor.Inputs.marginRight
		|| input == Subtitler.StyleEditor.Inputs.marginVertical
		|| input == Subtitler.StyleEditor.Inputs.aligment) {
		// preview ignores positioning so won't be affected
		continue;
	}
	
	if(input.matches('.numeric-input')) {
		input.addEventListener('value-modified', Subtitler.StyleEditor.renderPreview);
	}
	else if(input.matches('input[type=checkbox]')) {
		input.addEventListener('click', function() { 
			setTimeout(Subtitler.StyleEditor.renderPreview, 1);
		});
	}
	else if(input.matches('.colour-input')) {
		input.addEventListener('value-modified', Subtitler.StyleEditor.renderPreview);
	}
	else if(input.matches('.dropdown')) {
		input.addEventListener('value-modified', Subtitler.StyleEditor.renderPreview);
	}
	else {
		input.addEventListener('input', Subtitler.StyleEditor.renderPreview);
		input.addEventListener('change', Subtitler.StyleEditor.renderPreview);
	}
}
