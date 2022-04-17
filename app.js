

Subtitler = window.Subtitler || { };

Subtitler.url = 'https://subtitler-webapp.web.app';

Subtitler.Manifest = {
	"short_name": "Subtitler",
	"name": "Subtitler",
	"description": "",
	"icons": [
		{
			"src": "", // TODO
			"type": "image/png",
			"sizes": "192x192"
		},
		{
			"src": "", // TODO
			"type": "image/png",
			"sizes": "512x512"
		}
	],
	"start_url": "/",
	"background_color": "",
	"display": "standalone",
	"scope": "/",
	"theme_color:": "#999999", // TODO
}

Subtitler.app = Subtitler.app || document.querySelector('.webapp');

Subtitler.Utils = Subtitler.Utils || { };


Subtitler.Video = { };

Subtitler.Video.pane = document.querySelector('.webapp-video-player-pane');
Subtitler.Video.player = document.querySelector('.webapp-video-player-pane video');
Subtitler.Video.subtitleOverlay = Subtitler.Video.pane.querySelector('.subtitle-overlay');
Subtitler.Video.isPlaying = false;
Subtitler.Video.timestamp = document.querySelector('.webapp-video-player-pane .video-timestamp');
Subtitler.Video.lineStartDelta = document.querySelector('.webapp-video-player-pane .line-start-delta');
Subtitler.Video.lineEndDelta = document.querySelector('.webapp-video-player-pane .line-end-delta');
Subtitler.Video.duration = NaN;
Subtitler.Video.seeking = false;
Subtitler.Video.autoSeekOnLineSelect = true;
Subtitler.Video.zoomDropdown = document.querySelector('.video-scale-dropdown');

Subtitler.Video.__onVideoEvent = function() {
	if(!Subtitler.Video.seeking) {
		if(Subtitler.Video.hasRealVideo) {
			Subtitler.Video.time = Subtitler.Video.player.currentTime;
		}
		Subtitler.Video.__updateLineDeltas(Subtitler.Video.time);
		Subtitler.Video.__updateSeekBars(Subtitler.Video.time);
	}
	Subtitler.Video.__updateVisibleSubtitles();
}


Subtitler.Video.__timeUpdateInterval = window.setInterval(function() {
	var now = new Date().getTime();
	if(!Subtitler.Video.hasRealVideo && Subtitler.Video.isPlaying && !Subtitler.Video.seeking && Subtitler.Video.duration > 0) {
		
		var timeElapsed = (now - Subtitler.Video.__lastTick) / 1000;
		timeElapsed = Math.min(0.033, Math.max(timeElapsed, 0.066));
		Subtitler.Video.time += timeElapsed;
		if(Subtitler.Video.time >= Subtitler.Video.duration) {
			Subtitler.Video.time = Subtitler.Video.duration;
			Subtitler.Video.isPlaying = false;
		}
	}
	if(!isNaN(Subtitler.Video.duration) && !Subtitler.Video.seeking) {
		Subtitler.Video.__onVideoEvent();
		if(Subtitler.Video.__stopTime != null) {
			if((Subtitler.Video.time > Subtitler.Video.__stopTime)
				|| (Subtitler.Video.isPlaying && (Subtitler.Video.time >= Subtitler.Video.__stopTime))) {
				Subtitler.Video.seek(Subtitler.Video.__stopTime, false);
				Subtitler.Video.__stopTime = null;
			}
		}
	}
	Subtitler.Video.__lastTick = now;
}, 33);

Subtitler.Video.__updateVisibleSubtitles = function( forceRedraw ) {
	var currentTime = Subtitler.Video.time;
	var renderScale = Subtitler.Video.subtitleOverlay.clientWidth / (Subtitler.Info.playResX || Subtitler.Video.naturalWidth);
	
	if(Subtitler.Video.__stopTime != null && currentTime >= Subtitler.Video.__stopTime) {
		currentTime = Subtitler.Video.__stopTime;
	}
	
	var visibleLines = Subtitler.Lines.getVisibleLines(currentTime);
	
	visibleLines.sort(function(a, b) {
		if( a.start < b.start ) {
			return -1;
		}
		if( a.start > b.start ) {
			return 1;
		}
		if( a.lineno < b.lineno ) {
			return -1;
		}
		if( a.lineno > b.lineno ) {
			return 1;
		}
		return 0;
	});
	
	var previouslyVisibleSubtitles = Subtitler.Video.subtitleOverlay.querySelectorAll('.subtitle');
	
	var previouslyVisibleSubtitlesToKeep = [ ];
	var newSubtitlesToRender = [ ];
	
	for(var n=0; n<visibleLines.length; n++) {
		var line = visibleLines[n];
		
		var alreadyDrawn = false;
		if(!forceRedraw) {
			for(var p=0; p<previouslyVisibleSubtitles.length; p++) {
				if( previouslyVisibleSubtitles[p].getAttribute('data-subtitle-id') == line.id ) {
					var previousRenderScale = previouslyVisibleSubtitles[p].getAttribute('data-render-scale') * 1;
					if(isNaN(previousRenderScale) || renderScale != previousRenderScale ) {
						continue;
					}
					alreadyDrawn = true;
					previouslyVisibleSubtitlesToKeep.push(previouslyVisibleSubtitles[p]);
					break;
				}
			}
		}
		
		if(!alreadyDrawn) {
			newSubtitlesToRender.push(line);
		}
	}
	
	for(var p=0; p<previouslyVisibleSubtitles.length; p++) {
		var element = previouslyVisibleSubtitles[p];
		if( previouslyVisibleSubtitlesToKeep.indexOf(element) == -1 ) {
			element.parentNode.removeChild(element);
		}
	}
	
	// TODO - subtitle stacking
	// TODO - subtitle ordering
	
	for(var n=0; n<newSubtitlesToRender.length; n++) {
		var newLine = newSubtitlesToRender[n];
		var newLineElement = Subtitler.Video.__renderSubtitle(newLine);
	}
	
	Subtitler.Lines.__updateVisibleLines(visibleLines);
}

Subtitler.Video.__renderSubtitle = function( line ) {
	
	var renderScale = Subtitler.Video.subtitleOverlay.clientWidth / (Subtitler.Info.playResX || Subtitler.Video.naturalWidth);
	
	var renderOptions = { };
	renderOptions[Subtitler.Renderer.Options.SCALE] = renderScale;
	renderOptions[Subtitler.Renderer.Options.CAPTIONS_MODE] = Subtitler.Settings.captionsMode || false;
	
	var subtitleElement = Subtitler.Renderer.render( line, renderOptions );
	
	if(subtitleElement) {
		Subtitler.Video.subtitleOverlay.appendChild(subtitleElement);
	}
}

Subtitler.Video.player.addEventListener('canplaythrough', function() {
	Subtitler.Video.duration = Subtitler.Video.player.duration;
});

Subtitler.Video.player.addEventListener('seeked', function() {
	Subtitler.Video.seeking = false;
	Subtitler.Video.time = Subtitler.Video.player.currentTime;
	if(Subtitler.Video.__throttledSeekTime == null) {
		Subtitler.Video.__onVideoEvent();
	}
});
Subtitler.Video.player.addEventListener('play', function() {
	Subtitler.Video.isPlaying = true;
	Subtitler.Video.__onVideoEvent();
});
Subtitler.Video.player.addEventListener('playing', function() {
	if(Subtitler.Video.seeking) {
		return;
	}
	Subtitler.Video.isPlaying = true;
	Subtitler.Video.__onVideoEvent();
});
Subtitler.Video.player.addEventListener('paused', function() {
	Subtitler.Video.isPlaying = false;
	Subtitler.Video.__onVideoEvent();
	//Subtitler.Video.__stopTime = null;
	Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
	Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
});
Subtitler.Video.player.addEventListener('ended', function() {
	Subtitler.Video.isPlaying = false;
	Subtitler.Video.__stopTime = null;
	Subtitler.Video.__onVideoEvent();
	Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
	Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
});
Subtitler.Video.player.addEventListener('emptied', function() {
	Subtitler.Video.isPlaying = false;
	Subtitler.Video.time = 0;
	Subtitler.Video.__updateSeekBars(0);
	Subtitler.Video.__updateLineDeltas(0);
	Subtitler.Video.seek( 0, false );
	Subtitler.Video.__stopTime = null;
	Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
	Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
});


Subtitler.Video.setVideoNaturalDimensions = function( width, height ) {
	Subtitler.Video.naturalWidth = width;
	Subtitler.Video.naturalHeight = height;
	Subtitler.Video.aspectRatio = Math.round(100000 * (Subtitler.Video.naturalWidth / Subtitler.Video.naturalHeight)) / 100000;
	Subtitler.Video.pane.querySelector('.aspect-fullscreen').style.width = 'calc((100vh - 63px) * ' + Subtitler.Video.aspectRatio + ')';
	Subtitler.Video.pane.querySelector('.aspect-fullscreen').style.height = 'calc((100vw / ' + Subtitler.Video.aspectRatio + ') - 63px)';
	Subtitler.Video.pane.querySelector('.aspect').style.paddingTop = 'calc(100% / ' + Subtitler.Video.aspectRatio + ')';
	
	var currentScale = Subtitler.Video.zoomDropdown.getAttribute('data-value');
	if(currentScale != 'auto') {
		currentScale = currentScale / 100;
	}
	Subtitler.Video.setVideoScale(currentScale);
}

Subtitler.Video.player.addEventListener('loadedmetadata', function() {
	Subtitler.Video.setVideoNaturalDimensions( Subtitler.Video.player.videoWidth, Subtitler.Video.player.videoHeight );
	Subtitler.Video.pane.classList.remove('using-dummy-video');
	Subtitler.Video.pane.querySelector('.video-wrapper-inner').classList.remove('checkerboard');
	Subtitler.Video.pane.querySelector('.video-wrapper-inner').style.backgroundColor = '';
	Subtitler.Video.__offerToChangeScriptResolution();
});

Subtitler.Video.player.addEventListener('error', function() {
	Subtitler.Popup.show(
		Subtitler.Translations.get('videoLoadErrorPopupTitle'),
		Subtitler.Translations.get('videoLoadErrorPopupMessage'),
		[{ label: Subtitler.Translations.get('videoLoadErrorPopupButtonText') }]
	);
});

Subtitler.Garbage = Subtitler.Garbage || { };

Subtitler.Video.setVideoScale = function( scale ) {
	
	//if(scale != 'auto' && (Subtitler.Video.naturalWidth * (value/100) > window.innerWidth)) {
	//	value = 'auto';
	//}
	//else if(value != 'auto' && (Subtitler.Video.naturalHeight * (value/100) > (window.innerHeight - 100))) {
	//	value = 'auto';
	//}
	
	var value = (scale == 'auto') ? 'auto' : Math.round(scale * 10000) / 100;
	var element = Subtitler.Video.zoomDropdown.querySelector('.dropdown-item[data-value="' + value + '"] .dropdown-item-text');
	
	if(scale != 'auto') {
		
		Subtitler.Video.pane.classList.remove('video-scale-auto');
	
		var videoWidth = Math.round(Subtitler.Video.naturalWidth * scale);
		var videoHeight = Math.round(Subtitler.Video.naturalHeight * scale);
		
		Subtitler.Video.pane.style.maxWidth = Math.max(520, videoWidth) + 'px';
		Subtitler.Video.pane.querySelector('.video-area').style.maxWidth = videoWidth + 'px';
		
		Subtitler.Video.pane.querySelector('.video-wrapper-inner').style.maxWidth = 'none';
		Subtitler.Video.pane.querySelector('.aspect').style.maxWidth = 'none';
		Subtitler.Video.pane.querySelector('.aspect').style.width = videoWidth + 'px';
		Subtitler.Video.pane.querySelector('.aspect').style.height = videoHeight + 'px';
		
	}
	else {
		Subtitler.Video.pane.classList.add('video-scale-auto');
		Subtitler.Video.pane.style.maxWidth = '';
		Subtitler.Video.pane.querySelector('.video-area').style.width = '';
		Subtitler.Video.pane.querySelector('.video-wrapper-inner').style.maxWidth = 'calc((75vh - 95px) * ' + Subtitler.Video.aspectRatio + ')';
		Subtitler.Video.pane.querySelector('.aspect').style.maxWidth = 'calc((75vh - 95px) * ' + Subtitler.Video.aspectRatio + ')';
		Subtitler.Video.pane.querySelector('.aspect').style.width = '';
		Subtitler.Video.pane.querySelector('.aspect').style.height = '';
	}
	
	if(element) {
		Subtitler.Video.zoomDropdown.setAttribute('data-value', value);
		Subtitler.Video.zoomDropdown.querySelector('.dropdown-handle-text').textContent = element.textContent;
	}
	else {
		Subtitler.Video.zoomDropdown.setAttribute('data-value', value);
		Subtitler.Video.zoomDropdown.querySelector('.dropdown-handle-text').textContent = Subtitler.Translations.get('videoScaleCustom');
	}
}

Subtitler.Video.__loadDummyVideo = function( width, height, colour, checkerboard, frameRate, durationInSeconds, durationInFrames ) {
	
	var resolution = width + 'x' + height;
	
	Subtitler.Garbage.dummyVideo = {
		'width': width,
		'height': height,
		'resolution': resolution,
		'colour': colour,
		'checkerboard': checkerboard,
		'frameRate': frameRate,
		'durationInFrames': durationInFrames,
		'durationInSeconds': durationInSeconds
	}
	
	var previousAudioSrc = Subtitler.Audio.element.src;
	var previousVideoSrc = Subtitler.Video.player.src;
	
	if(Subtitler.Video.hasRealVideo) {
		Subtitler.Video.player.pause();
		Subtitler.Video.player.removeAttribute('src');
		Subtitler.Video.player.load();
	}
	
	if(previousVideoSrc && (!previousAudioSrc || previousVideoSrc != previousAudioSrc)) {
		URL.revokeObjectURL(previousVideoSrc);
	}
	
	Subtitler.Video.hasRealVideo = false;
	Subtitler.Video.setVideoNaturalDimensions( Subtitler.Garbage.dummyVideo.width, Subtitler.Garbage.dummyVideo.height );
	Subtitler.Video.seeking = false;
	Subtitler.Video.isPlaying = false;
	Subtitler.Video.time = 0;
	Subtitler.Video.duration = durationInSeconds;
	
	Subtitler.Garbage.videoFile = 
		'?dummy'
		+ ':' + frameRate
		+ ':' + (durationInFrames | 0)
		+ ':' + (width | 0)
		+ ':' + (height | 0)
		+ ':' + ((colour || { r: '0' }).r | 0)
		+ ':' + ((colour || { g: '0' }).g | 0)
		+ ':' + ((colour || { b: '0' }).b | 0)
		+ ':' + (checkerboard ? 'c' : '')
	;
	
	Subtitler.Video.pane.classList.add('using-dummy-video');
	Subtitler.Video.pane.querySelector('.video-wrapper-inner').style.backgroundColor = colour.toRGBA();
	Subtitler.Video.pane.querySelector('.video-wrapper-inner').classList.toggle('checkerboard', !!checkerboard);
	
	Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
	Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
	
	Subtitler.Video.__offerToChangeScriptResolution();
}

Subtitler.Video.__offerToChangeScriptResolution = function( ) {
	if(Subtitler.Video.naturalWidth && Subtitler.Video.naturalHeight) {
		if(Subtitler.Info.playResX != Subtitler.Video.naturalWidth
				|| Subtitler.Info.playResY != Subtitler.Video.naturalHeight) {
		
			// a new video has been loaded which doesn't match the current script resolution
			
			var updateInfo;
			var showPopup;
		
			if(Subtitler.Info.playResX == 0 && Subtitler.Info.playResY == 0) {
				// no previous settings, skip popup
				updateInfo = true;
				showPopup = false;
			}
			else if(Subtitler.Settings.onVideoResMismatch == 'autochange') {
				updateInfo = true;
				showPopup = false;
			}
			else if(Subtitler.Settings.onVideoResMismatch == 'popup') {
				updateInfo = false;
				showPopup = true;
			}
			else {
				// leave as is
				updateInfo = false;
				showPopup = false;
			}
			
			if(updateInfo) {
				Subtitler.Video.__changeScriptResolution();
			}
			else if(showPopup) {
				var scriptResolution = Subtitler.Info.playResX + 'x' + Subtitler.Info.playResY;
				var videoResolution = Subtitler.Video.naturalWidth + 'x' + Subtitler.Video.naturalHeight;
				Subtitler.Popup.show(
					Subtitler.Translations.get('videoResMismatchPopupTitle'),
					Subtitler.Translations.get('videoResMismatchPopupMessage')
						.replace('{videoResolution}', videoResolution)
						.replace('{scriptResolution}', scriptResolution),
					[
						{
							label: Subtitler.Translations.get('videoResMismatchPopupButtonNo'),
						},
						{
							label: Subtitler.Translations.get('videoResMismatchPopupButtonYes'),
							callback: Subtitler.Video.__changeScriptResolution
						},
//						{
//							label: Subtitler.Translations.get('videoResMismatchPopupButtonAlways'),
//							callback: function() {
//								Subtitler.Settings.onVideoResMismatch = 'autochange';
//								Subtitler.Settings.save();
//								Subtitler.Video.__changeScriptResolution();
//							}
//						}
					]
				);
			}
		}
	}
}

