Subtitler = window.Subtitler || { };
Subtitler.Visualiser = Subtitler.Visualiser || { };

Subtitler.Visualiser.container = document.querySelector('.subtitle-audio-visualiser');
Subtitler.Visualiser.canvas = Subtitler.Visualiser.container.querySelector('.waveform canvas');
Subtitler.Visualiser.audio = Subtitler.Visualiser.container.querySelector('.subtitle-audio-visualiser-source');

Subtitler.Visualiser.overlay = Subtitler.Visualiser.container.querySelector('.visualiser-overlay');
Subtitler.Visualiser.timestamps = Subtitler.Visualiser.container.querySelector('.waveform-timestamps');
Subtitler.Visualiser.gridlines = Subtitler.Visualiser.container.querySelector('.gridlines');

Subtitler.Visualiser.canvasCtx = Subtitler.Visualiser.canvas.getContext('2d');

Subtitler.Visualiser.audioCtx = null;
Subtitler.Visualiser.analyser = null;
Subtitler.Visualiser.source = null;
Subtitler.Visualiser.buffer = null;
Subtitler.Visualiser.data = null;
Subtitler.Visualiser.dataByTimestamp = null;

Subtitler.Visualiser.processingInterval = 20;
Subtitler.Visualiser.processing = false;
Subtitler.Visualiser.processingProgress = 0;
Subtitler.Visualiser.processingRate = 1;

Subtitler.Visualiser.overlayPreviousLine = Subtitler.Visualiser.overlay.querySelector('.visualiser-previous-line');
Subtitler.Visualiser.overlayCurrentLine = Subtitler.Visualiser.overlay.querySelector('.visualiser-current-line');
Subtitler.Visualiser.overlayNextLine = Subtitler.Visualiser.overlay.querySelector('.visualiser-next-line');

Subtitler.Visualiser.overlayCurrentAudioTime = Subtitler.Visualiser.overlay.querySelector('.visualiser-current-audio-time');
Subtitler.Visualiser.currentRegion = Subtitler.Visualiser.container.querySelector('.visualiser-current-region')

Subtitler.Visualiser.frequencyZoom = 3;
Subtitler.Visualiser.temporalZoom = 1;

Subtitler.Visualiser.temporalZoomSlider = document.querySelector('.visualiser-temporal-zoom-slider');
Subtitler.Visualiser.frequencyZoomSlider = document.querySelector('.visualiser-frequency-zoom-slider');
Subtitler.Visualiser.audioVolumeSlider = document.querySelector('.audio-volume-slider');

Subtitler.Visualiser.progressAndLocationPane = document.querySelector('.visualiser-location-and-progress');
Subtitler.Visualiser.progressIndicator = Subtitler.Visualiser.container.querySelector('.visualiser-progress');


/** removes everything  */
Subtitler.Visualiser.clear = function( ) {
	
	Subtitler.Visualiser.processing = false;
	Subtitler.Visualiser.processingProgress = 0;
	Subtitler.Visualiser.progressIndicator.style.left = '0';
	Subtitler.Visualiser.progressIndicator.style.visibility = 'visible';
	Subtitler.Visualiser.canvasCtx.clearRect(0, 0, Subtitler.Visualiser.canvas.width, Subtitler.Visualiser.canvas.height);
	
	if(Subtitler.Visualiser.analyser) {
		Subtitler.Visualiser.analyser.disconnect();
	}
	if(Subtitler.Visualiser.source) {
		Subtitler.Visualiser.source.disconnect();
	}
	
	if(Subtitler.Visualiser.audioCtx) {
		Subtitler.Visualiser.audioCtx.suspend();
	}
	
	if(Subtitler.Visualiser.dataByTimestamp) {
		Subtitler.Visualiser.data.splice(0, Subtitler.Visualiser.data.length);
	}
	
	if(Subtitler.Visualiser.dataByTimestamp) {
		for(var prop in Subtitler.Visualiser.dataByTimestamp) {
			delete Subtitler.Visualiser.dataByTimestamp;
		}
	}
	
//	Subtitler.Visualiser.audioCtx = null;
	Subtitler.Visualiser.analyser = null;
//	Subtitler.Visualiser.source = null;
	Subtitler.Visualiser.buffer = null;
	Subtitler.Visualiser.data = null;
	Subtitler.Visualiser.dataByTimestamp = null;

}

Subtitler.Visualiser.updateOverlay = function( line ) {
	
	if(typeof line == 'number') {
		line = Subtitler.Lines.list[line] || null;
	}
	else if(typeof line == 'string') {
		line = Subtitler.Lines.map[line] || null;
	}
	if(line == null) {
		return;
	}
	
	var previousLine = Subtitler.Lines.list[line.lineno-1] || null;
	var nextLine = Subtitler.Lines.list[line.lineno+1] || null;
	
	var leftEdge = (Subtitler.Visualiser.overlay.getAttribute('data-left-edge') || '0') * 1;
	var rightEdge = (Subtitler.Visualiser.overlay.getAttribute('data-right-edge') || '0') * 1;
	
	Subtitler.Visualiser.__drawOverlay(leftEdge, rightEdge, previousLine, line, nextLine);
	Subtitler.Visualiser.__drawCurrentRegion(leftEdge, rightEdge);
}

