Subtitler = window.Subtitler || { };
Subtitler.ColourPicker = Subtitler.ColourPicker || { };

Subtitler.ColourPicker.popup = document.querySelector('.colour-chooser-popup');

Subtitler.ColourPicker.preview = Subtitler.ColourPicker.popup.querySelector('.colour-preview');

Subtitler.ColourPicker.Inputs = { };

Subtitler.ColourPicker.Inputs.rgb_red = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-rgb-red');
Subtitler.ColourPicker.Inputs.rgb_green = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-rgb-green');
Subtitler.ColourPicker.Inputs.rgb_blue = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-rgb-blue');

Subtitler.ColourPicker.Inputs.alpha = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-other-alpha');
Subtitler.ColourPicker.Inputs.html = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-other-html');
Subtitler.ColourPicker.Inputs.aegisub = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-other-aegisub');

Subtitler.ColourPicker.Inputs.hsl_hue = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsl-hue');
Subtitler.ColourPicker.Inputs.hsl_saturation = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsl-saturation');
Subtitler.ColourPicker.Inputs.hsl_luminosity = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsl-luminosity');

Subtitler.ColourPicker.Inputs.hsv_hue = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsv-hue');
Subtitler.ColourPicker.Inputs.hsv_saturation = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsv-saturation');
Subtitler.ColourPicker.Inputs.hsv_value = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-hsv-value');

Subtitler.ColourPicker.Buttons = { };

Subtitler.ColourPicker.Buttons.cancel = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-popup-cancel');
Subtitler.ColourPicker.Buttons.ok = Subtitler.ColourPicker.popup.querySelector('.colour-chooser-popup-ok');



Subtitler.ColourPicker.__updateAegisub = function(colour) {
	var aegisub = colour.toAegisubBGR();
	if(!aegisub.endsWith('&')) {
		aegisub += '&';
	}
	Subtitler.ColourPicker.Inputs.aegisub.value = aegisub;
}
Subtitler.ColourPicker.__updateHtml = function(colour) {
	Subtitler.ColourPicker.Inputs.html.value = colour.toHex();
}
Subtitler.ColourPicker.__updatePreview = function(colour) {
	Subtitler.ColourPicker.preview.style.backgroundColor = colour.toRGBA();
}
Subtitler.ColourPicker.__updateRGB = function(colour) {
	Subtitler.ColourPicker.Inputs.rgb_red.value = colour.r;
	Subtitler.ColourPicker.Inputs.rgb_green.value = colour.g;
	Subtitler.ColourPicker.Inputs.rgb_blue.value = colour.b;
}
Subtitler.ColourPicker.__updateHSL = function(colour) {
	var hsl = Subtitler.ColourPicker.__toHSL(colour.r, colour.g, colour.b);
	Subtitler.ColourPicker.Inputs.hsl_hue.value = hsl.h;
	Subtitler.ColourPicker.Inputs.hsl_saturation.value = hsl.s;
	Subtitler.ColourPicker.Inputs.hsl_luminosity.value = hsl.l;
}
Subtitler.ColourPicker.__updateHSV = function(colour) {
	var hsv = Subtitler.ColourPicker.__toHSV(colour.r, colour.g, colour.b);
	Subtitler.ColourPicker.Inputs.hsv_hue.value = hsv.h;
	Subtitler.ColourPicker.Inputs.hsv_saturation.value = hsv.s;
	Subtitler.ColourPicker.Inputs.hsv_value.value = hsv.v;
}

Subtitler.ColourPicker.__onRgbChange = function() {
	
	var colour = new Subtitler.Styles.Colour();
	colour.r = Subtitler.ColourPicker.Inputs.rgb_red.value * 1;
	colour.g = Subtitler.ColourPicker.Inputs.rgb_green.value * 1;
	colour.b = Subtitler.ColourPicker.Inputs.rgb_blue.value * 1;
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	colour.a = realAlpha;
		
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateSpectrum(colour);
	Subtitler.ColourPicker.__updateAegisub(colour);
	Subtitler.ColourPicker.__updateHtml(colour);
	Subtitler.ColourPicker.__updateHSL(colour);
	Subtitler.ColourPicker.__updateHSV(colour);
}