Subtitler.Video.__changeScriptResolution = function() {
	if(Subtitler.Video.naturalWidth && Subtitler.Video.naturalHeight) {
		Subtitler.Info.playResX = Subtitler.Video.naturalWidth;
		Subtitler.Info.playResY = Subtitler.Video.naturalHeight;
	}
}

Subtitler.Video.__updateVideoSize = function() {
}

Subtitler.Video.__loadVideo = function( file ) {
	Subtitler.Video.duration = NaN;
	if(Subtitler.Video.isPlaying) {
		Subtitler.Video.player.pause();
	}
	Subtitler.Video.isPlaying = false;
	if(typeof file == 'string') {
		Subtitler.Video.player.src = file;
		Subtitler.Video.hasRealVideo = true;
	}
}

// metadata about the subtitles
Subtitler.Info = Subtitler.Info || { };

Subtitler.Video.seek = function( time, play ) {
	
	if(typeof time == 'object' && time.hasOwnProperty('start')) {
		time = time.start;
	}
	
	if(typeof time != 'number') {
		return;
	}
	
	if(time > Subtitler.Video.duration) {
		time = Subtitler.Video.duration;
	}
	
	this.__throttledSeekTimeout = null;
	this.__throttledSeekTime = null;
	if(!play && Subtitler.Video.isPlaying) {
		if(Subtitler.Video.hasRealVideo) {
			Subtitler.Video.player.pause();
		}
		Subtitler.Audio.pause();
		Subtitler.Video.isPlaying = false;
		Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
		Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
	}
	if(Subtitler.Video.hasRealVideo && Subtitler.Video.player.currentTime != time) {
		Subtitler.Video.seeking = true;
		Subtitler.Video.player.currentTime = time;
	}
	Subtitler.Video.time = time;
	if(!Subtitler.Video.hasRealVideo || Subtitler.Video.__throttledSeekTime == null) {
		Subtitler.Video.__updateLineDeltas(time);
		Subtitler.Video.__updateSeekBars(time);
	}
	if(play && !Subtitler.Video.isPlaying) {
		if(Subtitler.Video.hasRealVideo) {
			Subtitler.Video.player.play();
		}
		Subtitler.Audio.play(Subtitler.Video.time);
		Subtitler.Video.isPlaying = true;
	}
}

Subtitler.Video.__updateSeekBars = function( time ) {
	var percentage = Subtitler.Video.duration == 0 ? 0 : (time / Subtitler.Video.duration);
	if(isNaN(percentage)) {
		percentage = 0;
	}
	Subtitler.Video.Controls.SeekBar.handle.style.left = (100 * percentage) + '%';
	Subtitler.Video.Controls.SeekBar.foreground.style.width = (100 * percentage) + '%';
}

Subtitler.Video.__updateLineDeltas = function( time ) {
	var existingTimeHtml = Subtitler.Video.timestamp.innerHTML;
	var newTimeHtml = Subtitler.Formatting.formatTime(time, 3);
	if(newTimeHtml != existingTimeHtml) {
		Subtitler.Video.timestamp.innerHTML = Subtitler.Formatting.formatTime(time, 3);
	}
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine != null) {
		
		var lineStartDeltaInMillis = ((time - activeLine.start) * 1000) | 0;
		if(lineStartDeltaInMillis > 0) {
			lineStartDeltaInMillis = '+' + lineStartDeltaInMillis + 'ms';
		}
		else {
			lineStartDeltaInMillis = '' + lineStartDeltaInMillis + 'ms';
		}
		
		var lineEndDeltaInMillis = ((time - activeLine.end) * 1000) | 0;
		if(lineEndDeltaInMillis > 0) {
			lineEndDeltaInMillis = '+' + lineEndDeltaInMillis + 'ms';
		}
		else {
			lineEndDeltaInMillis = '' + lineEndDeltaInMillis + 'ms';
		}
		
		if(Subtitler.Video.lineStartDelta.innerHTML != lineStartDeltaInMillis) {
			Subtitler.Video.lineStartDelta.innerHTML = lineStartDeltaInMillis;
		}
		
		if(Subtitler.Video.lineEndDelta.innerHTML != lineEndDeltaInMillis) {
			Subtitler.Video.lineEndDelta.innerHTML = lineEndDeltaInMillis;
		}
	}
}

Subtitler.Video.play = function() {
	if(!(Subtitler.Video.duration > 0)) {
		Subtitler.Video.isPlaying = false;
		Subtitler.Audio.pause();
		return;
	}
	Subtitler.Video.isPlaying = true;
	if(Subtitler.Video.hasRealVideo) {
		Subtitler.Video.player.play();
	}
	Subtitler.Video.isPlaying = true;
	if(Subtitler.Video.hasRealVideo) {
		Subtitler.Video.time = Subtitler.Video.player.currentTime;
	}
	else {
		Subtitler.Video.time = Subtitler.Video.time || 0;
	}
	Subtitler.Video.__updateLineDeltas(Subtitler.Video.time);
}

Subtitler.Video.pause = function() {
	Subtitler.Video.isPlaying = false;
	if(Subtitler.Video.hasRealVideo) {
		Subtitler.Audio.pause();
		Subtitler.Video.player.pause();
		Subtitler.Video.isPlaying = false;
		Subtitler.Video.time = Subtitler.Video.player.currentTime;
	}
	Subtitler.Video.__updateLineDeltas(Subtitler.Video.time);
}

Subtitler.Video.__throttledSeekTime = null;
Subtitler.Video.__throttledSeekTimeout = null;
Subtitler.Video.__THROTTLED_SEEK_INTERVAL = 250;
Subtitler.Video.__throttledSeek = function( time ) {
	// like seek, but delays the actual seeking
	// new calls to throttledSeek while a seek is pending will
	// instead update the time that will be seeked to when the timer expires
	
	if(Subtitler.Video.isPlaying) {
		Subtitler.Video.pause();
		Subtitler.Audio.pause();
	}
	if(!Subtitler.Video.hasRealVideo) {
		Subtitler.Video.time = time;
		Subtitler.Video.seeking = false;
		return;
	}
	this.seeking = true;
	Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
	Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
	Subtitler.Video.__updateLineDeltas(time);
	if(this.__throttledSeekTimeout == null) {
		this.__throttledSeekTimeout = window.setTimeout(function() {
			if(Subtitler.Video.__throttledSeekTime != null) {
				Subtitler.Video.seek(Subtitler.Video.__throttledSeekTime, false);
			}
			Subtitler.Video.__throttledSeekTimeout = null;
		}, Subtitler.Video.__THROTTLED_SEEK_INTERVAL);
	}
	this.__throttledSeekTime = time;
}

Subtitler.Video.Controls = { };

Subtitler.Video.Controls.SeekBar = { };
Subtitler.Video.Controls.SeekBar.container = document.querySelector('.video-seek-bar');
Subtitler.Video.Controls.SeekBar.background = document.querySelector('.video-seek-track');
Subtitler.Video.Controls.SeekBar.foreground = document.querySelector('.video-seek-progress');
Subtitler.Video.Controls.SeekBar.handle = document.querySelector('.video-current');
Subtitler.Video.Controls.SeekBar.isHandleGrabbed = false;

Subtitler.Video.Controls.Buttons = { };

Subtitler.Video.Controls.Buttons.togglePlayPause = document.querySelector('.button-play-toggle');
Subtitler.Video.Controls.Buttons.playCurrentLine = document.querySelector('.button-play-line');
Subtitler.Video.Controls.Buttons.jumpToSelectedLine = document.querySelector('.button-jump-on-line-select');
Subtitler.Video.Controls.Buttons.toggleHideVideo = document.querySelector('.button-video-toggle');
Subtitler.Video.Controls.Buttons.toggleFullScreen = document.querySelector('.button-video-fullscreen');

Subtitler.Video.Controls.Buttons.togglePlayPause.addEventListener('click', function() {
	Subtitler.Video.__stopTime = null;
	if(Subtitler.Video.isPlaying) {
		Subtitler.Video.pause();
		Subtitler.Audio.pause();
		Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
		Subtitler.Video.Controls.Buttons.playCurrentLine.classList.remove('toggled');
	}
	else {
		Subtitler.Video.play();
		Subtitler.Audio.play(Subtitler.Video.time);
		Subtitler.Video.Controls.Buttons.togglePlayPause.classList.toggle('toggled', Subtitler.Video.isPlaying);
	}
});

Subtitler.Video.Controls.Buttons.playCurrentLine.addEventListener('click', function() {
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Video.Controls.Buttons.togglePlayPause.classList.remove('toggled');
		Subtitler.Video.__stopTime = activeLine.end - 0.03;
		if(Subtitler.Video.isPlaying || Subtitler.Video.time != activeLine.start) {
			Subtitler.Video.seek(activeLine.start, true);
			Subtitler.Audio.play(activeLine.start, activeLine.end);
			Subtitler.Video.Controls.Buttons.playCurrentLine.classList.add('toggled');
		}
		else {
			Subtitler.Video.play();
			Subtitler.Audio.play(activeLine.start, activeLine.end);
			Subtitler.Video.Controls.Buttons.playCurrentLine.classList.toggle('toggled', Subtitler.Video.isPlaying);
		}
	}
});

Subtitler.Video.Controls.Buttons.jumpToSelectedLine.addEventListener('click', function() {
	Subtitler.Video.autoSeekOnLineSelect = !Subtitler.Video.autoSeekOnLineSelect;
	if(Subtitler.Video.autoSeekOnLineSelect) {
		Subtitler.Video.Controls.Buttons.jumpToSelectedLine.classList.add('toggled');
	}
	else {
		Subtitler.Video.Controls.Buttons.jumpToSelectedLine.classList.remove('toggled');
	}
});



Subtitler.Video.Controls.Buttons.toggleFullScreen.addEventListener('click', function(){
	if(Subtitler.Video.pane.classList.contains('video-disabled')) {
		Subtitler.Video.pane.classList.remove('video-disabled');
	}
	Subtitler.Video.Controls.Buttons.toggleHideVideo.classList.remove('toggled');
	Subtitler.Video.pane.classList.remove('entering-fullscreen');
	Subtitler.Video.pane.classList.remove('exiting-fullscreen');
	if(Subtitler.Video.pane.classList.contains('fullscreen')) {
		Subtitler.Video.Controls.Buttons.toggleFullScreen.classList.remove('toggled');
		Subtitler.Video.pane.classList.remove('fullscreen');
		Subtitler.Video.pane.classList.add('exiting-fullscreen');
		try {
			document.exitFullscreen();
		}
		catch(e){
			// pass
		}
	}
	else {
		Subtitler.Video.Controls.Buttons.toggleFullScreen.classList.add('toggled');
		Subtitler.Video.pane.classList.add('entering-fullscreen');
		try {
			Subtitler.Video.pane.requestFullscreen();
		}
		catch(e){
			// pass
		}
		Subtitler.Video.pane.classList.add('fullscreen');
	}
});

Subtitler.Video.pane.addEventListener('fullscreenchange', function() {
	if(Subtitler.Video.pane.classList.contains('entering-fullscreen')) {
		Subtitler.Video.pane.classList.remove('entering-fullscreen');
	}
	else if(Subtitler.Video.pane.classList.contains('exiting-fullscreen')) {
		Subtitler.Video.pane.classList.remove('exiting-fullscreen');
	}
	else if(Subtitler.Video.pane.classList.contains('fullscreen')) {
		Subtitler.Video.pane.classList.remove('fullscreen');
		Subtitler.Video.Controls.Buttons.toggleFullScreen.classList.remove('toggled');
	}
});

Subtitler.Video.Controls.Buttons.toggleHideVideo.addEventListener('click', function() {
	if(Subtitler.Video.pane.classList.contains('video-disabled')) {
		Subtitler.Video.pane.classList.remove('video-disabled');
		Subtitler.Video.Controls.Buttons.toggleHideVideo.classList.remove('toggled');
	}
	else {
		Subtitler.Video.pane.classList.add('video-disabled');
		Subtitler.Video.Controls.Buttons.toggleHideVideo.classList.add('toggled');
		if(Subtitler.Video.pane.classList.contains('fullscreen')) {
			Subtitler.Video.pane.classList.remove('fullscreen');
			Subtitler.Video.pane.classList.add('exiting-fullscreen');
			try {
				document.exitFullscreen();
			}
			catch(e){
				// pass
			}
			Subtitler.Video.Controls.Buttons.toggleFullScreen.classList.remove('toggled');
		}
	}
});
Subtitler.Video.Controls.SeekBar.__handleGrabStartHandler = function() {
	if(event.button && event.button != 1) {
		return;
	}
	if(isNaN(Subtitler.Video.duration)) {
		return;
	}
	Subtitler.Video.Controls.SeekBar.isHandleGrabbed = true;
};
Subtitler.Video.Controls.SeekBar.__handleMoveHandler = function(event) {
	if(!Subtitler.Video.Controls.SeekBar.isHandleGrabbed) {
		return;
	}
	if(isNaN(Subtitler.Video.duration)) {
		return;
	}
	var x = (event.touches && event.touches[0].clientX != undefined) ? event.touches[0].clientX : event.clientX;
	
	x = x - 10; // parent padding
	
	var xMin = 0;
	var xMax = Subtitler.Video.Controls.SeekBar.background.clientWidth;
	
	x = Math.min(xMax, x);
	x = Math.max(xMin, x);
	
	var percentage = x / xMax;
	
	Subtitler.Video.Controls.SeekBar.handle.style.left = (100 * percentage) + '%';
	Subtitler.Video.Controls.SeekBar.foreground.style.width = (100 * percentage) + '%';
	
	var newTime = Math.min(Math.max(0, percentage * Subtitler.Video.duration), Subtitler.Video.duration);
	Subtitler.Video.__stopTime = null;
	Subtitler.Video.__throttledSeek(newTime);
};
Subtitler.Video.Controls.SeekBar.__handleGrabEndHandler = function() {
	Subtitler.Video.Controls.SeekBar.isHandleGrabbed = false;
};

Subtitler.Video.Controls.SeekBar.handle.addEventListener('mousedown', Subtitler.Video.Controls.SeekBar.__handleGrabStartHandler);
Subtitler.Video.Controls.SeekBar.handle.addEventListener('touchstart', Subtitler.Video.Controls.SeekBar.__handleGrabStartHandler);
document.addEventListener('mousemove', Subtitler.Video.Controls.SeekBar.__handleMoveHandler);
document.addEventListener('touchmove', Subtitler.Video.Controls.SeekBar.__handleMoveHandler);
document.addEventListener('mouseup', Subtitler.Video.Controls.SeekBar.__handleGrabEndHandler);
document.addEventListener('touchend', Subtitler.Video.Controls.SeekBar.__handleGrabEndHandler);
document.addEventListener('touchcancel', Subtitler.Video.Controls.SeekBar.__handleGrabEndHandler);

Subtitler.Video.Controls.SeekBar.container.addEventListener('mousedown', function(event) {
	if(Subtitler.Video.Controls.SeekBar.isHandleGrabbed) {
		return;
	}
	if(event.button && event.button != 1) {
		return;
	}
	if(isNaN(Subtitler.Video.duration)) {
		return;
	}
	
	var x = (event.touches && event.touches[0].clientX != undefined) ? event.touches[0].clientX : event.clientX;
	
	x = x - 10; // parent padding
	
	var xMin = 0;
	var xMax = Subtitler.Video.Controls.SeekBar.background.clientWidth || 1;
	
	x = Math.min(xMax, x);
	x = Math.max(xMin, x);
	
	var percentage = x / xMax;
	
	Subtitler.Video.Controls.SeekBar.handle.style.left = (100 * percentage) + '%';
	Subtitler.Video.Controls.SeekBar.foreground.style.width = (100 * percentage) + '%';
	
	Subtitler.Video.Controls.SeekBar.isHandleGrabbed = true;
	
	var newTime = Math.min(Math.max(0, percentage * Subtitler.Video.duration), Subtitler.Video.duration);
	Subtitler.Video.__stopTime = null;
	Subtitler.Video.__throttledSeek(newTime);
});