Subtitler.Visualiser.renderLine = function( line, dontChangeEdges, leftEdgeOverride, rightEdgeOverride ) {
	
	if(typeof line == 'number') {
		line = Subtitler.Lines.list[line] || null;
	}
	else if(typeof line == 'string') {
		line = Subtitler.Lines.map[line] || null;
	}
	if(line == null) {
		return;
	}
	
	var previousLine = Subtitler.Lines.list[line.lineno-1] || null;
	var nextLine = Subtitler.Lines.list[line.lineno+1] || null;
	
	var leftEdge;
	var rightEdge;
	if(dontChangeEdges) {
		leftEdge = (Subtitler.Visualiser.overlay.getAttribute('data-left-edge') || '0') * 1;
		rightEdge = (Subtitler.Visualiser.overlay.getAttribute('data-right-edge') || '0') * 1;
		
		if(leftEdgeOverride != undefined) {
			leftEdge = leftEdgeOverride;
		}
		if(rightEdgeOverride != undefined) {
			rightEdge = rightEdgeOverride;
		}
		if(leftEdge < 0) {
			leftEdge = 0;
			rightEdge = leftEdge + width;
		}
	}
	else {
		var width = 4/(Subtitler.Visualiser.temporalZoom || 1);
		var lineMiddle = line.start + (line.duration/2);
		leftEdge = lineMiddle - (width/2);
		if(leftEdge > line.start - (width*0.1)) {
			leftEdge = line.start - (width*0.1);
		}
		if(leftEdge < 0) {
			leftEdge = 0;
		}
		rightEdge = leftEdge + width;
	}
	
	Subtitler.Visualiser.__render( leftEdge, rightEdge, (Subtitler.Visualiser.frequencyZoom||1), previousLine, line, nextLine );
}

Subtitler.Visualiser.__render = function( leftEdge, rightEdge, frequencyZoom, previousLine, currentLine, nextLine ) {
	
	Subtitler.Visualiser.__drawGridLinesAndTimestamps(leftEdge, rightEdge);
	Subtitler.Visualiser.__drawOverlay(leftEdge, rightEdge, previousLine, currentLine, nextLine);
	Subtitler.Visualiser.__drawCanvas(leftEdge, rightEdge, frequencyZoom);
	Subtitler.Visualiser.__drawCurrentRegion(leftEdge, rightEdge);
}

Subtitler.Visualiser.__drawCurrentRegion = function(leftEdge, rightEdge) {
	
	var duration = Subtitler.Visualiser.audio.duration || 0;
	if(duration == 0) {
		for(var n=0; n<Subtitler.Lines.list.length; n++) {
			if((Subtitler.Lines.list[n].end + 2) > duration) {
				duration = Subtitler.Lines.list[n].end + 2;
			}
		}
		if(duration == 0) {
			duration = 1;
		}
	}
	
	leftEdgePercentage = 100*(leftEdge/duration);
	rightEdgePercentage = 100*(rightEdge/duration);
	
	Subtitler.Visualiser.currentRegion.style.left = leftEdgePercentage + '%';
	Subtitler.Visualiser.currentRegion.style.width = (rightEdgePercentage - leftEdgePercentage) + '%';
}

Subtitler.Visualiser.__drawGridLinesAndTimestamps = function( leftEdge, rightEdge ) {
	
	if(leftEdge == rightEdge) {
		Subtitler.Visualiser.gridlines.innerHTML = '';
		Subtitler.Visualiser.timestamps.innerHTML = '';
		return;
	}
	
	var width = rightEdge - leftEdge;
	
	var minor_step = 0.02;
	var major_step = 0.1;
	if(width > 0.5) {
		minor_step = 0.05;
		major_step = 0.25;
	}
	if(width > 0.75) {
		minor_step = 0.1;
		major_step = 0.5;
	}
	if(width > 1) {
		minor_step = 0.1;
		major_step = 1;
	}
	if(width > 8) {
		minor_step = 0.5;
	}
	if(width > 12) {
		minor_step = 1;
		major_step = 5;
	}
	if(width > 20) {
		minor_step = 1;
		major_step = 10;
	}
	
	var timestampHTML = '';
	var gridlineHTML = '';
	
	var first = ((((leftEdge*10) - ((leftEdge*10) % (minor_step*10)))/10) + minor_step);
	first = Math.round(first*10000)/10000;
	
	for(var i=first; i<rightEdge; i+=minor_step) {
		var className = 'waveform-gridline-minor';
		var left = 100 * ((i-leftEdge)/width);
		var fixed_i = (Math.round(i*10000)/10000);
		var modulo = (Math.round((fixed_i / major_step) * 10000) / 10000) % 1;
		if( modulo == 0 ) {
			className = 'waveform-gridline-major';
			timestampHTML += '<div class="waveform-timestamp" data-time="' + Subtitler.Formatting.formatTime(i, 3) + '" style="left: ' + left + '%">' + Subtitler.Formatting.formatTime(i, major_step < 1 ? 2 : 0).replace(/^0?0?:/,'') + '</div>'
		}
		gridlineHTML += '<div class="' + className + '" data-time="' + Subtitler.Formatting.formatTime(i, 3) + '" style="left: ' + left + '%"></div>';
	}
	
	Subtitler.Visualiser.gridlines.innerHTML = gridlineHTML;
		Subtitler.Visualiser.timestamps.innerHTML = timestampHTML;
}
Subtitler.Visualiser.__drawOverlay = function( leftEdge, rightEdge, previousLine, currentLine, nextLine ) {
	
	Subtitler.Visualiser.overlay.setAttribute('data-left-edge', leftEdge);
	Subtitler.Visualiser.overlay.setAttribute('data-right-edge', rightEdge);
	
	if(leftEdge == rightEdge) {
		Subtitler.Visualiser.overlayPreviousLine.style.display = 'none';
		Subtitler.Visualiser.overlayCurrentLine.style.display = 'none';
		Subtitler.Visualiser.overlayNextLine.style.display = 'none';
		return;
	}
	
	var width = rightEdge - leftEdge;
	
	if(previousLine) {
		Subtitler.Visualiser.overlayPreviousLine.style.display = '';
		Subtitler.Visualiser.overlayPreviousLine.style.left = (100 * (previousLine.start - leftEdge) / width) + '%';
		Subtitler.Visualiser.overlayPreviousLine.style.width = (100 * previousLine.duration / width) + '%';
	}
	else {
		Subtitler.Visualiser.overlayPreviousLine.style.display = 'none';
	}
	
	if(currentLine) {
		Subtitler.Visualiser.overlayCurrentLine.style.display = '';
		Subtitler.Visualiser.overlayCurrentLine.style.left = (100 * (currentLine.start - leftEdge) / width) + '%';
		Subtitler.Visualiser.overlayCurrentLine.style.width = (100 * currentLine.duration / width) + '%';
	}
	else {
		Subtitler.Visualiser.overlayCurrentLine.style.display = 'none';
	}
	
	if(nextLine) {
		Subtitler.Visualiser.overlayNextLine.style.display = '';
		Subtitler.Visualiser.overlayNextLine.style.left = (100 * (nextLine.start - leftEdge) / width) + '%';
		Subtitler.Visualiser.overlayNextLine.style.width = (100 * nextLine.duration / width) + '%';
	}
	else {
		Subtitler.Visualiser.overlayNextLine.style.display = 'none';
	}

}

