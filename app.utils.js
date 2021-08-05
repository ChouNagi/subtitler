
Subtitler = window.Subtitler || { };
Subtitler.Utils = Subtitler.Utils || { };

Subtitler.Utils.uuid = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

Subtitler.Utils.toHex2 = function( n ) {
	var string = '0' + n.toString(16);
	return string.substring(string.length-2, string.length).toUpperCase();
}

Subtitler.Utils.fromHex2 = function( string ) {
	return parseInt( string, 16 );
}