Subtitler.ColourPicker.__onAlphaChange = function() {
	
	var colour = new Subtitler.Styles.Colour();
	colour.r = Subtitler.ColourPicker.Inputs.rgb_red.value * 1;
	colour.g = Subtitler.ColourPicker.Inputs.rgb_green.value * 1;
	colour.b = Subtitler.ColourPicker.Inputs.rgb_blue.value * 1;
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	colour.a = realAlpha;
	
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateSpectrum(colour);
}

Subtitler.ColourPicker.__onHtmlChange = function() {
	
	var html = Subtitler.ColourPicker.Inputs.html.value;
	var colour = Subtitler.Styles.Colour.hex(html);
	if(colour == null) {
		colour = Subtitler.Styles.Colour.rgba(html);
	}
	if(colour == null) {
		colour = Subtitler.Styles.Colour.rgb(html);
	}
	if(colour == null) {
		return;
	}
	
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	colour.a = realAlpha;
	
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateSpectrum(colour);
	Subtitler.ColourPicker.__updateRGB(colour);
	Subtitler.ColourPicker.__updateAegisub(colour);
	Subtitler.ColourPicker.__updateHSL(colour);
	Subtitler.ColourPicker.__updateHSV(colour);
}

Subtitler.ColourPicker.__onAegisubChange = function() {
	
	var aegisub = Subtitler.ColourPicker.Inputs.aegisub.value;
	var colour = Subtitler.Styles.Colour.aegisubABGR(aegisub);
	if(colour == null) {
		colour = Subtitler.Styles.Colour.aegisubBGR(aegisub);
	}
	if(colour == null) {
		return;
	}
	
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	colour.a = realAlpha;
	
	Subtitler.ColourPicker.__updateRGB(colour);
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateHtml(colour);
	Subtitler.ColourPicker.__updateHSL(colour);
	Subtitler.ColourPicker.__updateHSV(colour);
}

Subtitler.ColourPicker.__onHslChange = function() {
	
	var h = Subtitler.ColourPicker.Inputs.hsl_hue.value * 1;
	var s = Subtitler.ColourPicker.Inputs.hsl_saturation.value * 1;
	var l = Subtitler.ColourPicker.Inputs.hsl_luminosity.value * 1;
	
	var nLum = l/255;
	var nSat = s/255;
	var nHue = (h*360)/255;
	
	var c = (1 - Math.abs((2 * nLum) - 1)) * nSat;
	
	var hPrime = nHue / 60;
	var x = c * (1 - Math.abs((hPrime % 2) - 1));
	
	var r;
	var g;
	var b;
	if(0 <= hPrime && hPrime < 1) {
		r = c;
		g = x;
		b = 0;
	}
	else if(1 <= hPrime && hPrime < 2) {
		r = x;
		g = c;
		b = 0;
	}
	else if(2 <= hPrime && hPrime < 3) {
		r = 0;
		g = c;
		b = x;
	}
	else if(3 <= hPrime && hPrime < 4) {
		r = 0;
		g = x;
		b = c;
	}
	else if(4 <= hPrime && hPrime < 5) {
		r = x;
		g = 0;
		b = c;
	}
	else if(5 <= hPrime && hPrime < 6) {
		r = c;
		g = 0;
		b = x;
	}
	
	var m = nLum - (c/2);
	
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	
	var colour = Subtitler.Styles.Colour.rgba(
		Math.round((r+m) * 255),
		Math.round((g+m) * 255),
		Math.round((b+m) * 255),
		realAlpha
	);
	
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateSpectrum(colour);
	Subtitler.ColourPicker.__updateRGB(colour);
	Subtitler.ColourPicker.__updateAegisub(colour);
	Subtitler.ColourPicker.__updateHtml(colour);
	Subtitler.ColourPicker.__updateHSV(colour);
}