/** */
Subtitler.Visualiser.load = function( file ) {
	Subtitler.Visualiser.clear();
	
	var url;
	if(typeof file == 'string') {
		url = file;
	}
	else if(file instanceof File) {
		url = URL.createObjectURL(file);
	}
	else {
		return false;
	}
	
	Subtitler.Visualiser.processing = false;
	Subtitler.Visualiser.audio.src = url;
	return true;
}

Subtitler.Visualiser.__onWaveHeadWithinCurrentRegion = function() {
	
	var leftEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute ('data-left-edge')*1;
	var rightEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-right-edge')*1;
	
	if(leftEdgeTimestamp == rightEdgeTimestamp) {
		return;
	}
	Subtitler.Visualiser.__drawCanvas(leftEdgeTimestamp, rightEdgeTimestamp, (Subtitler.Visualiser.frequencyZoom||1));
}

// called when the fft data wavehead reaches the end of the current region (or reaches the end of the file)
Subtitler.Visualiser.__onCurrentRegionRenderable = function() {
	
	var leftEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute ('data-left-edge')*1;
	var rightEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-right-edge')*1;
	
	if(leftEdgeTimestamp == rightEdgeTimestamp) {
		return;
	}
	Subtitler.Visualiser.__drawCanvas(leftEdgeTimestamp, rightEdgeTimestamp, (Subtitler.Visualiser.frequencyZoom||1));
}

Subtitler.Visualiser.__drawCanvas = function( leftEdgeTimestamp, rightEdgeTimestamp, zoom ) {
	
	Subtitler.Visualiser.canvasCtx.clearRect(0, 0, Subtitler.Visualiser.canvas.width, Subtitler.Visualiser.canvas.height);
	
	var timestamps;
	if(Subtitler.Visualiser.dataByTimestamp == null) {
		timestamps = [ ]
	}
	else {
		timestamps = Object.keys(Subtitler.Visualiser.dataByTimestamp)
	}
	
	timestamps.sort(function(a,b) {
		if( (a*1) < (b*1) ) {
			return -1;
		}
		if( (a*1) > (b*1) ) {
			return 1;
		}
		return 0;
	});
		
	for(var x=0; x<Subtitler.Visualiser.canvas.width; x++) {
		
		var timestampStart = leftEdgeTimestamp + x*((rightEdgeTimestamp - leftEdgeTimestamp)/Subtitler.Visualiser.canvas.width);
		var timestampEnd = leftEdgeTimestamp + (x+1)*((rightEdgeTimestamp - leftEdgeTimestamp)/Subtitler.Visualiser.canvas.width);
		
		var timestampsInRange = [ ];
		for(var t=0; t<timestamps.length; t++) {
			if(timestamps[t] == timestampStart && timestampsInRange.length == 0) {
				timestampsInRange.push(timestamps[t]);
				continue;
			}
			else if((timestamps[t]*1) > timestampStart && timestampsInRange.length == 0) {
				if(t != 0) {
					timestampsInRange.push(timestamps[t-1]);
				}
				timestampsInRange.push(timestamps[t]);
				if((timestamps[t]*1) > timestampEnd) {
					break;
				}
				continue;
			}
			if((timestamps[t]*1) > timestampEnd) {
				timestampsInRange.push(timestamps[t]);
				break;
			}
			if(timestampsInRange.length != 0) {
				timestampsInRange.push(timestamps[t]);
			}
		}
		
		//console.log('x=' + x + ', timestampStart='+timestampStart+', timestampEnd='+timestampEnd+', timestampsInRange=[' + timestampsInRange + ']');
		
		// we've got the indexes timestamps that will be used to calculate the interval
		// now we need to get the actual data sets
		// due to fingerprint resistance, we're limited in how accurate those timestamps are
		// there will almost certainly be duplicates
		
		// for those before the range, we want the last
		// for those after the range, we want the first
		// for those inside the range, we want all
		
		var dataSets = [ ];
		
		if(Subtitler.Visualiser.dataByTimestamp) {
			
			for(var n=Subtitler.Visualiser.dataByTimestamp[timestampsInRange[0]];
					n<=Subtitler.Visualiser.dataByTimestamp[timestampsInRange[timestampsInRange.length-1]]; n++) {
				
			
				var dataSet = { factor: 1, values: Subtitler.Visualiser.data[n] };
				dataSets.push(dataSet);
			}
		
//			// TODO - for now just use the first one
//			dataSets.push({
//				factor: 1,
//				values: Subtitler.Visualiser.data[
//							Subtitler.Visualiser.dataByTimestamp[
//								timestampsInRange[0]
//							]
//						]
//			});
		}
		
		// next, need to compute factor - ie, how much the dataset should count towards the value
		
		var divisor = 0;
		for(var d=0; d<dataSets.length; d++) {
			
			// TODO
			dataSets.factor = 1; 
			
			divisor += dataSets.factor;
		}
		
		// normalise factors
		for(var d=0; d<dataSets.length; d++) {
			dataSets[d].factor = dataSets[d].factor / divisor;
		}
		
		var interpolatedDataSet = [ ];
		for(var d=0; d<dataSets.length; d++) {
			for(var n=0; n<dataSets[d].values.length; n++) {
				if(interpolatedDataSet[n] == undefined) {
					interpolatedDataSet.push(0);
				}
				interpolatedDataSet[n] += (dataSets[d].values[n] * dataSets[d].factor);
			}
		}
		
		var verticalCutoff = 1;
		
		// at this point we have a vertical slice
		// but probably way more values in the dataset than vertical pixels in the canvas
		
		for(var y=0; y<Subtitler.Visualiser.canvas.height; y++) {
			
			var start = (y/Subtitler.Visualiser.canvas.height)*interpolatedDataSet.length*verticalCutoff;
			var end = ((y+1)/Subtitler.Visualiser.canvas.height)*interpolatedDataSet.length*verticalCutoff;
			
			var difference = end - start;
			
			var interpolatedValue = 0;
			
			var firstFactor;
			if(start != (start|0)) {
				firstFactor = ((start+1) - (start|0));
				start = start|0;
			}
			else {
				firstFactor = 1;
			}
			
			var lastFactor;
			if(end != (end|0)) {
				lastFactor = (end - (end|0));
				end = (end|0) + 1;
			}
			else {
				lastFactor = 1;
			}
			
			var pixelColour;
			
			if(interpolatedDataSet.length > 0) {
				for(var i=start; i<=end; i++) {
					if(i == start) {
						interpolatedValue += interpolatedDataSet[i]*firstFactor;
					}
					else if(i == end) {
						interpolatedValue += interpolatedDataSet[i]*lastFactor;
					}
					else {
						interpolatedValue += interpolatedDataSet[i];
					}
				}
			
				interpolatedValue = interpolatedValue / difference;
			
				pixelColour = Subtitler.Visualiser.__getPixelColour(interpolatedValue, 255, zoom);
			}
			else {
				pixelColour = Subtitler.Styles.Colour.rgb(0,0,0);
			}
			
			Subtitler.Visualiser.canvasCtx.fillStyle = pixelColour.toRGBA();
			Subtitler.Visualiser.canvasCtx.fillRect( x, Subtitler.Visualiser.canvas.height-y, 1, 1 );
		}
	}
}

