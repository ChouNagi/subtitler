Subtitler = window.Subtitler || { };
Subtitler.Renderer = Subtitler.Renderer || { };

Subtitler.Renderer.Options = {
	
	// scale to render
	SCALE: 'scale',
	
	// the subtitle will be rendered without accounting for alignment {\pos} or {\mov}
	IGNORE_POSITIONING: 'ignorePositioning',
	
	// see: captions mode description in app.translations.js
	CAPTIONS_MODE: 'captionsMode',
	
	// ignores line style and uses provided style instead
	STYLE_OVERRIDE: 'styleOverride',
	
	
};

Subtitler.Renderer.DefaultOptions = { };
Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.SCALE] = 1;
Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.CAPTIONS_MODE] = false;
Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.IGNORE_POSITIONING] = false;
Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.STYLE_OVERRIDE] = null;

Subtitler.Renderer.__getOptions = function( options ) {
	
	var optionsCopy = { };
	for(var prop in Subtitler.Renderer.DefaultOptions) {
		if(!options.hasOwnProperty(prop)) {
			optionsCopy[prop] = Subtitler.Renderer.DefaultOptions[prop];
		}
	}
	if(options) {
		for(var prop in options) {
			optionsCopy[prop] = options[prop];
		}
	}
	
	return optionsCopy;
}
Subtitler.Renderer.__getStyle = function( line, options ) {
	
	var style = null;
	if(typeof options[Subtitler.Renderer.Options.STYLE_OVERRIDE] == 'string') {
		style = Subtitler.Styles.map[Subtitler.Renderer.Options.STYLE_OVERRIDE];
	}
	else if(options[Subtitler.Renderer.Options.STYLE_OVERRIDE] != null
			&& typeof options[Subtitler.Renderer.Options.STYLE_OVERRIDE] == 'object') {
		style = options[Subtitler.Renderer.Options.STYLE_OVERRIDE];
	}
	else if(line.style != null && typeof line.style == 'string') {
		style = Subtitler.Styles.map[line.style];
	}
	if(style == null) {
		style = Subtitler.Styles.DefaultStyle;
	}
	
	return style;
}

