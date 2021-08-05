Subtitler = window.Subtitler || { };
Subtitler.DummyVideo = Subtitler.DummyVideo || { };

Subtitler.DummyVideo.popup = document.querySelector('.dummy-video-popup');

Subtitler.DummyVideo.Inputs = { };

Subtitler.DummyVideo.Inputs.resolution = Subtitler.DummyVideo.popup.querySelector('.dummy-video-resolution-dropdown');
Subtitler.DummyVideo.Inputs.width = Subtitler.DummyVideo.popup.querySelector('.dummy-video-resolution-x');
Subtitler.DummyVideo.Inputs.height = Subtitler.DummyVideo.popup.querySelector('.dummy-video-resolution-y');
Subtitler.DummyVideo.Inputs.colour = Subtitler.DummyVideo.popup.querySelector('.dummy-video-colour');
Subtitler.DummyVideo.Inputs.checkerboard = Subtitler.DummyVideo.popup.querySelector('.dummy-video-checkerboard-pattern-checkbox');
Subtitler.DummyVideo.Inputs.frameRate = Subtitler.DummyVideo.popup.querySelector('.dummy-video-frame-rate');
Subtitler.DummyVideo.Inputs.durationInSeconds = Subtitler.DummyVideo.popup.querySelector('.dummy-video-duration-in-seconds');
Subtitler.DummyVideo.Inputs.durationInFrames = Subtitler.DummyVideo.popup.querySelector('.dummy-video-duration-in-frames');

Subtitler.DummyVideo.Buttons = { };

Subtitler.DummyVideo.Buttons.cancel = Subtitler.DummyVideo.popup.querySelector('.dummy-video-button-cancel');
Subtitler.DummyVideo.Buttons.ok = Subtitler.DummyVideo.popup.querySelector('.dummy-video-button-ok');


Subtitler.DummyVideo.showPopup = function() {
	
	var width;
	var height;
	var resolution;
	var colour;
	var checkerboard;
	var frameRate;
	var durationInFrames;
	var durationInSeconds;
	
	if(Subtitler.Garbage.dummyVideo) {
		width = Subtitler.Garbage.dummyVideo.width;
		height = Subtitler.Garbage.dummyVideo.height;
		colour = Subtitler.Garbage.dummyVideo.colour;
		checkerboard = !!Subtitler.Garbage.dummyVideo.checkerboard;
		frameRate = Subtitler.Garbage.dummyVideo.frameRate;
		durationInFrames = Subtitler.Garbage.dummyVideo.durationInFrames;
		durationInSeconds = durationInFrames / frameRate;
	}
	else {
		
		if(Subtitler.Info.playResX && Subtitler.Info.playResY) {
			// default to subtitle size
			width = Subtitler.Info.playResX;
			height = Subtitler.Info.playResY;
		}
		else if(Subtitler.Video.naturalWidth && Subtitler.Video.naturalHeight) {
			// default to size of current video
			width = Subtitler.Video.naturalWidth;
			height = Subtitler.Video.naturalHeight;
		}
		else {
			// default to 720p
			width = 1280;
			height = 720;
		}
		
		colour = new Subtitler.Styles.Colour('#8af');
		checkerboard = false;
		frameRate = 24;
		durationInSeconds = 30 * 60;
		durationInFrames = durationInSeconds * frameRate;
	}
	
	resolution = width + 'x' + height;
	if(!Subtitler.DummyVideo.Inputs.resolution.querySelector('.dropdown-item[data-value="' + resolution + '"]')) {
		resolution = 'custom';
	}
	
	Subtitler.DummyVideo.Inputs.resolution.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: resolution }}));
	Subtitler.DummyVideo.Inputs.width.value = width;
	Subtitler.DummyVideo.Inputs.height.value = height;
	Subtitler.DummyVideo.Inputs.colour.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: colour }}));
	Subtitler.DummyVideo.Inputs.checkerboard.checked = checkerboard;
	Subtitler.DummyVideo.Inputs.frameRate.value = frameRate;
	Subtitler.DummyVideo.Inputs.durationInSeconds.value = Subtitler.Formatting.formatTime(durationInSeconds, 3);
	Subtitler.DummyVideo.Inputs.durationInSeconds.setAttribute('data-value', durationInSeconds);
	Subtitler.DummyVideo.Inputs.durationInFrames.value = durationInFrames;

	
	Subtitler.DummyVideo.popup.classList.add('visible');
}

