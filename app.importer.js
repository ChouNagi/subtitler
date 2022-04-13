Subtitler = window.Subtitler || { };
Subtitler.Importer = Subtitler.Importer || { };

Subtitler.Importer.load = function( contents, format, filename ) {
	if(format == Subtitler.FileTypes.ASS) {
		return Subtitler.Importer.fromASS(contents, false, filename);
	}
	if(format == Subtitler.FileTypes.SBV) {
		return Subtitler.Importer.fromSBV(contents, false, filename);
	}
	if(format == Subtitler.FileTypes.SRT) {
		return Subtitler.Importer.fromSRT(contents, false, filename);
	}
	if(format == Subtitler.FileTypes.VTT) {
		return Subtitler.Importer.fromVTT(contents, false, filename);
	}
	if(format == Subtitler.FileTypes.YTT) {
		return Subtitler.Importer.fromYTT(contents, false, filename);
	}
	if(format == Subtitler.FileTypes.JSON) {
		return Subtitler.Importer.fromJSON(contents, false, filename);
	}
	
	var json = Subtitler.Importer.__parseSRT(contents);
	if(!json.fatalErrors) {
		return Subtitler.Importer.fromJSON(json, false, filename);
	}
	
	json = Subtitler.Importer.__parseSBV(contents);
	if(!json.fatalErrors) {
		return Subtitler.Importer.fromJSON(json, false, filename);
	}
	
	json = Subtitler.Importer.__parseCustomFormat(contents);
	if(!json.fatalErrors) {
		return Subtitler.Importer.fromJSON(json, false, filename);
	}
	
	Subtitler.Popup.show(
		Subtitler.Translations.get('unknownImportWarningPopupTitle'),
		Subtitler.Translations.get('unknownImportWarningPopupMessage'),
		[
			{
				label: Subtitler.Translations.get('unknownImportWarningPopupButtonAbort'),
				callback: function() {
					// abort
				}
			},
			{
				label: Subtitler.Translations.get('unknownImportWarningPopupButtonProceed'),
				callback: function() {
					var json = Subtitler.Importer.__parseUnknown(contents);
					Subtitler.Importer.fromJSON(json, false, filename);
				}
			},
		]
	);
}

Subtitler.Importer.fromSRT = function( srt, strict, filename ) {
	var json = Subtitler.Importer.__parseSRT(srt, strict);
	return Subtitler.Importer.fromJSON(json, strict, filename);
}

Subtitler.Importer.fromSBV = function( sbv, strict, filename ) {
	var json = Subtitler.Importer.__parseSBV(sbv, strict);
	return Subtitler.Importer.fromJSON(json, strict, filename);
}

Subtitler.Importer.fromASS = function( ass, strict, filename ) {
	var json = Subtitler.Importer.__parseASS(ass, strict);
	return Subtitler.Importer.fromJSON(json, strict, filename);
}

Subtitler.Importer.fromVTT = function( vtt, strict, filename ) {
	var json = Subtitler.Importer.__parseVTT(vtt, strict);
	return Subtitler.Importer.fromJSON(json, strict, filename);
}
Subtitler.Importer.fromYTT = function( ytt, strict, filename ) {
	var json = Subtitler.Importer.__parseYTT(ytt, strict);
	return Subtitler.Importer.fromJSON(json, strict, filename);
}

Subtitler.Importer.fromJSON = function( json, strict, filename ) {
	
	if( typeof json == 'string' ) {
		try {
			json = JSON.parse(json);
		}
		catch(e) {
			json = {
				'errors': ['JSON parse exception'],
				'fatalErrors': ['JSON parse exception']
			};
		}
	}
	
	if(json.fatalErrors) {
		Subtitler.Popup.show(
			Subtitler.Translations.get('fatalImportErrorPopupTitle'),
			(Subtitler.Translations.get('fatalImportErrorPopupMessage') || '').replace('{errorList}', (json.errors || [ ]).join('\n')),
			[
				{
					label: Subtitler.Translations.get('fatalImportErrorPopupButtonAbort'),
					callback: function() {
						// abort
					}
				}
			]
		);
		return;
	}
	
	if(json.errors && false) {
		// TODO - if import strict, show error popup
		return;
	}
	
	if(json.errors) {
		// TODO - if correctable errors and import show popup, show warning popup
		
		if(Subtitler.Settings.onRecoverableImportError == 'popup') {
			Subtitler.Popup.show(
				Subtitler.Translations.get('recoverableImportErrorPopupTitle'),
				(Subtitler.Translations.get('recoverableImportErrorPopupMessage') || '').replace('{errorList}', (json.errors || [ ]).join('\n')),
				[
					{
						label: Subtitler.Translations.get('recoverableImportErrorPopupButtonAbort'),
						callback: function() {
							// abort
						}
					},
					{
						label: Subtitler.Translations.get('recoverableImportErrorPopupButtonProceed'),
						callback: function() {
							Subtitler.Importer.__checkActorThenLoad(json, filename);
						}
					},
				]
			);
		}
		else if(Subtitler.Settings.onRecoverableImportError == 'autocorrect') {
			Subtitler.Importer.__checkActorThenLoad(json, filename);
		}
		else if(Subtitler.Settings.onRecoverableImportError == 'abort') {
			alert('TODO - abort popup');
			return;
		}
	}
	else {
		Subtitler.Importer.__checkActorThenLoad(json, filename);
	}
	
}

Subtitler.Importer.__checkAutoTranscribedConfidenceCommentsThenLoad = function( json, filename ) {
	
	var confidenceRegex = /^\s*confidence(?::|\s)\s*\d+(?:\.\d+)?%?\s*$/i;
	var commentsMatchingConfidenceRegex = 0;
	for(var n=0; n<json.lines.length; n++) {
		if(json.lines[n].isComment && confidenceRegex.test(json.lines[n].text_src || '')) {
			commentsMatchingConfidenceRegex += 1;
		}
	}
	if(json.lines.length > 0 && commentsMatchingConfidenceRegex > 5 && (commentsMatchingConfidenceRegex/json.lines.length) > 0.25) {
		// TODO - only show popup if settings require it
		Subtitler.Popup.show(
			Subtitler.Translations.get('autotranscribedWarningPopupTitle'),
			Subtitler.Translations.get('autotranscribedWarningPopupMessage'),
			[
				{
					label: Subtitler.Translations.get('autotranscribedWarningPopupButtonNo'),
					callback: function() {
						Subtitler.Importer.__load(json, filename);
					}
				},
				{
					label: Subtitler.Translations.get('autotranscribedWarningPopupButtonYes'),
					callback: function() {
						var linesToKeep = [ ];
						for(var n=0; n<json.lines.length; n++) {
							if(json.lines[n].isComment && confidenceRegex.test(json.lines[n].text_src || '')) {
								continue;
							}
							linesToKeep.push(json.lines[n]);
						}
						json.lines = linesToKeep;
						Subtitler.Importer.__load(json, filename);
					}
				}
			]
		);
	}
	else {
		Subtitler.Importer.__load(json, filename);
	}
}

Subtitler.Importer.__checkActorThenLoad = function( json, filename ) {
	var linesStartingWithActorPrefix = 0;
	for(var n=0; n<json.lines.length; n++) {
		if(json.lines[n].text_src.startsWith('>> ')) {
			linesStartingWithActorPrefix += 1;
		}
	}
	
	if(json.lines.length > 0 && linesStartingWithActorPrefix/json.lines.length > 0.5) {
		// TODO - only show popup if settings require it
		Subtitler.Popup.show(
			Subtitler.Translations.get('actorWarningPopupTitle'),
			Subtitler.Translations.get('actorWarningPopupMessage'),
			[
				{
					label: Subtitler.Translations.get('actorWarningPopupButtonNo'),
					callback: function() {
						Subtitler.Importer.__checkAutoTranscribedConfidenceCommentsThenLoad(json, filename);
					}
				},
				{
					label: Subtitler.Translations.get('actorWarningPopupButtonYes'),
					callback: function() {
						for(var n=0; n<json.lines.length; n++) {
							json.lines[n].text_src = json.lines[n].text_src.replace(/^>> /, '');
						}
						Subtitler.Importer.__checkAutoTranscribedConfidenceCommentsThenLoad(json, filename);
					}
				}
			]
		);
	}
	else {
		Subtitler.Importer.__checkAutoTranscribedConfidenceCommentsThenLoad(json, filename);
	}
}

Subtitler.Importer.__load = function( json, filename ) {
	Subtitler.Importer.__loadInfo(json.info);
	Subtitler.Info.filename = filename || 'unknown';
	document.querySelector('.subtitle-file-name').textContent = Subtitler.Info.filename;
	Subtitler.Importer.__loadStyles(json.styles);
	Subtitler.Importer.__loadLines(json.lines);
	Subtitler.Importer.__loadGarbage(json.garbage);
}

Subtitler.Importer.__loadInfo = function( info ) {
	Subtitler.Info.reset();
	for(var prop in info) {
		Subtitler.Info[prop] = info[prop];
	}
}
Subtitler.Importer.__loadGarbage = function( garbage ) {
	
	var unloadVideo = false;
	var unloadAudio = false;
	
	// TODO
	// if currently has video and garbage has no video, show popup asking if they want to unload the video
	// if currently has video and garbage has dummy video, show popup asking if they want to load the dummy video
	// if currently has video and garbage has video with matching file name, skip popup
	// if currently has video and garbage has video with different file name, show popup asking if they want to unload the video and showing the name of the video file that it's expecting
	
	// reset garbage properties to default (skipping video properties if necessary)
	for(var prop in Subtitler.Garbage) {
		if(Subtitler.Garbage.hasOwnProperty(prop) && typeof Subtitler.Garbage[prop] != 'function') {
			if(!unloadVideo && (prop == 'audioFile' || prop == 'dummyVideo')) {
				continue;
			}
			if(!unloadAudio && prop == 'audioFile') {
				continue;
			}
			delete Subtitler.Garbage[prop];
		}
	}
	
	if(garbage) {
		// TODO - set non video properties
		
		if(Subtitler.Garbage.videoZoom) {
			Subtitler.Video.zoomDropdown.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: Subtitler.Garbage.videoZoom }}));
			Subtitler.Video.zoomDropdown.dispatchEvent(new CustomEvent('value-modified', { bubbles: true, cancelable: true, detail: { value: Subtitler.Garbage.videoZoom }}));
		}
		
		if(Subtitler.Garbage.activeLine) {
			Subtitler.Lines.selectLine(garbage.activeLine);
		}
	}
}

