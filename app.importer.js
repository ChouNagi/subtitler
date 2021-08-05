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
						Subtitler.Importer.__load(json, filename);
					}
				},
				{
					label: Subtitler.Translations.get('actorWarningPopupButtonYes'),
					callback: function() {
						for(var n=0; n<json.lines.length; n++) {
							json.lines[n].text_src = json.lines[n].text_src.replace(/^>> /, '');
						}
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
			ExpectStartEndTimes: 4,
			ExpectTextOrEmptyLine: 5
		};
		
		var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
			
		var lineStart = null;
		var lineEnd = null;
		var lineText = null;
		var lineErrors = [ ];
		
		var lineStartEndTimesRegexStrict = /^(?:([0-9][0-9]?):)?([0-9][0-9]):([0-9][0-9])\.([0-9][0-9][0-9]),([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])\.([0-9][0-9][0-9])$/;
		var lineStartEndTimesRegexLoose = /^(?:([0-9][0-9]?):)?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))? ?(?:--?-?>?|,) ?(?:([0-9][0-9]?):)?0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?))?$/;
		
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
							info.errors.push('Line ' + (n+1) + ': ' + 'Duplicate [DELAY] tag, overwriting previous value "' + info.title + '" with "' + fileline.substring(7) + '"')
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
						info.errors.push('Line ' + (n+1) + ': ' + 'Ignored [DELAY] tag with non integer frame delay "' + fileline.substring(7) + '"')
					}
					continue;
				}
				if(fileline.toUpperCase() == '[ENDINFORMATION]') {
					if(strict) {
						throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space');
					}
					else {
						info.errors = info.errors || [ ];
						info.errors.push('Line ' + (n+1) + ': ' + '[END INFORMATION] tag missing space')
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
								styleValue = Math.round(styleValueString * 1);
							}
							else if(strict) {
								throw new ParseException(n+1, 'Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '"');
							}
							else {
								style.errors = style.errors || [ ];
								style.errors.push('Line ' + (n+1) + ': ' + '[SIZE] tag value is not an integer: "' + styleValueString + '"');
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
					parserState = State.ExpectStartEndTimes;
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
			parserState = State.ExpectLineNumber;
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
		var filelines = filecontents.split(/(?:\r\n|\n|\r)/);
		
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
		
		var unicodeObjectCharacterRegex = new RegExp('\uFFFC', 'g');
		
		var lineNumberRegex = /^[1-9][0-9]*$/;
		var lineStartEndTimesRegexStrict = /^([0-9][0-9]):([0-9][0-9]):([0-9][0-9]),([0-9][0-9][0-9]) --> ([0-9][0-9]):([0-9][0-9]):([0-9][0-9]),([0-9][0-9][0-9])$/;
		var lineStartEndTimesRegexLoose = /^0?([0-9][0-9]?):0?0?([0-9][0-9]?):([0-9][0-9]?)(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)? ?--?-?>? ?0?([0-9][0-9]?):0?0?([0-9][0-9]):([0-9][0-9])(?:(?:,|\.|:)([0-9][0-9]?[0-9]?)0?)?$/;
		
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
			else if(parserState == State.ExpectStartEndTimes) {
				
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
			else if(parserState == State.ExpectTextOrEmptyLine) {
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

Subtitler.Importer.__parseVTT = function( filecontents ) {
	// TODO
	return Subtitler.Importer.__parseUnknown(filecontents);
}