Subtitler.Formatting = { }

Subtitler.Formatting.newlineCharacterReplacement = '<span class="hard-linebreak">\\N</span>';
Subtitler.Formatting.specialCharacterReplacement = '<span class="special">\u2600\uFE0E</span>';

Subtitler.Formatting.formatTime = function( timeInSeconds, nMillis ) {
	if(nMillis == undefined) {
		nMillis = 3;
	}
	
	// fix any floating point addition errors that have snuck in
	var timeInSeconds = Math.round(timeInSeconds * 1000000) / 1000000;
	
	var millis = Math.round((timeInSeconds - (timeInSeconds | 0)) * 1000);
	var seconds = (timeInSeconds | 0) % 60;
	var minutes = (((timeInSeconds | 0) - seconds) / 60) % 60;
	var hours = ((timeInSeconds | 0) - seconds - (minutes * 60)) / (60 * 60);
	
	var millisSubstring = '000' + millis;
	millisSubstring = millisSubstring.substring(millisSubstring.length - 3, millisSubstring.length);
	millisSubstring = millisSubstring.substring(0, nMillis > 3 ? 3 : nMillis)
	
	
	return hours + ':' + ((minutes <= 9) ? '0' : '') + minutes + ':' + ((seconds <= 9) ? '0' : '') + seconds + (nMillis > 0 ? ('.' + millisSubstring) : '');
}
Subtitler.Formatting.formatTimeASS = function( timeInSeconds ) {
	return Subtitler.Formatting.formatTime(timeInSeconds, 2);
}
Subtitler.Formatting.formatTimeSBV = function( timeInSeconds ) {
	return Subtitler.Formatting.formatTime(timeInSeconds, 3);
}
Subtitler.Formatting.formatTimeSRT = function( timeInSeconds ) {
	return (timeInSeconds < 36000 ? '0' : '') + Subtitler.Formatting.formatTime(timeInSeconds, 3).replace('.', ',');
}

Subtitler.Formatting.prettify = function( text ) {
	
	if(text == undefined) {
		return '';
	}
	
	var valid_escapes = [ '\\n', '\\N', '\\h' ];
	var valid_commands = [
		'\\i',
		'\\b',
		'\\u',
		'\\s',
		'\\bord',
		'\\xbord',
		'\\ybord',
		'\\shad',
		'\\xshad',
		'\\yshad',
		'\\be',
		'\\blur',
		'\\fn',
		'\\fs',
		'\\fscx',
		'\\fscy',
		'\\fsp',
		'\\frx',
		'\\fry',
		'\\frz',
		'\\fr',
		'\\fax',
		'\\fay',
		'\\fe',
		'\\c',
		'\\1c',
		'\\2c',
		'\\3c',
		'\\4c',
		'\\alpha',
		'\\1a',
		'\\2a',
		'\\3a',
		'\\4a',
		'\\an',
		'\\a',
		'\\k',
		'\\K',
		'\\kf',
		'\\ko',
		'\\q',
		'\\r',
		'\\pos',
		'\\move',
		'\\org',
		'\\fad',
		'\\fade',
		'\\t',
		'\\clip',
		'\\iclip',
		'\\p',
		'\\pbo'
	];
	
	text = text.replace(/&/g,'&amp;');
	text = text.replace(/</g,'&lt;');
	text = text.replace(/>/g,'&gt;');
	var parts = [ ];
	var inBlock = false;
	var buffer = '';
	var type = 'text';
	
	for(var c=0; c<text.length; c++) {
		if(!inBlock) {
			if(text.charAt(c) == '}') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				parts.push({ 'type': 'error', 'text': '}' });
			}
			else if(text.charAt(c) == '{') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				parts.push({ 'type': 'brace', 'text': '{' });
				type = 'pseudo-comment';
				inBlock = true;
			}
			else if(text.charAt(c) == '\\') {
				if(buffer) {
					parts.push({ 'type': type, text: buffer });
					buffer = '';
				}
				buffer = '\\';
				type = 'escape';
			}
			else if(type == 'escape') {
				buffer += text.charAt(c);
				parts.push({ 'type': type, text: buffer });
				buffer = '';
				type = 'text';
			}
			else {
				buffer += text.charAt(c);
			}
		}
		else {
			if(text.charAt(c) == '{') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				parts.push({ 'type': 'error', 'text': '{' });
			}
			else if(text.charAt(c) == '}') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				parts.push({ 'type': 'brace', 'text': '}' });
				type = 'text';
				inBlock = false;
			}
			else if(text.charAt(c) == '\\') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				buffer = '\\';
				type = 'command';
			}
			else if(type == 'command' && text.charAt(c) == '&') {
				if(buffer) {
					parts.push({ 'type': 'command', 'text': buffer });
					buffer = '';
				}
				buffer = '&';
				type = 'param';
			}
			else if((text.charAt(c) == '(' || text.charAt(c) == ')' || text.charAt(c) == ',') && type != 'pseudo-comment') {
				if(buffer) {
					parts.push({ 'type': type, 'text': buffer });
					buffer = '';
				}
				parts.push({ 'type': 'syntax', 'text': text.charAt(c) });
				type = (text.charAt(c) == ')') ? 'pseudo-comment' : 'param';
			}
			else {
				buffer += text.charAt(c);
			}
		}
	}
	if(buffer) {
		parts.push({ 'type': type, text: buffer });
	}
	
	var outputText = '';
	for(var p=0; p<parts.length; p++) {
		var type = parts[p].type;
		var text = parts[p].text;
		
		if(type == 'text') {
			outputText += text;
			continue;
		}
		if(type == 'brace') {
			outputText += '<span class="highlight-brace">' + text + '</span>';
			continue;
		}
		if(type == 'escape') {
			if(valid_escapes.indexOf(text) != -1) {
				outputText += '<span class="highlight-escape">' + text + '</span>';
			}
			else if(text.charAt(1) == ' ') {
				outputText += '<span class="syntax-error">' + text.charAt(0) + '</span>';
				outputText += ' ';
			}
			else {
				outputText += '<span class="syntax-error">' + text + '</span>';
			}
			continue;
		}
		if(type == 'syntax') {
			outputText += '<span class="highlight-syntax">' + text + '</span>';
			continue;
		}
		if(type == 'pseudo-comment') {
			outputText += '<span class="block-comment">' + text + '</span>';
			continue;
		}
		if(type == 'command') {
			if(valid_commands.indexOf(text) != -1) {
				outputText += '<span class="highlight-syntax">\\</span>';
				outputText += '<span class="highlight-command">' + text.substring(1) + '</span>';
				continue;
			}
			else if(text.startsWith('\\r')) {
				outputText += '<span class="highlight-syntax">\\</span>';
				outputText += '<span class="highlight-command">r</span>';
				outputText += '<span class="highlight-param">' + text.substring(2) + '</span>';
				continue;
			}
			else if(text.startsWith('\\fn')) {
				outputText += '<span class="highlight-syntax">\\</span>';
				outputText += '<span class="highlight-command">fn</span>';
				outputText += '<span class="highlight-param">' + text.substring(3) + '</span>';
				continue;
			}
			else if(valid_commands.indexOf(text.replace(/[0-9]+$/g, '')) != -1) {
				var command = text.replace(/[0-9]+$/g, '');
				outputText += '<span class="highlight-syntax">\\</span>';
				outputText += '<span class="highlight-command">' + command.substring(1) + '</span>';
				outputText += '<span class="highlight-param">' + text.substring(command.length) + '</span>';
				continue;
			}
			else {
				outputText += '<span class="syntax-error">' + text + '</span>';
			}
			continue;
		}
		if(type == 'param') {
			outputText += '<span class="highlight-param">' + text + '</span>';
			continue;
		}
		if(type == 'error') {
			outputText += '<span class="syntax-error">' + text + '</span>';
			continue;
		}
	}
	
	return outputText;
}

Subtitler.Settings = Subtitler.Settings || { };

/*

LINE FORMAT:

(brackets) around a property indicate it is automatically inferred

{
	(id):			string,		// uuid that identifies the line
	lineno:		int,			// 
	actor: string,
	layer: int,
	style: string,
	text_src:	string,
	(text_plain):	string,		// text_src with all non-visible characters removed, and \N replaced with a linebreak
	(text_html):	string,		// text_src formatted into html.
								//	{\c&H000000&}text{\r} would be rendered as <span style="color: #000000;">text</span>
	(text_line):	string,		// similar to text_plain, but with non visible parts {\fade(250,0)} replaced with the special character and newlines replaced with spaces
	start:		double,
	end:		double,
	(duration):	double,
	(cps): int
}


*/

Subtitler.Files = { };

Subtitler.LineEditor = { };
Subtitler.LineEditor.pane = document.querySelector('.webapp-edit-subtitle-pane');
Subtitler.LineEditor.start = Subtitler.LineEditor.pane.querySelector('input.subtitle-start'); 
Subtitler.LineEditor.end = Subtitler.LineEditor.pane.querySelector('input.subtitle-end');
Subtitler.LineEditor.duration = Subtitler.LineEditor.pane.querySelector('input.subtitle-duration');
Subtitler.LineEditor.layer = Subtitler.LineEditor.pane.querySelector('input.subtitle-layer');
Subtitler.LineEditor.style = Subtitler.LineEditor.pane.querySelector('.subtitle-style-dropdown');
Subtitler.LineEditor.editStyle = Subtitler.LineEditor.pane.querySelector('.subtitle-edit-style-button');
Subtitler.LineEditor.actor = Subtitler.LineEditor.pane.querySelector('input.actor-textbox');
Subtitler.LineEditor.text_src = Subtitler.LineEditor.pane.querySelector('.subtitle-text-editor textarea');
Subtitler.LineEditor.text_pretty = Subtitler.LineEditor.pane.querySelector('.subtitle-text-editor .pretty-editor');
Subtitler.LineEditor.text_original = Subtitler.LineEditor.pane.querySelector('.original-line');
Subtitler.LineEditor.isComment = Subtitler.LineEditor.pane.querySelector('.subtitle-comment');
Subtitler.LineEditor.lineId = null;

Subtitler.LineEditor.previousLineButton = document.querySelector('.subtitle-navigation-previous-line');
Subtitler.LineEditor.nextLineButton = document.querySelector('.subtitle-navigation-next-line');
Subtitler.LineEditor.togglePlayButton = document.querySelector('.subtitle-navigation-play-toggle');
Subtitler.LineEditor.playLineButton = document.querySelector('.subtitle-navigation-play-line');
Subtitler.LineEditor.play500msBeforeButton = document.querySelector('.subtitle-timing-aid-play-500ms-before');
Subtitler.LineEditor.playFirst500msButton = document.querySelector('.subtitle-timing-aid-play-first-500ms');
Subtitler.LineEditor.playLast500msButton = document.querySelector('.subtitle-timing-aid-play-last-500ms');
Subtitler.LineEditor.play500msAfterButton = document.querySelector('.subtitle-timing-aid-play-500ms-after');
Subtitler.LineEditor.addLeadInButton = document.querySelector('.subtitle-add-lead-in');
Subtitler.LineEditor.addLeadOutButton = document.querySelector('.subtitle-add-lead-out');
Subtitler.LineEditor.confirmLineButton = document.querySelector('.subtitle-confirm');

Subtitler.LineEditor.updateStylesDropdown = function() {
	var html = '';
	for(var s=0; s<Subtitler.Styles.list.length; s++) {
		var style = Subtitler.Styles.list[s];
		html += ('<div class="dropdown-item" data-value="' + style.name + '"><div class="dropdown-item-text">' + style.name + '</div></div>');
	}
	Subtitler.LineEditor.style.querySelector('.dropdown-contents').innerHTML = html;
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.LineEditor.style.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: activeLine.style }}));
	}
}

Subtitler.Video.zoomDropdown.addEventListener('value-modified', function(e) {
	if(e && e.detail) {
		
		var value = e.detail.value;
		if(value != 'auto') {
			value = value / 100;
		}
		
		Subtitler.Video.setVideoScale(value);
	}
});

if(Subtitler.LineEditor.editStyle) {
	Subtitler.LineEditor.editStyle.addEventListener('click', function() {
		Subtitler.StyleEditor.showPopup( Subtitler.LineEditor.style.getAttribute('data-value'), false );
	});
}

Subtitler.LineEditor.previousLineButton.addEventListener('click', function() {
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		var previousLine = Subtitler.Lines.list[activeLine.lineno-1];
		if(previousLine) {
			Subtitler.Lines.makeLineActive(previousLine);
			Subtitler.Lines.selectLine(previousLine, true);
		}
	}
});

Subtitler.LineEditor.nextLineButton.addEventListener('click', function() {
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		var nextLine = Subtitler.Lines.list[activeLine.lineno+1];
		if(nextLine) {
			Subtitler.Lines.makeLineActive(nextLine);
			Subtitler.Lines.selectLine(nextLine, true);
		}
	}
});

Subtitler.LineEditor.togglePlayButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	if(Subtitler.Audio.isPlaying) {
		Subtitler.Audio.pause();
	}
	else {
		Subtitler.Audio.play();
	}
});

Subtitler.LineEditor.playLineButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Audio.play(activeLine.start, activeLine.end);
	}
});

Subtitler.LineEditor.play500msBeforeButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Audio.play(Math.max(0, activeLine.start-0.5), activeLine.start);
	}
});

Subtitler.LineEditor.playFirst500msButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Audio.play(activeLine.start, activeLine.start+0.5);
	}
});

Subtitler.LineEditor.playLast500msButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Audio.play(Math.max(0, activeLine.end-0.5), activeLine.end);
	}
});

Subtitler.LineEditor.play500msAfterButton.addEventListener('click', function() {
	Subtitler.Video.pause();
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		Subtitler.Audio.play(activeLine.end, activeLine.end+0.5);
	}
});

Subtitler.LineEditor.addLeadInButton.addEventListener('click', function() {
	var startTime = Subtitler.LineEditor.start.getAttribute('data-value') * 1;
	startTime = Math.max(0, startTime - (Subtitler.Settings.leadIn / 1000));
	Subtitler.LineEditor.start.value = Subtitler.Formatting.formatTime(startTime, 2);
	Subtitler.LineEditor.start.setAttribute('data-value', startTime+'');
	
	var endTime = Math.max(startTime, Subtitler.LineEditor.end.getAttribute('data-value')*1);
	var duration = endTime - startTime;
	Subtitler.LineEditor.duration.value = Subtitler.Formatting.formatTime(duration, 2)
	Subtitler.LineEditor.duration.setAttribute('data-value', duration+'');
	
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		activeLine.start = startTime;
		activeLine.duration = duration;
		Subtitler.Lines.updateLine(activeLine);
	}
});

Subtitler.LineEditor.addLeadOutButton.addEventListener('click', function() {
	var endTime = Subtitler.LineEditor.end.getAttribute('data-value') * 1;
	endTime = Math.max(0, endTime + (Subtitler.Settings.leadOut / 1000));
	Subtitler.LineEditor.end.value = Subtitler.Formatting.formatTime(endTime, 2);
	Subtitler.LineEditor.end.setAttribute('data-value', endTime+'');
	
	var startTime = Subtitler.LineEditor.start.getAttribute('data-value') * 1;
	var duration = endTime - startTime;
	Subtitler.LineEditor.duration.value = Subtitler.Formatting.formatTime(duration, 2)
	Subtitler.LineEditor.duration.setAttribute('data-value', duration+'');
	
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		activeLine.end = endTime;
		activeLine.duration = duration;
		Subtitler.Lines.updateLine(activeLine);
	}
});

Subtitler.LineEditor.confirmLineButton.addEventListener('click', function() {
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine) {
		var nextLine = Subtitler.Lines.list[activeLine.lineno+1];
		if(!nextLine) {
			nextLine = Subtitler.Lines.insertNewLineAtEnd();
		}
		Subtitler.Lines.selectLine(nextLine);
	}
});