Subtitler.ColourPicker.__onHsvChange = function() {
	
	var h = Subtitler.ColourPicker.Inputs.hsv_hue.value * 1;
	var s = Subtitler.ColourPicker.Inputs.hsv_saturation.value * 1;
	var v = Subtitler.ColourPicker.Inputs.hsv_value.value * 1;
	
	var nVal = v/255;
	var nSat = s/255;
	var nHue = (h*360)/255;
	
	var c = nVal * nSat;
	var hPrime = nHue / 60;
	var x = c * (1 - Math.abs((hPrime % 2) - 1));
	
	var r;
	var g;
	var b;
	if(0 <= hPrime && hPrime < 1) {
		r = c;
		g = x;
		b = 0;
	}
	else if(1 <= hPrime && hPrime < 2) {
		r = x;
		g = c;
		b = 0;
	}
	else if(2 <= hPrime && hPrime < 3) {
		r = 0;
		g = c;
		b = x;
	}
	else if(3 <= hPrime && hPrime < 4) {
		r = 0;
		g = x;
		b = c;
	}
	else if(4 <= hPrime && hPrime < 5) {
		r = x;
		g = 0;
		b = c;
	}
	else if(5 <= hPrime && hPrime < 6) {
		r = c;
		g = 0;
		b = x;
	}
	
	var m = nVal - c;
	
	var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
	var realAlpha = (255 - aegisubAlpha) / 255;
	
	var colour = Subtitler.Styles.Colour.rgba(
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
		realAlpha
	);
	
	Subtitler.ColourPicker.__updateRGB(colour);
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateAegisub(colour);
	Subtitler.ColourPicker.__updateHtml(colour);
	Subtitler.ColourPicker.__updateHSL(colour);
}


document.addEventListener('click', function(e) {
	if(e && e.target && e.target.closest('.colour-input')) {
		Subtitler.ColourPicker.show(e.target.closest('.colour-input'));
	}
});

document.addEventListener('set-value', function(e) {
	if(e && e.target && e.target.closest('.colour-input')) {
		if(e.detail && e.detail.value && e.detail.value instanceof Subtitler.Styles.Colour) {
			var colourInput = e.target.closest('.colour-input');
			var colourPreview = colourInput.querySelector('.colour-preview');
			if(colourPreview) {
				colourPreview.style.backgroundColor = e.detail.value.toRGBA();
			}
			colourInput.setAttribute('data-value', e.detail.value.toAegisubABGR());
			colourInput.setAttribute('data-red', e.detail.value.r);
			colourInput.setAttribute('data-green', e.detail.value.g);
			colourInput.setAttribute('data-blue', e.detail.value.b);
			colourInput.setAttribute('data-alpha', e.detail.value.a);
		}
	}
});

/** Note: See Subtitler.Styles.Colour for the structure and methods of a Colour */

/** 
	Subtitler.ColourPicker.show( colourInput )
	Subtitler.ColourPicker.show( colour, callback )
	
	Shows the ColourPicker popup and initialises it with the given colour (or colour from the input)
	On closing the colour picker:
		If "OK" was selected:
			If the argument was a colour input, the colour and value of said input will be updated, and a "value-modified" event triggered
			If a callback was specified, the callback will be called with the chosen Colour as its argument
		If cancel was selected, the callback (if present) will be called with null as its argument
*/
Subtitler.ColourPicker.show = function( elementOrColour, callback ) {
	
	var colour;
	if(elementOrColour instanceof HTMLElement) {
		var element = elementOrColour;
		colour = new Subtitler.Styles.Colour(elementOrColour.getAttribute('data-value'));
		var oldCallback = callback;
		callback = function( c ) {
			if(c) {
				element.dispatchEvent(new CustomEvent('set-value', { bubbles: true, cancelable: true, detail: {
					value: c }
				}));
				element.dispatchEvent(new CustomEvent('value-modified', { bubbles: true, cancelable: true, detail: {
					value: c }
				}));
			}
			if(oldCallback) {
				oldCallback(c);
			}
		};
	}
	else {
		colour = elementOrColour;
	}
	
	Subtitler.ColourPicker.popup.classList.add('visible');
	Subtitler.ColourPicker.__callback = callback;
	
	Subtitler.ColourPicker.__updatePreview(colour);
	Subtitler.ColourPicker.__updateSpectrum(colour);
	
	Subtitler.ColourPicker.__updateRGB(colour);
	
	var aegisubAlpha = 255 - Math.round(colour.a * 255);
	Subtitler.ColourPicker.Inputs.alpha.value = aegisubAlpha
	Subtitler.ColourPicker.Inputs.html.value = colour.toHex();
	
	Subtitler.ColourPicker.__updateHtml(colour);
	Subtitler.ColourPicker.__updateAegisub(colour);
	
	Subtitler.ColourPicker.__updateHSL(colour);
	Subtitler.ColourPicker.__updateHSV(colour);
}