Subtitler.Importer.__loadStyles = function( styles ) {
	Subtitler.Styles.list = [ ];
	Subtitler.Styles.map = { };
	if( styles == null || styles.length == 0 ) {
		styles = [ Subtitler.Styles.DefaultStyle ];
	}
	for(var s=0; s<styles.length; s++) {
		Subtitler.Styles.newStyle(styles[s]);
	}
	
	Subtitler.LineEditor.updateStylesDropdown();
}

Subtitler.Importer.__loadLines = function( lines ) {
	Subtitler.Lines.list = [ ];
	Subtitler.Lines.map = { };
	for(var n=0; n<lines.length; n++) {
		var line = lines[n];
		var lineCopy = {
			start: line.start,
			end: line.end,
			text_src: line.text_src,
			lineno: n,
			layer: (line.layer || 0),
			isComment: line.isComment || false,
			style: line.style || Subtitler.Styles.DefaultStyle.name
		}
		Subtitler.Lines.list.push(lineCopy);
	}
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		Subtitler.Lines.__recompute(Subtitler.Lines.list[n]);
	}
	
	var html = Subtitler.Lines.renderLines();
	Subtitler.Lines.__checkIfActorPresent();
	
	Subtitler.Lines.listElement.innerHTML = html;
	Subtitler.Lines.listElement.appendChild(Subtitler.Lines.insertLineAtEndButton); // move button to bottom
	
	Subtitler.Lines.selectLine(Subtitler.Lines.list[0]);
}

function ParseException(lineNumber, message) {
	this.lineNumber = lineNumber;
	this.message = message;
	// Use V8's native method if available, otherwise fallback
	if ("captureStackTrace" in Error)
		Error.captureStackTrace(this, ParseException);
	else
		this.stack = (new Error()).stack;
}

ParseException.prototype = Object.create(Error.prototype);
ParseException.prototype.name = "ParseException";
ParseException.prototype.constructor = ParseException;

Subtitler.Importer.__map = function( map, propertyName, propertyValue, section, errorFunction, lineNo ) {
	
	var error = errorFunction || function() { };
	
	var value = propertyValue;
	var mapping = map[propertyName];
	
	if(!mapping) {
		error(section, lineNo, 'Line ' + lineNo + ': ' + 'Unrecognised property "' + propertyName + '" with value "' + value + '" was ignored');
		return;
	}
	
	if(mapping.type == 'string') {
		
		if(mapping.expect) {
			if(typeof mapping.expect == 'string') {
				if(mapping.expect != value) {
						error(section, lineNo, 'Line ' + lineNo + ': ' + 'String property "' + propertyName + '" had incorrect value "' + value + '". Expected "' + mapping.expect + '"');
				}
			}
			else if(mapping.expect instanceof Array) {
				var matchesExpectation = false;
				for(var e=0; e<mapping.expect.length; e++) {
					if(mapping.expect[e] == value) {
						matchesExpectation = true;
						break;
					}
				}
				if(!matchesExpectation) {
						error(section, lineNo, 'Line ' + lineNo + ': ' + 'String property "' + propertyName + '" had incorrect value "' + value + '". Expected "' + mapping.expect.join('" or "') + '"');
				}
			}
		}
		
		if(mapping.prop != null) {
			section[mapping.prop] = value;
		}
	}
	else if(mapping.type == 'boolean') {
		if(/^(?:yes|no|-?1|0|true|false)$/.test(value.toLowerCase())) {
			
			if(mapping.expect) {
				
				if(typeof mapping.expect == 'string') {
					if(mapping.expect != value) {
						error(section, lineNo, 'Line ' + lineNo + ': ' + 'Boolean property "' + propertyName + '" had incorrect value "' + value + '". Expected "' + mapping.expect + '"');
					}
				}
				else if(mapping.expect instanceof Array) {
					var matchesExpectation = false;
					for(var e=0; e<mapping.expect.length; e++) {
						if(mapping.expect[e] == value) {
							matchesExpectation = true;
							break;
						}
					}
					if(!matchesExpectation) {
						error(section, lineNo, 'Line ' + lineNo + ': ' + 'Boolean property "' + propertyName + '" had incorrect value "' + value + '". Expected "' + mapping.expect.join('" or "') + '"');
					}
				}
			}
			
			
			var booleanValue;
			if(value.toLowerCase() == 'yes'
				|| value.toLowerCase() == '1'
				|| value.toLowerCase() == '-1'
				|| value.toLowerCase() == 'true') {
				booleanValue = true;
			}
			else {
				booleanValue = false;
			}
			
			if(mapping.prop != null) {
				section[mapping.prop] = booleanValue
			}
		}
		else {
			error(section, lineNo, 'Line ' + lineNo + ': ' + 'Boolean property "' + propertyName + '" had non boolean value "' + value + '". Expected 1 or 0');
			section[mapping.prop] = false;
		}
	}
	else if(mapping.type == 'int' || mapping.type == 'integer') {
		if(!/^[0-9]+$/.test(value)) {
			error(section, lineNo, 'Line ' + lineNo + ': ' + 'Integer property "' + propertyName + '" had non integer value "' + value + '"');
		}
		if(!isNaN(value * 1)) {
			section[mapping.prop] = (value * 1) | 0;
		}
		else {
			section[mapping.prop] = 0;
		}
	}
	else if(mapping.type == 'number' || mapping.type == 'float' || mapping.type == 'double' || mapping.type == 'decimal') {
		if(!/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
			error(section, lineNo, 'Line ' + lineNo + ': ' + 'Numeric property "' + propertyName + '" had non numeric value "' + value + '"');
		}
		if(!isNaN(value * 1)) {
			section[mapping.prop] = value * 1;
		}
		else {
			section[mapping.prop] = 0;
		}
	}
	else if(mapping.type == 'colour' || mapping.type == 'color') {
		
		var colour = Subtitler.Styles.Colour.aegisubABGR(value);
		if(colour == undefined) {
			colour = Subtitler.Styles.Colour.aegisubBGR(value);
		}
		if(colour == undefined) {
			error(section, lineNo, 'Line ' + lineNo + ': ' + 'Colour property "' + propertyName + '" had non colour value "' + value + '"');
		}
		section[mapping.prop] = colour;
	}
}

Subtitler.Importer.__parseASS = function( filecontents, strict ) {
	try {
		var State = {
			ExpectSection: 0,
			ExpectInfo: 1,
			ExpectProjectGarbage: 2,
			ExpectStyles: 3,
			ExpectEvents: 4
		};
		
		var info = { };
		var garbage = { };
		var styles = [ ];
		var lines = [ ];
		
		var parsedSubtitles = {
			info: info,
			garbage: garbage,
			styles: styles,
			lines: lines
		}
		
		var Sections = {
			INFO: 0,
			PROJECT_GARBAGE: 1,
			STYLES: 2,
			EVENTS: 3
		}
		
		var sectionsAlreadyUsed = [ ];
		
		var errors = [ ];
		
		var error = function(line, lineno, message) {
			if(strict) {
				throw new ParseException(lineno, message);
			}
			else {
				errors.push(message);
				if(line) {
					line.errors = line.errors || [ ];
					line.errors.push(message);
				}
			}
		}
		
		var styleFormat = null;
		var eventFormat = null;
		
		var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
		
		var atLeastOneNewlineSinceLastStatement = true;
		
		var parserState = State.ExpectSection;
		for(var n=0; n<filelines.length; n++) {
			var fileline = filelines[n];
			
			// empty line / comment
			if(fileline.trim() == '' || fileline.startsWith(';')) {
				atLeastOneNewlineSinceLastStatement = true;
				continue;
			}
			
			if(fileline.trim().toLowerCase() == '[script info]') {
				if(!atLeastOneNewlineSinceLastStatement) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at least one empty line between sections');
				}
				if(sectionsAlreadyUsed.indexOf(Sections.INFO) != -1) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one [Script Info] section');
				}
				else {
					sectionsAlreadyUsed.push(Sections.INFO);
				}
				parserState = State.ExpectInfo;
				atLeastOneNewlineSinceLastStatement = false;
				continue;
			}
			
			if(fileline.trim().toLowerCase() == '[aegisub project garbage]') {
				if(!atLeastOneNewlineSinceLastStatement) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at least one empty line between sections');
				}
				if(sectionsAlreadyUsed.indexOf(Sections.PROJECT_GARBAGE) != -1) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one [Aegisub Project Garbage] section');
				}
				else {
					sectionsAlreadyUsed.push(Sections.PROJECT_GARBAGE);
				}
				parserState = State.ExpectProjectGarbage;
				atLeastOneNewlineSinceLastStatement = false;
				continue;
			}
			
			if(fileline.trim().toLowerCase() == '[v4+ styles]') {
				if(!atLeastOneNewlineSinceLastStatement) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at least one empty line between sections');
				}
				if(sectionsAlreadyUsed.indexOf(Sections.STYLES) != -1) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one [V4+ Styles] section');
				}
				else {
					sectionsAlreadyUsed.push(Sections.STYLES);
				}
				parserState = State.ExpectStyles;
				atLeastOneNewlineSinceLastStatement = false;
				continue;
			}
			if(fileline.trim().toLowerCase() == '[events]') {
				if(!atLeastOneNewlineSinceLastStatement) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at least one empty line between sections');
				}
				if(sectionsAlreadyUsed.indexOf(Sections.EVENTS) != -1) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one [Events] section');
				}
				else {
					sectionsAlreadyUsed.push(Sections.EVENTS);
				}
				parserState = State.ExpectEvents;
				atLeastOneNewlineSinceLastStatement = false;
				continue;
			}

			
			var parts = fileline.split(/: /);
			
			
			// INFO STATEMENTS
			
			var infoMapping = {
				'Title': { prop: 'title', type: 'string' },
				'ScriptType': { prop: null, type: 'string', expect: 'v4.00+' },
				'ScaledBorderAndShadow': { prop: 'scaledBorderAndShadow', type: 'boolean', expect: ['yes','no'] },
				'YCbCr Matrix': { prop: 'matrix', type: 'string', expect: ['None','TV.601','PC.601','TV.709','PC.709','TV.FCC','PC.FCC','TV.240M','PC.240M'] },
				'Original Script': { prop: 'originalScript', type: 'string' },
				'Original Translation': { prop: 'translation', type: 'string' },
				'Original Editing': { prop: 'editing', type: 'string' },
				'Original Timing': { prop: 'timing', type: 'string' },
				'Synch Point': { prop: 'syncPoint', type: 'string' },
				'Script Updated By': { prop: 'updatedBy', type: 'string' },
				'Update Details': { prop: 'updateDetails', type: 'string' },
				'PlayResX': { prop: 'playResX', type: 'int' },
				'PlayResY': { prop: 'playResY', type: 'int' },
				'WrapStyle': { prop: 'wrapStyle', type: 'int' }
			}
			
			if(infoMapping.hasOwnProperty(parts[0])) {
				if(parserState != State.ExpectInfo) {
					error(info, (n+1), 'Line ' + (n+1) + ': ' + parts[0] + ' statement outside [Script Info] section');
				}
				var propertyName =  parts[0];
				var value = parts.slice(1).join(': ');
				
				Subtitler.Importer.__map(infoMapping, propertyName, value, info, error, n+1);
				
				parserState = State.ExpectInfo;
				continue;
			}
			else if(parserState == State.ExpectInfo) {
				error(info, (n+1), 'Line ' + (n+1) + ': Unrecognised ' + parts[0] + ' statement inside [Script Info] section. Should this be ignored?');
			}


			// GARBAGE STATEMENTS
			
			var garbageMapping = {
				'Last Style Storage': { prop: 'lastStyleStorage', type: 'string' },
				'Audio File': { prop: 'audioFile', type: 'string' },
				'Video File': { prop: 'videoFile', type: 'string' },
				'Video AR Mode': { prop: 'aspectRatioMode', type: 'int' },
				'Video AR Value': { prop: 'aspectRatio', type: 'float' },
				'Active Line': { prop: 'activeLine' },
				'Video Zoom Percent': { prop: 'videoZoom', type: 'float' },
				'Video Position': { prop: 'videoPosition', type: 'int' },
				'Scroll Position': { prop: 'scrollPosition', type: 'int' }
			};
			
	//		Video File: ?dummy:24.000000:40000:1280:720:51:48:254:c