Subtitler.LineEditor.style.addEventListener('value-modified', function() {
	var value = Subtitler.LineEditor.style.getAttribute('data-value');
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.style = value;
		Subtitler.Lines.updateLine(selectedLine);
	}
	if(Subtitler.Lines.selection.length > 0) {
		Subtitler.Video.__updateVisibleSubtitles(true);
	}
});

Subtitler.LineEditor.text_src.addEventListener('input', function() {
	Subtitler.LineEditor.text_pretty.innerHTML = Subtitler.Formatting.prettify(Subtitler.LineEditor.text_src.value);
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.text_src = Subtitler.LineEditor.text_src.value;
		Subtitler.Lines.updateLine(selectedLine);
	}
	if(Subtitler.Lines.selection.length > 0) {
		Subtitler.Video.__updateVisibleSubtitles(true);
	}
});

Subtitler.LineEditor.text_src.addEventListener('change', function() {
	Subtitler.LineEditor.text_pretty.innerHTML = Subtitler.Formatting.prettify(Subtitler.LineEditor.text_src.value);
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.text_src = Subtitler.LineEditor.text_src.value;
		Subtitler.Lines.updateLine(selectedLine);
	}
	if(Subtitler.Lines.selection.length > 0) {
		Subtitler.Video.__updateVisibleSubtitles(true);
	}
});

Subtitler.LineEditor.actor.addEventListener('input', function() {
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.actor = Subtitler.LineEditor.actor.value;
		Subtitler.Lines.updateLine(selectedLine);
	}
	if(Subtitler.Lines.selection.length > 0) {
		Subtitler.Video.__updateVisibleSubtitles(true);
	}
});

Subtitler.LineEditor.start.addEventListener('value-modified', function(e) {
	// change the start time of all selected lines and update end and duration accordingly
	var activeLine = Subtitler.Lines.getActiveLine();
	var start = Subtitler.LineEditor.start.getAttribute('data-value') * 1;
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		var end = selectedLine.end;
		
		if(start > end) {
			end = start;
			if(selectedLine == activeLine) {
				Subtitler.LineEditor.end.value = Subtitler.Formatting.formatTime(start, 2);
				Subtitler.LineEditor.end.setAttribute('data-value', start+'');
			}
		}
		
		duration = Subtitler.Utils.fixFloatingPointErrors(end - start);
		if(selectedLine == activeLine) {
			Subtitler.LineEditor.duration.value = Subtitler.Formatting.formatTime(duration, 2);
			Subtitler.LineEditor.duration.setAttribute('data-value', duration+'');
		}
		
		selectedLine.start = start;
		selectedLine.end = end;
		selectedLine.duration = duration;
		Subtitler.Lines.updateLine(selectedLine);
	}
	Subtitler.Lines.__updateOverlappingLines(Subtitler.Lines.getActiveLine());
});

Subtitler.LineEditor.end.addEventListener('value-modified', function(e) {
	// change the end time of all selected lines and update start and duration accordingly
	var activeLine = Subtitler.Lines.getActiveLine();
	var end = Subtitler.LineEditor.end.getAttribute('data-value') * 1;
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		var start = selectedLine.start;
		
		if(end < start) {
			start = end;
			if(selectedLine == activeLine) {
				Subtitler.LineEditor.start.value = Subtitler.Formatting.formatTime(end, 2);
				Subtitler.LineEditor.start.setAttribute('data-value', end+'');
			}
		}
		
		duration = Subtitler.Utils.fixFloatingPointErrors(end - start);
		if(selectedLine == activeLine) {
			Subtitler.LineEditor.duration.value = Subtitler.Formatting.formatTime(duration, 2);
			Subtitler.LineEditor.duration.setAttribute('data-value', duration+'');
		}
		
		selectedLine.start = start;
		selectedLine.end = end;
		selectedLine.duration = duration;
		Subtitler.Lines.updateLine(selectedLine);
	}
	Subtitler.Lines.__updateOverlappingLines(Subtitler.Lines.getActiveLine());
});

Subtitler.LineEditor.duration.addEventListener('value-modified', function(e) {
	// change the duration of all selected lines and update end accordingly
	var activeLine = Subtitler.Lines.getActiveLine();
	var duration = Subtitler.LineEditor.duration.getAttribute('data-value') * 1;
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		var start = selectedLine.start;
		var end = Subtitler.Utils.fixFloatingPointErrors(start + duration);
		
		if(selectedLine == activeLine) {
			Subtitler.LineEditor.end.value = Subtitler.Formatting.formatTime(end, 2)
			Subtitler.LineEditor.end.setAttribute('data-value', end+'');
		}
		
		selectedLine.start = start;
		selectedLine.end = end;
		selectedLine.duration = duration;
		Subtitler.Lines.updateLine(selectedLine);
	}
	Subtitler.Lines.__updateOverlappingLines(Subtitler.Lines.getActiveLine());
});

Subtitler.LineEditor.layer.addEventListener('value-modified', function(e) {
	var value = Subtitler.LineEditor.layer.value | 0;
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.layer = value;
		Subtitler.Lines.updateLine(selectedLine);
	}
});

Subtitler.LineEditor.isComment.addEventListener('change', function(e) {
	var value = Subtitler.LineEditor.layer.value | 0;
	for(var n=0; n<Subtitler.Lines.selection.length; n++) {
		var selectedLine = Subtitler.Lines.selection[n];
		selectedLine.isComment = Subtitler.LineEditor.isComment.checked;
		Subtitler.Lines.updateLine(selectedLine);
	}
});

Subtitler.ContextMenu = { };
Subtitler.ContextMenu.show = function( element, x, y, attributes ) {
	
	element.style.display = 'block';
	element.style.top = '0';
	element.style.left = '0';
	
	var menuTop = y;
	var menuHeight = element.clientHeight;
	var availableHeight = window.innerHeight;
	if(menuTop + menuHeight > availableHeight - 20) {
		menuTop = availableHeight - 20 - menuHeight;
	}
	if(menuTop < 20) {
		menuTop = 20;
	}
	
	var menuLeft = x;
	var menuWidth = element.clientWidth;
	var availableWidth = window.innerWidth;
	if(menuLeft + menuWidth > availableWidth - 20) {
		menuLeft = availableWidth - 20 - menuWidth;
	}
	if(menuLeft < 20) {
		menuLeft = 20;
	}
	element.style.left = menuLeft + 'px';
	element.style.top = menuTop + 'px';
	
	if(attributes) {
		for(var attr in attributes) {
			if(attributes.hasOwnProperty(attr)) {
				element.setAttribute(attr, attributes[attr]);
			}
		}
	}
}
document.addEventListener('click', function() {
	var contextMenus = document.querySelectorAll('.webapp-context-menu');
	for(var c=0; c<contextMenus.length; c++) {
		contextMenus[c].style.display = 'none';
	}
});

Subtitler.Lines = { };
Subtitler.Lines.list = [ ];
Subtitler.Lines.map = { };
Subtitler.Lines.selection = [ ];

Subtitler.Lines.defaultLineDuration = 2;

Subtitler.Lines.listHeader = document.querySelector('.subtitle-list-header');
Subtitler.Lines.listElement = document.querySelector('.subtitle-list-content');
Subtitler.Lines.contextMenu = document.querySelector('.webapp-subtitle-list-context-menu');
Subtitler.Lines.insertLineAtEndButton = Subtitler.Lines.listElement.querySelector('.insert-new-line-row');

Subtitler.Lines.__onLineClick = function(e) {
	if(e.target && e.target.closest('.subtitle-list-element')) {
		
		var ctrlHeld = e.ctrlKey || false;
		var shiftHeld = e.shiftKey || false;
		var lineId = e.target.closest('.subtitle-list-element').getAttribute('data-subtitle-id');
		var line = Subtitler.Lines.getLine(lineId);
		
		var activeLine = Subtitler.Lines.getActiveLine();
		var isAlreadySelected = Subtitler.Lines.isLineSelected(lineId);
		
		if(!shiftHeld && !ctrlHeld) {
			Subtitler.Lines.selectLine(lineId, true);
		}
		else if(!shiftHeld && ctrlHeld && !isAlreadySelected) {
			Subtitler.Lines.selectLine(lineId, false);
		}
		else if(!shiftHeld && ctrlHeld && isAlreadySelected) {
			Subtitler.Lines.unselectLine(lineId);
		}
		else if(shiftHeld && !ctrlHeld) {
			if(activeLine == null) {
				Subtitler.Lines.selectLine(lineId, true);
			}
			else {
				var linesToSelect = [ ];
				var firstLineNo = Math.min(line.lineno, activeLine.lineno);
				var lastLineNo = Math.max(line.lineno, activeLine.lineno);
				lastLineNo = Math.min(lastLineNo, Subtitler.Lines.list.length - 1);
				for(var n=firstLineNo; n<=lastLineNo; n++) {
					linesToSelect.push(Subtitler.Lines.list[n]);
				}
				Subtitler.Lines.selectLines(linesToSelect, true);
			}
		}
		else if(shiftHeld && ctrlHeld) {
			if(activeLine == null) {
				Subtitler.Lines.selectLine(lineId, false);
			}
			else {
				var linesToSelect = [ ];
				var firstLineNo = Math.min(line.lineno, activeLine.lineno);
				var lastLineNo = Math.max(line.lineno, activeLine.lineno);
				lastLineNo = Math.min(lastLineNo, Subtitler.Lines.list.length - 1);
				for(var n=firstLineNo; n<=lastLineNo; n++) {
					linesToSelect.push(Subtitler.Lines.list[n]);
				}
				Subtitler.Lines.selectLines(linesToSelect, false);
			}
		}
		
		Subtitler.Lines.makeLineActive(lineId);
	}
}
Subtitler.Lines.listElement.addEventListener('click', Subtitler.Lines.__onLineClick);

Subtitler.Lines.__onLineRightClick = function(e) {
	if(e.target && e.target.closest('.subtitle-list-element')) {
		var line = Subtitler.Lines.getLine(e.target.closest('.subtitle-list-element').getAttribute('data-subtitle-id'));
		if(!Subtitler.Lines.isLineSelected(line)) {
			Subtitler.Lines.selectLine(line, true);
		}
		Subtitler.Lines.makeLineActive(line);
		Subtitler.ContextMenu.show(
			Subtitler.Lines.contextMenu,
			e.clientX,
			e.clientY,
			{ 'data-subtitle-id': e.target.closest('.subtitle-list-element').getAttribute('data-subtitle-id') }
		);
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
}
Subtitler.Lines.listElement.addEventListener('contextmenu', Subtitler.Lines.__onLineRightClick);

Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-insert-before').addEventListener('click', function() {
	Subtitler.Lines.insertNewLineBeforeLine(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-insert-after').addEventListener('click', function() {
	Subtitler.Lines.insertNewLineAfterLine(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-insert-at-video-time-before').addEventListener('click', function() {
	Subtitler.Lines.insertNewLineAtVideoTimeBeforeLine(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-insert-at-video-time-after').addEventListener('click', function() {
	Subtitler.Lines.insertNewLineAtVideoTimeAfterLine(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-duplicate-line').addEventListener('click', function() {
	Subtitler.Lines.duplicateLine(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-split-line-at-video-time').addEventListener('click', function() {
	Subtitler.Lines.splitLineAtVideoTime(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});

Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-cut-line').addEventListener('click', function() {
	Subtitler.Lines.cutLines(Subtitler.Lines.selection);
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-copy-line').addEventListener('click', function() {
	Subtitler.Lines.copyLines(Subtitler.Lines.selection);
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-paste-line-before').addEventListener('click', function() {
	Subtitler.Lines.pasteBefore(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-paste-line-after').addEventListener('click', function() {
	Subtitler.Lines.pasteAfter(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-paste-line-over').addEventListener('click', function() {
	Subtitler.Lines.pasteOver(Subtitler.Lines.contextMenu.getAttribute('data-subtitle-id'));
});
Subtitler.Lines.contextMenu.querySelector('.webapp-context-menu-option-delete-line').addEventListener('click', function() {
	Subtitler.Lines.deleteLines(Subtitler.Lines.selection);
});


Subtitler.Lines.__insertNewLine = function( index, start, end, text, style, layer, actor, isComment ) {
	var newLine = {
		'start': start,
		'end': end,
		'text_src': text,
		'style': style,
		'layer': layer,
		'isComment': !!isComment
	};
	if(actor) {
		newLine.actor = actor;
	}
	return Subtitler.Lines.__insertLine(index, newLine, true);
}
Subtitler.Lines.__insertLine = function( index, newLine, select ) {
	
	Subtitler.Lines.list.splice(index, 0, newLine);
	Subtitler.Lines.__updateLineNumbers();
	var lineToRender = Subtitler.Lines.__recompute(newLine);
	var renderedLineHtml = Subtitler.Lines.renderLine(lineToRender);
	var renderer = document.createElement('DIV');
	renderer.innerHTML = renderedLineHtml;
	
	var lineAfter = Subtitler.Lines.list[index+1];
	
	if(lineAfter) {
		var lineAfterElement = Subtitler.Lines.listElement.querySelector('.subtitle-list-element[data-subtitle-id="' + lineAfter.id + '"]');
		while(renderer.childNodes.length > 0) {
			Subtitler.Lines.listElement.insertBefore(renderer.childNodes[0], lineAfterElement);
		}
	}
	else if(index == Subtitler.Lines.list.length-1) {
		// it's the last element in the list
		while(renderer.childNodes.length > 0) {
			Subtitler.Lines.listElement.appendChild(renderer.childNodes[0]);
		}
	}
	else {
		// for whatever reason the line before is missing, which should never happen
		// rerender everything from scratch to be safe
		Subtitler.Lines.listElement.innerHTML = Subtitler.Lines.renderLines();
		Subtitler.Lines.__checkIfActorPresent();
	}
	Subtitler.Lines.listElement.appendChild(Subtitler.Lines.insertLineAtEndButton); // move button to bottom
	if(select) {
		Subtitler.Lines.selectLine(newLine, true);
		Subtitler.Lines.makeLineActive(newLine);
	}
	return newLine;
}

Subtitler.Lines.__updateLineNumbers = function( ) {
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		Subtitler.Lines.list[n].lineno = n;
	}
}

Subtitler.Lines.__checkIfActorPresent = function( ) {
	var actorPresent = false;
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		if(Subtitler.Lines.list[n].actor) {
			actorPresent = true;
			break;
		}
	}
	Subtitler.Lines.listHeader.classList.toggle('actor-present', actorPresent);
	Subtitler.Lines.listElement.classList.toggle('actor-present', actorPresent);
}

Subtitler.Lines.insertNewLineAtEnd = function( ) {
	var lastLine = Subtitler.Lines.list[Subtitler.Lines.list.length-1];
	if(!lastLine) {
		lastLine = { end: 0, style: Subtitler.Styles.DefaultStyle.name };
	}
	var newLine = Subtitler.Lines.__insertNewLine(Subtitler.Lines.list.length, lastLine.end, lastLine.end+Subtitler.Lines.defaultLineDuration, '', lastLine.style || Subtitler.Styles.DefaultStyle.name, 0);
	return newLine;
};

Subtitler.Lines.insertNewLineBeforeLine = function( lineOrId ) {
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		var previousLine = (line.lineno == 0) ? { end: 0 } : Subtitler.Lines.list[line.lineno-1];
		if(previousLine) {
			var lineStart = Math.max(previousLine.end, line.start-Subtitler.Lines.defaultLineDuration);
			var newLine = Subtitler.Lines.__insertNewLine(line.lineno, lineStart, line.start, '', line.style || Subtitler.Styles.DefaultStyle.name, 0);
			return newLine;
		}
		
	}
};

Subtitler.Lines.insertNewLineAfterLine = function( lineOrId ) {
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		var nextLine = (line.lineno == Subtitler.Lines.list.length-1) ? { start: Infinity } : Subtitler.Lines.list[line.lineno+1];
		if(nextLine) {
			var lineEnd = Math.min(line.end+Subtitler.Lines.defaultLineDuration, nextLine.start);
			var newLine = Subtitler.Lines.__insertNewLine(line.lineno+1, line.end, lineEnd, '', line.style || Subtitler.Styles.DefaultStyle.name, 0);
			return newLine;
		}
	}
};

// TODO
// aegisub's start time = 	frame_start - (frame_duration / 2)
// as frame rate is really awkward in js, just using video time for now
// might be worth changing to video time - 0.015 or something in future

Subtitler.Lines.insertNewLineAtVideoTimeAtEnd = function( ) {
	// round to 2 decimal places
	var videoTime = Subtitler.Video.time;
	videoTime = (((videoTime * 100) | 0) / 100);
	var lastLine = Subtitler.Lines.list[Subtitler.Lines.list.length-1] || { style: Subtitler.Styles.DefaultStyle.name };
	var newLine = Subtitler.Lines.__insertNewLine(Subtitler.Lines.list.length, videoTime, videoTime+Subtitler.Lines.defaultLineDuration, '', lastLine.style || Subtitler.Styles.DefaultStyle.name, 0);
	return newLine;
}; 

Subtitler.Lines.insertNewLineAtVideoTimeBeforeLine = function( lineOrId ) {
	// round to 2 decimal places
	var videoTime = Subtitler.Video.time;
	videoTime = (((videoTime * 100) | 0) / 100);
	
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		var lineStart = videoTime;
		var lineEnd = Math.min(lineStart+Subtitler.Lines.defaultLineDuration, line.start);
		if(lineEnd < lineStart) {
			lineEnd = lineStart + Subtitler.Lines.defaultLineDuration;
		}
		var newLine = Subtitler.Lines.__insertNewLine(line.lineno, lineStart, line.start, '', line.style || Subtitler.Styles.DefaultStyle.name, 0);
		return newLine;
	}
};