Subtitler.DummyVideo.hidePopup = function() {
	Subtitler.DummyVideo.popup.classList.remove('visible');
}

Subtitler.DummyVideo.Buttons.cancel.addEventListener('click', function() {
	Subtitler.DummyVideo.hidePopup();
});

Subtitler.DummyVideo.Buttons.ok.addEventListener('click', function() {
	
	var width = Subtitler.DummyVideo.Inputs.width.value * 1;
	var height = Subtitler.DummyVideo.Inputs.height.value * 1;
	var resolution = width + 'x' + height;
	var colour = new Subtitler.Styles.Colour(Subtitler.DummyVideo.Inputs.colour.getAttribute('data-value'));
	var checkerboard = Subtitler.DummyVideo.Inputs.checkerboard.checked;
	var frameRate = Subtitler.DummyVideo.Inputs.frameRate.value * 1;
	var durationInFrames = Subtitler.DummyVideo.Inputs.durationInFrames.value * 1;
	var durationInSeconds = Subtitler.DummyVideo.Inputs.durationInSeconds.getAttribute('data-value') * 1;
	
	Subtitler.Video.__loadDummyVideo( width, height, colour, checkerboard, frameRate, durationInSeconds, durationInFrames );
	
	Subtitler.DummyVideo.hidePopup();
});

Subtitler.DummyVideo.Inputs.resolution.addEventListener('value-modified', function(e) {
	if(e && e.detail && e.detail.value) {
		if(e.detail.value == 'custom') {
			return;
		}
		else {
			var parts = e.detail.value.split('x');
			var width = parts[0] * 1;
			var height = parts[1] * 1;
			Subtitler.DummyVideo.Inputs.width.value = width;
			Subtitler.DummyVideo.Inputs.height.value = height;
		}
	}
});

Subtitler.DummyVideo.__onWidthOrHeightModified = function(e) {
	var width = Subtitler.DummyVideo.Inputs.width.value * 1;
	var height = Subtitler.DummyVideo.Inputs.height.value * 1;
	var resolution = width + 'x' + height;
	if(!Subtitler.DummyVideo.Inputs.resolution.querySelector('.dropdown-item[data-value="' + resolution + '"]')) {
		resolution = 'custom';
	}
	Subtitler.DummyVideo.Inputs.resolution.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: { value: resolution }}));
}

Subtitler.DummyVideo.Inputs.width.addEventListener('value-modified', Subtitler.DummyVideo.__onWidthOrHeightModified);
Subtitler.DummyVideo.Inputs.height.addEventListener('value-modified', Subtitler.DummyVideo.__onWidthOrHeightModified);

Subtitler.DummyVideo.__onFrameRateOrDurationModified = function(e) {
	var frameRate = Subtitler.DummyVideo.Inputs.frameRate.value * 1;
	var durationInSeconds = Subtitler.DummyVideo.Inputs.durationInSeconds.getAttribute('data-value') * 1;
	
	var durationInFrames = Math.ceil(frameRate * durationInSeconds);
	Subtitler.DummyVideo.Inputs.durationInFrames.value = durationInFrames;
}

Subtitler.DummyVideo.Inputs.durationInSeconds.addEventListener('value-modified', Subtitler.DummyVideo.__onFrameRateOrDurationModified);
Subtitler.DummyVideo.Inputs.frameRate.addEventListener('value-modified', Subtitler.DummyVideo.__onFrameRateOrDurationModified);

Subtitler.DummyVideo.Inputs.durationInFrames.addEventListener('value-modified', function() {
	var frameRate = Subtitler.DummyVideo.Inputs.frameRate.value * 1;
	var durationInFrames = Subtitler.DummyVideo.Inputs.durationInFrames.value * 1;
	
	var durationInSeconds = durationInFrames / frameRate;
	
	Subtitler.DummyVideo.Inputs.durationInSeconds.setAttribute('data-value', durationInSeconds);
	Subtitler.DummyVideo.Inputs.durationInSeconds.value = Subtitler.Formatting.formatTime(durationInSeconds, 3);
});