//								(fps):(durationInFrames):(resX):(resY):(red):(green):(blue):(c if checkerboard, else empty string)
			
			if(garbageMapping.hasOwnProperty(parts[0])) {
				if(parserState != State.ExpectInfo) {
					error(garbage, (n+1), 'Line ' + (n+1) + ': ' + parts[0] + ' statement outside [Aegisub Project Garbage] section');
				}
				var propertyName =  parts[0];
				var value = parts.slice(1).join(': ');
				
				Subtitler.Importer.__map(garbageMapping, propertyName, value, garbage, error, n+1);
				
				if(propertyName == 'Video File' && value.startsWith('?dummy')) {
					var dummyMatch = /^\?dummy:([0-9]+(?:\.[0-9]+)?):([0-9]+):([0-9]+):([0-9]+):([0-9]+):([0-9]+):([0-9]+):(c?)$/.exec(value);
					if(dummyMatch) {
						var frameRate = dummyMatch[1] * 1;
						var durationInFrames = dummyMatch[2] * 1;
						var durationInSeconds = frameRate * durationInFrames;
						var width = dummyMatch[3];
						var height = dummyMatch[4];
						var resolution = width + 'x' + height;
						
						var red = dummyMatch[5];
						var green = dummyMatch[6];
						var blue = dummyMatch[7];
						// TODO - validate colour
						
						var colour = Subtitler.Styles.Colour.rgb(red, green, blue);
						var checkerboard = (dummyMatch[8].toLowerCase() == 'c');
						
						garbage.dummyVideo = {
							'width': width,
							'height': height,
							'resolution': resolution,
							'colour': colour,
							'checkerboard': checkerboard,
							'frameRate': frameRate,
							'durationInFrames': durationInFrames,
							'durationInSeconds': durationInSeconds,
						};
					}
					else {
						error(garbage, (n+1), 'Line ' + (n+1) + ': Video File statement starts with "?dummy" but the dummy video data is malformed');
					}
				}
				
				parserState = State.ExpectProjectGarbage;
				continue;
			}
			else if(parserState == State.ExpectProjectGarbage) {
				error(garbage, (n+1), 'Line ' + (n+1) + ': Unrecognised ' + parts[0] + ' statement inside [Aegisub Project Garbage] section. Should this be ignored?');
			}
			
			if(parts[0] == 'Format' && parserState == State.ExpectStyles) {
				if(eventFormat != null) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one Format statement in the [V4+ Styles] section');
				}
				styleFormat = parts.slice(1).join(': ').split(/, ?/g);
				continue;
			}
			
			if(parts[0] == 'Format' && parserState == State.ExpectEvents) {
				if(eventFormat != null) {
					error(null, (n+1), 'Line ' + (n+1) + ': ' + 'Expected at most one Format statement in the [Events] section');
				}
				eventFormat = parts.slice(1).join(': ').split(/, ?/g);
				continue;
			}
			
			if(parts[0] == 'Format') {
				throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Format statement outside [V4+ Styles] or [Events] section');
			}
			
			

	//		Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1
			
			if(parts[0] == 'Style') {
				
				if(styleFormat == null) {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Style statement before Format statement, unsure how to interpret');
				}
				
				var style = { };
				
				if(parserState != State.ExpectStyles) {
					error(style, (n+1), 'Line ' + (n+1) + ': ' + parts[0] + ' statement outside the [V4+ Styles] section');
				}
				
				var styleProperties = parts.slice(1).join(': ').split(',');
				if(styleProperties.length > styleFormat.length) {
					var finalValue = styleProperties.slice(styleFormat.length-1).join(',');
					styleProperties = styleProperties.slice(0, styleFormat.length - 1);
					styleProperties.push(finalValue);
				}
				
				var formatMapping = {
					'Name': { prop: 'name', type: 'string' },
					'Alignment': { prop: 'alignment', type: 'int' },
					'Fontname': { prop: 'fontFamily', type: 'string' },
					'Fontsize': { prop: 'fontSize', type: 'int' },
					'PrimaryColour': { prop: 'colourPrimary', type: 'colour' },
					'SecondaryColour': { prop: 'colourSecondary', type: 'colour' },
					'OutlineColour': { prop: 'colourOutline', type: 'colour' },
					'BackColour': { prop: 'colourShadow', type: 'colour' },
					'Bold': { prop: 'bold', type: 'boolean', expect: ['1','0'] },
					'Italic': { prop: 'italic', type: 'boolean', expect: ['1','0'] },
					'Underline': { prop: 'underline', type: 'boolean', expect: ['1','0'] },
					'StrikeOut': { prop: 'strikeout', type: 'boolean', expect: ['1','0'] },
					'ScaleX': { prop: 'scaleX', type: 'number' },
					'ScaleY': { prop: 'scaleY', type: 'number' },
					'Spacing': { prop: 'spacing', type: 'number' },
					'Angle': { prop: 'angle', type: 'number' },
					'BorderStyle': { prop: 'borderStyle', type: 'number' },
					'Outline': { prop: 'outlineWidth', type: 'number' },
					'Shadow': { prop: 'shadowOffset', type: 'number' },
					'MarginL': { prop: 'marginLeft', type: 'int' },
					'MarginR': { prop: 'marginRight', type: 'int' },
					'MarginV': { prop: 'marginVertical', type: 'int' },
					'Encoding': { prop: 'encoding', type: 'int' }
				};
				
				for(var f=0; f<styleFormat.length; f++) {
					
					var formatPart = styleFormat[f];
					var value = styleProperties[f];
					var mapping = formatMapping[formatPart];
					
					Subtitler.Importer.__map( formatMapping, styleFormat[f], styleProperties[f], style, error, n+1 );
				}
				
				styles.push(style);
			}
			
			
			if(parts[0] == 'Dialogue' || parts[0] == 'Comment') {
				
				if(eventFormat == null) {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + parts[0] + ' statement before Format statement, unsure how to interpret');
				}
				
				var line = { };
				
				if(parserState != State.ExpectEvents) {
					error(line, (n+1), 'Line ' + (n+1) + ': ' + parts[0] + ' statement outside the [Events] section');
				}
				
				line.isComment = (parts[0] == 'Comment');
				
				var eventProperties = parts.slice(1).join(': ').split(',');
				if(eventProperties.length > eventFormat.length) {
					var finalValue = eventProperties.slice(eventFormat.length-1).join(',');
					eventProperties = eventProperties.slice(0, eventFormat.length - 1);
					eventProperties.push(finalValue);
				}
				
				var formatMapping = {
					'Layer': { prop: 'layer', type: 'int' },
					'Start': { prop: 'start', type: 'time' },
					'End': { prop: 'end', type: 'time' },
					'Style': { prop: 'style', type: 'string' },
					'Name': { prop: 'actor', type: 'string' },
					'MarginL': { prop: 'marginLeft', type: 'int' },
					'MarginR': { prop: 'marginRight', type: 'int' },
					'MarginV': { prop: 'marginVertical', type: 'int' },
					'Effect': { prop: 'effect', type: 'string' },
					'Text': { prop: 'text_src', type: 'string' }
				};
				
				var timeRegexLax = /^(?:([0-9]+):)?0?([0-9][0-9]):0?([0-9][0-9])(?:\.([0-9][0-9]?[0-9]?)0?)?$/;
				var timeRegexStrict = /^([1-9][0-9]*):([0-9][0-9]):([0-9][0-9])\.([0-9][0-9][0-9])$/;
				
				for(var f=0; f<eventFormat.length; f++) {
					var formatPart = eventFormat[f];
					var value = eventProperties[f];
					var mapping = formatMapping[formatPart];
					
					if(!mapping) {
						error(line, (n+1), 'Line ' + (n+1) + ': ' + 'Unrecognised Format property "' + formatPart + '" with value "' + value + '" was ignored');
						continue;
					}
					
					if(mapping.type == 'string') {
						line[mapping.prop] = value;
					}
					else if(mapping.type == 'int') {
						if(!/^[0-9]+$/.test(value)) {
							error(line, (n+1), 'Line ' + (n+1) + ': ' + 'Integer property "' + formatPart + '" had non integer value "' + value + '"');
						}
						if(!isNaN(value * 1)) {
							line[mapping.prop] = (value * 1) | 0;
						}
						else {
							line[mapping.prop] = 0;
						}
					}
					else if(mapping.type == 'time') {
						var regex = null;
						if(timeRegexStrict.test(value)) {
							regex = timeRegexStrict;
						}
						else if(!strict && timeRegexLax.test(value)) {
							regex = timeRegexLax;
							error(line, n+1, 'Line ' + (n+1) + ': ' + 'Time property "' + formatPart + '" in unrecognised format. Expected h:mm:ss.SSS');
						}
						else {
							throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Time property "' + formatPart + '" in unrecognised format. Expected h:mm:ss.SSS');
						}
						
						var group = value.match(regex);
				
						var hours = (group[1] || '0') * 1;
						var minutes = (group[2] || '0') * 1;
						var seconds = (group[3] || '0') * 1;
						var milliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
						
						var time = (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
						
						line[mapping.prop] = time;
					}
				}
				
				lines.push(line);
				
				continue;
				
			}
		}
	}
	catch(e) {
		parsedSubtitles = { fatalErrors: [ e.message ] }
	}
	
	// TODO
	
	return parsedSubtitles;
}
Subtitler.Importer.__parseSBV = function( filecontents, strict ) {
		
	var info = { };
	var styles = [ ];
	var lines = [ ];
		
	var parsedSubtitles = {
		info: info,
		styles: styles,
		lines: lines
	}
		
	try {
		var State = {
			ExpectFirstLineOrInformation: 0,
			ExpectInfoOrCloseInfo: 1,
			ExpectSubtitle: 2,
			ExpectStyling: 3,
			ExpectStartEndTimesOrUnnecessaryLineNumber: 4,
			ExpectStartEndTimes: 5,
			ExpectTextOrEmptyLine: 6
		};
		
		var lineStart = null;
		var lineEnd = null;
		var lineText = null;
		var lineErrors = [ ];
		
		var unicodeFormFeedCharacterRegex = new RegExp('\u000C', 'g');
		
		if(filecontents.indexOf('\u000C') != -1) {
			parsedSubtitles.errors = parsedSubtitles.errors || [ ];
			parsedSubtitles.errors.push('File contains form feed characters, resolved by treating as newlines. Note, this may cause line numbers in further error messages to be inaccurate');
			if(strict) {
				throw new ParseException(n+1, parsedSubtitles.errors[0]);
			}
			filecontents = filecontents.replace(unicodeFormFeedCharacterRegex, '\n');
		}
		
		var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
		
		var lineStartEndTimesRegexStrict = /^(?:([0-9][0-9]?):)?([0-9][0-9]):([0-9][0-9])\.([0-9][0-9][0-9]),([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])\.([0-9][0-9][0-9])$/;
		var lineStartEndTimesRegexLoose = /^(?:([0-9][0-9]?):)?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))? ?(?:--?-?>?|,) ?(?:([0-9][0-9]?):)?0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))?$/;
		var lineStartEndTimesRegexLooseWithPrecedingLineNumber = /^[0-9]+\s+(?:([0-9][0-9]?):)?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))? ?(?:--?-?>?|,) ?(?:([0-9][0-9]?):)?0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))?$/;
		
		var actorLineRegex = /^>> ([A-Za-z0-9][^:]*): /;
		
		var parserState = State.ExpectFirstLineOrInformation;
		for(var n=0; n<filelines.length; n++) {
			var fileline = filelines[n].trim();
			
			if(parserState == State.ExpectFirstLineOrInformation ) {
				if(fileline == '') {
					continue;
				}
				if(fileline.toUpperCase() == '[INFORMATION]') {
					parserState = State.ExpectInfoOrCloseInfo;
					continue;
				}
				if(lineStartEndTimesRegexLoose.test(fileline)) {
					parserState = State.ExpectStartEndTimes;
					n -= 1;
					continue;
				}
				if(/^[0-9]+$/.test(fileline) || lineStartEndTimesRegexLooseWithPrecedingLineNumber.test(fileline)) {
					parserState = State.ExpectStartEndTimesOrUnnecessaryLineNumber;
					n -= 1;
					continue;
				}
				if(fileline.toUpperCase() == '[SUBTITLE]') {
					parserState = State.ExpectStyling;
					continue;
				}
				if(fileline.toUpperCase().startsWith('[COLF]')
					|| fileline.toUpperCase().startsWith('[FONT]')
					|| fileline.toUpperCase().startsWith('[SIZE]')) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + fileline.substring(0,6) + ' tag before [SUBTITLE] tag');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + fileline.substring(0,6) + ' tag before [SUBTITLE] tag');
					}
					parserState = State.ExpectStyling;
					n -= 1;
					continue;
				}
				if(fileline.toUpperCase() == '[END INFORMATION]' && !strict) {
					parserState = State.ExpectSubtitle;
					continue;
				}
				throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected metadata or first line start and end times');
			}
			if(parserState == State.ExpectInfoOrCloseInfo) {
				
				if(fileline.toUpperCase() == '[END INFORMATION]') {
					parserState = State.ExpectSubtitle;
					continue;
				}
				if(fileline.toUpperCase().startsWith('[SUBTITLE]')) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[SUBTITLE] tag within [INFORMATION] section');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + '[SUBTITLE] tag within [INFORMATION] section');
					}
					parserState = State.ExpectStyling;
					continue;
				}
				if(fileline.toUpperCase().startsWith('[COLF]')
					|| fileline.toUpperCase().startsWith('[FONT]')
					|| fileline.toUpperCase().startsWith('[SIZE]')) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + fileline.substring(0,6) + ' tag within [INFORMATION] section');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + fileline.substring(0,6) + ' tag within [INFORMATION] section');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + fileline.substring(0,6) + ' tag within [INFORMATION] section');
					}
					parserState = State.ExpectStyling;
					n -= 1;
					continue;
				}
				if(fileline.toUpperCase().startsWith('[TITLE]')) {
					if(info.hasOwnProperty('title')) {
						if(strict) {
							throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Duplicate [TITLE] tag');
						}
						else {
							info.errors = info.errors || [ ];
							info.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [TITLE] tag, overwriting previous value "' + info.title + '" with "' + fileline.substring(7) + '"');
							parsedSubtitles.errors = parsedSubtitles.errors || [ ];
							parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [TITLE] tag, overwriting previous value "' + info.title + '" with "' + fileline.substring(7) + '"');
						}
					}
					info.title = fileline.substring(7);
					continue;
				}
				if(fileline.toUpperCase().startsWith('[AUTHOR]')) {
					if(info.hasOwnProperty('title')) {
						if(strict) {
							throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Duplicate [AUTHOR] tag');
						}
						else {
							info.errors = info.errors || [ ];
							info.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [AUTHOR] tag, overwriting previous value "' + info.author + '" with "' + fileline.substring(8) + '"');
							parsedSubtitles.errors = parsedSubtitles.errors || [ ];
							parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [AUTHOR] tag, overwriting previous value "' + info.author + '" with "' + fileline.substring(8) + '"');
						}
					}
					info.author = fileline.substring(8);
					continue;
				}
				if(fileline.toUpperCase().startsWith('[DELAY]')) {
					if(info.hasOwnProperty('delay')) {
						if(strict) {
							throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Duplicate [DELAY] tag');
						}
						else {
							info.errors = info.errors || [ ];
							info.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [DELAY] tag, overwriting previous value "' + info.title + '" with "' + fileline.substring(7) + '"');
							parsedSubtitles.errors = parsedSubtitles.errors || [ ];
							parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [DELAY] tag, overwriting previous value "' + info.title + '" with "' + fileline.substring(7) + '"');
						}
					}
					if(/\[DELAY\][0-9]+/.test(fileline)) {
						info.delay = fileline.substring(7) * 1;
					}
					else if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[DELAY] tag with non integer frame delay "' + fileline.substring(7) + '"');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + 'Ignored [DELAY] tag with non integer frame delay "' + fileline.substring(7) + '"');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Ignored [DELAY] tag with non integer frame delay "' + fileline.substring(7) + '"');
					}
					continue;
				}
				if(fileline.toUpperCase() == '[ENDINFORMATION]') {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space');
					}
					parserState = State.ExpectSubtitle;
					continue;
				}
				if(/^\[A-Z]+\].*/.test(fileline)) {
					// unrecognised tag
					// TODO - get complete list of valid tags
					continue;
				}
				
				if(lineStartEndTimesRegexLoose.test(fileline)) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected [END INFORMATION] tag before first subtitle line');
					}
					else {
						lineErrors.push('Line ' + (n+1) + ': ' + 'Expected [END INFORMATION] tag before first subtitle line');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Expected [END INFORMATION] tag before first subtitle line');
						n -= 1;
						parserState = State.ExpectStartEndTimes;
						continue;
					}
				}
				
				throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space');
			}
			
			if(parserState == State.ExpectSubtitle) {
				if(fileline == '') {
					continue;
				}
				if(fileline == '[SUBTITLE]') {
					parserState = State.ExpectStyling;
					continue;
				}
				if(lineStartEndTimesRegexLoose.test(fileline)) {
					n -= 1;
					parserState = State.ExpectStartEndTimes;
					continue;
				}
				if(/^[0-9]+$/.test(fileline) || lineStartEndTimesRegexLooseWithPrecedingLineNumber.test(fileline)) {
					parserState = State.ExpectStartEndTimesOrUnnecessaryLineNumber;
					n -= 1;
					continue;
				}
				if(fileline.toUpperCase().startsWith('[COLF]')
					|| fileline.toUpperCase().startsWith('[FONT]')
					|| fileline.toUpperCase().startsWith('[SIZE]')) {
					
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected [SUBTITLE] tag before styling tags but got: "' + fileline + '"');
					}
					else {
						if(styles[0] == undefined) {
							styles[0] = { };
						}
						styles[0].errors = style.errors || [ ];
						styles[0].errors.push('Line ' + (n+1) + ': ' + 'Expected [SUBTITLE] tag before styling tags but got: "' + fileline + '"');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Expected [SUBTITLE] tag before styling tags but got: "' + fileline + '"');
						parserState = State.ExpectStyling;
						n -= 1;
						continue;
					}
				}
			}
			
			if(parserState == State.ExpectStyling) {
				if(fileline.toUpperCase().startsWith('[COLF]')
					|| fileline.toUpperCase().startsWith('[FONT]')
					|| fileline.toUpperCase().startsWith('[SIZE]')) {
						
					if(styles[0] == undefined) {
						styles[0] = { };
					}
					var style = styles[0];
					
					var properties = fileline.split(',');
					for(var p=0; p<properties.length; p++) {
						
						var propName = properties[p].split(']')[0].replace('[','');
						
						// TODO - get complete list of allowed properties
						var styleProp = {
							'COLF': 'colourPrimary',
							'FONT': 'fontFamily',
							'SIZE': 'fontSize'
						}[propName];
						
						var styleValueString = properties[p].substring(propName.length + 2);
						var styleValue;
						if(styleProp == 'colourPrimary') {
							if(/^&H[0-9A-Fa-f]{6}&?$/.test(styleValueString)) {
								styleValue = Subtitler.Styles.Colour.aegisubBGR(styleValueString);
							}
							else if(strict) {
								throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[COLF] tag value is not a recognised colour: "' + styleValueString + '"');
							}
							else {
								style.errors = style.errors || [ ];
								style.errors.push('Line ' + (n+1) + ': ' + '[COLF] tag value is not a recognised colour: "' + styleValueString + '"');
								parsedSubtitles.errors = parsedSubtitles.errors || [ ];
								parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + '[COLF] tag value is not a recognised colour: "' + styleValueString + '"');
							}
						}
						else if(styleProp == 'fontFamily') {
							styleValue = styleValueString;
						}
						else if(styleProp == 'fontSize') {
							if(/^[0-9]+$/.test(styleValueString)) {
								styleValue = styleValueString * 1;
							}
							else if(/^[0-9]+\.[0-9]+$/.test(styleValueString) && !strict) {
								style.errors = style.errors || [ ];
								style.errors.push('Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '", resolved by rounding');
								parsedSubtitles.errors = parsedSubtitles.errors || [ ];
								parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '", resolved by rounding');
								styleValue = Math.round(styleValueString * 1);
							}
							else if(strict) {
								throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '"');
							}
							else {
								style.errors = style.errors || [ ];
								style.errors.push('Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '"');
								parsedSubtitles.errors = parsedSubtitles.errors || [ ];
								parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '"');
							}
						}
						
						if(styleProp && styleValue) {
							style[styleProp] = styleValue;
						}
					}
					
					parserState = State.ExpectStartEndTimes;
					continue;
				}
				if(lineStartEndTimesRegexLoose.test(fileline)) {
					n -= 1;
					parserState = State.ExpectStartEndTimes;
					continue;
				}
			}
			
			if(parserState == State.ExpectStartEndTimesOrUnnecessaryLineNumber) {
				
				if(fileline == '') {
					continue;
				}
				if(/^[0-9]+$/.test(fileline) && strict) {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Unexpected line number before line');
				}
				else if(/^[0-9]+$/.test(fileline)) {
					// log an error and ignore the line number
					lineErrors.push('Line ' + (n+1) + ': ' + 'Unexpected line number before line, resolved by ignoring');
					parsedSubtitles.errors = parsedSubtitles.errors || [ ];
					parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Unexpected line number before line, resolved by ignoring');
					parserState = State.ExpectStartEndTimes;
					continue;
				}
				else if(lineStartEndTimesRegexLooseWithPrecedingLineNumber.test(fileline)) {
					fileline = fileline.replace(/^[0-9]+\s+/, '');
					lineErrors.push('Line ' + (n+1) + ': ' + 'Unexpected line number at start of line timing, resolved by ignoring');
					parsedSubtitles.errors = parsedSubtitles.errors || [ ];
					parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Unexpected line number at start of line timing, resolved by ignoring');
					parserState = State.ExpectStartEndTimes;
					// do not continue (as that would reset the fileline), fall into next if statement instead
				}
				else {
					n -= 1
					parserState = State.ExpectStartEndTimes;
					continue;
				}
			}
			if(parserState == State.ExpectStartEndTimes) {
				
				if(fileline == '') {
					continue;
				}
				
				var regex = null;
				if(lineStartEndTimesRegexStrict.test(fileline)) {
					// all good
					regex = lineStartEndTimesRegexStrict;
				}
				else if(!strict && lineStartEndTimesRegexLoose.test(fileline)) {
					lineErrors.push('Line ' + (n+1) + ': ' + 'Expected start and end times in format "h:mm:ss.SSS,h:mm:ss.SSS" but got "' + fileline + '"');
					parsedSubtitles.errors = parsedSubtitles.errors || [ ];
					parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Expected start and end times in format "h:mm:ss.SSS,h:mm:ss.SSS" but got "' + fileline + '"');
					regex = lineStartEndTimesRegexLoose;
				}
				else {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected start and end times in format "h:mm:ss.SSS,h:mm:ss.SSS" but got "' + fileline + '"');
				}
				
				var group = fileline.match(regex);
				
				var startHours = (group[1] || '0') * 1;
				var startMinutes = group[2] * 1;
				var startSeconds = group[3] * 1;
				var startMilliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
				
				var endHours = (group[5] || '0') * 1;
				var endMinutes = group[6] * 1;
				var endSeconds = group[7] * 1;
				var endMilliseconds = Math.round(('0.' + (group[8] || '0')) * 1000);
				
				lineStart = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMilliseconds / 1000);
				lineEnd = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMilliseconds / 1000);
				
				if(lineStart > lineEnd) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected line end to come after line start');
					}
					else {
						var temp = lineEnd;
						lineEnd = lineStart;
						lineStart = temp;
						lineErrors.push('Line ' + (n+1) + ': ' + 'Expected line end to come after line start');
						parsedSubtitles.errors = parsedSubtitles.errors || [ ];
						parsedSubtitles.errors.push('Line ' + (n+1) + ': ' + 'Expected line end to come after line start');
					}
				}
				
				parserState = State.ExpectTextOrEmptyLine;
				continue;
			}
			else if(parserState == State.ExpectTextOrEmptyLine) {
				if(fileline == '') {
					var line = {
						start: lineStart,
						end: lineEnd,
						text_src: (lineText || [ ]).join('\\N').replace(/\[br\]/g, '\\N'),
					};
					if(lineErrors && lineErrors.length > 0) {
						line.errors = lineErrors;
					}
					lines.push(line);
					lineStart = null;
					lineEnd = null;
					lineText = null;
					lineErrors = [ ];
					parserState = State.ExpectStartEndTimesOrUnnecessaryLineNumber;
				}
				else {
					if(lineText == null) {
						lineText = [ ];
					}
					lineText.push(fileline);
				}
			}
		}
		if(lineStart != null) {
			// add final line
			var line = {
				start: lineStart,
				end: lineEnd,
				text_src: (lineText || [ ]).join('\\N'),
			};
			lines.push(line);
			lineStart = null;
			lineEnd = null;
			lineText = null;
			parserState = State.ExpectStartEndTimesOrUnnecessaryLineNumber;
		}
	}
	catch(e) {
		parsedSubtitles = { fatalErrors: [ e.message ] };
	}
	return parsedSubtitles;
}