Subtitler.Lines.insertNewLineAtVideoTimeAfterLine = function( lineOrId ) {
	// round to 2 decimal places
	var videoTime = Subtitler.Video.time;
	videoTime = (((videoTime * 100) | 0) / 100);
	
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		var nextLine = (line.lineno == Subtitler.Lines.list.length-1) ? { start: Infinity } : Subtitler.Lines.list[line.lineno+1];
		var lineStart = videoTime;
		var lineEnd;
		if(nextLine) {
			var lineEnd = Math.min(lineStart+Subtitler.Lines.defaultLineDuration, nextLine.start);
			if(lineEnd < lineStart) {
				lineEnd = lineStart + Subtitler.Lines.defaultLineDuration;
			}
			var newLine = Subtitler.Lines.__insertNewLine(line.lineno+1, lineStart, lineEnd, '', line.style || Subtitler.Styles.DefaultStyle.name, 0);
			return newLine;
		}
		else {
			lineEnd = lineStart + Subtitler.Lines.defaultLineDuration;
			var newLine = Subtitler.Lines.__insertNewLine(line.lineno+1, lineStart, lineEnd, '', line.style || Subtitler.Styles.DefaultStyle.name, 0);
			return newLine;
		}
	}
};

Subtitler.Lines.duplicateLine = function( lineOrId ) {
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		var newLine = Subtitler.Lines.__insertNewLine(line.lineno+1, line.start, line.end, line.text_src, line.style, line.layer, line.actor, line.isComment);
		return newLine;
	}
};

Subtitler.Lines.splitLineAtVideoTime = function( lineOrId ) {
	var videoTime = Subtitler.Video.time;
	videoTime = (((videoTime * 100) | 0) / 100);
	
	var line = Subtitler.Lines.getLine(lineOrId);
	if(line) {
		if(videoTime <= line.start || videoTime >= line.end ) {
			return;
		}
		
		var firstLineStart = line.start;
		var firstLineEnd = videoTime;
		var firstLineText = line.text_src;
		
		var secondLineStart = videoTime;
		var secondLineEnd = line.end;
		var secondLineText = line.text_src;
		
		line.start = firstLineStart;
		line.end = firstLineEnd;
		
		Subtitler.Lines.__recompute(line);
		Subtitler.Lines.updateLine(line);
		var newLine = Subtitler.Lines.__insertNewLine(line.lineno+1, secondLineStart, secondLineEnd, secondLineText, line.style, line.layer, line.actor, line.isComment);
		return newLine;
	}
};

Subtitler.Lines.deleteLines = function( lines ) {
	if(lines) {
		// use a copy incase someone passes in Subtitler.Lines.list or Subtitler.Lines.selection 
		var copy = [ ];
		for(var n=0; n<lines.length; n++) {
			copy.push(lines[n]);
		}
		for(var n=0; n<copy.length; n++) {
			Subtitler.Lines.deleteLine(copy[n]);
		}
	}
}

Subtitler.Lines.deleteLine = function( lineIdOrElement ) {
	var line = Subtitler.Lines.getLine(lineIdOrElement);
	if(line) {
		Subtitler.Lines.list.splice(line.lineno, 1);
		delete Subtitler.Lines.map[line.id];
		Subtitler.Lines.__updateLineNumbers();
		var element = Subtitler.Lines.listElement.querySelector('.subtitle-list-element[data-subtitle-id="' + line.id + '"]');
		var reselect = element.classList.contains('currently-selected');
		element.parentNode.removeChild(element);
		if(reselect) {
			if(line.lineno >= Subtitler.Lines.list.length) {
				// select last line
				Subtitler.Lines.selectLine(Subtitler.Lines.list.length-1);
			}
			else {
				Subtitler.Lines.selectLine(line.lineno);
			}
		}
	}
	if(Subtitler.Lines.list.length == 0) {
		// if we deleted the final line, insert a new line
		Subtitler.Lines.__insertNewLine(0, 0, 5, '', Subtitler.Styles.DefaultStyle.name, 0);
	}
};

Subtitler.Lines.cutLines = function( lines ) {
	var linesToCut = [ ];
	if(lines != null) {
		for(var i=0; i<lines.length; i++) {
			if(lines[i] != null) {
				var line = Subtitler.Lines.getLine(lines[i]);
				if(line != null) {
					linesToCut.push(line);
				}
			}
		}
	}
	Subtitler.Clipboard.cut(linesToCut);
};

Subtitler.Lines.cutLine = function( line ) {
	return Subtitler.Lines.cutLines([line]);
};

Subtitler.Lines.copyLines = function( lines ) {
	var linesToCut = [ ];
	if(lines != null) {
		for(var i=0; i<lines.length; i++) {
			if(lines[i] != null) {
				var line = Subtitler.Lines.getLine(lines[i]);
				if(line != null) {
					linesToCut.push(line);
				}
			}
		}
	}
	Subtitler.Clipboard.copy(linesToCut);
};

Subtitler.Lines.copyLine = function( line ) {
	return Subtitler.Lines.cutLines([line]);
};

Subtitler.Lines.pasteBefore = function( line ) {
	var insertionPoint = Subtitler.Lines.getLine(line);
	if(insertionPoint) {
		Subtitler.Clipboard.paste(insertionPoint, 'before');
	}
}

Subtitler.Lines.pasteAfter = function( line ) {
	var insertionPoint = Subtitler.Lines.getLine(line);
	if(insertionPoint) {
		Subtitler.Clipboard.paste(insertionPoint, 'after');
	}
}

Subtitler.Lines.pasteOver = function( line ) {
	var insertionPoint = Subtitler.Lines.getLine(line);
	if(insertionPoint) {
		Subtitler.Clipboard.paste(insertionPoint, 'over');
	}
}

Subtitler.Lines.pasteAtEnd = function( ) {
	var line = Subtitler.Lines.list[Subtitler.Lines.list.length-1];
	return Subtitler.Lines.pasteAfter(line);
}


Subtitler.Lines.__recompute = function( line ) {
	if(line.id == null) {
		line.id = Subtitler.Utils.uuid();
	}
	this.__computeDuration(line);
	this.__computeAlternateTextForms(line);
	this.__computeCPS(line);
	this.map[line.id] = line;
	return line;
}

Subtitler.Lines.getOverlappingLines = function( lineToMatch ) {
	
	var start = lineToMatch.start;
	var end = lineToMatch.end;
	
	var matches = [ ];
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line == lineToMatch) {
			continue;
		}
		if(line.isComment) {
			continue;
		}
		if(line.end <= start) {
			continue;
		}
		if(line.start >= end) {
			continue;
		}
		matches.push(line);
	}
	matches.sort(function(a, b) {
		if(a.start < b.start) {
			return -1;
		}
		if(a.start > b.start) {
			return 1;
		}
		if(a.order < b.order) {
			return -1;
		}
		if(a.order > b.order) {
			return 1;
		}
		return 0;
	});
	return matches;
}

Subtitler.Lines.getVisibleLines = function( time ) {
	var matches = [ ];
	for(var n=0; n<Subtitler.Lines.list.length; n++) {
		var line = Subtitler.Lines.list[n];
		if(line.isComment) {
			continue;
		}
		if(line.start <= time && line.end > time) {
			matches.push(line);
		}
	}
	matches.sort(function(a, b) {
		if(a.start < b.start) {
			return -1;
		}
		if(a.start > b.start) {
			return 1;
		}
		if(a.order < b.order) {
			return -1;
		}
		if(a.order > b.order) {
			return 1;
		}
		return 0;
	});
	
	return matches;
}

Subtitler.Lines.__computeDuration = function( line ) {
	line.duration = Math.max(line.end - line.start, 0);
	return line;
}

Subtitler.Lines.__computeAlternateTextForms = function( line ) {
	line.text_plain = line.text_src.replace(/\n/g, ' ')
						.replace(/\\n/g, '')
						.replace(/\\N/g, '\n')
						.replace(/\{[^}]+\}/g, '');
	line.text_line = line.text_src
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/\n/g, ' ')
						.replace(/\\n/g, '')
						.replace(/ /g, '&nbsp;')
						.replace(/\\N/g, Subtitler.Formatting.newlineCharacterReplacement)
						.replace(/\{[^}]*\}/g, Subtitler.Formatting.specialCharacterReplacement);
	line.text_rich = Subtitler.Lines.__computeRichTextForm(line);
	line.text_html = line.text_plain
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;');
}