Subtitler.Visualiser.__onData = function( timestamp, data ) {
	
	if(!Subtitler.Visualiser.audio.duration) {
		return;
	}
	
	var copy = data.slice();
	
	Subtitler.Visualiser.processingProgress = (timestamp / Subtitler.Visualiser.audio.duration);
	Subtitler.Visualiser.progressIndicator.style.left = (Subtitler.Visualiser.processingProgress * 100) + '%';
	
	if(!Subtitler.Visualiser.data) {
		Subtitler.Visualiser.data = [ ];
	}
	Subtitler.Visualiser.data.push(copy);
	if(!Subtitler.Visualiser.dataByTimestamp) {
		Subtitler.Visualiser.dataByTimestamp = { };
	}
	if(!Subtitler.Visualiser.dataByTimestamp.hasOwnProperty(timestamp)) {
		Subtitler.Visualiser.dataByTimestamp[timestamp] = Subtitler.Visualiser.data.length - 1;
	}
}

Subtitler.Visualiser.__setupListeners = function() {
	Subtitler.Visualiser.audio.playbackRate = Subtitler.Visualiser.processingRate;
	Subtitler.Visualiser.audio.addEventListener('ended', function() {
		Subtitler.Visualiser.processing = false;
		Subtitler.Visualiser.processingProgress = 1;
		Subtitler.Visualiser.progressIndicator.style.left = '100%';
		Subtitler.Visualiser.progressIndicator.style.visibility = 'hidden';
		
		var leftEdge = (Subtitler.Visualiser.overlay.getAttribute('data-left-edge') || '0')*1;
		var rightEdge = (Subtitler.Visualiser.overlay.getAttribute('data-right-edge') || '0')*1;
		var now = Subtitler.Visualiser.audio.duration;
		if(now > leftEdge && now <= rightEdge) {
			Subtitler.Visualiser.__onCurrentRegionRenderable();
		}
	});
	Subtitler.Visualiser.audio.addEventListener('error', function() {
		Subtitler.Visualiser.processing = false;
	});
	Subtitler.Visualiser.audio.addEventListener('paused', function() {
		Subtitler.Visualiser.processing = false;
	});
	Subtitler.Visualiser.audio.addEventListener('canplaythrough', function() {
		Subtitler.Visualiser.__onAudioReady();
	});
}

window.setInterval(function() {
	if(Subtitler.Visualiser.processing) {
		Subtitler.Visualiser.analyser.getByteFrequencyData(Subtitler.Visualiser.buffer);
		Subtitler.Visualiser.__onData(Subtitler.Visualiser.audio.currentTime, Subtitler.Visualiser.buffer);
	}
}, Subtitler.Visualiser.processingInterval);

window.setInterval(function() {
	if(Subtitler.Visualiser.processing) {
		var leftEdge = (Subtitler.Visualiser.overlay.getAttribute('data-left-edge') || '0')*1;
		var rightEdge = (Subtitler.Visualiser.overlay.getAttribute('data-right-edge') || '0')*1;
		var now = Subtitler.Visualiser.audio.currentTime;
		if(now > leftEdge && now < rightEdge) {
			Subtitler.Visualiser.__onWaveHeadWithinCurrentRegion();
		}
		else if(now > rightEdge && now < rightEdge + 0.6) {
			Subtitler.Visualiser.__onCurrentRegionRenderable();
		}
	}
}, 330);