Subtitler.Importer.__parseSRT = function( filecontents, strict ) {
	try {
		var State = {
			ExpectLineNumber: 0,
			ExpectStartEndTimes: 1,
			ExpectTextOrEmptyLine: 2
		}
		var lines = [ ];
		
		var subtitles = {
			lines: lines,
			styles: [ ],
			info: { }
		};
		
		var previousLineNumber = null;
		
		var lineNumber = null;
		var lineStart = null;
		var lineEnd = null;
		var lineText = null;
		var lineErrors = [ ];
		
		var unicodeFormFeedCharacterRegex = new RegExp('\u000C', 'g');
		
		if(filecontents.indexOf('\u000C') != -1) {
			subtitles.errors = subtitles.errors || [ ];
			subtitles.errors.push('File contains form feed characters, resolved by treating as newlines. Note, this may cause line numbers in further error messages to be inaccurate');
			if(strict) {
				throw new ParseException(n+1, subtitles.errors[0]);
			}
			filecontents = filecontents.replace(unicodeFormFeedCharacterRegex, '\n');
		}
		
		var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
		
		var unicodeObjectCharacterRegex = new RegExp('\uFFFC', 'g');
		
		var lineNumberRegex = /^[1-9][0-9]*$/;
		var lineStartEndTimesRegexStrict = /^([0-9][0-9]):([0-9][0-9]):([0-9][0-9]),([0-9][0-9][0-9]) --> ([0-9][0-9]):([0-9][0-9]):([0-9][0-9]),([0-9][0-9][0-9])$/;
		var lineStartEndTimesRegexLoose = /^0?([0-9][0-9]?):0?0?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)? ?--?-?>? ?0?([0-9][0-9]?):0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)?$/;
		var lineStartEndTimesRegexLooseWithPrecedingLineNumber = /^[0-9]+\s+0?([0-9][0-9]?):0?0?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)? ?--?-?>? ?0?([0-9][0-9]?):0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)?$/;
		
		var parserState = State.ExpectLineNumber;
		for(var n=0; n<filelines.length; n++) {
			var fileline = filelines[n].trim();
			
			if(fileline.indexOf('\uFFFC') != -1) {
				lineErrors.push('Line ' + (n+1) + ': ' + 'Line contains the unicode object replacement character');
				if(strict) {
					throw new ParseException(n+1, lineErrors[0]);
				}
				fileline = fileline.replace(unicodeObjectCharacterRegex, '');
			}
			
			if(parserState == State.ExpectLineNumber) {
				if(fileline == '') {
					continue;
				}
				else if(lineNumberRegex.test(fileline)) {
					lineNumber = fileline * 1;
					
					var error = false;
					
					if((previousLineNumber == null && lineNumber == 1)
						|| (lineNumber == previousLineNumber + 1)) {
						// all is fine
					}
					else if(previousLineNumber == null && strict) {
						lineErrors.push('Line ' + (n+1) + ': ' + 'Expected first line number to start at 1, but got ' + fileline);
						error = true;
					}
					else if(strict) {
						lineErrors.push('Line ' + (n+1) + ': ' + 'Expected next line number after ' + previousLineNumber + ' to be ' + (previousLineNumber + 1) + ' but got ' + fileline);
						error = true;
					}
					
					if(strict && error) {
						throw new ParseException(n+1, lineErrors[0]);
					}
					else if(error) {
						lineNumber = previousLineNumber + 1;
					}
					
					parserState = State.ExpectStartEndTimes;
					continue;
					
				}
				else if(!strict && lineStartEndTimesRegexLooseWithPrecedingLineNumber.test(fileline)) {
					lineErrors.push('Line ' + (n+1) + ': ' + 'Line number on same line as start time');
					lineNumber = fileline.split(/\s+/)[0] * 1;
					fileline = fileline.replace(/^[0-9]+\s+/, '');
					parserState = State.ExpectStartEndTimes;
				}
				else if(!strict && lineStartEndTimesRegexLoose.test(fileline)) {
					lineErrors.push('Line ' + (n+1) + ': ' + 'Line number missing');
					lineNumber = previousLineNumber + 1;
					parserState = State.ExpectStartEndTimes;
					n -= 1;
					continue;
				}
				else {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected positive line number, but found ' + fileline);
				}
			}
			if(parserState == State.ExpectStartEndTimes) {
				
				var regex = null;
				if(lineStartEndTimesRegexStrict.test(fileline)) {
					// all good
					regex = lineStartEndTimesRegexStrict;
				}
				else if(!strict && lineStartEndTimesRegexLoose.test(fileline)) {
					lineErrors.push('Line ' + (n+1) + ': ' + 'Expected start and end times in format "hh:mm:ss,SSS --> hh:mm:ss,SSS" but got "' + fileline + '"');
					regex = lineStartEndTimesRegexLoose;
				}
				else {
					throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected start and end times in format "hh:mm:ss,SSS --> hh:mm:ss,SSS" but got "' + fileline + '"');
				}
				
				var group = fileline.match(regex);
				
				var startHours = group[1] * 1;
				var startMinutes = group[2] * 1;
				var startSeconds = group[3] * 1;
				var startMilliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
				
				var endHours = group[5] * 1;
				var endMinutes = group[6] * 1;
				var endSeconds = group[7] * 1;
				var endMilliseconds = Math.round(('0.' + (group[8] || '0')) * 1000);
				
				lineStart = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMilliseconds / 1000);
				lineEnd = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMilliseconds / 1000);
				
				if(lineStart > lineEnd) {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + 'Expected line end to come after line start');
					}
					else {
						var temp = lineEnd;
						lineEnd = lineStart;
						lineStart = temp;
						lineErrors.push('Line ' + (n+1) + ': ' + 'Expected line end to come after line start');
					}
				}
				
				parserState = State.ExpectTextOrEmptyLine;
				continue;
			}
			if(parserState == State.ExpectTextOrEmptyLine) {
				if(fileline == '') {
					var line = {
						start: lineStart,
						end: lineEnd,
						text_src: (lineText || [ ]).join('\\N'),
					};
					if(lineErrors && lineErrors.length > 0) {
						line.errors = lineErrors;
						subtitles.errors = subtitles.errors || [ ];
						for(var e=0; e<lineErrors.length; e++) {
							subtitles.errors.push(lineErrors[e]);
						}
					}
					lines.push(line);
					previousLineNumber = lineNumber;
					lineNumber = null;
					lineStart = null;
					lineEnd = null;
					lineText = null;
					lineErrors = [ ];
					parserState = State.ExpectLineNumber;
				}
				else {
					if(lineText == null) {
						lineText = [ ];
					}
					lineText.push(fileline);
				}
				continue;
			}
		}
		if(lineStart != null) {
			// add final line
			var line = {
				start: lineStart,
				end: lineEnd,
				text_src: (lineText || [ ]).join('\\N'),
			};
			if(lineErrors && lineErrors.length > 0) {
				line.errors = lineErrors;
				subtitles.errors = subtitles.errors || [ ];
				for(var e=0; e<lineErrors.length; e++) {
					subtitles.errors.push(lineErrors[e]);
				}
			}
			lines.push(line);
			previousLineNumber = lineNumber;
			lineNumber = null;
			lineStart = null;
			lineEnd = null;
			lineText = null;
			parserState = State.ExpectLineNumber;
		}
	}
	catch(e) {
		subtitles = { fatalErrors: [ e.message ] };
	}
	return subtitles;
}