Subtitler.Renderer.render = function( line, options ) {
	
	if(line.text_src == '') {
		return null;
	}
	
	options = Subtitler.Renderer.__getOptions(options);
	var style = Subtitler.Renderer.__getStyle(line, options);
	var ignorePositioning = options[Subtitler.Renderer.Options.IGNORE_POSITIONING];
	if(ignorePositioning == undefined) {
		ignorePositioning = Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.IGNORE_POSITIONING];
	}
	var captionsMode = options[Subtitler.Renderer.Options.CAPTIONS_MODE];
	if(captionsMode == undefined) {
		ignorePositioning = Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.IGNORE_POSITIONING];
	}
	var renderScale = options[Subtitler.Renderer.Options.SCALE] || Subtitler.Renderer.DefaultOptions[Subtitler.Renderer.Options.SCALE];
	
	var subtitle = document.createElement('DIV');
	subtitle.className = 'subtitle';
	if( line.id ) {
		subtitle.setAttribute('data-subtitle-id', line.id);
	}
	subtitle.setAttribute('data-layer', (line.layer || 0) + '');
	subtitle.setAttribute('data-render-scale', renderScale);
	
	
	if(!ignorePositioning) {
		subtitle.style.position = 'absolute';
	}
	
	var fontFamily = style.fontFamily;
	var allowedCaptionsModeFonts = ['','','','',''];
	if(!fontFamily || (captionsMode && allowedCaptionsModeFonts.indexOf(fontFamily) == -1)) {
		fontFamily = 'Arial';
	}
	
	// TODO - parse tags like \pos and \mov and style based on that
	
	subtitle.style.fontFamily = fontFamily ? ('"' + fontFamily + '", sans-serif') : '"Arial", sans-serif';
	
	var effectiveFontSize = (style.fontSize * renderScale);
	if(captionsMode && effectiveFontSize < 20) {
		effectiveFontSize = 20;
	}
	if(captionsMode && effectiveFontSize > 20) {
		effectiveFontSize = 20 + ((effectiveFontSize - 20) / 4);
	}
	subtitle.style.fontSize = effectiveFontSize + 'px';

	if(!ignorePositioning) {
		var marginLeftAmount = ((line.marginLeft || style.marginLeft) * renderScale);
		if(captionsMode && marginLeftAmount < 20) {
			marginLeftAmount = 20;
		}
		subtitle.style.paddingLeft = marginLeftAmount + 'px';
		var marginRightAmount = ((line.marginRight || style.marginRight) * renderScale);
		if(captionsMode && marginRightAmount < 20) {
			marginRightAmount = 20;
		}
		subtitle.style.paddingRight = marginRightAmount + 'px';
	}
	var verticalMarginAmount = ((line.marginVertical || style.marginVertical) * renderScale);
	if(captionsMode && verticalMarginAmount < 20) {
		verticalMarginAmount = 20;
	}
	var verticalMargin = verticalMarginAmount + 'px';
	
	if(!ignorePositioning) {
		subtitle.style.maxWidth = 'calc(100% - ' + subtitle.style.marginLeft + ' - ' + subtitle.style.marginRight + ')';
	}
	
	var transform = [];
	
	var alignment = style.alignment;
	if(captionsMode) {
		alignment = Subtitler.Styles.Alignments.BOTTOM;
	}
	if(!ignorePositioning) {
		if(alignment == Subtitler.Styles.Alignments.BOTTOM_LEFT) {
			subtitle.style.left = '0';
			subtitle.style.bottom = '0';
			subtitle.style.marginBottom = verticalMargin;
			subtitle.style.textAlign = 'left';
		}
		if(alignment == Subtitler.Styles.Alignments.LEFT) {
			subtitle.style.left = '0';
			subtitle.style.top = '50%';
			transform.push('translateY(-50%)');
			subtitle.style.textAlign = 'left';
		}
		if(alignment == Subtitler.Styles.Alignments.TOP_LEFT) {
			subtitle.style.left = '0';
			subtitle.style.top = '0';
			subtitle.style.marginTop = verticalMargin;
			subtitle.style.textAlign = 'left';
		}
		
		if(alignment == Subtitler.Styles.Alignments.BOTTOM_RIGHT) {
			subtitle.style.right = '0';
			subtitle.style.bottom = '0';
			subtitle.style.marginBottom = verticalMargin;
			subtitle.style.textAlign = 'right';
		}
		if(alignment == Subtitler.Styles.Alignments.RIGHT) {
			subtitle.style.right = '0';
			subtitle.style.top = '50%';
			transform.push('translateY(-50%)');
			subtitle.style.textAlign = 'right';
		}
		if(alignment == Subtitler.Styles.Alignments.TOP_RIGHT) {
			subtitle.style.right = '0';
			subtitle.style.top = '0';
			subtitle.style.marginTop = verticalMargin;
			subtitle.style.textAlign = 'right';
		}
		
		if(alignment == Subtitler.Styles.Alignments.BOTTOM) {
			subtitle.style.left = '50%';
			subtitle.style.bottom = '0';
			transform.push('translateX(-50%)');
			subtitle.style.marginBottom = verticalMargin;
			subtitle.style.textAlign = 'center';
		}
		if(alignment == Subtitler.Styles.Alignments.CENTER) {
			subtitle.style.left = '50%';
			subtitle.style.top = '50%';
			transform.push('translate(-50%,-50%)');
			subtitle.style.textAlign = 'center';
		}
		if(alignment == Subtitler.Styles.Alignments.TOP) {
			subtitle.style.left = '50%';
			subtitle.style.top = '0';
			transform.push('translateX(-50%)');
			subtitle.style.marginTop = verticalMargin;
			subtitle.style.textAlign = 'center';
		}
	}
	
	// TODO - support ass tags, only basic subtitles currently supported
	
	var innerHTML = '';
	
	var subLines = line.text_plain.split('\n');
	for(var n=0; n<subLines.length; n++) {
		if(n != 0) {
			innerHTML += '<br/>'
		}
		innerHTML += '<div class="subtitle-line">'
						+ '<div class="subtitle-line-shadow">' + subLines[n] + '</div>'
						+ '<div class="subtitle-line-outline">' + subLines[n] + '</div>'
						+ '<div class="subtitle-line-text">' + (subLines[n] == '' ? '&nbsp;' : subLines[n]) + '</div>'
					+ '</div>';
	}
		
	subtitle.style.color = style.colourPrimary.toRGBA();

	subtitle.innerHTML = innerHTML;
	
	if(!captionsMode && style.borderStyle == Subtitler.Styles.BorderType.DEFAULT) {
		subtitle.setAttribute('data-border-style', 'default')
		if(style.outlineWidth > 0) {
			var textOutlines = subtitle.querySelectorAll('.subtitle-line-outline');
			for(var s=0; s<textOutlines.length; s++) {
				var textOutline = textOutlines[s];
				textOutline.style.webkitTextStrokeWidth = (style.outlineWidth * 2 * renderScale) + 'px';
				textOutline.style.webkitTextStrokeColor = style.colourOutline.toRGBA();
				textOutline.style.opacity = '1';
			}
		}
		if(style.shadowOffset > 0) {
			var textShadows = subtitle.querySelectorAll('.subtitle-line-shadow');
			for(var s=0; s<textShadows.length; s++) {
				var textShadow = textShadows[s];
				textShadow.style.webkitTextStrokeWidth = (Math.max(0, style.outlineWidth) * 2 * renderScale) + 'px';
				textShadow.style.webkitTextStrokeColor = style.colourShadow.toRGBA();
				textShadow.style.webkitTextFillColor = style.colourShadow.toRGBA();
				textShadow.style.color = style.colourShadow.toRGBA();
				textShadow.style.top = (style.shadowOffset * renderScale) + 'px';
				textShadow.style.left = (style.shadowOffset * renderScale) + 'px';
				textShadow.style.opacity = '1';
			}
		}
	}
	else if(captionsMode || style.borderStyle == Subtitler.Styles.BorderType.RECTANGLE) {
		subtitle.setAttribute('data-border-style', 'rectangle');
		
		var textOutlines = subtitle.querySelectorAll('.subtitle-line-outline');
		for(var s=0; s<textOutlines.length; s++) {
			var textOutline = textOutlines[s];
			textOutline.style.color = 'transparent';
			if(!captionsMode) {
				textOutline.style.backgroundColor = style.colourOutline.toRGBA();
				textOutline.style.padding = (Math.max(0, style.outlineWidth) * renderScale) + 'px';
				textOutline.style.marginTop = '-' + (Math.max(0, style.outlineWidth) * renderScale) + 	'px';
				textOutline.style.marginLeft = '-' + (Math.max(0, style.outlineWidth) * renderScale) + 'px';
			}
			else {
				textOutline.style.backgroundColor = 'rgba(0,0,0,0.75)';
				textOutline.style.padding = (renderScale * 3) + 'px';
				textOutline.style.marginTop = '-' + (renderScale * 3) + 'px';
				textOutline.style.marginLeft = '-' + (renderScale * 3) + 'px';
			}
			textOutline.style.opacity = '1';
		}
		
		if(!captionsMode && style.shadowOffset > 0) {
			var textShadows = subtitle.querySelectorAll('.subtitle-line-shadow');
			for(var s=0; s<textShadows.length; s++) {
				var textShadow = textShadows[s];
				textShadow.style.color = 'transparent';
				textShadow.style.backgroundColor = style.colourShadow.toRGBA();
				textShadow.style.padding = (Math.max(0, style.outlineWidth) * renderScale) + 'px';
				textShadow.style.marginTop = '-' + (Math.max(0, style.outlineWidth) * renderScale) + 	'px';
				textShadow.style.marginLeft = '-' + (Math.max(0, style.outlineWidth) * renderScale) + 'px';
				textShadow.style.top = (style.shadowOffset * renderScale) + 'px';
				textShadow.style.left = (style.shadowOffset * renderScale) + 'px';
				textShadow.style.opacity = '1';
			}
		}
	}
	
	var subLineNodes = subtitle.querySelectorAll('.subtitle-line');
	for(var s=0; s<subLineNodes.length; s++) {
		subLineNodes[s].style.fontWeight = style.bold ? 'bold' : 'normal';
		subLineNodes[s].style.fontStyle = style.italic ? 'italic' : 'normal';
		//subLineNodes[s].style.textDecoration = style.underline ? 'underline' : 'none';
		subLineNodes[s].style.letterSpacing = style.spacing + 'px';
	}
	
	if(!captionsMode && (style.scaleX != 100 || style.scaleY != 100)) {
		transform.push('scale(' + (style.scaleX/100) + ',' + (style.scaleY/100) + ')');
	}
	if(!captionsMode && style.rotation) {
		transform.push('rotate(' + (0 - style.rotation) + 'deg)');
	}
	if(transform.length > 0) {
		subtitle.style.transform = transform.join(' ');
	}

	return subtitle;
}