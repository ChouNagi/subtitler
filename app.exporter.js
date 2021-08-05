Subtitler = window.Subtitler || { };
Subtitler.Exporter = Subtitler.Exporter || { };

Subtitler.Exporter.toASS = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.ASS);
}
Subtitler.Exporter.toSBV = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.SBV);
}
Subtitler.Exporter.toSRT = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.SRT);
}
Subtitler.Exporter.toVTT = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.VTT);
}
Subtitler.Exporter.toYTT = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.YTT);
}
Subtitler.Exporter.toJSON = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.JSON);
}
Subtitler.Exporter.toTXT = function( ) {
	return Subtitler.Exporter.save(Subtitler.FileTypes.TXT);
}

Subtitler.Exporter.save = function( format ) {
	var mimetype = Subtitler.FileTypes.toMimeType(format);
	var fileExtension = Subtitler.FileTypes.toFileExtension(format) || format;
	var filename = Subtitler.Exporter.__setFileExtension(Subtitler.Info.filename || Subtitler.Info.title || 'untitled', fileExtension);
	var filecontents = Subtitler.Exporter.__convert(format);
	Subtitler.Exporter.__saveToFile( filename, mimetype, filecontents);
}

Subtitler.Exporter.__setFileExtension = function( filename, extension ) {
	
	if(extension && extension.length > 0 && extension.charAt(0) != '.') {
		extension = '.' + extension;
	}
	
	if(filename.endsWith(extension)) {
		return filename;
	}
	
	// remove existing extension (example.ass -> example) 
	if(/(?:[^.]+)*[^.]+\.[^.]{1,6}$/.test(filename)) {
		filename = filename.replace(/\.[^.]+$/, '');
	}
	
	return filename + extension;
}

Subtitler.Exporter.__saveToFile = function( filename, mimetype, filecontents ) {
	var blob = new Blob([filecontents], { type: mimetype });
	var fileUrl = URL.createObjectURL(blob);
	var downloadLink = document.createElement('A');
	downloadLink.setAttribute('download', filename); 
	downloadLink.href = fileUrl;
	downloadLink.click();
}

Subtitler.Exporter.__convert = function( format ) {
	
	var filecontents;
	if(format == Subtitler.FileTypes.ASS) {
		filecontents = Subtitler.Exporter.__convertToASS();
	}
	else if(format == Subtitler.FileTypes.SBV) {
		filecontents = Subtitler.Exporter.__convertToSBV();
	}
	else if(format == Subtitler.FileTypes.SRT) {
		filecontents = Subtitler.Exporter.__convertToSRT();
	}
	else if(format == Subtitler.FileTypes.VTT) {
		filecontents = Subtitler.Exporter.__convertToVTT();
	}
	else if(format == Subtitler.FileTypes.YTT) {
		filecontents = Subtitler.Exporter.__convertToYTT();
	}
	else if(format == Subtitler.FileTypes.JSON) {
		filecontents = Subtitler.Exporter.__convertToJSON();
	}
	else if(format == Subtitler.FileTypes.TXT) {
		filecontents = Subtitler.Exporter.__convertToTXT();
	}
	else {
		throw new UnrecognisedExportFormatException(format);
	}
	
	filecontents = Subtitler.Exporter.__convertLineEndings(filecontents);
	
	return filecontents;
}