Subtitler.Visualiser.__onAudioReady = function() {
	Subtitler.Visualiser.clear();
	Subtitler.Visualiser.__initialiseContext();
	Subtitler.Visualiser.processing = true;
	Subtitler.Visualiser.audio.play();
	Subtitler.Visualiser.audioCtx.resume();
	
	Subtitler.Visualiser.__drawCurrentRegion(
		(Subtitler.Visualiser.overlay.getAttribute('data-left-edge') || '0')*1,
		(Subtitler.Visualiser.overlay.getAttribute('data-right-edge') || '0')*1
	);
}

Subtitler.Visualiser.__initialiseContext = function( ) {
	var AudioContext = (window.AudioContext || window.webkitAudioContext);
	if(!AudioContext) {
		return;
	}
	if(!Subtitler.Visualiser.audioCtx) {
		Subtitler.Visualiser.audioCtx = new AudioContext();
	}
	Subtitler.Visualiser.analyser = Subtitler.Visualiser.audioCtx.createAnalyser();
	if(!Subtitler.Visualiser.source) {
		Subtitler.Visualiser.source = Subtitler.Visualiser.audioCtx.createMediaElementSource(Subtitler.Visualiser.audio);
	}
	Subtitler.Visualiser.source.connect(Subtitler.Visualiser.analyser);
	Subtitler.Visualiser.analyser.fftSize = 2048;
	Subtitler.Visualiser.buffer = new Uint8Array(Subtitler.Visualiser.analyser.frequencyBinCount);
}


/** Given a value in the range [0-max] (max default=255), returns a Subtitler.Styles.Colour object */
Subtitler.Visualiser.__getPixelColour = function( value, max, zoom ) {
	if(max == undefined) {
		max = 255;
	}
	if( zoom == undefined ) {
		zoom = 1;
	}
	if( value == undefined ) {
		value = 0;
	}
	if( value == 0 ) {
		return Subtitler.Styles.Colour.rgb(0,0,0);
	}
	
	value = value / max;
	
	value = value * value;
	
	value = Math.min(1, value * zoom);
	
	value = value * 255;
	
	if( value < Math.max(2, zoom*2) ) {
		return Subtitler.Styles.Colour.rgb(0,0,0);
	}
	if( value > 255 ) {
		return Subtitler.Styles.Colour.rgb(255,255,255);
	}
	
	// TODO - fancy colouring, for now just return a greyscale image
	
	return Subtitler.Styles.Colour.rgb(
		Math.max(0,(value|0)-32),
		Math.min(Math.max(0,((value*2.5)|0)-16),255),
		Math.min(255,((value*2)|0)+16)
	);
}

Subtitler.Visualiser.__setupListeners();

Subtitler.Visualiser.__sticky = 5;
Subtitler.Visualiser.__dragInertia = 5;
Subtitler.Visualiser.__currentLineDraggedEdge = null;