Subtitler.Lines.__computeRichTextForm = function( line ) {
	
	var RichTextType = {
		TEXT: 0,
		HARD_SPACE: 1,
		SOFT_LINE_BREAK: 2,
		HARD_LINE_BREAK: 3
	};
	
	var HARD_SPACE_CHARACTER = '\00A0';
	var SOFT_LINE_BREAK_CHARACTER = '\200B';
	var HARD_LINE_BREAK_CHARACTER = '\r\n';
	
	var richtext = [ ];
	
	/*
		text: '',
		style: {
			
		}
	*/
	
	var initialStyle = Subtitler.Styles.map[line.style] || Subtitler.Styles.DefaultStyle;
		
	var commands = {
		'b': {
			name: 'b',
			multiArg: false,
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				if(args[0] == 0 || args[0] == 1) {
					currentStyle.bold = !!args[0];
					currentStyle.fontWeight = !!args[0] ? 'bold' : 'normal';
				}
				else if(args[0] <= 400) {
					currentStyle.bold = false;
					currentStyle.fontWeight = args[0];
				}
				else if(args[0] > 400) {
					currentStyle.bold = true;
					currentStyle.fontWeight = args[0];
				}
			}
		},
		'i': {
			name: 'i',
			argTypes: ['bool-int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.italic = !!args[0];
			}
		},
		'u': {
			name: 'u',
			argTypes: ['bool-int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.underline = !!args[0];
			}
		},
		's': {
			name: 's',
			argTypes: ['bool-int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.strikeout = !!args[0];
			}
		},
		'bord': {
			name: 'bord',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.outlineWidth = args[0];
				currentStyle.outlineWidthX = args[0];
				currentStyle.outlineWidthY = args[0];
			}
		},
		'xbord': {
			name: 'xbord',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.outlineWidthX = args[0];
				if(currentStyle.outlineWidthX == currentStyle.outlineWidthY) {
					currentStyle.outlineWidth = args[0];
				}
			}
		},
		'ybord': {
			name: 'ybord',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.outlineWidthY = args[0];
				if(currentStyle.outlineWidthX == currentStyle.outlineWidthY) {
					currentStyle.outlineWidth = args[0];
				}
			}
		},
		'shad': {
			name: 'shad',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.shadowOffset = args[0];
				currentStyle.shadowOffsetX = args[0];
				currentStyle.shadowOffsetY = args[0];
			}
		},
		'xshad': {
			name: 'xshad',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.shadowOffsetX = args[0];
				if(currentStyle.shadowOffsetX == currentStyle.shadowOffsetY) {
					currentStyle.shadowOffset = args[0];
				}
			}
		},
		'yshad': {
			name: 'yshad',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.shadowOffsetY = args[0];
				if(currentStyle.shadowOffsetX == currentStyle.shadowOffsetY) {
					currentStyle.shadowOffset = args[0];
				}
			}
		},
		'be': {
			name: 'be',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.blurStrength = args[0];
				currentStyle.blurType = 'discrete';
			}
		},
		'blur': {
			name: 'blur',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.blurStrength = args[0];
				currentStyle.blurType = 'guassian';
			}
		},
		'fn': {
			name: 'fn',
			argTypes: ['string'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.fontFamily = args[0];
			}
		},
		'fs': {
			name: 'fs',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.fontSize = args[0];
			}
		},
		'fscx': {
			name: 'fscx',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.scaleX = args[0];
			}
		},
		'fscy': {
			name: 'fscy',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.scaleY = args[0];
			}
		},
		'fsp': {
			name: 'fsp',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.spacing = args[0];
			}
		},
		'frx': {
			name: 'frx',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.rotationX = args[0];
			}
		},
		'fry': {
			name: 'fry',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.rotationY = args[0];
			}
		},
		'frz': {
			name: 'frz',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.rotationZ = args[0];
				currentStyle.rotation = args[0];
			}
		},
		'fr': {
			name: 'fr',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.rotationZ = args[0];
				currentStyle.rotation = args[0];
			}
		},
		'fax': {
			name: 'fax',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.shearX = args[0];
			}
		},
		'fay': {
			name: 'fax',
			argTypes: ['float'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.shearY = args[0];
			}
		},
		'fe': {
			name: 'fe',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.encoding = args[0];
			}
		},
		'c': {
			name: 'c',
			argTypes: ['colour'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourPrimary.r = args[0].r;
				currentStyle.colourPrimary.g = args[0].g;
				currentStyle.colourPrimary.b = args[0].b;
			}
		},
		'1c': {
			name: '1c',
			argTypes: ['colour'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourPrimary.r = args[0].r;
				currentStyle.colourPrimary.g = args[0].g;
				currentStyle.colourPrimary.b = args[0].b;
			}
		},
		'2c': {
			name: '2c',
			argTypes: ['colour'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourSecondary.r = args[0].r;
				currentStyle.colourSecondary.g = args[0].g;
				currentStyle.colourSecondary.b = args[0].b;
			}
		},
		'3c': {
			name: '3c',
			argTypes: ['colour'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourOutline.r = args[0].r;
				currentStyle.colourOutline.g = args[0].g;
				currentStyle.colourOutline.b = args[0].b;
			}
		},
		'4c': {
			name: '4c',
			argTypes: ['colour'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourShadow.r = args[0].r;
				currentStyle.colourShadow.g = args[0].g;
				currentStyle.colourShadow.b = args[0].b;
			}
		},
		'alpha': {
			name: 'alpha',
			argTypes: ['hex'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourPrimary.alpha = args[0];
				currentStyle.colourSecondary.alpha = args[0];
				currentStyle.colourOutline.alpha = args[0];
				currentStyle.colourShadow.alpha = args[0];
			}
		},
		'1a': {
			name: '1a',
			argTypes: ['hex'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourPrimary.alpha = args[0];
			}
		},
		'2a': {
			name: '2a',
			argTypes: ['hex'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourSecondary.alpha = args[0];
			}
		},
		'3a': {
			name: '3a',
			argTypes: ['hex'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourOutline.alpha = args[0];
			}
		},
		'4a': {
			name: '4a',
			argTypes: ['hex'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.colourShadow.alpha = args[0];
			}
		},
		'an': {
			name: 'an',
			multiArg: false,
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				lineProperties.alignment = args[0];
			}
		},
		'a': {
			name: 'a',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				if(args[0] >= 1 || args[0] <=3) {
					currentStyle.alignment = args[0];
				}
				else if(args[0] >= 5 || args[0] <=6) {
					currentStyle.alignment = args[0] + 2;
				}
				else if(args[0] >= 8 || args[0] <=11) {
					currentStyle.alignment = args[0] - 5;
				}
			}
		},
		// k
		// K
		// Kf
		// ko
		'q': {
			name: 'q',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				if(args[0] >=0 && args[0] <= 3) {
					currentStyle.wrapStyle = args[0];
				}
			}
		},
		'r': {
			name: 'r',
			argTypes: [[], ['string']],
			effect: function(args, currentStyle, lineProperties) {
				var style = args[0] ? (Subtitler.Styles.map[args[0]] || initialStyle) : initialStyle;
				for(var prop in currentStyle) {
					if(currentStyle.hasOwnProperty(prop)) {
						delete currentStyle[prop];
					}
				}
				for(var prop in style) {
					if(style.hasOwnProperty(prop)) {
						if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
							currentStyle[prop] = initialStyle[prop].copy();
						}
						else {
							currentStyle[prop] = initialStyle[prop];
						}
					}
				}
			}
		},
		'pos': {
			name: 'pos',
			argTypes: ['int', 'int'],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.motion || lineProperties.position) {
					return;
				}
				lineProperties.position = { 'x': args[0], 'y': args[1] };
			}
		},
		'move': {
			name: 'move',
			multiArg: false,
			argTypes: [
				['int', 'int', 'int', 'int'],
				['int', 'int', 'int', 'int', 'int', 'int', 'int']
			],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.motion || lineProperties.position) {
					return;
				}
				lineProperties.position = {
					'x': args[0],
					'y': args[1]
				}
				var startTime = line.start;
				if(args[5] != undefined) {
					startTime = line.start + (args[5] / 1000);
				}
				var endTime = line.end;
				if(args[6] != undefined) {
					endTime = line.start + (args[6] / 1000);
				}
				lineProperties.motion = {
					'startX': args[0],
					'startY': args[1],
					'startTime': startTime,
					'endX': args[2],
					'endY': args[3],
					'endTime': endTime
				};
			}
		},
		'org': {
			name: 'org',
			multiArg: false,
			argTypes: ['int', 'int'],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.rotationOrigin) {
					return;
				}
				lineProperties.rotationOrigin = { 'x': args[0], 'y': args[1] }
			}
		},
		'fad': {
			name: 'fad',
			multiArg: false,
			argTypes: ['int', 'int'],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.fade) {
					return;
				}
				lineProperties.fade = {
					'initialOpacity': 0,
					'fadeInStart': line.start,
					'fadeInEnd': line.start + (args[0] / 1000),
					'intermediateOpacity': 1,
					'fadeOutStart': line.end - (args[1] / 1000),
					'fadeOutEnd': line.end,
					'finalOpacity': 0
				}
			}
		},
		'fade': {
			name: 'fade',
			argTypes: ['int', 'int', 'int', 'int', 'int', 'int', 'int'],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.fade) {
					return;
				}
				lineProperties.fade = {
					'initialOpacity': 255 - args[0],
					'fadeInStart': line.start + (args[3] / 1000),
					'fadeInEnd': line.start + (args[4] / 1000),
					'intermediateOpacity': 255 - args[1],
					'fadeOutStart': line.start + (args[5] / 1000),
					'fadeOutEnd': line.start + (args[6] / 1000),
					'finalOpacity': 255 - args[2]
				}
			}
		},
		't': {
			name: 't',
			argTypes: [
				['string'],
				['int', 'string'],
				['int', 'int', 'string'],
				['int', 'int', 'int', 'string']
			],
			effect: function(args, currentStyle, lineProperties) {
				// TODO
			}
		},
		'clip': {
			name: 'clip',
			argTypes: [
				['int', 'int', 'int', 'int'],
				['string'],
				['float', 'string']
			],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.clip) {
					return;
				}
				// TODO
			}
		},
		'iclip': {
			name: 'iclip',
			argTypes: [
				['int', 'int', 'int', 'int'],
				['string'],
				['float', 'string']
			],
			effect: function(args, currentStyle, lineProperties) {
				if(lineProperties.clip) {
					return;
				}
				// TODO
			}
		},
		'p': {
			name: 'p',
			argTypes: ['int'],
			effect: function(args, currentStyle, lineProperties) {
				currentStyle.isDrawing = !!args[0];
				currentStyle.drawingScale = args[0];
			}
		}
		// pbo
	};
	
	var getCommand = function( commandBuffer ) {
		
		var invalid = false;
		
		var commandRegex = /^(?:([0-9a-zA-Z][a-z]*))(?:(?:([^\(\,\)]+)|(?:\(([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)(?:\)|,(?:([^\(\),]+(?:\([^\(\)]+\))*[^\),]*)+)\)))))))))))?$/;
		var group = commandBuffer.match(commandRegex);
		if(!group) {
			return null;
		}
		
		var commandName = group[1];
		
		var commandArgStrings = [ ];
		if(group[2]) {
			commandArgStrings.push(group[2]);
		}
		else if(group[3]) {
			for(var i=0; i<10; i++) {
				if(group[i]) {
					commandArgStrings.push(group[i]);
				}
				else {
					break;
				}
			}
		}
		
		var command = commands[commandName];
		
		var commandArgTypes = null;
		if(command && Array.isArray(command.argTypes[0])) {
			for(var i=0; i<command.argTypes.length; i++) {
				if(command.argTypes[i].length == commandArgStrings.length) {
					commandArgTypes = command.argTypes[i];
					break;
				}
			}
		}
		else {
			commandArgTypes = command.argTypes;
		}
		
		if(commandArgTypes == null) {
			invalid = true;
		}
		else if(commandArgTypes.length != commandArgStrings.length) {
			commandArgTypes = null;
			invalid = true;
		}
		
		var commandArgs = null;
		if(commandArgTypes != null && commandArgStrings != null) {
			commandArgs = [ ];
			for(var i=0; i<commandArgStrings.length; i++) {
				var type = commandArgTypes[i];
				var stringValue = commandArgStrings[i];
				var value;
				if(type == 'string') {
					value = stringValue;
				}
				else if(type == 'bool-int') {
					if(stringValue == '1') {
						value = true;
					}
					else if(stringValue == '0') {
						value = false;
					}
					else {
						invalid = true;
						break;
					}
				}
				else if(type == 'int') {
					if(/[0-9]+/.test(stringValue)) {
						value = stringValue * 1;
					}
					else {
						invalid = true;
						break;
					}
				}
				else if(type == 'float') {
					if(/[0-9]+(?:\.[0-9]+)/.test(stringValue)) {
						value = stringValue * 1;
					}
					else {
						invalid = true;
						break;
					}
				}
				else if(type == 'colour') {
					value = Subtitler.Styles.Colour.aegisubBGR(stringValue);
					if(value == null) {
						invalid = true;
						break;
					}
				}
				else if(type == 'hex') {
					var hexString = stringValue.match(/^&H([0-9A-Fa-f]+)&/);
					if(hexString) {
						value = Number.parseInt('100', hexString[1]);
					}
					else {
						invalid = true;
					}
				}
				else {
					// TODO
				}
				
				commandArgs.push(value);
			}
		}
		
		return invalid ? null : {
			command: command,
			args: commandArgs
		};
	}
	
	var currentStyle = { };
	for(var prop in initialStyle) {
		if(initialStyle.hasOwnProperty(prop)) {
			if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
				currentStyle[prop] = initialStyle[prop].copy();
			}
			else {
				currentStyle[prop] = initialStyle[prop];
			}
		}
	}
	
	var buffer = '';
	
	var inBlock = false;
	var escaped = false;
	brackets = 0;
	
	var lineProperties = { };
	
	var lineParts = [ ];
	
	for(var c=0; c<line.text_src.length; c++) {
		var character = line.text_src[c];
		
		if(!inBlock && character == '{') {
			inBlock = true;
			if(escaped) {
				buffer += '\\';
			}
			escaped = false;
			if(buffer) {
				var currentPart = { };
				currentPart.text = buffer;
				currentPart.style = currentStyle;
				currentPart.type = RichTextType.TEXT;
				lineParts.push(currentPart);
				
				var previousStyle = currentStyle;
				currentStyle = { };
				for(var prop in initialStyle) {
					if(initialStyle.hasOwnProperty(prop)) {
						if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
							currentStyle[prop] = initialStyle[prop].copy();
						}
						else {
							currentStyle[prop] = initialStyle[prop];
						}
					}
				}
				buffer = '';
			}
			continue;
		}
		else if(!inBlock && character == '\\' && !escaped) {
			escaped = true;
			continue;
		}
		else if(!inBlock && escaped && (character == 'h' || character == 'n' || character == 'N')) {
			escaped = false;
			
			if(buffer) {
				var currentPart = { };
				currentPart.text = buffer;
				currentPart.style = currentStyle;
				currentPart.type = RichTextType.TEXT;
				lineParts.push(currentPart);
				
				var previousStyle = currentStyle;
				currentStyle = { };
				for(var prop in initialStyle) {
					if(initialStyle.hasOwnProperty(prop)) {
						if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
							currentStyle[prop] = initialStyle[prop].copy();
						}
						else {
							currentStyle[prop] = initialStyle[prop];
						}
					}
				}
				buffer = '';
			}
			
			var specialCharacterText = {
				'h': HARD_SPACE_CHARACTER,
				'n': SOFT_LINE_BREAK_CHARACTER,
				'N': HARD_LINE_BREAK_CHARACTER
			}[character];
			
			var partType = {
				'h': RichTextType.HARD_SPACE,
				'n': RichTextType.SOFT_LINE_BREAK,
				'N': RichTextType.HARD_LINE_BREAK
			}[character];

			
			var currentPart = { };
			currentPart.text = specialCharacterText;
			currentPart.style = currentStyle;
			currentPart.type = partType;
			lineParts.push(currentPart);
			
			var previousStyle = currentStyle;
			currentStyle = { };
			for(var prop in initialStyle) {
				if(initialStyle.hasOwnProperty(prop)) {
					if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
						currentStyle[prop] = initialStyle[prop].copy();
					}
					else {
						currentStyle[prop] = initialStyle[prop];
					}
				}
			}
			
			continue;
		}
		else if(!inBlock && escaped) {
			buffer += '\\';
		}
		
		if(!inBlock) {
			buffer += character;
			continue;
		}
		
		var command = null;
		var commandArgs = [ ];
		
		// at this point, it must be in a block
		
		if(!escaped && character == '\\') {
			escaped = true;
			continue;
		}
		
		if(character == '(') {
			brackets += 1;
		}
		if(character == ')') {
			brackets -= 1;
		}
		
		if((character == '\\' && brackets == 0)
			|| character == '}') {
				
			if(buffer == '') {
				continue;
			}
			
			inBlock = (character != '}');
			escaped = (character == '\\');
			
			var commandAndArgs = getCommand(buffer);
			buffer = '';
			if(commandAndArgs == null) {
				continue;
			}
			command = commandAndArgs.command;
			commandArgs = commandAndArgs.args;
		}
		else if(escaped) {
			buffer += character;
		}
		
		if(command != null) {
			command.effect(commandArgs, currentStyle, lineProperties);
			continue;
		}
	}
	
	if(!inBlock && escaped) {
		buffer += '\\';
	}
	if(buffer) {
		var currentPart = { };
		currentPart.text = buffer;
		currentPart.style = currentStyle;
		currentPart.type = RichTextType.TEXT;
		lineParts.push(currentPart);
		
		var previousStyle = currentStyle;
		currentStyle = { };
		for(var prop in initialStyle) {
			if(initialStyle.hasOwnProperty(prop)) {
				if(initialStyle[prop] instanceof Subtitler.Styles.Colour) {
					currentStyle[prop] = initialStyle[prop].copy();
				}
				else {
					currentStyle[prop] = initialStyle[prop];
				}
			}
		}
		buffer = '';
	}
	
	return lineParts;
}