Subtitler.Importer.__parseCustomFormat = function( filecontents ) {
	// a simplistic format
	
	// OPTIONAL:
	// 		AT LEAST ONE:
	//			header line
	// 		empty line
	
	// AT LEAST ONE:
	//		start time (optional end time)
	//		line
	
	// In the event the end time is missing, the end time will be assumed to be the start of the next line, or 7cps, whichever's sooner
	
	var State = {
		ExpectHeaderOrFirstLineTiming: 0,
		ExpectHeaderOrEmptyLine: 1,
		ExpectLineTiming: 2,
		ExpectLineText: 3,
		ExpectLineTextOrEmptyLine: 4
	};
	
	var lines = [ ];
	var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
	
	var subtitles = {
		lines: [ ],
		styles: [ ],
		info: [ ]
	};
	
	var timeRegex = /^\s*(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?(?:\s*-?->?\s*(?:(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?))?(?:\s+°+)?\s*$/;
	
	var lineWithTimingRegex = /^\s*(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?(?:\s*-?->?\s*(?:(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?))?(?:\s+°+)?(?:\s*$|\s+(.*?)$)/;
	
	var parserState = State.ExpectHeaderOrFirstLineTiming;
	
	var headers = [ ];
	
	var lineStart = 0;
	var lineEnd = null;
	var lineText = '';
	
	var nonBlankLines = 0;
	var nonBlankLinesMatchingLineWithTimingRegex = 0;
	for(var n=0; n<filelines.length; n++) {
		if(filelines[n].trim() != '') {
			nonBlankLines += 1;
			if(lineWithTimingRegex.test(filelines[n])) {
				nonBlankLinesMatchingLineWithTimingRegex += 1;
			}
		}
	}
	var expectTimingAndLineTogether = false;
	if(nonBlankLines > 0 && ((nonBlankLinesMatchingLineWithTimingRegex/nonBlankLines) > 0.66)) {
		expectTimingAndLineTogether = true;
	}
	
	for(var n=0; n<filelines.length; n++) {
		
		var fileline = filelines[n];
		
		if(parserState == State.ExpectHeaderOrFirstLineTiming) {
			if(fileline == '') {
				continue;
			}
			else if(expectTimingAndLineTogether && lineWithTimingRegex.test(fileline)) {
				parserState = State.ExpectLineTiming;
				n -= 1;
				continue;
			}
			else if(timeRegex.test(fileline)) {
				parserState = State.ExpectLineTiming;
				n -= 1;
				continue;
			}
			else {
				headers.push(fileline);
				continue;
			}
		}
		else if(parserState == State.ExpectHeaderOrEmptyLine) {
			if(fileline == '') {
				parserState = State.ExpectHeaderOrFirstLineTiming;
				continue;
			}
			else {
				headers.push(fileline);
				continue;
			}
		}
		else if(parserState == State.ExpectLineTiming) {
			if(fileline == '') {
				continue;
			}
			else if(expectTimingAndLineTogether && lineWithTimingRegex.test(fileline)) {
				if(headers.length > 0) {
					for(var h=0; h<headers.length; h++) {
						var line = { 
							text_src: headers[h],
							start: 0,
							end: 0,
							isComment: true
						};
						subtitles.lines.push(line);
					}
					headers = [ ];
				}
				var group = fileline.match(lineWithTimingRegex);
				
				var startHours = (group[1] || '0') * 1;
				var startMinutes = group[2] * 1;
				var startSeconds = group[3] * 1;
				var startMilliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
				lineStart = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMilliseconds / 1000);
				
				if(group[7]) {
					var endHours = (group[5] || '0') * 1;
					var endMinutes = group[6] * 1;
					var endSeconds = group[7] * 1;
					var endMilliseconds = Math.round(('0.' + (group[8] || '0')) * 1000);
					lineEnd = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMilliseconds / 1000);
				}
				else {
					lineEnd = null;
				}
				
				lineText = group[9] || '';
				
				var line = { 
					text_src: lineText,
					start: lineStart,
					end: lineEnd
				}
				subtitles.lines.push(line);
				parserState = State.ExpectLineTiming;
				lineStart = null;
				lineEnd = null;
				lineText = '';
			}
			else if(timeRegex.test(fileline)) {
				if(headers.length > 0) {
					for(var h=0; h<headers.length; h++) {
						var line = { 
							text_src: headers[h],
							start: 0,
							end: 0,
							isComment: true
						};
						subtitles.lines.push(line);
					}
					headers = [ ];
				}
				var group = fileline.match(timeRegex);
				
				var startHours = (group[1] || '0') * 1;
				var startMinutes = group[2] * 1;
				var startSeconds = group[3] * 1;
				var startMilliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
				lineStart = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMilliseconds / 1000);
				
				if(group[7]) {
					var endHours = (group[5] || '0') * 1;
					var endMinutes = group[6] * 1;
					var endSeconds = group[7] * 1;
					var endMilliseconds = Math.round(('0.' + (group[8] || '0')) * 1000);
					lineEnd = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMilliseconds / 1000);
				}
				else {
					lineEnd = null;
				}
				
				lineText = '';
				
				parserState = State.ExpectLineText;
				continue;
			}
			else {
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected Line Timing but got "' + fileline + '", treating as comment'
				);
				var line = { 
					text_src: fileline,
					start: null,
					end: null,
					isComment: true
				};
				subtitles.lines.push(line);
				continue;
			}
		}
		else if(parserState == State.ExpectLineText) {
			if(fileline == '') {
				continue;
			}
			else {
				lineText += ((lineText != '') ? '\\N' : '') + fileline;
				parserState = State.ExpectLineTextOrEmptyLine;
			}
			continue;
		}
		else if(parserState == State.ExpectLineTextOrEmptyLine) {
			if(fileline == '') {
				var line = { 
					text_src: lineText,
					start: lineStart,
					end: lineEnd
				};
				subtitles.lines.push(line);
				lineText = '';
				lineStart = null;
				lineEnd = null;
				parserState = State.ExpectLineTiming;
				continue;
			}
			else {
				lineText += ((lineText != '') ? '\\N' : '') + fileline;
				parserState = State.ExpectLineTextOrEmptyLine;
				continue;
			}
		}
	}
	if(lineText) {
		var line = { 
			text_src: lineText,
			start: null,
			end: null
		};
		subtitles.lines.push(line);
	}
	if(subtitles.lines.length == 0) {
		subtitles.fatalErrors = subtitles.fatalErrors || [ 'File not in expected format' ]
	}
	else {
		var comments = 0;
		for(var n=0; n<subtitles.lines.length; n++) {
			var previousLine = subtitles.lines[n-1] || null;
			var line = subtitles.lines[n];
			var nextLine = subtitles.lines[n+1] || null;
			if(line.isComment) {
				comments += 1;
			}
			if(line.start == null) {
				line.start = (previousLine == null) ? 0 : previousLine.end;
			}
			if(line.end == null) {
				if(line.isComment) {
					line.end = line.start;
				}
				else {
					var estimatedDuration = line.text_src.length / 8;
					if(estimatedDuration < 2) {
						estimatedDuration = 2;
					}
					if(nextLine && (nextLine.start != null) && (nextLine.start - 0.2) < (line.start + estimatedDuration)) {
						estimatedDuration = nextLine.start - line.start;
					}
					line.end = line.start + estimatedDuration;
				}
			}
		}
		if(comments > 5 && comments > (subtitles.lines.length * 0.25)) {
			subtitles.fatalErrors = subtitles.fatalErrors || [ 'File not in expected format' ]
		}
	}
	return subtitles;
}