Subtitler.ColourPicker.__updateHtml = function(colour) {
	Subtitler.ColourPicker.Inputs.html.value = colour.toHex();
}
Subtitler.ColourPicker.__updatePreview = function(colour) {
	Subtitler.ColourPicker.preview.style.backgroundColor = colour.toRGBA();
}
Subtitler.ColourPicker.__updateRGB = function(colour) {
	Subtitler.ColourPicker.Inputs.rgb_red.value = colour.r;
	Subtitler.ColourPicker.Inputs.rgb_green.value = colour.g;
	Subtitler.ColourPicker.Inputs.rgb_blue.value = colour.b;
}
Subtitler.ColourPicker.__updateHSL = function(colour) {
	var hsl = Subtitler.ColourPicker.__toHSL(colour.r, colour.g, colour.b);
	Subtitler.ColourPicker.Inputs.hsl_hue.value = hsl.h;
	Subtitler.ColourPicker.Inputs.hsl_saturation.value = hsl.s;
	Subtitler.ColourPicker.Inputs.hsl_luminosity.value = hsl.l;
}
Subtitler.ColourPicker.__updateHSV = function(colour) {
	var hsv = Subtitler.ColourPicker.__toHSV(colour.r, colour.g, colour.b);
	Subtitler.ColourPicker.Inputs.hsv_hue.value = hsv.h;
	Subtitler.ColourPicker.Inputs.hsv_saturation.value = hsv.s;
	Subtitler.ColourPicker.Inputs.hsv_value.value = hsv.v;
}
Subtitler.ColourPicker.__updateSpectrum = function(colour) {
	// TODO - colour spectrum
}

Subtitler.ColourPicker.__toHSL = function(r, g, b) {
	
	var nRed = r / 255;
	var nGreen = g / 255;
	var nBlue = b / 255;
	
	var cMin = Math.min(nRed,nGreen,nBlue);
	var cMax = Math.max(nRed,nGreen,nBlue);
	var delta = cMax - cMin;
	
	var hue;
	if(delta == 0) {
		hue = 0;
	}
	else if(cMax == nRed) {
		hue = ((nGreen - nBlue) / delta) % 6;
	}
	else if(cMax == nGreen) {
		hue = ((nBlue - nRed) / delta) + 2;
	}
	else {
		hue = ((nRed - nGreen) / delta) + 4;
	}
	
	hue = hue * 60;
	
	if(hue < 0) {
		hue += 360;
	}
	
	var luminosity = (cMax + cMin) / 2;
	
	var saturation;
	if(delta == 0) {
		saturation = 0;
	}
	else {
		saturation = 1 - Math.abs((2 * luminosity) - 1);
	}
	
	return { h: Math.round(hue*255/360), s: Math.round(saturation * 255), l: Math.round(luminosity * 255) };
}

Subtitler.ColourPicker.__toHSV = function(r, g, b) {
	
	var nRed = r / 255;
	var nGreen = g / 255;
	var nBlue = b / 255;
	
	var cMin = Math.min(nRed,nGreen,nBlue);
	var cMax = Math.max(nRed,nGreen,nBlue);
	var delta = cMax - cMin;
	
	var hue;
	if(delta == 0) {
		hue = 0;
	}
	else if(cMax == nRed) {
		hue = ((nGreen - nBlue) / delta) % 6;
	}
	else if(cMax == nGreen) {
		hue = ((nBlue - nRed) / delta) + 2;
	}
	else {
		hue = ((nRed - nGreen) / delta) + 4;
	}
	
	hue = Math.round(hue * 60);
	
	if(hue < 0) {
		hue += 360;
	}
	
	var value = cMax;
	
	var saturation;
	if(delta == 0) {
		saturation = 0;
	}
	else {
		saturation = delta / value;
	}
	
	return { h: hue, s: Math.round(saturation * 255), v: Math.round(value * 255) };
}