Subtitler.Lines.__computeCPS = function( line ) {
	var visibleCharacters = line.text_plain.replace(/[\r\n\t "',.\-\?!¡¿]+/g, '');
	var visibleCharactersCount = visibleCharacters.length;
	var cps = line.duration < 0.1 ? NaN : (visibleCharacters.length/line.duration);
	line.cps = isNaN(cps) ? NaN : (visibleCharactersCount == 0 ? 0 : Math.max(1, cps | 0));
	return line;
}
Subtitler.Lines.renderLines = function() {
	var html = [ ];
	for(var n=0; n<this.list.length; n++) {
		var line = this.list[n];
		html.push(this.renderLine(line));
	}
	return html.join('');
}
Subtitler.Lines.renderLine = function( line ) {
	return '<div class="subtitle-list-element'
					+ (line.isComment ? ' comment' : '')
					+ (Subtitler.Lines.isLineSelected(line) ? ' currently-selected' : '')
					+ (Subtitler.Lines.isLineActive(line) ? ' currently-active' : '')
					+ '" data-subtitle-id="' + line.id + '">'
			+ '<div class="subtitle-list-column-lineno"></div>'
				+ '<div class="subtitle-list-data-columns">'
					+ '<div class="subtitle-list-column-start">' + Subtitler.Formatting.formatTime(line.start, 2) + '</div>'
					+ '<div class="subtitle-list-column-end">' + Subtitler.Formatting.formatTime(line.end, 2) + '</div>'
					+ '<div class="subtitle-list-column-cps" data-cps="' + (line.cps >= 28 ? '28+' : line.cps) + '">' + line.cps + '</div>'
					+ '<div class="subtitle-list-column-style">' + (line.style || '') + '</div>'
					+ '<div class="subtitle-list-column-actor">' + (line.actor || '') + '</div>'
					+ '<div class="subtitle-list-column-text">' + line.text_line + '</div>'
				+ '</div>'
			+ '</div>'
		+ '</div>'
}

Subtitler.Lines.updateLine = function( lineOrLineId ) {
	
	var line = Subtitler.Lines.getLine(lineOrLineId);
	
	this.__computeDuration(line);
	this.__computeAlternateTextForms(line);
	this.__computeCPS(line);
	
	var lineElement = Subtitler.Lines.listElement.querySelector('.subtitle-list-element[data-subtitle-id="' + line.id + '"]');
	
	if(lineElement == null) {
		return;
	}
	
	lineElement.querySelector('.subtitle-list-column-start').innerHTML = Subtitler.Formatting.formatTime(line.start, 2);
	lineElement.querySelector('.subtitle-list-column-end').innerHTML = Subtitler.Formatting.formatTime(line.end, 2);
	lineElement.querySelector('.subtitle-list-column-cps').setAttribute('data-cps', (line.cps >= 28 ? '28+' : line.cps) + '');
	lineElement.querySelector('.subtitle-list-column-cps').innerHTML = line.cps + '';
	lineElement.querySelector('.subtitle-list-column-style').innerHTML = line.style; // TODO
	lineElement.querySelector('.subtitle-list-column-text').innerHTML = line.text_line;
	lineElement.querySelector('.subtitle-list-column-actor').textContent = Subtitler.LineEditor.actor.value || '';
	
	if(Subtitler.LineEditor.actor.value) {
		Subtitler.Lines.listHeader.classList.add('actor-present');
		Subtitler.Lines.listElement.classList.add('actor-present');
	}
	else {
		Subtitler.Lines.__checkIfActorPresent();
	}
	
	lineElement.classList.toggle('comment', !!line.isComment);
	Subtitler.Visualiser.updateOverlay(line);
}

// given a line, line id, or element which represents a line, returns the line
Subtitler.Lines.getLine = function( lineIdOrElement ) {
	if(lineIdOrElement == null) {
		return null;
	}
	var id = null;
	if(lineIdOrElement instanceof HTMLElement && lineIdOrElement.hasAttribute('data-subtitle-id')) {
		id = lineIdOrElement.getAttribute('data-subtitle-id');
	}
	else if(typeof lineIdOrElement == 'object' && lineIdOrElement.hasOwnProperty('id')) {
		id = lineIdOrElement.id;
	}
	else if(typeof lineIdOrElement == 'string') {
		id = lineIdOrElement;
	}
	else if(typeof lineIdOrElement == 'number') {
		var line = this.list[lineIdOrElement];
		if(line) {
			id = line.id;
		}
	}
	
	if(!id) {
		return null;
	}
	
	var line = Subtitler.Lines.map[id] || null;
	
	return line;
}

// returns the line that's currently being edited in the LineEditor
Subtitler.Lines.getActiveLine = function( ) {
	return Subtitler.Lines.getLine(Subtitler.LineEditor.lineId);
}

// returns whether the line (or id) corresponds to the line currently being edited in the LineEditor
Subtitler.Lines.isLineActive = function( lineIdOrElement ) {
	var activeLine = Subtitler.Lines.getActiveLine();
	if(activeLine == null){
		return false;
	}
	return (activeLine == Subtitler.Lines.getLine(lineIdOrElement));
}

// returns whether the line (or id) is one of the currently selected lines
Subtitler.Lines.isLineSelected = function( lineIdOrElement ) {
	var line = Subtitler.Lines.getLine(lineIdOrElement);
	return (Subtitler.Lines.selection.indexOf(line) != -1);
}

Subtitler.Lines.__updateSelectedLines = function() {
	var currentlySelected = this.listElement.querySelectorAll('.subtitle-list-element.currently-selected');
	for(var c=0; c<currentlySelected.length; c++) {
		currentlySelected[c].classList.remove('currently-selected');
	}
	
	for(var s=0; s<this.selection.length; s++) {
		var lineToSelect = this.selection[s];
		var elementsToSelect = this.listElement.querySelectorAll('.subtitle-list-element[data-subtitle-id="' + lineToSelect.id + '"]');
		for(var c=0; c<elementsToSelect.length; c++) {
			elementsToSelect[c].classList.add('currently-selected');
		}
	}
}

Subtitler.Lines.selectLines = function( lineIdsOrElements, replace ) {
	if(replace) {
		Subtitler.Lines.selection = [ ];
	}
	if(lineIdsOrElements == null) {
		return;
	}
	for(var n=0; n<lineIdsOrElements.length; n++) {
		Subtitler.Lines.selectLine(lineIdsOrElements[n], false, true);
	}
	Subtitler.Lines.__updateSelectedLines();
}

Subtitler.Lines.unselectLine = function( lineIdOrElement ) {
	var line = Subtitler.Lines.getLine(lineIdOrElement);
	if(line == null) {
		return;
	}
	for(var s=0; s<Subtitler.Lines.selection.length; s++) {
		if(Subtitler.Lines.selection[s].id == line.id) {
			Subtitler.Lines.selection.splice(s, 1);
			s -= 1;
		}
	}
	Subtitler.Lines.__updateSelectedLines();
}

Subtitler.Lines.selectLine = function( lineIdOrElement, replace, skipClassChanges ) {
	if(replace) {
		Subtitler.Lines.selection = [ ];
	}
	var line = Subtitler.Lines.getLine(lineIdOrElement);
	
	if(line == null) {
		return;
	}
	
	Subtitler.Lines.selection.push(line);
	
	if(!skipClassChanges) {
		Subtitler.Lines.__updateSelectedLines();
	}
}

Subtitler.Lines.__updateOverlappingLines = function(line) {
	var overlapingLines = Subtitler.Lines.getOverlappingLines(line || Subtitler.Lines.getActiveLine());
	
	var linesAlreadyMarkedAsOverlapping = this.listElement.querySelectorAll('.subtitle-list-element.overlapping');
	for(var i=0; i<linesAlreadyMarkedAsOverlapping.length; i++) {
		linesAlreadyMarkedAsOverlapping[i].classList.remove('overlapping');
	}
	for(var i=0; i<overlapingLines.length; i++) {
		var overlappingLineId = overlapingLines[i].id;
		var toAddClass = this.listElement.querySelectorAll('.subtitle-list-element[data-subtitle-id="' + overlappingLineId + '"]');
		for(var c=0; c<toAddClass.length; c++) {
			toAddClass[c].classList.add('overlapping');
		}
	}
}

Subtitler.Lines.makeLineActive = function( lineIdOrElement ) {
	
	var line = Subtitler.Lines.getLine(lineIdOrElement);
	if(line == null) {
		return;
	}
	
	var currentlyActive = this.listElement.querySelectorAll('.subtitle-list-element.currently-active');
	for(var c=0; c<currentlyActive.length; c++) {
		currentlyActive[c].classList.remove('currently-active');
	}
	
	var currentlyOverlapping = this.listElement.querySelectorAll('.subtitle-list-element.overlapping');
	for(var c=0; c<currentlyOverlapping.length; c++) {
		currentlyOverlapping[c].classList.remove('overlapping');
	}
	
	if(line.text_original == null) {
		line.text_original = line.text_src || '';
	}
	if(Subtitler.Lines.isLineActive(line)) {
		line.text_recent = line.text_src || '';
	}
	
	var tomakeLineActive = this.listElement.querySelectorAll('.subtitle-list-element[data-subtitle-id="' + line.id + '"]');
	for(var c=0; c<tomakeLineActive.length; c++) {
		tomakeLineActive[c].classList.add('currently-active');
	}
	
	Subtitler.Lines.__updateOverlappingLines(line);
	
	Subtitler.LineEditor.start.setAttribute('data-value', line.start+'');
	Subtitler.LineEditor.start.value = Subtitler.Formatting.formatTime(line.start, 2);
	Subtitler.LineEditor.end.setAttribute('data-value', line.end+'');
	Subtitler.LineEditor.end.value = Subtitler.Formatting.formatTime(line.end, 2);
	Subtitler.LineEditor.duration.value = Subtitler.Formatting.formatTime(line.duration, 2);
	Subtitler.LineEditor.duration.setAttribute('data-value', line.duration+'');
	Subtitler.LineEditor.layer.value = line.layer + '';
	Subtitler.LineEditor.style.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: line.style }}));
	Subtitler.LineEditor.text_src.value = line.text_src;
	Subtitler.LineEditor.actor.value = line.actor || '';
	Subtitler.LineEditor.text_pretty.innerHTML = Subtitler.Formatting.prettify(line.text_src);
	Subtitler.LineEditor.lineId = line.id;
	var comparison_text;
	if(Subtitler.Settings.lineComparison == 'selection') {
		comparison_text = line.text_recent;
	}
	else {
		comparison_text = line.text_original;
	}
	 
	Subtitler.LineEditor.text_original.innerHTML = Subtitler.Formatting.prettify(comparison_text);
	
	Subtitler.LineEditor.isComment.checked = !!line.isComment;
	Subtitler.LineEditor.isComment.setAttribute('data-value', !!line.isComment);
	Subtitler.LineEditor.isComment.closest('.checkbox-and-label').setAttribute('data-value', !!line.isComment);
	
	if(Subtitler.Video.autoSeekOnLineSelect) {
		if(Subtitler.Video.isPlaying || Subtitler.Video.time != line.start) {
			Subtitler.Video.seek(line.start, false);
		}
	}
	
	Subtitler.Visualiser.renderLine(line);
}

Subtitler.Lines.__updateVisibleLines = function( visibleLines ) {
	var currentlyVisible = Subtitler.Lines.listElement.querySelectorAll('.subtitle-list-element.currently-visible');
	for(var n=0; n<currentlyVisible.length; n++) {
		currentlyVisible[n].classList.remove('currently-visible');
	}
	for(var n=0; n<visibleLines.length; n++) {
		var line = visibleLines[n];
		var shouldBeVisible = Subtitler.Lines.listElement.querySelectorAll('.subtitle-list-element[data-subtitle-id="' + line.id + '"]');
		for(var v=0; v<shouldBeVisible.length; v++) {
			shouldBeVisible[v].classList.add('currently-visible');
		}
	}
}

Subtitler.Styles = { };
Subtitler.Styles.list = [ ];
Subtitler.Styles.map = { };

Subtitler.Styles.newStyle = function( data ) {
	if(data.name.indexOf(',') > 0 || Subtitler.Styles.map.hasOwnProperty(data.name)) {
		throw new Error('style name must be unique and not contain commas');
	}
	var style = { };
	for(var prop in data) {
		if(data.hasOwnProperty(prop)) {
			if(data[prop] instanceof Subtitler.Styles.Colour) {
				style[prop] = data[prop].copy();
			}
			else {
				style[prop] = data[prop];
			}
		}
	}
	Subtitler.Styles.list.push(style);
	Subtitler.Styles.map[style.name] = style;
	return style;
}

Subtitler.Styles.Colour = function( string ) {
	
	if(!(this instanceof Subtitler.Styles.Colour)) {
		return new Subtitler.Styles.Colour(string);
	}
	
	var template = null;
	if(typeof string == 'string') {
		if(template == null) {
			template = Subtitler.Styles.Colour.rgba(string);
		}
		if(template == null) {
			template = Subtitler.Styles.Colour.rgb(string);
		}
		if(template == null) {
			template = Subtitler.Styles.Colour.hex(string);
		}
		if(template == null) {
			template = Subtitler.Styles.Colour.aegisubABGR(string);
		}
		if(template == null) {
			template = Subtitler.Styles.Colour.aegisubBGR(string);
		}
	}
	if(template) {
		this.r = template.r;
		this.g = template.g;
		this.b = template.b;
		this.a = template.a;
	}
}

Subtitler.Styles.Colour.rgb = function(r, g, b) {
	if(typeof r == 'string' && arguments.length == 1) {
		var colourString = r;
		var match = /rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/.exec(colourString);
		if(match) {
			var colour = new Subtitler.Styles.Colour();
			colour.r = match[1] * 1;
			colour.g = match[2] * 1;
			colour.b = match[3] * 1;
			colour.a = 1;
			return colour;
		}
		return null;
	}
	var colour = new Subtitler.Styles.Colour();
	colour.r = r * 1;
	colour.g = g * 1;
	colour.b = b * 1;
	colour.a = 1;
	return colour;
}
Subtitler.Styles.Colour.rgba = function(r, g, b, a) {
	if(typeof r == 'string' && arguments.length == 1) {
		var colourString = r;
		var match = /rgba\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(colourString);
		if(match) {
			var colour = new Subtitler.Styles.Colour();
			colour.r = match[1] * 1;
			colour.g = match[2] * 1;
			colour.b = match[3] * 1;
			colour.a = match[4] * 1;
			return colour;
		}
		return null;
	}
	var colour = new Subtitler.Styles.Colour();
	colour.r = r * 1;
	colour.g = g * 1;
	colour.b = b * 1;
	colour.a = a * 1;
	return colour;
}
Subtitler.Styles.Colour.hex = function(hex) {
	var regex = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/;
	var group = hex.match(regex);
	if(group) {
		var r = Subtitler.Utils.fromHex2(group[1].toUpperCase());
		var g = Subtitler.Utils.fromHex2(group[2].toUpperCase());
		var b = Subtitler.Utils.fromHex2(group[3].toUpperCase());
		var a = Subtitler.Utils.fromHex2(group[4] == undefined ? 'FF' : group[4].toUpperCase()) / 255;
		var colour = new Subtitler.Styles.Colour();
		colour.r = r;
		colour.g = g;
		colour.b = b;
		colour.a = a;
		return colour;
	}
	
	var regex = /^#?([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])?$/;
	var group = hex.match(regex);
	if(group) {
		var r = Subtitler.Utils.fromHex2(group[1].toUpperCase() + group[1].toUpperCase());
		var g = Subtitler.Utils.fromHex2(group[2].toUpperCase() + group[2].toUpperCase());
		var b = Subtitler.Utils.fromHex2(group[3].toUpperCase() + group[3].toUpperCase());
		var a = Subtitler.Utils.fromHex2(group[4] == undefined ? 'FF' : (group[4].toUpperCase()+group[4].toUpperCase())) / 255;
		var colour = new Subtitler.Styles.Colour();
		colour.r = r;
		colour.g = g;
		colour.b = b;
		colour.a = a;
		return colour;
	}
	return null;
}
Subtitler.Styles.Colour.aegisubBGR = function(aegisub) {
	var regex = /^&H([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})&?$/;
	var group = aegisub.match(regex);
	if(group) {
		var b = Subtitler.Utils.fromHex2(group[1]);
		var g = Subtitler.Utils.fromHex2(group[2]);
		var r = Subtitler.Utils.fromHex2(group[3]);
		var colour = new Subtitler.Styles.Colour();
		colour.r = r;
		colour.g = g;
		colour.b = b;
		colour.a = 1;
		return colour;
	}
	return null;
}
Subtitler.Styles.Colour.aegisubABGR = function(aegisub) {
	var regex = /^&H([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})&?$/;
	var group = aegisub.match(regex);
	if(group) {
		var a = Subtitler.Utils.fromHex2(group[1]) / 255;
		var b = Subtitler.Utils.fromHex2(group[2]);
		var g = Subtitler.Utils.fromHex2(group[3]);
		var r = Subtitler.Utils.fromHex2(group[4]);
		var colour = new Subtitler.Styles.Colour();
		colour.r = r;
		colour.g = g;
		colour.b = b;
		colour.a = 1 - a;
		return colour;
	}
	return null;
}

Subtitler.Styles.Colour.prototype.copy = function() {
	var colour = new Subtitler.Styles.Colour();
	colour.r = this.r;
	colour.g = this.g;
	colour.b = this.b;
	colour.a = this.a;
	return colour;
}

Subtitler.Styles.Colour.prototype.toRGB = function() {
	return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
}
Subtitler.Styles.Colour.prototype.toRGBA = function() {
	return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
}
Subtitler.Styles.Colour.prototype.toHex = function() {
	return '#' + Subtitler.Utils.toHex2(this.r) + Subtitler.Utils.toHex2(this.g) + Subtitler.Utils.toHex2(this.b);
}
Subtitler.Styles.Colour.prototype.toAegisubBGR = function() {
	return '&H' + Subtitler.Utils.toHex2(this.b) + Subtitler.Utils.toHex2(this.g) + Subtitler.Utils.toHex2(this.r);
}
Subtitler.Styles.Colour.prototype.toAegisubABGR = function() {
	return '&H' + Subtitler.Utils.toHex2(255 - Math.round(this.a * 255)) + Subtitler.Utils.toHex2(this.b) + Subtitler.Utils.toHex2(this.g) + Subtitler.Utils.toHex2(this.r);
}

Subtitler.Styles.Encodings = {
	ANSI: 0,
	DEFAULT: 1,
	SHIFT_JIS: 128
}

Subtitler.Styles.Alignments = {
	BOTTOM_LEFT: 1,
	BOTTOM: 2,
	BOTTOM_RIGHT: 3,
	LEFT: 4,
	CENTER: 5,
	RIGHT: 6,
	TOP_LEFT: 7,
	TOP: 8,
	TOP_RIGHT: 9,
}


Subtitler.Styles.BorderType = {
	DEFAULT: 1,
	RECTANGLE: 3
}

Subtitler.Styles.DefaultStyle = {
	name: 'Default',
	fontFamily: 'Arial',
	fontSize: 20,
	bold: false,
	italic: false,
	underline: false,
	strikeout: false,
	colourPrimary: Subtitler.Styles.Colour.rgba(255, 255, 255, 1 ),
	colourSecondary: Subtitler.Styles.Colour.rgba(255, 0, 0, 1 ),
	colourOutline: Subtitler.Styles.Colour.rgba(0, 0, 0, 1 ),
	colourShadow: Subtitler.Styles.Colour.rgba(0, 0, 0, 1 ),
	marginLeft: 10,
	marginRight: 10,
	marginVertical: 10,
	alignment: Subtitler.Styles.Alignments.BOTTOM,
	outlineWidth: 2,
	shadowOffset: 2,
	borderStyle: Subtitler.Styles.BorderType.DEFAULT,
	scaleX: 100,
	scaleY: 100,
	rotation: 0,
	spacing: 0,
	encoding: Subtitler.Styles.Encodings.DEFAULT
};


function closeMenu() {
	document.querySelector('.webapp-menu').classList.remove('webapp-menu-open');
	document.querySelector('.webapp-sub-menu-export').classList.remove('webapp-sub-menu-open');
}

document.querySelector('.webapp-menu-new-subtitles').addEventListener('click', function() {
	closeMenu();
	Subtitler.Importer.fromJSON({
		info: {
			title: Subtitler.Translations.get('initialFileName')
		},
		styles: [
			Subtitler.Styles.DefaultStyle
		],
		lines: [
			{ start: 0, end: 5, text_src: '', style: Subtitler.Styles.DefaultStyle.name }
		]
	}, false, Subtitler.Translations.get('initialFileName'));
});