Subtitler.Visualiser.__onPointerDown = function(e) {
	var edgeBeingDragged = null;
	if(e && e.target) {
		if(e.target.closest('.visualiser-current-line-start')) {
			edgeBeingDragged = 'start';
		}
		else if(e.target.closest('.visualiser-current-line-end')) {
			edgeBeingDragged = 'end';
		}
	}
	if(edgeBeingDragged) {
		
		var clientX = e.clientX || (e.touches[0] || { }).clientX;
		var clientY = e.clientY || (e.touches[0] || { }).clientY;
		
		Subtitler.Visualiser.__currentLineDraggedEdge = {
			edge: edgeBeingDragged,
			overcomeInertia: false,
			x: clientX,
			y: clientY
		}
	}
}
Subtitler.Visualiser.__onPointerMove = function(e) {
	if(e && Subtitler.Visualiser.__currentLineDraggedEdge) {
		
		var clientX = e.clientX || (e.touches[0] || { }).clientX;
		var clientY = e.clientY || (e.touches[0] || { }).clientY;
		
		if(Math.abs(clientX - Subtitler.Visualiser.__currentLineDraggedEdge.x) > Subtitler.Visualiser.__dragInertia) {
			Subtitler.Visualiser.__currentLineDraggedEdge.overcomeInertia = true;
		}
		if(Subtitler.Visualiser.__currentLineDraggedEdge.overcomeInertia) {
			var leftEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-left-edge')*1;
			var rightEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-right-edge')*1;
			var rect = Subtitler.Visualiser.overlay.getBoundingClientRect();
			
			var leftEdgeX = rect.left;
			var rightEdgeX = rect.right;
			
			if(clientX > rightEdgeX) {
				clientX = rightEdgeX;
			}
			if(clientX < leftEdgeX) {
				clientX = leftEdgeX;
			}
			
			var widthInPixels = rightEdgeX - leftEdgeX;
			var percentageMoved = (clientX - leftEdgeX) / widthInPixels;
			
			var pointerTimestamp = leftEdgeTimestamp + (percentageMoved * (rightEdgeTimestamp - leftEdgeTimestamp));
			
			var currentLine = Subtitler.Lines.map[Subtitler.LineEditor.lineId] || null;
			var nextLine = null;
			var previousLine = null;
			
			// TODO - check if edge within Subtitler.Visualiser.__sticky pixels of previous/next line edge,
			// if so, set timestamp to match
			var pointerTimestampAfterSticky = pointerTimestamp;
			
			// console.log('time: ' + Subtitler.Formatting.formatTime(pointerTimestamp) + ', effective: ' + Subtitler.Formatting.formatTime(pointerTimestampAfterSticky))
			
			Subtitler.Visualiser.__currentLineDraggedEdge.timestamp = pointerTimestampAfterSticky;
			
			if(currentLine) {
				var currentLineCopy = { };
				for(var prop in currentLine) {
					if(currentLine.hasOwnProperty(prop)) {
						currentLineCopy[prop] = currentLine[prop];
					}
				}
				if(Subtitler.Visualiser.__currentLineDraggedEdge.edge == 'start') {
					currentLineCopy.start = pointerTimestamp;
					if(currentLineCopy.end < currentLineCopy.start) {
						currentLineCopy.end = currentLineCopy.start;
					}
					currentLineCopy.duration = currentLineCopy.end - currentLineCopy.start;
				}
				else if(Subtitler.Visualiser.__currentLineDraggedEdge.edge == 'end') {
					currentLineCopy.end = pointerTimestamp;
					if(currentLineCopy.end < currentLineCopy.start) {
						currentLineCopy.start = currentLineCopy.end;
					}
					currentLineCopy.duration = currentLineCopy.end - currentLineCopy.start;
				}
				Subtitler.Visualiser.updateOverlay(currentLineCopy);
			}
		}
	}
}
Subtitler.Visualiser.__onPointerUp = function(e) {
	if(Subtitler.Visualiser.__currentLineDraggedEdge && Subtitler.Visualiser.__currentLineDraggedEdge.timestamp != null) {
		if(Subtitler.Visualiser.__currentLineDraggedEdge.edge == 'start') {
			var roundedTimestamp = Math.round(Subtitler.Visualiser.__currentLineDraggedEdge.timestamp * 100) / 100;
			Subtitler.LineEditor.start.setAttribute('data-value', roundedTimestamp);
			Subtitler.LineEditor.start.value = Subtitler.Formatting.formatTime(roundedTimestamp, 2);
			Subtitler.LineEditor.start.dispatchEvent(new CustomEvent('value-modified', { bubbles: true, cancelable: true, detail: { value: roundedTimestamp }}));
			Subtitler.Visualiser.renderLine(Subtitler.Lines.map[Subtitler.LineEditor.lineId] || null, true);
		}
		else if(Subtitler.Visualiser.__currentLineDraggedEdge.edge == 'end') {
			var roundedTimestamp = Math.round(Subtitler.Visualiser.__currentLineDraggedEdge.timestamp * 100) / 100;
			Subtitler.LineEditor.end.setAttribute('data-value', roundedTimestamp);
			Subtitler.LineEditor.end.value = Subtitler.Formatting.formatTime(roundedTimestamp, 2);
			Subtitler.LineEditor.end.dispatchEvent(new CustomEvent('value-modified', { bubbles: true, cancelable: true, detail: { value: roundedTimestamp }}));
			Subtitler.Visualiser.renderLine(Subtitler.Lines.map[Subtitler.LineEditor.lineId] || null, true);
		}
	}
	Subtitler.Visualiser.__currentLineDraggedEdge = null;
}

Subtitler.Visualiser.overlayCurrentLine.querySelector('.visualiser-current-line-start')
	.addEventListener('mousedown', Subtitler.Visualiser.__onPointerDown);
Subtitler.Visualiser.overlayCurrentLine.querySelector('.visualiser-current-line-start')
	.addEventListener('touchstart', Subtitler.Visualiser.__onPointerDown);
Subtitler.Visualiser.overlayCurrentLine.querySelector('.visualiser-current-line-end')
	.addEventListener('mousedown', Subtitler.Visualiser.__onPointerDown);
Subtitler.Visualiser.overlayCurrentLine.querySelector('.visualiser-current-line-end')
	.addEventListener('touchstart', Subtitler.Visualiser.__onPointerDown);

document.addEventListener('mousemove', Subtitler.Visualiser.__onPointerMove);
document.addEventListener('touchmove', Subtitler.Visualiser.__onPointerMove);

document.addEventListener('mouseup', Subtitler.Visualiser.__onPointerUp);
document.addEventListener('touchend', Subtitler.Visualiser.__onPointerUp);
Subtitler.Visualiser.container.addEventListener('touchcancel', Subtitler.Visualiser.__onPointerUp);

Subtitler.Visualiser.updateCurrentAudioTime = function() {
	if(Subtitler.Audio.isPlaying) {
		var leftEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-left-edge')*1;
		var rightEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-right-edge')*1;
		
		var currentAudioTime = Subtitler.Audio.time;
		
		var percentage = (currentAudioTime - leftEdgeTimestamp) / (rightEdgeTimestamp - leftEdgeTimestamp);
			
		Subtitler.Visualiser.overlayCurrentAudioTime.style.display = 'block';
		Subtitler.Visualiser.overlayCurrentAudioTime.style.left = (percentage * 100) + '%';
	}
	else {
		Subtitler.Visualiser.overlayCurrentAudioTime.style.display = 'none';
	}
}

Subtitler.Visualiser.__getLines = function() {
	var currentLine = Subtitler.Lines.map[Subtitler.LineEditor.lineId];
	var previousLine = (currentLine == null) ? null : (Subtitler.Lines.list[currentLine.lineno-1] || null);
	var nextLine = (currentLine == null) ? null : (Subtitler.Lines.list[currentLine.lineno+1] || null);
	return {
		current: currentLine,
		next: nextLine,
		previous: previousLine
	};
}
Subtitler.Visualiser.__getTemporalZoomSliderPosition = function( zoom ) {
	if(zoom == 0.5) {
		return 0.5;
	}
	if(zoom > 0.5) {
		return 0.625 + (0.125 * Math.log2(zoom));
	}
	return (40 - (4/zoom)) / 64;
}
Subtitler.Visualiser.__calculateTemporalZoom = function( value ) {
	if(value >= 0.5) {
		return 2 ** ((value - 0.625) * 8);
	}
	return 4/((0.625 - value) * 64);
}