Subtitler.Exporter.__convertToASS = function( ) {
	
	var outputLines = [ ];
	outputLines.push('[Script Info]');
	outputLines.push('; Script generated by Subtitler WebApp ' + Subtitler.version);
	if(Subtitler.url) {
		outputLines.push('; ' + (Subtitler.url || ''));
	}
	outputLines.push('Title: ' + (Subtitler.Info.filename || 'Default Aegisub file'));
	outputLines.push('ScriptType: v4.00+');
	outputLines.push('WrapStyle: 0');
	outputLines.push('ScaledBorderAndShadow: yes');
	outputLines.push('YCbCr Matrix: TV.601');
	outputLines.push('PlayResX: ' + Subtitler.Info.playResX || Subtitler.Video.naturalWidth || 1920);
	outputLines.push('PlayResY: ' + Subtitler.Info.playResY || Subtitler.Video.naturalHeight || 1080);
	outputLines.push('');
	
	outputLines.push('[Aegisub Project Garbage]');
	if(Subtitler.Video.filename) {
		outputLines.push('Audio File: ' + Subtitler.Garbage.audioFile);
		outputLines.push('Video File: ' + Subtitler.Garbage.videoFile);
	}
	outputLines.push('Video AR Mode: 4');
	
	var aspectRatio;
	if(Subtitler.Info.playResX && Subtitler.Info.playResY) {
		aspectRatio = Subtitler.Info.playResX / Subtitler.Info.playResY;
	}
	else if(Subtitler.Video.naturalWidth && Subtitler.Video.naturalHeight) {
		aspectRatio = Subtitler.Video.naturalWidth / Subtitler.Video.naturalHeight;
	}
	else {
		aspectRatio = 1.777778;
	}
	
	aspectRatio = Math.round(aspectRatio * 1000000) / 1000000;
	outputLines.push('Video AR Value: ' + aspectRatio);
	
	if(Subtitler.Video.width && Subtitler.Video.naturalWidth) {
		outputLines.push('Video Zoom Percent: ' + (Math.round(Subtitler.Video.width * 1000000 / Subtitler.Video.naturalWidth) / 1000000));
	}
	
	var scrollPosition = (document.querySelector('.subtitle-list-content').scrollTop / document.querySelector('.subtitle-list-content .subtitle-list-element').clientHeight) | 0;
	if(scrollPosition >= Subtitler.Lines.list.length) {
		scrollPosition = Subtitler.Lines.list.length -1;
	}
	if(scrollPosition < 0) {
		scrollPosition = 0;
	}
	
	// TODO - Scroll Position: 39 (presumably which line is the first visible)
	outputLines.push('Scroll Position: ' + scrollPosition);
	if(Subtitler.Lines.map[Subtitler.LineEditor.lineId]) {
		outputLines.push('Active Line: ' + Subtitler.Lines.map[Subtitler.LineEditor.lineId].lineno);
	}
	// TODO - video position (probably best to ignore this as it's the frame of the video)
	outputLines.push('');
	
	outputLines.push('[V4+ Styles]');
	outputLines.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding');

	for(var s=0; s<Subtitler.Styles.list.length; s++) {
		var style = Subtitler.Styles.list[s];
		
		outputLines.push(
			'Style: '
			+ style.name + ','
			+ style.fontFamily + ','
			+ style.fontSize + ','
			+ style.colourPrimary.toAegisubBGRA() + ','
			+ style.colourSecondary.toAegisubBGRA() + ','
			+ style.colourOutline.toAegisubBGRA() + ','
			+ style.colourShadow.toAegisubBGRA() + ','
			+ (style.bold ? '1' : '0') + ','
			+ (style.italic ? '1' : '0') + ','
			+ (style.underline ? '1' : '0') + ','
			+ (style.strikeout ? '1' : '0') + ','
			+ style.scaleX + ','
			+ style.scaleY + ','
			+ style.spacing + ','
			+ style.rotation + ','
			+ style.borderStyle + ','
			+ style.outlineWidth + ','
			+ style.shadowOffset + ','
			+ style.alignment + ','
			+ style.marginLeft + ','
			+ style.marginRight + ','
			+ style.marginVertical + ','
			+ style.encoding
		);
	}
	outputLines.push('');

	outputLines.push('[Events]');
	outputLines.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');
	
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		
		var lineType = (line.isComment ? 'Comment' : 'Dialogue');
		var layer = line.layer || 0;
		var start = Subtitler.Formatting.formatTimeASS(line.start);
		var end = Subtitler.Formatting.formatTimeASS(line.end);
		var style = (Subtitler.Styles.map[line.style] || { }).name || line.style || '';
		var name = line.actor || '';
		var marginLeft = line.marginLeft || 0;
		var marginRight = line.marginRight || 0;
		var marginVertical = line.marginVertical || 0;
		var effect = line.effect || ''; // TODO
		var text = line.text_src;
		
		outputLines.push(
			lineType + ': '
			+ layer + ','
			+ start + ','
			+ end + ','
			+ style + ',' 
			+ name + ','
			+ marginLeft + ','
			+ marginRight + ','
			+ marginVertical + ','
			+ effect + ','
			+ text
		);
	}
	outputLines.push('')
	
	return outputLines.join('\n');
}
Subtitler.Exporter.__convertToSBV = function( ) {
	var outputLines = [ ];
	outputLines.push('[INFORMATION]')
	if(Subtitler.Info.hasOwnProperty('delay')) {
		outputLines.push('[DELAY]' + Subtitler.Info.delay);
	}
	if(Subtitler.Info.hasOwnProperty('author')) {
		outputLines.push('[AUTHOR]' + Subtitler.Info.author);
	}
	if(Subtitler.Info.hasOwnProperty('title')) {
		outputLines.push('[TITLE]' + Subtitler.Info.title);
	}
	outputLines.push('[END INFORMATION]');
	outputLines.push('[SUBTITLE]');
	outputLines.push(
		'[COLF]' + Subtitler.Styles.DefaultStyle.colourPrimary.toAegisubBGR() + ','
		+ '[SIZE]' + Subtitler.Styles.DefaultStyle.fontSize + ','
		+ '[FONT]' + Subtitler.Styles.DefaultStyle.fontFamily
	);
	outputLines.push('');
	
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line.isComment) {
			continue;
		}
		outputLines.push(
			Subtitler.Formatting.formatTimeSBV(line.start)
			+ ','
			+ Subtitler.Formatting.formatTimeSBV(line.end)
		);
		var textContent = line.text_plain.split(/(?:\n|\[br\])/g);
		for(var t=0; t<textContent.length; t++) {
			outputLines.push(
				(line.actor ? ('>> ' + line.actor + ': ') : '')
				+ textContent[t]
			);
		}
		outputLines.push('');
	}
	return outputLines.join('\n');
}