document.querySelector('.webapp-menu-load-subtitles-file-input').addEventListener('change', function() {
	closeMenu();
	var input = document.querySelector('.webapp-menu-load-subtitles-file-input');
	if(input.value == '' || !input.files || input.files.length == 0) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function() {
		var mimetype = input.files[0].type;
		var filename = input.files[0].name;
		var filetype = Subtitler.FileTypes.fromFileExtension(filename) || Subtitler.FileTypes.fromFileExtension(mimetype) || null;
		var contents = reader.result;
		Subtitler.Importer.load(contents, filetype, filename);
		input.value = '';
	}
	reader.readAsText(input.files[0]);
});

document.querySelector('.webapp-menu-load-video-file-input').addEventListener('change', function() {
	closeMenu();
	var input = document.querySelector('.webapp-menu-load-video-file-input');
	if(input.value == '' || !input.files || input.files.length == 0) {
		return;
	}
	
	var previousAudioSrc = Subtitler.Audio.element.src;
	var previousVideoSrc = Subtitler.Video.player.src;
	
	var file = input.files[0];
	var blobUrl = URL.createObjectURL(file);
	Subtitler.Video.player.src = blobUrl
	Subtitler.Video.hasRealVideo = true;
	Subtitler.Garbage.videoFile = file.name;
	
	// TODO - popup?
	
	var conflictBehaviour = Subtitler.Settings.hasOwnProperty('onVideoAudioConflict') ? Subtitler.Settings.onVideoAudioConflict : Subtitler.Settings.Defaults.onVideoAudioConflict;
	
	if(previousAudioSrc == null
		|| previousAudioSrc == previousVideoSrc
		|| conflictBehaviour == 'replace') {
		URL.revokeObjectURL(previousAudioSrc);
		Subtitler.Garbage.audioFile = file.name;
		Subtitler.Audio.load(blobUrl);
	}
	else if(conflictBehaviour == 'popup') {
		Subtitler.Popup.show(
			Subtitler.Translations.get('videoAudioConflictPopupTitle'),
			Subtitler.Translations.get('videoAudioConflictPopupMessage'),
			[
				{
					label: Subtitler.Translations.get('videoAudioConflictPopupButtonDoNothing')
				},
				{
					label: Subtitler.Translations.get('videoAudioConflictPopupButtonReplace'),
					callback: function() {
						URL.revokeObjectURL(previousAudioSrc);
						Subtitler.Garbage.audioFile = file.name;
						Subtitler.Audio.load(blobUrl);
					}
				}
			]
		);
	}
	
	//var reader = new FileReader();
	//reader.onload = function() {
	//	 Subtitler.Video.player.src = reader.result;
	//}
	//reader.readAsDataURL(input.files[0]);
});

document.querySelector('.webapp-menu-load-audio-file-input').addEventListener('change', function() {
	closeMenu();
	var input = document.querySelector('.webapp-menu-load-audio-file-input');
	if(input.value == '' || !input.files || input.files.length == 0) {
		return;
	}
	
	var previousAudioSrc = Subtitler.Audio.element.src;
	var previousVideoSrc = Subtitler.Video.player.src;
	
	if(previousAudioSrc && previousVideoSrc != previousAudioSrc) {
		URL.revokeObjectURL(previousAudioSrc);
	}
	
	var file = input.files[0];
	var blobUrl = URL.createObjectURL(file);
	Subtitler.Garbage.audioFile = file.name;
	Subtitler.Audio.load(blobUrl);
});

document.querySelector('.webapp-menu-use-dummy-video').addEventListener('click', function() {
	Subtitler.DummyVideo.showPopup();
	closeMenu();
});

document.querySelector('.webapp-menu-export-ass').addEventListener('click', function() { closeMenu(); Subtitler.Exporter.toASS(); });
document.querySelector('.webapp-menu-export-sbv').addEventListener('click', function() { closeMenu(); Subtitler.Exporter.toSBV(); });
document.querySelector('.webapp-menu-export-srt').addEventListener('click', function() { closeMenu(); Subtitler.Exporter.toSRT(); });
document.querySelector('.webapp-menu-export-vtt').addEventListener('click', function() { closeMenu(); Subtitler.Exporter.toVTT(); });
document.querySelector('.webapp-menu-export-txt').addEventListener('click', function() { closeMenu(); Subtitler.Exporter.toTXT(); });

document.querySelector('.webapp-mobile-menu-toggle-button').addEventListener('click', function() {
	document.querySelector('.webapp-menu').classList.toggle('webapp-menu-open');
});

document.querySelector('.webapp-menu-timing').addEventListener('click', function() {
	Subtitler.TimingPopup.show();
	closeMenu();
});

document.querySelector('.webapp-menu-styles').addEventListener('click', function() {
	Subtitler.StylesPopup.show();
	closeMenu();
});

document.querySelector('.webapp-menu-properties').addEventListener('click', function() {
	Subtitler.Info.showPopup();
	closeMenu();
});

document.querySelector('.webapp-menu-settings').addEventListener('click', function() {
	Subtitler.Settings.showPopup();
	closeMenu();
});

document.querySelector('.webapp-menu-export').addEventListener('click', function() {
	document.querySelector('.webapp-sub-menu-export').classList.toggle('webapp-sub-menu-open');
});

document.querySelector('.webapp-menu-about').addEventListener('click', function() {
	closeMenu();
	Subtitler.Popup.show(
		Subtitler.Translations.get('aboutPopupTitle'),
		Subtitler.Translations.get('aboutPopupMessage'),
		[
			{
				label: Subtitler.Translations.get('aboutPopupButtonAegisub'),
				callback: function() {
					window.open('https://github.com/Aegisub/Aegisub', '_blank');
				}
			},
			{
				label: Subtitler.Translations.get('aboutPopupButtonSrc'),
				callback: function() {
					window.open('https://github.com/ChouNagi/subtitler', '_blank');
				}
			},
			{
				label: Subtitler.Translations.get('aboutPopupButtonClose')
			}
		]
	);
});

document.addEventListener('click', function(e) {
	if(e && e.target && e.target.matches('.insert-new-line-row')) {
		Subtitler.Lines.insertNewLineAtEnd();
	}
	
	if(e && e.target && !(e.target.closest('.webapp-menu, .webapp-mobile-menu-toggle-button'))) {
		closeMenu();
	}
});


Subtitler.Audio = Subtitler.Audio || { };
Subtitler.Audio.hasAudio = false;
Subtitler.Audio.time = 0;
Subtitler.Audio.duration = 0;
Subtitler.Audio.isPlaying = false;

Subtitler.Audio.getVolume = function() {
	var volume = Subtitler.Audio.element.volume;
	return Math.pow(volume, 1/2);
}
Subtitler.Audio.setVolume = function( volume ) {
	if(volume < 0) {
		volume = 0;
	}
	if(volume > 1) {
		volume = 1;
	}
	volume = Math.pow(volume, 2); // non-linear better match human perceived loudness
	Subtitler.Audio.element.volume = volume;
}

Subtitler.Audio.element = document.querySelector('.line-editor-audio');
Subtitler.Audio.element.volume = 0.25;

Subtitler.Audio.load = function( fileOrUrl ) {
	
	Subtitler.Audio.empty();
	
	if(typeof fileOrUrl != 'string') {
		fileOrUrl = URL.createObjectURL(fileOrUrl);
	}
	
	Subtitler.Audio.element.src = fileOrUrl;
	
	if(Subtitler.Visualiser && Subtitler.Settings.audioVisualiser == 'enabled') {
		Subtitler.Visualiser.load(fileOrUrl);
	}
}
Subtitler.Audio.play = function( start, stop ) {
	if(start == undefined) {
		start = Subtitler.Audio.time;
	}
	if( stop == undefined ) {
		stop = Subtitler.Audio.duration;
	}
	if(stop <= start) {
		Subtitler.Audio.element.pause();
		Subtitler.Audio.isPlaying = false;
		return;
	}
	
	if(stop < Subtitler.Audio.duration) {
		Subtitler.Audio.__stopTime = stop;
	}
	else {
		Subtitler.Audio.__stopTime = null;
	}
	
	if(Subtitler.Audio.isPlaying || Subtitler.Audio.time != start) {
		Subtitler.Audio.isPlaying = false;
		Subtitler.Audio.element.pause();
		Subtitler.Audio.element.currentTime = start;
	}
	
	Subtitler.Audio.element.play();
	Subtitler.Audio.isPlaying = true;
}

Subtitler.Audio.pause = function( ) {
	Subtitler.Audio.isPlaying = false;
	Subtitler.Audio.element.pause();
}

Subtitler.Audio.empty = function( ) {
	Subtitler.Audio.hasAudio = false;
	Subtitler.Audio.time = 0;
	Subtitler.Audio.duration = 0;
	Subtitler.Audio.element.removeAttribute('src');
	Subtitler.Audio.__stopTime = null;
}

Subtitler.Audio.element.addEventListener('canplaythrough', function() {
	Subtitler.Audio.hasAudio = true;
	Subtitler.Audio.time = Subtitler.Audio.element.currentTime || 0;
	Subtitler.Audio.duration = Subtitler.Audio.element.duration;
	Subtitler.Audio.__onAudioEvent();
});
Subtitler.Audio.element.addEventListener('ended', function() {
	Subtitler.Audio.isPlaying = false;
	Subtitler.Audio.__stopTime = null;
	Subtitler.Audio.__onAudioEvent();
});

Subtitler.Audio.__playing = function() {
	if(Subtitler.Audio.hasAudio) {
		if(Subtitler.Audio.__stopTime != null
				&& Subtitler.Audio.element.currentTime > Subtitler.Audio.__stopTime) {
			Subtitler.Audio.isPlaying = false;
			Subtitler.Audio.element.pause();
			Subtitler.Audio.element.currentTime = Subtitler.Audio.__stopTime;
			Subtitler.Audio.__stopTime = null;
			Subtitler.Audio.__onAudioEvent();
		}
		if(Subtitler.Audio.isPlaying) {
			Subtitler.Audio.time = Subtitler.Audio.element.currentTime;
			Subtitler.Audio.__onAudioEvent();
		}
	}
}
Subtitler.Audio.__onAudioEvent = function() {
	if(Subtitler.Visualiser) {
		Subtitler.Visualiser.updateCurrentAudioTime();
	}
}

window.setInterval(Subtitler.Audio.__playing, 15);

Subtitler.Storage = { };

Subtitler.Storage.store = function(key, value) {
	localStorage[key] = value;
}
Subtitler.Storage.storeJSON = function(key, value) {
	return Subtitler.Storage.store(key, JSON.stringify(value));
}
Subtitler.Storage.load = function(key, defaultValue) {
	if(localStorage.hasOwnProperty(key)) {
		return localStorage[key];
	}
	return defaultValue;
}
Subtitler.Storage.loadJSON = function(key, defaultValue) {
	if(localStorage.hasOwnProperty(key)) {
		try {
			return JSON.parse(localStorage[key]);
		}
		catch(e) {
			return defaultValue;
		}
	}
	return defaultValue;
}
Subtitler.Storage.clear = function(key) {
	delete localStorage[key];
}

Subtitler.Storage.Files = { };
Subtitler.Storage.Files.root = [ ];
Subtitler.Storage.Files.map = { };

Subtitler.Storage.Files.init = function() {
	Subtitler.Storage.Files.__readAll();
}

Subtitler.Storage.Files.createFolder = function(parent, folderName) {
	
	var folder = {
		'filename': folderName,
		'isFolder': true,
		'contents': [ ]
	}
	
	return Subtitler.Storage.Files.__save(parent, folder);
}

Subtitler.Storage.Files.createFile = function(parent, filename, filecontents, mimetype) {
	
	var file = {
		'filename': filename,
		'data': filecontents,
		'isFolder': false
	};
	
	if(mimetype) {
		file.mimetype = mimetype;
	}
	
	return Subtitler.Storage.Files.__save(parent, file);
}

Subtitler.Storage.Files.__save = function(parent, fileOrFolder) {
	Subtitler.Storage.Files.__readAll();
	if(typeof parent === 'string') {
		parent = Subtitler.Storage.Files.map[parent];
		if(parent == null || !parent.isFolder) {
			return null;
		}
	}
	if(fileOrFolder.id == null) {
		fileOrFolder.id = Subtitler.Utils.uuid();
	}
	if(!fileOrFolder.isFolder && fileOrFolder.mimetype == null) {
		var fileType = Subtitler.FileTypes.fromFileExtension(fileOrFolder.name);
		if(fileType != null) {
			fileOrFolder.mimetype = Subtitler.FileTypes.toMimeType(fileType);
		}
	}
	
	var now = new Date().getTime();
	if(fileOrFolder.created == null) {
		fileOrFolder.created = now;
	}
	fileOrFolder.modified = now;
	
	// remove from existing parent's contents
	if(fileOrFolder.parent != null) {
		fileOrFolder.parent.contents = fileOrFolder.parent.contents || [ ];
		for(var c=0; c<parent.contents.length; c++) {
			var item = parent.contents[c];
			if(item.id == fileOrFolder.id) {
				parent.contents.splice(c, 1);
			}
		}
	}
	
	if(parent == null) {
		fileOrFolder.parent = null;
		var present = false;
		for(var f=0; f<Subtitler.Storage.Files.root.length; f++) {
			var item = Subtitler.Storage.Files.root[f];
			if(item.id == fileOrFolder.id) {
				present = true;
			}
		}
		if(!present) {
			Subtitler.Storage.Files.root.push(fileOrFolder);
		}
		Subtitler.Storage.Files.root.sort(function(a, b) {
			if(a.name < b.name) {
				return -1;
			}
			if(a.name > b.name) {
				return 1;
			}
			return 0;
		});
	}
	else {
		fileOrFolder.parent = parent.id;
		parent.contents = parent.contents || [ ];
		var present = false;
		for(var f=0; f<parent.contents.length; f++) {
			var item = parent.contents[f];
			if(item.id == fileOrFolder.id) {
				present = true;
			}
		}
		if(!present) {
			parent.contents.push(fileOrFolder);
		}
		parent.contents.sort(function(a, b) {
			if(a.name < b.name) {
				return -1;
			}
			if(a.name > b.name) {
				return 1;
			}
			return 0;
		});
	}
	Subtitler.Storage.Files.map[fileOrFolder.id] = fileOrFolder;
	if(Subtitler.Storage.Files.__writeAll()) {
		return fileOrFolder;
	}
	return null;
}

Subtitler.Storage.Files.__readAll = function() {
	var root = Subtitler.Storage.loadJSON('Subtitler.Storage.Files', [ ]);
	Subtitler.Storage.Files.map = { };
	Subtitler.Storage.Files.__readAllRecursive(root);
	Subtitler.Storage.Files.root = root;
}

Subtitler.Storage.Files.__readAllRecursive = function(files) {
	for(var f=0; f<files.length; f++) {
		var file = files[f];
		Subtitler.Storage.Files.map[file.id] = file;
		if(file.isFolder && file.contents) {
			Subtitler.Storage.Files.__readAllRecursive(file.contents);
		}
	}
	return true;
}

Subtitler.Storage.Files.__writeAll = function() {
	try {
		Subtitler.Storage.storeJSON('Subtitler.Storage.Files', Subtitler.Storage.Files.root);
		return true;
	}
	catch(e) {
		return false;
	}
}

Subtitler.Storage.Files.moveFile = function( newParent, fileOrFolderOrId ) {
	if(typeof fileOrFolderOrId === 'string') {
		fileOrFolderOrId = Subtitler.Storage.Files.map[id];
		if(fileOrFolderOrId == null) {
			return null;
		}
	}
	if(typeof newParent === 'string') {
		newParent = Subtitler.Storage.Files.map[newParent];
		if(newParent == null || !newParent.isFolder) {
			return null;
		}
	}
	return Subtitler.Storage.Files.__save(newParent, fileOrFolderOrId);
}


Subtitler.Storage.deleteFile = function(id) {
	// TODO - delete from storage
}

Subtitler.Storage.Files.init();

var lastResizeCallback = new Date().getTime();
var redrawSubtitleTimeout = null;
window.addEventListener('resize', function() {
	if(redrawSubtitleTimeout == null) {
		if(new Date().getTime() - lastResizeCallback > 120) {
			windowResizeCallback();
		}
		else {
			redrawSubtitleTimeout = window.setTimeout(windowResizeCallback, 120);
		}
	}
});

function windowResizeCallback() {
	lastResizeCallback = new Date().getTime();
	redrawSubtitleTimeout = null;
	
	Subtitler.Video.__updateVisibleSubtitles();
	
	// TODO:
	// - calculate render scale
	// - redraw subtitles with wrong render scale
}