Subtitler.Visualiser.__modifyZoomPropertyAndRender = function( e, propName ) {
	if(e && e.detail) {
		var value = e.detail.value * 1;
		
		var convertedValue = Math.round((0.1 + (value * 9.9)) * 1000) / 1000;
		var propValue = convertedValue;
		if(propName == 'temporalZoom') {
			propValue = Subtitler.Visualiser.__calculateTemporalZoom(value);
		}
		if(convertedValue < 0.1) {
			convertedValue = 0.1;
		}
		if(convertedValue > 10) {
			convertedValue = 10;
		}
		
		var temporalZoomBefore = Subtitler.Visualiser.temporalZoom;
		Subtitler.Visualiser[propName] = propValue;
		var temporalZoomAfter = Subtitler.Visualiser.temporalZoom;
		
		var leftEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute ('data-left-edge')*1;
		var rightEdgeTimestamp = Subtitler.Visualiser.overlay.getAttribute('data-right-edge')*1;
		if(temporalZoomBefore != temporalZoomAfter) {
			var visualiserWidth = rightEdgeTimestamp - leftEdgeTimestamp;
			visualiserWidth = (visualiserWidth * temporalZoomBefore) / temporalZoomAfter;
			rightEdgeTimestamp = leftEdgeTimestamp + visualiserWidth;
			if(isNaN(rightEdgeTimestamp) || rightEdgeTimestamp == leftEdgeTimestamp) {
				rightEdgeTimestamp = leftEdgeTimestamp + 0.1;
			}
			Subtitler.Visualiser.overlay.setAttribute('data-right-edge', rightEdgeTimestamp);
		}
		if(isNaN(rightEdgeTimestamp) || rightEdgeTimestamp == leftEdgeTimestamp) {
			rightEdgeTimestamp = leftEdgeTimestamp + 0.1;
		}
		
		var lines = Subtitler.Visualiser.__getLines();
		Subtitler.Visualiser.__render(leftEdgeTimestamp, rightEdgeTimestamp, Subtitler.Visualiser.frequencyZoom, lines.previous, lines.current, lines.next);
	}
}

Subtitler.Visualiser.__getSliderValue = function(slider, e) {
	if(slider) {
		var inner = slider.querySelector('.visualiser-slider-inner');
		
		var clientY = (typeof e.clientY != undefined) ? e.clientY : ((e.touches || [ ])[0] || { }).clientY;
		
		var sliderInnerBox = inner.getBoundingClientRect();
		
		var sliderInnerHeight = sliderInnerBox.bottom - sliderInnerBox.top;
		
		var value = (sliderInnerBox.bottom - clientY) / sliderInnerHeight;
		
		if(value > 1) {
			value = 1;
		}
		if(value < 0) {
			value = 0;
		}
		
		return value;
	}
}

Subtitler.Visualiser.__sliderPointerDown = function(e) {
	var slider = e && e.target && e.target.closest('.visualiser-slider');
	if(slider) {
		var value = Subtitler.Visualiser.__getSliderValue(slider, e);
		slider.setAttribute('data-value', value);
		slider.classList.add('visualiser-slider-held');
		slider.querySelector('.visualiser-slider-fill').style.height = (value * 100) + '%';
		slider.querySelector('.visualiser-slider-handle').style.bottom = (value * 100) + '%';
	}
}
Subtitler.Visualiser.__sliderPointerMove = function(e) {
	var slider = document.querySelector('.visualiser-slider-held')
	if(slider) {
		var value = Subtitler.Visualiser.__getSliderValue(slider, e);
		slider.setAttribute('data-value', value);
		slider.querySelector('.visualiser-slider-fill').style.height = (value * 100) + '%';
		slider.querySelector('.visualiser-slider-handle').style.bottom = (value * 100) + '%';
		slider.dispatchEvent(new CustomEvent('value-modification-pending', { bubbles: true, cancelable: true, detail: { value: (slider.getAttribute('data-value') * 1) }}));
	}
}
Subtitler.Visualiser.__sliderPointerUp = function(e) {
	var slider = document.querySelector('.visualiser-slider-held')
	if(slider) {
		slider.classList.remove('visualiser-slider-held');
		slider.dispatchEvent(new CustomEvent('value-modified', { bubbles: true, cancelable: true, detail: { value: (slider.getAttribute('data-value') * 1) }}));
	}
}

Subtitler.Visualiser.__sliders = document.querySelectorAll('.visualiser-slider');
for(var s=0; s<Subtitler.Visualiser.__sliders.length; s++) {
	Subtitler.Visualiser.__sliders[s].addEventListener('mousedown', Subtitler.Visualiser.__sliderPointerDown);
	Subtitler.Visualiser.__sliders[s].addEventListener('touchstart', Subtitler.Visualiser.__sliderPointerDown);
}

document.addEventListener('mousemove', Subtitler.Visualiser.__sliderPointerMove);
document.addEventListener('touchmove', Subtitler.Visualiser.__sliderPointerMove);
document.addEventListener('mouseup', Subtitler.Visualiser.__sliderPointerUp);
document.addEventListener('touchend', Subtitler.Visualiser.__sliderPointerUp);
document.addEventListener('touchcancel', Subtitler.Visualiser.__sliderPointerUp);

Subtitler.Visualiser.temporalZoomSlider.addEventListener('value-modified', function(e) {
	Subtitler.Visualiser.__modifyZoomPropertyAndRender(e, 'temporalZoom');
});
Subtitler.Visualiser.frequencyZoomSlider.addEventListener('value-modified', function(e) {
	Subtitler.Visualiser.__modifyZoomPropertyAndRender(e, 'frequencyZoom');
});
Subtitler.Visualiser.audioVolumeSlider.addEventListener('value-modified', function(e) {
	if(e && e.detail) {
		var value = e.detail.value;
		Subtitler.Audio.setVolume(value);
	}
});
Subtitler.Visualiser.audioVolumeSlider.addEventListener('value-modification-pending', function(e) {
	if(e && e.detail) {
		var value = e.detail.value;
		Subtitler.Audio.setVolume(value);
	}
});