Subtitler.Importer.__parseUnknown = function( filecontents ) {
	
	// no idea what it is, just interpret every line in the file as a line
	var lines = [ ];
	var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
	
	var subtitles = {
		lines: lines,
		styles: [ ],
		info: { }
	};
	
	for(var n=0; n<filelines.length; n++) {
		lines.push({start: 0, end: 0, text_src: filelines[n] });
	}
	
	json = subtitles;
	
	return json;
}

Subtitler.Importer.__parseVTT = function( filecontents, strict ) {
	
	// WEBVTT - only one, right at very start
	// NOTE - anything after is a comment
	// STYLE
	//  ::cue { ... }
	//  ::cue(b) { ... }
	//
	//
	// line format: 
	//
	//	START --> END optional styling
	//	(times can be minutes:seconds.millis or full with hours)
	
	var State = {
		ExpectWebVTT: 0,
		ExpectStyleRegionOrFirstLine: 1,
		ExpectMultiLineCommentThenStyleRegionOrFirstLine: 2,
		ExpectStyleInfoOrEmptyLine: 3,
		ExpectRegionInfoOrEmptyLine: 4,
		ExpectMultiLineCommentThenLine: 5,
		ExpectLineLabelOrTiming: 6,
		ExpectLineTiming: 7,
		ExpectLineText: 8,
		ExpectLineTextOrEmptyLine: 9,
		ExpectLineEmptyLine: 9
	};
	
	var state = State.ExpectWebVTT;
	
	var lines = [ ];
	var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
	
	var subtitles = {
		lines: lines,
		styles: [ ],
		info: { }
	};
	
	// TODO - add region/style support to regex
	var timeRegexStrict = /^\s*(?:(?:([0-9]+):)?((?:^|[0-9])[0-9]):)?((?:^|[0-9])[0-9]?)(?:\.([0-9][0-9]?[0-9]?))?\s+-->\s+(?:(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:\.([0-9][0-9]?[0-9]?))?)\s*$/;
	var timeRegexLax = /^\s*(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?(?:\s*-?->?\s*(?:(?:(?:([0-9]+):)?([0-9][0-9]?):)?([0-9][0-9]?)(?:[.,]([0-9]+))?))(?:\s+°+)?\s*$/;
	
	var lineStart = null;
	var lineEnd = null;
	var lineLabel = null;
	var lineText = '';
	
	for(var n=0; n<filelines.length; n++) {
		var fileline = filelines[n];
		
		if(state == State.ExpectWebVTT) {
			if(fileline.trim() == '') {
				continue;
			}
			if(fileline.trim() == 'WEBVTT') {
				state = State.ExpectStyleRegionOrFirstLine;
				continue;
			}
			else {
				// file is missing starting WEBVTT - recoverable
				state = State.ExpectStyleRegionOrFirstLine;
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected WEBVTT as first line but got "' + fileline + '", pretending it was present'
				);
				n -= 1;
				continue;
			}
		}
		else if(state == State.ExpectStyleRegionOrFirstLine) {
			if(fileline.trim() == '') {
				continue;
			}
			if(fileline.trim() == 'REGION') {
				state = State.ExpectRegionInfoOrEmptyLine;
				continue;
			}
			if(fileline.trim() == 'STYLE') {
				state = State.ExpectStyleInfoOrEmptyLine;
				continue;
			}
			if(fileline.trim() == 'NOTE') {
				state = State.ExpectMultiLineCommentThenStyleRegionOrFirstLine;
				lineText = '';
				continue;
			}
			else if(fileline.trim().startsWith('NOTE ') || fileline.trim().startsWith('NOTE\t')) {
				lines.push({start: null, end: null, text_src: fileline.trim().substring(4).trim(), isComment: true });
				continue;
			}
			
			// it's not one of the allowed header fields - so we must have left the header
			
			state = State.ExpectLineLabelOrTiming;
			n -= 1;
			continue;
		}
		else if(state == State.ExpectMultiLineCommentThenStyleRegionOrFirstLine) {
			if(fileline.trim() == '') {
				lines.push({start: null, end: null, text_src: lineText, isComment: true });
				lineText = '';
				state = State.ExpectStyleRegionOrFirstLine;
				continue;
			}
			else {
				if(lineText.length > 0) {
					lineText += '\n';
				}
				lineText += fileline;
				continue;
			}
		}
		else if(state == State.ExpectMultiLineCommentThenLine) {
			if(fileline.trim() == '') {
				lines.push({start: null, end: null, text_src: lineText, isComment: true });
				lineText = '';
				state = State.ExpectLineLabelOrTiming;
				continue;
			}
			else {
				if(lineText.length > 0) {
					lineText += '\n';
				}
				lineText += fileline;
				continue;
			}
		}
		else if(state == State.ExpectStyleInfoOrEmptyLine) {
			if(fileline.trim() == '') {
				// TODO - style
				state = State.ExpectStyleRegionOrFirstLine;
				continue;
			}
			// TODO - currently just ignores everything in the style
			continue;
		}
		else if(state == State.ExpectRegionInfoOrEmptyLine) {
			if(fileline.trim() == '') {
				// TODO - region
				state = State.ExpectStyleRegionOrFirstLine;
				continue;
			}
			// TODO - currently just ignores everything in the region
			continue;
		}
		else if(state == State.ExpectLineLabelOrTiming) {
			if(fileline.trim() == '') {
				continue;
			}
			if(fileline.trim() == 'NOTE') {
				state = State.ExpectMultiLineCommentThenStyleRegionOrFirstLine;
				lineText = '';
				continue;
			}
			else if(fileline.trim().startsWith('NOTE ') || fileline.trim().startsWith('NOTE\t')) {
				lines.push({start: null, end: null, text_src: fileline.trim().substring(4).trim(), isComment: true });
				continue;
			}
			else if(timeRegexLax.test(fileline.trim())) {
				lineLabel = null;
				state = State.ExpectLineTiming;
				n -= 1;
				continue;
			}
			else {
				lineLabel = fileline.trim();
				continue;
			}
			// TODO
		}
		else if(state == State.ExpectLineTiming) {
			if(fileline.trim() == '') {
				lineLabel = null;
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line timing after label but got empty line, pretending previous label did not exist'
				);
				state = State.ExpectLineLabelOrTiming;
				continue;
			}
			else if(fileline.trim() == 'NOTE') {
				lineLabel = null;
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line timing after label but got comment instead, pretending previous label did not exist'
				);
				state = State.ExpectMultiLineCommentThenStyleRegionOrFirstLine;
				lineText = '';
				continue;
			}
			else if(fileline.trim().startsWith('NOTE ') || fileline.trim().startsWith('NOTE\t')) {
				lineLabel = null;
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line timing after label but got comment instead, pretending previous label did not exist'
				);
				state = State.ExpectLineLabelOrTiming;
				lines.push({start: null, end: null, text_src: fileline.trim().substring(4).trim(), isComment: true });
				continue;
			}
			else if(!timeRegexLax.test(fileline.trim())) {
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line timing after label but got "' + fileline + '", pretending previous label did not exist and using this as the label'
				);
				lineLabel = fileline;
				state = State.ExpectLineTiming;
				continue;
			}
			
			if(!timeRegexStrict.test(fileline.trim())) {
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line timing in correct format but got "' + fileline + '", but able to interpret intended timestamp despite this'
				);
			}
			
			var group = fileline.match(timeRegexLax);
			
			var startHours = group[1] * 1;
			var startMinutes = group[2] * 1;
			var startSeconds = group[3] * 1;
			var startMilliseconds = Math.round(('0.' + (group[4] || '0')) * 1000);
			
			var endHours = group[5] * 1;
			var endMinutes = group[6] * 1;
			var endSeconds = group[7] * 1;
			var endMilliseconds = Math.round(('0.' + (group[8] || '0')) * 1000);
			
			lineStart = (startHours * 3600) + (startMinutes * 60) + startSeconds + (startMilliseconds / 1000);
			lineEnd = (endHours * 3600) + (endMinutes * 60) + endSeconds + (endMilliseconds / 1000);
			
			if(lineStart > lineEnd) {
				subtitles.errors = subtitles.errors || [ ];
				subtitles.errors.push(
					'Line ' + (n+1) + ': ' + 'Expected line end to come after line start'
				);
				var temp = lineEnd;
				lineEnd = lineStart;
				lineStart = temp;
			}
			
			// TODO - extract styling and region info
			
			state = State.ExpectLineText;
			lineText = '';
			continue;
		}
		else if(state == State.ExpectLineText) {
			if(fileline.trim() == '') {
				lines.push({start: lineStart, end: lineEnd, text_src: fileline, isComment: false });
				state = State.ExpectLineLabelOrTiming;
				lineStart = null;
				lineEnd = null;
				lineText = '';
				state = State.ExpectEmptyLine;
				continue;
			}
			else {
				if(lineText != '') {
					lineText += '\n';
				}
				lineText += fileline;
				state = State.ExpectLineTextOrEmptyLine;
				continue;
			}
		}
		else if(state == State.ExpectLineTextOrEmptyLine) {
			if(fileline.trim() == '') {
				lines.push({start: lineStart, end: lineEnd, text_src: lineText, isComment: false });
				state = State.ExpectLineLabelOrTiming;
				lineStart = null;
				lineEnd = null;
				lineText = '';
				continue;
			}
			else {
				if(lineText != '') {
					lineText += '\n';
				}
				lineText += fileline;
				continue;
			}
		}
		else if(state == State.ExpectLineEmptyLine) {
			if(fileline.trim() == '') {
				state = State.ExpectLineLabelOrTiming;
				continue;
			}
			// TODO - complain
			n -= 1;
			state = State.ExpectLineLabelOrTiming;
			continue;
		}
		else {
			// TODO
		}
	}
	
	// iterate through comments and set start + end times based on next line
	for(var n=subtitles.lines.length-1; n>=0; n--) {
		var line = subtitles.lines[n];
		if(!line.isComment) {
			// all normal lines will be correctly formatted
			continue;
		}
		var previousLine = subtitles.lines[n-1] || null;
		var nextLine = subtitles.lines[n+1] || null;
		if(line.end == null) {
			if(nextLine != null && nextLine.start != null) {
				line.end = nextLine.start;
			}
		}
		if(line.start == null) {
			line.start = line.end;
		}
	}
	for(var n=0; n<subtitles.lines.length; n++) {
		var line = subtitles.lines[n];
		if(!line.isComment) {
			continue;
		}
		var previousLine = subtitles.lines[n-1] || null;
		var nextLine = subtitles.lines[n+1] || null;
		if(line.start == null && line.end == null && nextLine != null && nextLine.start != null ) {
			line.end = nextLine.start;
		}
		if(line.start == null) {
			line.start = line.end;
		}
		if(line.start == null) {
			// only possible if all lines are comments
			line.start = 0;
		}
		if(line.end == null) {
			line.end = line.start;
		}
	}
	
	// TODO - strict
	
	return subtitles;
}