Subtitler.ColourPicker.hide = function( ) {
	Subtitler.ColourPicker.popup.classList.remove('visible');
}

Subtitler.ColourPicker.Buttons.cancel.addEventListener('click', function() {
	Subtitler.ColourPicker.hide();
	if(Subtitler.ColourPicker.__callback) {
		Subtitler.ColourPicker.__callback(null);
	}
	Subtitler.ColourPicker.__callback = null;
});

Subtitler.ColourPicker.Buttons.ok.addEventListener('click', function() {
	Subtitler.ColourPicker.hide();
	if(Subtitler.ColourPicker.__callback) {
		var colour = new Subtitler.Styles.Colour();
		colour.r = Subtitler.ColourPicker.Inputs.rgb_red.value * 1;
		colour.g = Subtitler.ColourPicker.Inputs.rgb_green.value * 1;
		colour.b = Subtitler.ColourPicker.Inputs.rgb_blue.value * 1;
		var aegisubAlpha = Subtitler.ColourPicker.Inputs.alpha.value * 1;
		var realAlpha = (255 - aegisubAlpha) / 255;
		colour.a = realAlpha;
		Subtitler.ColourPicker.__callback(colour);
	}
	Subtitler.ColourPicker.__callback = null;
});


Subtitler.ColourPicker.Inputs.rgb_red.addEventListener('input', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_red.addEventListener('change', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_red.addEventListener('value-modified', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_green.addEventListener('input', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_green.addEventListener('change', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_green.addEventListener('value-modified', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_blue.addEventListener('input', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_blue.addEventListener('change', Subtitler.ColourPicker.__onRgbChange);
Subtitler.ColourPicker.Inputs.rgb_blue.addEventListener('value-modified', Subtitler.ColourPicker.__onRgbChange);

Subtitler.ColourPicker.Inputs.alpha.addEventListener('input', Subtitler.ColourPicker.__onAlphaChange);
Subtitler.ColourPicker.Inputs.alpha.addEventListener('change', Subtitler.ColourPicker.__onAlphaChange);
Subtitler.ColourPicker.Inputs.alpha.addEventListener('value-modified', Subtitler.ColourPicker.__onAlphaChange);

Subtitler.ColourPicker.Inputs.html.addEventListener('input', Subtitler.ColourPicker.__onHtmlChange);
Subtitler.ColourPicker.Inputs.html.addEventListener('change', Subtitler.ColourPicker.__onHtmlChange);
Subtitler.ColourPicker.Inputs.html.addEventListener('value-modified', Subtitler.ColourPicker.__onHtmlChange);

Subtitler.ColourPicker.Inputs.aegisub.addEventListener('input', Subtitler.ColourPicker.__onAegisubChange);
Subtitler.ColourPicker.Inputs.aegisub.addEventListener('change', Subtitler.ColourPicker.__onAegisubChange);
Subtitler.ColourPicker.Inputs.aegisub.addEventListener('value-modified', Subtitler.ColourPicker.__onAegisubChange);

Subtitler.ColourPicker.Inputs.hsl_hue.addEventListener('input', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_hue.addEventListener('change', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_hue.addEventListener('value-modified', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_saturation.addEventListener('input', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_saturation.addEventListener('change', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_saturation.addEventListener('value-modified', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_luminosity.addEventListener('input', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_luminosity.addEventListener('change', Subtitler.ColourPicker.__onHslChange);
Subtitler.ColourPicker.Inputs.hsl_luminosity.addEventListener('value-modified', Subtitler.ColourPicker.__onHslChange);

Subtitler.ColourPicker.Inputs.hsv_hue.addEventListener('input', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_hue.addEventListener('change', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_hue.addEventListener('value-modified', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_saturation.addEventListener('input', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_saturation.addEventListener('change', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_saturation.addEventListener('value-modified', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_value.addEventListener('input', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_value.addEventListener('change', Subtitler.ColourPicker.__onHsvChange);
Subtitler.ColourPicker.Inputs.hsv_value.addEventListener('value-modified', Subtitler.ColourPicker.__onHsvChange);