var temporalZoomPercentage = Subtitler.Visualiser.__getTemporalZoomSliderPosition(Subtitler.Visualiser.temporalZoom);
Subtitler.Visualiser.temporalZoomSlider.querySelector('.visualiser-slider-fill').style.height = (temporalZoomPercentage * 100) + '%';
Subtitler.Visualiser.temporalZoomSlider.querySelector('.visualiser-slider-handle').style.bottom = (temporalZoomPercentage * 100) + '%';
		
		
var frequencyZoomPercentage = ((Subtitler.Visualiser.frequencyZoom / 9.9) - 0.1);
Subtitler.Visualiser.frequencyZoomSlider.querySelector('.visualiser-slider-fill').style.height = (frequencyZoomPercentage * 100) + '%';
Subtitler.Visualiser.frequencyZoomSlider.querySelector('.visualiser-slider-handle').style.bottom = (frequencyZoomPercentage * 100) + '%';

var audioZoomPercentage = Subtitler.Audio.getVolume();
Subtitler.Visualiser.audioVolumeSlider.querySelector('.visualiser-slider-fill').style.height = (audioZoomPercentage * 100) + '%';
Subtitler.Visualiser.audioVolumeSlider.querySelector('.visualiser-slider-handle').style.bottom = (audioZoomPercentage * 100) + '%';

// TODO - add ability to pan using the pane, and remove auto-reselect line 

Subtitler.Visualiser.__progressPanePanning = false;
Subtitler.Visualiser.__progressPanePendingLeftEdge = 0;
Subtitler.Visualiser.__progressPanePendingRightEdge = 0;
Subtitler.Visualiser.__progressPanePointerDown = function(e) {
	if(e && e.target && e.target.closest('.visualiser-location-and-progress')) {
		Subtitler.Visualiser.__progressPanePanning = true;
		Subtitler.Visualiser.__progressPaneUpdate(e);
	}
}
Subtitler.Visualiser.__progressPanePointerMove = function(e) {
	if(Subtitler.Visualiser.__progressPanePanning) {
		Subtitler.Visualiser.__progressPaneUpdate(e);
	}
}
Subtitler.Visualiser.__progressPanePointerUp = function(e) {
	if(Subtitler.Visualiser.__progressPanePanning) {
		Subtitler.Visualiser.__progressPanePanning = false;
		
		var leftEdgeTimestamp = Subtitler.Visualiser.__progressPanePendingLeftEdge;
		var rightEdgeTimestamp = Subtitler.Visualiser.__progressPanePendingRightEdge;
		if(isNaN(rightEdgeTimestamp) || rightEdgeTimestamp == leftEdgeTimestamp) {
			rightEdgeTimestamp = leftEdgeTimestamp + 0.1;
		}
		
		var lines = Subtitler.Visualiser.__getLines();
		Subtitler.Visualiser.__render(leftEdgeTimestamp, rightEdgeTimestamp, Subtitler.Visualiser.frequencyZoom, lines.previous, lines.current, lines.next);
	}
}
Subtitler.Visualiser.__progressPaneUpdate = function(e) {
	
	var duration = Subtitler.Visualiser.audio.duration || 0;
	if(duration == 0) {
		for(var n=0; n<Subtitler.Lines.list.length; n++) {
			if((Subtitler.Lines.list[n].end + 2) > duration) {
				duration = Subtitler.Lines.list[n].end + 2;
			}
		}
		if(duration == 0) {
			duration = 1;
		}
	}
	
	var clientX = e.clientX || (e.touches[0] || { }).clientX;
	
	var rect = Subtitler.Visualiser.progressAndLocationPane.getBoundingClientRect();
			
	var leftEdgeX = rect.left;
	var rightEdgeX = rect.right;
	
	var widthPixels = (rightEdgeX - leftEdgeX);
	var widthSeconds = 4/(Subtitler.Visualiser.temporalZoom || 1);
	
	var relativeX = clientX - leftEdgeX;
	
	var leftEdge = (relativeX/widthPixels)*duration;
	leftEdge = leftEdge - widthSeconds/2;
	var rightEdge = leftEdge + widthSeconds;
	
	if(rightEdge > duration) {
		rightEdge = duration;
		leftEdge = rightEdge - widthSeconds;
	}
	if(leftEdge < 0) {
		leftEdge = 0;
		rightEdge = leftEdge + widthSeconds;
	}
	
	Subtitler.Visualiser.__progressPanePendingLeftEdge = leftEdge;
	Subtitler.Visualiser.__progressPanePendingRightEdge = rightEdge;
	
	Subtitler.Visualiser.__drawCurrentRegion(leftEdge, rightEdge);
}
Subtitler.Visualiser.progressAndLocationPane.addEventListener('mousedown', Subtitler.Visualiser.__progressPanePointerDown);
Subtitler.Visualiser.progressAndLocationPane.addEventListener('touchstart', Subtitler.Visualiser.__progressPanePointerDown);

document.addEventListener('mousemove', Subtitler.Visualiser.__progressPanePointerMove);
document.addEventListener('touchmove', Subtitler.Visualiser.__progressPanePointerMove);
document.addEventListener('mouseup', Subtitler.Visualiser.__progressPanePointerUp);
document.addEventListener('touchend', Subtitler.Visualiser.__progressPanePointerUp);
document.addEventListener('touchcancel', Subtitler.Visualiser.__progressPanePointerUp);
