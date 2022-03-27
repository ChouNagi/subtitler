
Subtitler = window.Subtitler || { };
Subtitler.FileTypes = Subtitler.FileTypes || { };

Subtitler.FileTypes.ASS = Subtitler.FileTypes.Aegisub = 'ass';
Subtitler.FileTypes.SBV = Subtitler.FileTypes.SubViewer = 'sbv';
Subtitler.FileTypes.SRT = Subtitler.FileTypes.SubRip = 'srt';
Subtitler.FileTypes.VTT = Subtitler.FileTypes.WebVTT = 'vtt';
Subtitler.FileTypes.YTT = Subtitler.FileTypes.YoutubeTimedText = 'ytt';
Subtitler.FileTypes.JSON = 'json';
Subtitler.FileTypes.TXT = 'txt';

Subtitler.FileTypes.toFileExtension = function( filetype ) {
	
	if(filetype == Subtitler.FileTypes.ASS) {
		return '.ass';
	}
	if(filetype == Subtitler.FileTypes.SBV) {
		return '.sbv';
	}
	if(filetype == Subtitler.FileTypes.SRT) {
		return '.srt';
	}
	if(filetype == Subtitler.FileTypes.VTT) {
		return '.vtt';
	}
	if(filetype == Subtitler.FileTypes.JSON) {
		return '.json';
	}
	if(filetype == Subtitler.FileTypes.YTT) {
		return '.ytt';
	}
	if(filetype == Subtitler.FileTypes.TXT) {
		return '.txt';
	}
	
	return '';
}

Subtitler.FileTypes.toMimeType = function( filetype ) {
	
	if(filetype == Subtitler.FileTypes.ASS) {
		return 'text/x-ass';
	}
	if(filetype == Subtitler.FileTypes.SBV) {
		return 'application/x-subviewer';
	}
	if(filetype == Subtitler.FileTypes.SRT) {
		return 'application/x-subrip';
	}
	if(filetype == Subtitler.FileTypes.VTT) {
		return 'text/vtt';
	}
	if(filetype == Subtitler.FileTypes.JSON) {
		return 'application/json';
	}
	if(filetype == Subtitler.FileTypes.YTT) {
		return 'text/x-ytt'; // TODO
	}
	if(filetype == Subtitler.FileTypes.TXT) {
		return 'text/plain';
	}
	
	return 'application/octet-stream';
}

Subtitler.FileTypes.fromMimeType = function( mimetype ) {
	
	if(mimetype == 'text/x-ass') {
		return Subtitler.FileTypes.ASS;
	}
	if(mimetype == 'application/x-subviewer') {
		return Subtitler.FileTypes.SBV;
	}
	if(mimetype == 'application/x-subrip') {
		return Subtitler.FileTypes.SRT;
	}
	if(mimetype == 'text/vtt') {
		return Subtitler.FileTypes.VTT;
	}
	if(mimetype == 'application/json') {
		return Subtitler.FileTypes.JSON;
	}
	if(mimetype == 'text/x-ytt' || mimetype == 'text/x-srv3') { // TODO
		return Subtitler.FileTypes.YTT; 
	}
	if(mimetype == 'text/plain') {
		return Subtitler.FileTypes.TXT;
	}
	
	return null;
}

Subtitler.FileTypes.fromFileExtension = function( filename ) {
	var dotPos = (filename || '').lastIndexOf('.');
	if(dotPos == -1) {
		return null;
	}
	var extension = filename.substring(dotPos).toLowerCase();
	
	if(extension == '.ass') {
		return Subtitler.FileTypes.ASS;
	}
	if(extension == '.sbv') {
		return Subtitler.FileTypes.SBV;
	}
	if(extension == '.srt') {
		return Subtitler.FileTypes.SRT;
	}
	if(extension == '.vtt' || extension == '.webvtt') {
		return Subtitler.FileTypes.VTT;
	}
	if(extension == '.ytt' || extension == '.srv3') {
		return Subtitler.FileTypes.YTT;
	}
	if(extension == '.json') {
		return Subtitler.FileTypes.JSON;
	}
	if(extension == '.txt') {
		return Subtitler.FileTypes.TXT;
	}
	
	return null;
}