Subtitler.Exporter.__convertToSRT = function( ) {
	var outputLines = [ ];
	var nonCommentLineCount = 0;
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line.isComment) {
			continue;
		}
		nonCommentLineCount += 1;
		outputLines.push(nonCommentLineCount + '');
		outputLines.push(
			Subtitler.Formatting.formatTimeSRT(line.start)
			+ ' --> '
			+ Subtitler.Formatting.formatTimeSRT(line.end)
		);
		var textContent = line.text_plain.split('\n');
		for(var t=0; t<textContent.length; t++) {
			outputLines.push(textContent[t])
		}
		outputLines.push('');
	}
	return outputLines.join('\n');
	
}

Subtitler.Exporter.__convertToTXT = function( ) {
	var outputLines = [ ];
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line.isComment) {
			continue;
		}
		outputLines.push(
			Subtitler.Formatting.formatTimeSBV(line.start)
			+ ','
			+ Subtitler.Formatting.formatTimeSBV(line.end)
		);
		var textContent = line.text_plain.split('\n');
		for(var t=0; t<textContent.length; t++) {
			outputLines.push(textContent[t])
		}
		outputLines.push('');
	}
	return outputLines.join('\n');
	
}

Subtitler.Exporter.__convertToVTT = function( ) {
	var outputLines = [ ];
	
	outputLines.push('WEBVTT' + (Subtitler.Info.title ? (' - ' + Subtitler.Info.title) : ''));
	outputLines.push('');
	
	// TODO - styling
	
	var nonCommentLineCount = 0;
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line.isComment) {
			continue;
		}
		nonCommentLineCount += 1;
		outputLines.push(nonCommentLineCount + '');
		outputLines.push(
			Subtitler.Formatting.formatTimeSRT(line.start)
			+ ' --> '
			+ Subtitler.Formatting.formatTimeSRT(line.end)
		);
		var textContent = line.text_plain.split('\n');
		for(var t=0; t<textContent.length; t++) {
			outputLines.push('- ' + textContent[t])
		}
		outputLines.push('');
	}
	return outputLines.join('\n');
}