Subtitler.Importer.__parseYTT = function( filecontents ) {
	parser = new DOMParser();
	var xmlDoc = null;
	try {
		xmlDoc = parser.parseFromString(filecontents, "text/xml");
	}
	catch(e) {
		// pass
	}
	if(xmlDoc == null) {
		return { fatalErrors: [ 'File contents not valid xml' ], errors: [ 'File contents not valid xml' ] }
	}
	
	var valid_pen_attributes = [
		'id', 'b', 'i', 'u',
		'fc', 'fo', 'bo', 'ec',
		'et', 'fs', 'sz', 'rb',
		'of', 'te'
	];
	
	var pens = { };
	var pen_array = xmlDoc.querySelectorAll('timedtext head pen');
	for(var p=0; p<pen_array.length; p++) {
		var pen_element = pen_array[p];
		var pen_object = { };
		var attributeNames = pen_element.getAttributeNames();
		for(var a=0; a<attributeNames.length; a++) {
			if(valid_pen_attributes.indexOf(attributeNames[a]) == -1) {
				// TODO - log error
				continue;
			}
			pen_object[attributeNames[a]] = pen_element.getAttribute(attributeNames[a]);
		}
		pens[pen_object.id] = pen_object;
	}
	
	var valid_ws_attributes = [ 'id', 'ju', 'pd', 'sd' ];
	
	var alignments = { };
	var ws_array = xmlDoc.querySelectorAll('timedtext head ws');
	for(var ws=0; ws<ws_array.length; ws++) {
		var ws_element = ws_array[ws];
		var alignment_object = { };
		var attributeNames = ws_element.getAttributeNames();
		for(var a=0; a<attributeNames.length; a++) {
			if(valid_ws_attributes.indexOf(attributeNames[a]) == -1) {
				// TODO - log error
				continue;
			}
			alignment_object[attributeNames[a]] = ws_element.getAttribute(attributeNames[a]);
		}
		alignments[alignment_object.id] = alignment_object;
	}
	
	var valid_wp_attributes = [ 'id', 'ap', 'ah', 'av' ];
	
	var positionings = { };
	var wp_array = xmlDoc.querySelectorAll('timedtext head wp');
	for(var wp=0; wp<wp_array.length; wp++) {
		var wp_element = wp_array[wp];
		var positioning_object = { };
		var attributeNames = wp_element.getAttributeNames();
		for(var a=0; a<attributeNames.length; a++) {
			if(valid_wp_attributes.indexOf(attributeNames[a]) == -1) {
				// TODO - log error
				continue;
			}
			positioning_object[attributeNames[a]] = wp_element.getAttribute(attributeNames[a]);
		}
		positionings[positioning_object.id] = positioning_object;
	}
	
	
	var styles = { };
	
	function getStyleName( p, ws, wp ) {
		var styleName = '';
		if(wp != null) {
			if(styleName) {
				styleName += '_';
			}
			styleName += 'WP' + wp;
		}
		if(ws != null) {
			if(styleName) {
				styleName += '_';
			}
			styleName += 'WS' + ws;
		}
		if(styleName == '') {
			styleName = 'Default';
		}
		if(p != null) {
			if(styleName) {
				styleName += '_';
			}
			styleName += 'P' + p;
		}
		return styleName;
	}
	
	function getOrCreateStyle( p, ws, wp ) {
		var styleName = getStyleName(p, ws, wp);
		if(styles[styleName]) {
			return styles[styleName];
		}
		return createStyle( pens[p], (ws == null ? ws : alignments[ws]), (wp == null ? null : positionings[wp]) );
	}
	
	function createStyle( pen, alignment, positioning ) {
		var styleName = getStyleName( (pen ? pen.id : null), (alignment ? alignment.id : null), (positioning ? positioning.id : null) );
		var style = {
			name: styleName
		};
		
		style.fontFamily = 'Roboto';
		style.fontSize = 20;
		
		style.colourPrimary = Subtitler.Styles.Colour.rgb( 254, 254, 254 );
		style.colourSecondary = Subtitler.Styles.Colour.rgb( 255, 0, 0 );
		style.colourOutline = Subtitler.Styles.Colour.rgba( 0, 0, 0, 0.8 );
		style.colourShadow = Subtitler.Styles.Colour.hex('#000000');
		
		style.marginLeft = 10;
		style.marginRight = 10;
		style.marginVertical = 30;
		
		style.bold = false;
		style.italic = false;
		style.underline = false;
		
		style.alignment = Subtitler.Styles.Alignments.BOTTOM;
		
		style.borderStyle = Subtitler.Styles.BorderType.RECTANGLE;
		style.outlineWidth = 3;
		style.shadowOffset = 0;
		
		style.rotation = 0;
		style.spacing = 0;
		style.scaleX = 100;
		style.scaleY = 100;
		
		style.encoding = Subtitler.Styles.Encodings.DEFAULT;
		
		if(pen) {
			
			if(pen.hasOwnProperty('b')) {
				style.bold = (pen.b == '1');
			}
			if(pen.hasOwnProperty('i')) {
				style.italic = (pen.i == '1');
			}
			if(pen.hasOwnProperty('u')) {
				style.underline = (pen.u == '1');
			}
			
			var colour = null;
			if(pen.hasOwnProperty('fc')) {
				colour = Subtitler.Styles.Colour.hex(pen.fc);
			}
			if(colour == null) {
				colour = Subtitler.Styles.Colour.hex('#FEFEFE');
			}
			var opacity = null;
			if(pen.hasOwnProperty('fo')) {
				opacity = (pen.fo * 1) / 255;
			}
			if(opacity == null || isNaN(opacity)) {
				opacity = 1;
			}
			colour.a = opacity;
			style.colourPrimary = colour;
			
			
			// TODO - bc, bo
			// TODO - ec, et
			
			if(pen.hasOwnProperty('fs')) {
				style.fontFamily = {
					'0': 'Roboto',
					'1': 'Courier New',
					'2': 'Times New Roman',
					'3': 'Lucida Console',
					'4': 'Roboto',
					'5': 'Comic Sans MS',
					'6': 'Monotype Corsiva',
					'7': 'Arial',
				}[pen.fs] || 'Roboto';
			}
			
			if(pen.hasOwnProperty('sz')) {
				var sz = 20 * ((pen.sz - 100) / 4);
				if(!isNaN(sz)) {
					if(sz < 16) {
						sz = 16;
					}
					style.fontSize = sz;
				}
			}
			
			// TODO - rb
			// TODO - of
			// TODO - te
			// TODO - hg
		}
		
		if(positioning) {
			
			if(positioning.ap == '0'
					&& (positioning.ah * 1) <= 10
					&& (positioning.av * 1) <= 10) {
				style.alignment = Subtitler.Styles.Alignments.TOP_LEFT;
			}
			else if(positioning.ap == '1'
					&& (positioning.ah * 1) >= 45 && (positioning.ah * 1) <= 55
					&& (positioning.av * 1) <= 10) {
				style.alignment = Subtitler.Styles.Alignments.TOP;
			}
			else if(positioning.ap == '2'
					&& (positioning.ah * 1) >= 90
					&& (positioning.av * 1) <= 10) {
				style.alignment = Subtitler.Styles.Alignments.TOP_RIGHT;
			}
			else if(positioning.ap == '3'
					&& (positioning.ah * 1) <= 10
					&& (positioning.av * 1) >= 45 && (positioning.av * 1) <= 55) {
				style.alignment = Subtitler.Styles.Alignments.LEFT;
			}
			else if(positioning.ap == '4'
					&& (positioning.ah * 1) >= 45 && (positioning.ah * 1) <= 55
					&& (positioning.av * 1) >= 45 && (positioning.av * 1) <= 55) {
				style.alignment = Subtitler.Styles.Alignments.CENTER;
			}
			else if(positioning.ap == '5'
					&& (positioning.ah * 1) >= 90
					&& (positioning.av * 1) >= 45 && (positioning.av * 1) <= 55) {
				style.alignment = Subtitler.Styles.Alignments.RIGHT;
			}
			else if(positioning.ap == '6'
					&& (positioning.ah * 1) <= 10
					&& (positioning.av * 1) >= 90) {
				style.alignment = Subtitler.Styles.Alignments.BOTTOM_LEFT;
			}
			else if(positioning.ap == '7'
					&& (positioning.ah * 1) >= 45 && (positioning.ah * 1) <= 55
					&& (positioning.av * 1) >= 90) {
				style.alignment = Subtitler.Styles.Alignments.BOTTOM;
			}
			else if(positioning.ap == '8'
					&& (positioning.ah * 1) >= 90
					&& (positioning.av * 1) >= 90) {
				style.alignment = Subtitler.Styles.Alignments.BOTTOM_RIGHT;
			}
		}
		
		styles[styleName] = style;
		
		return style;
	}
	
	var valid_p_attributes = [ 't', 'd', 'ws', 'wp', 'p' ];
	
	var line_objects = [ ];
	var p_array = xmlDoc.querySelectorAll('timedtext body p');
	for(var p=0; p<p_array.length; p++) {
		var p_element = p_array[p];
		var line_object = { };
		var attributeNames = p_element.getAttributeNames();
		for(var a=0; a<attributeNames.length; a++) {
			if(valid_p_attributes.indexOf(attributeNames[a]) == -1) {
				// TODO - log error
				continue;
			}
			line_object[attributeNames[a]] = p_element.getAttribute(attributeNames[a]);
		}
		line_object.__element = p_element;
		line_objects[line_objects.length] = line_object;
	}

	var lines = [ ];
	for(var n=0; n<line_objects.length; n++) {
		var line_object = line_objects[n];
		
		var start = line_object.t / 1000;
		var duration = line_object.d / 1000;
		var end = ((line_object.t * 1) + (line_object.d * 1)) / 1000;
		
		var line_pen = line_object.p || null;
		var line_alignment = line_object.ws || null;
		var line_positioning = line_object.wp || null;
		
		var style = getOrCreateStyle(line_pen, line_alignment, line_positioning);
		
		var text = '';
		
		if(line_object.__element && line_object.__element.childNodes) {
			for(var i=0; i<line_object.__element.childNodes.length; i++) {
				var node = line_object.__element.childNodes[i];
				if(node instanceof Element) {
					var block_pen = line_pen;
					if(node.tagName && node.tagName == 's') {
						if(node.getAttribute('p')) {
							block_pen = node.getAttribute('p');
						}
					}
					if(block_pen != line_pen) {
						if((node.textContent || '').replace(/\u200B/g, '').replace(/\n/g, '\\N')) {
							var block_style = getOrCreateStyle(block_pen, line_alignment, line_positioning);
							text += '{\\r' + block_style.name + '}';
							text += (node.textContent || '').replace(/\u200B/g, '').replace(/\n/g, '\\N');
							text += '{\\r}'
						}
					}
				}
				if(node instanceof Text) {
					text += (node.textContent || '').replace(/\u200B/g, '').replace(/\n/g, '\\N');
				}
			}
		}
		//text = p_array[n].textContent;
		
		lines.push({
			start: start,
			end: end,
			style: style.name,
			text_src: text
		});
	}
	
	var style_array = [ ];
	for(var s in styles) {
		if(styles.hasOwnProperty(s)) {
			style_array.push(styles[s]);
		}
	}
	
	var subtitles = {
		lines: lines,
		styles: style_array,
		info: { }
	};
	
	return subtitles;
}