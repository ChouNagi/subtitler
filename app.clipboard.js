Subtitler = window.Subtitler || { };
Subtitler.Clipboard = Subtitler.Clipboard || { };

Subtitler.Clipboard.contents = [ ];

Subtitler.Clipboard.copy = function( lines ) {
	Subtitler.Clipboard.__setContents(lines, false);
}

Subtitler.Clipboard.cut = function( lines ) {
	Subtitler.Clipboard.__setContents(lines, true);
}

Subtitler.Clipboard.__setContents = function( lines, destructive ) {
	if(lines == null) {
		lines = [ ];
	}
	if(typeof lines == 'object' && !Array.isArray(lines)) {
		lines = [ lines ];
	}
	Subtitler.Clipboard.contents = [ ];
	for(var n=0; n<lines.length; n++) {
		var line = lines[n];
		var lineCopy = { };
		for(var prop in line) {
			if(prop == 'lineno') {
				continue;
			}
			if(line.hasOwnProperty(prop)) {
				lineCopy[prop] = line[prop];
			}
		}
		Subtitler.Clipboard.contents.push(lineCopy);
		if(destructive) {
			Subtitler.Lines.deleteLine(line);
		}
	}
}

Subtitler.Clipboard.pasteBefore = function(insertionPoint) {
	Subtitler.Clipboard.paste(insertionPoint, 'before');
}
Subtitler.Clipboard.pasteAfter = function(insertionPoint) {
	Subtitler.Clipboard.paste(insertionPoint, 'after');
}
Subtitler.Clipboard.pasteOver = function(insertionPoint) {
	Subtitler.Clipboard.paste(insertionPoint, 'over');
}

Subtitler.Clipboard.paste = function( insertionPoint, insertionMode) {
	
	var insertionIndex = null;
	if(typeof insertionPoint == 'string') {
		var line = Subtitler.Lines.map[insertionPoint];
		insertionIndex = line.lineno;
	}
	else if(typeof insertionPoint == 'object' && insertionPoint != null) {
		insertionIndex = insertionPoint.lineno;
	}
	else if(typeof insertionPoint == 'number') {
		insertionIndex = insertionPoint;
	}
	if(insertionIndex != null) {
		
		var firstLineInserted = null;
	
		var linesToPaste = [ ];
		for(var n=0; n<Subtitler.Clipboard.contents.length; n++) {
			linesToPaste.push(Subtitler.Clipboard.__getPasteableLine(Subtitler.Clipboard.contents[n]));
		}
		if(insertionMode == 'before') {
			for(var n=0; n<linesToPaste.length; n++) {
				var insertedLine = Subtitler.Lines.__insertLine(insertionIndex, linesToPaste[n]);
				if(firstLineInserted == null) {
					firstLineInserted = insertedLine;
				}
				insertionIndex += 1;
			}
		}
		else if(insertionMode == 'after') {
			insertionIndex += 1;
			for(var n=0; n<linesToPaste.length; n++) {
				var insertedLine = Subtitler.Lines.__insertLine(insertionIndex, linesToPaste[n]);
				if(firstLineInserted == null) {
					firstLineInserted = insertedLine;
				}
				insertionIndex += 1;
			}
		}
		else if(insertionMode == 'over') {
			for(var n=0; n<linesToPaste.length; n++) {
				var lineToPaste = linesToPaste[n];
				if(Subtitler.Lines.list[insertionIndex]) {
					var existingLine = Subtitler.Lines.list[insertionIndex];
					for(var prop in lineToPaste) {
						if(prop == 'id' || prop == 'text_original' || prop == 'text_recent') {
							continue;
						}
						if(lineToPaste.hasOwnProperty(prop)) {
							existingLine[prop] = lineToPaste[prop];
						}
					}
					Subtitler.Lines.updateLine(existingLine);
					var insertedLine = existingLine;
					if(firstLineInserted == null) {
						firstLineInserted = insertedLine;
					}
				}
				else {
					var insertedLine = Subtitler.Lines.__insertLine(insertionIndex, linesToPaste[n], false);
					if(firstLineInserted == null) {
						firstLineInserted = insertedLine;
					}
				}
				insertionIndex += 1;
			}
		}
		if(firstLineInserted) {
			Subtitler.Lines.selectLines(linesToPaste, true);
			Subtitler.Lines.makeLineActive(firstLineInserted);
		}
	}
}

Subtitler.Clipboard.__getPasteableLine = function(line) {
	
	var lineToPaste = line;
	var lineAlreadyExists = (line.id != null && Subtitler.Lines.map[line.id] != null);
	
	if(lineAlreadyExists) {
		lineToPaste = { };
		for(var prop in line) {
			if(prop == 'id'
				|| prop == 'text_original'
				|| prop == 'text_recent') {
				continue;
			}
			if(line.hasOwnProperty(prop)) {
				lineToPaste[prop] = line[prop];
			}
		}
		lineToPaste.id = Subtitler.Utils.uuid();
	}
	
	return lineToPaste;
}