Subtitler.Exporter.__convertToYTT = function( ) {
	
	// set to "1" to enable
	// b - bold
	// i - italic
	// u - underline
	
	// fc - text colour (#010101 - #FEFEFE)
	// fo - text colour (0-254)
	
	// bc - bg colour (#010101 - #FEFEFE)
	// bo - bg opacity (0-254)
	
	
	// ec - (#010101 - #FEFEFE)
	
	// et
	var EdgeType = {
		HARD_SHADOW: 1,
		BEVEL: 2,
		OUTLINE: 3,
		SOFT_SHADOW: 4
	};
	
	// fs
	var Font = {
		'Default': 0,
		'Courier New': 1,
		'monospace': 1,
		'Times New Roman': 2,
		'serif': 2,
		'Lucida Console': 3,
		'Roboto': 4,
		'sans-serif': 4,
		'Comic Sans MS': 5,
		'Monotype Corsiva': 6,
		'Carrois Gothic SC': 7
	};
	
	var defaultFontSize = 20;
	// fz - font size (relative to Default size)
	// 50 = 75%
	// 100 = 100% Default size
	// 200 = 125%
	// 300 = 150%
	
	// rb
	var RubyText = {
		RUBY: 1,
		RUBY_PARENTHESIS: 2,
		RUBY_OVER: 4,
		RUBY_UNDER: 5
	};
	
	// of
	var PositionalScaling = {
		SUBSCRIPT: 0,
		REGULAR: 1,
		SUPERSCRIPT: 2
	};
	
	// ju
	var HorizontalAlignment = {
		LEFT: 0,
		RIGHT: 1,
		CENTER: 2
	};
	
	// pd + sd = for vertical text
	
	// ap
	var ANCHOR = {
		TOP_LEFT: 0,
		TOP: 1,
		TOP_RIGHT: 2,
		LEFT: 3,
		CENTER: 4,
		RIGHT: 5,
		BOTTOM_LEFT: 6,
		BOTTOM: 7,
		BOTTOM_RIGHT: 8
	};
	
	// ah - x coord (0 to 100)
	// av - y coord (0 to 100)
	
	
	// TODO - richtext segments
	
	// TODO - work out which styles are needed
	
	var outputLines = [ ];
	
	outputLines.push('<?xml version="1.0" encoding="utf-8" ?>');
	outputLines.push('<timedtext format="3">');
	outputLines.push('<head>');
	
	// TODO - <pen>
	// TODO - <ws>
	// TODO - <wp>
	
	outputLines.push('</head>');
	outputLines.push('<body>');
	
	for(var n=0; n<Subtitler.Lines.length; n++) {
		var line = Subtitler.Lines[n];
		
		// TODO - one <p> tag per line with ws="id" and wp="id" corresponding to the above
		// parts within the line are represented as <s> tags with a p="id" corresponding to the <pen> above
		// if multiple <s> tags are needed (ie, parts within the line are styled differently)
		
		// currently just a really crude
		outputLines.push('<p t="' + Math.round(line.start * 1000) + '" d="' + Math.round(line.duration * 1000) + '"><s>' + line.text_plain + '</s></p>');
	}
	
	outputLines.push('</body>');
	outputLines.push('</timedtext>');
	return outputLines.join('\n');
}

Subtitler.Exporter.__convertToJSON = function( ) {
	var simplifiedLines = [ ];
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		var lineSimplified = { };
		
		if(line.actor) {
			lineSimplified.actor = line.actor;
		}
		if(line.layer) {
			lineSimplified.layer = line.layer;
		}
		lineSimplified.style = line.style;
		lineSimplified.text_src = line.text_src;
		lineSimplified.start = line.start;
		
		simplifiedLines.push(lineSimplified);
	}
	var object = { styles: Subtitler.Styles.list, info: Subtitler.Info, lines: simplifiedLines };
	return JSON.stringify(object);
}

Subtitler.Exporter.__convertLineEndings = function( filecontents ) {
	return filecontents.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
}