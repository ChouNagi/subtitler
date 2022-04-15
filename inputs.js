// Event Handlers for additional inputs

// numeric-input		a browser consistent version of <input type="number">, set data-type="int" to force integer
// temporal-input		aegisub-style textbox with time format, pressing backspace moves cursor left one space, typing overwrites
// dropdown				a browser consistent version of select
// checkbox				a browser consistent version of checkbox

// to get the value, check the data-value attribute of the top level
// to set the value, dispatch a bubbling "set-value" on the top level, with the value in the detail
// to detect when the value changes, listen for a "value-modified" event on the top level

document.addEventListener('set-value', function(e) {
	if(e && e.target && e.target.matches('.dropdown')) {
		var handleText = e.target.querySelector('.dropdown-handle .dropdown-handle-text');
		var items = e.target.querySelectorAll('.dropdown-item');
		var valueMap = { };
		for(var i=0; i<items.length; i++) {
			var value = items[i].getAttribute('data-value');
			var textElement = items[i].querySelector('.dropdown-item-text');
			var text = ((textElement == null) ? '' : textElement.textContent);
			valueMap[value] = text;
		}
		
		var value = e.detail.value;
		var text = valueMap[value];
		if(handleText) {
			handleText.textContent = text;
			e.target.setAttribute('data-value', value);
		}
	}
	if(e && e.target && e.target.matches('.checkbox-and-label')
		||  e.target.matches('.checkbox-and-label input[type=checkbox]')) {
		
		var value = e.detail.value;
		if(value == 'false') {
			value = false;
		}
		else {
			value = !!value;
		}
		
		var checkboxWrapper = e.target.closest('.checkbox-and-label');
		var checkbox = checkboxWrapper.querySelector('input[type=checkbox]');
		
		checkboxWrapper.setAttribute('data-value', value + '');
		checkbox.setAttribute('data-value', value + '');
		checkbox.checked = value;
	}
});

document.addEventListener('click', function(e) {
	if(e && e.target && (
			e.target.closest('.numeric-input-adjustment-arrow-increase')
			|| e.target.closest('.numeric-input-adjustment-arrow-decrease'))) {
		var wrapper = e.target.closest('.numeric-input-wrapper');
		if(wrapper) {
			var input = wrapper.querySelector('.numeric-input');
			if(input) {
				var step = (input.getAttribute('data-step') || '1') * 1;
				if(isNaN(step)) {
					step = 1;
				}
				var value = input.value * 1;
				if(isNaN(value)) {
					value = 0;
				}
				if(e.target.closest('.numeric-input-adjustment-arrow-decrease')) {
					step *= -1;
				}
				value += step;
				if(e.target.getAttribute('data-format') == 'int') {
					value = value | 0;
				}
				if(input.getAttribute('data-max')) {
					var max = input.getAttribute('data-max') * 1;
					if(!isNaN(max)) {
						value = Math.min(max, value);
					}
				}
				if(input.getAttribute('data-min')) {
					var min = input.getAttribute('data-min') * 1;
					if(!isNaN(min)) {
						value = Math.max(min, value);
					}
				}
				
				// counteract js floating point bug
				value = Math.round(value * 1000000) / 1000000;
				
				input.value = value + '';
				
				input.dispatchEvent(new CustomEvent("value-modified", {
					detail: {
						'value': value
					},
					bubbles: true,
					cancelable: true
				}));
			}
		}
	}
	
	if(e && e.target && e.target.closest('.dropdown .dropdown-handle')) {
		e.target.closest('.dropdown').classList.toggle('dropdown-open');
		e.target.closest('.dropdown').querySelector('.dropdown-contents').scrollTop = 0;
	}
	else {
		var exception = e.target.closest('.dropdown');
		var dropdowns = document.querySelectorAll('.dropdown');
		for(var d=0; d<dropdowns.length; d++) {
			if(dropdowns[d] != exception) {
				dropdowns[d].classList.remove('dropdown-open');
			}
		}
	}
	
	if(e && e.target && e.target.closest('.dropdown .dropdown-item')) {
		
		var dropdown = e.target.closest('.dropdown');
		
		var item = e.target.closest('.dropdown .dropdown-item');
		var value = item.getAttribute('data-value');
		var textElement = item.querySelector('.dropdown-item-text');
		var text = ((textElement == null) ? '' : textElement.textContent);
		
		var handle = dropdown.querySelector('.dropdown-handle');
		if(handle) {
			handle.setAttribute('data-value', value);
			var handleText = handle.querySelector('.dropdown-handle-text');
			if(handleText) {
				handleText.textContent = text;
			}
		}
		
		dropdown.setAttribute('data-value', value);
		
		dropdown.classList.remove('dropdown-open');
		
		dropdown.dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': value
			},
			bubbles: true,
			cancelable: true
		}));
	}
	
	if(e && e.target && e.target.closest('.list-box .list-box-item')) {
		var listBoxItem = e.target.closest('.list-box .list-box-item');
		var listBox = listBoxItem.closest('.list-box');
		var allListBoxItems = Array.prototype.slice.call(listBox.querySelectorAll('.list-box-item'));
		var index = allListBoxItems.indexOf(listBoxItem);
		
		allListBoxItems.forEach(function(item) { item.classList.remove('list-box-item-selected'); });
		listBoxItem.classList.add('list-box-item-selected');
		if(listBoxItem.hasAttribute('data-value')) {
			listBox.setAttribute('data-value', listBoxItem.getAttribute('data-value'));
		}
		else {
			listBox.removeAttribute('data-value');
		}
		listBox.setAttribute('data-index', index+'');
		
		listBox.dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': value,
				'index': index
			},
			bubbles: true,
			cancelable: true
		}));
	}
});

document.addEventListener('keydown', function(e) {
	if(e && e.target && e.target.matches('.temporal-input')) {
		
		var dataFormat = e.target.getAttribute('data-format') || '';
		
		var initialValue = e.target.value;
		var finalValue = initialValue;
		
		var initialCaretPosition = e.target.selectionStart;
		var finalCaretPosition = initialCaretPosition;
		
		
		var nextCharacter = dataFormat[initialCaretPosition] || '';
		var characterAfterNext = dataFormat[initialCaretPosition+1] || '';
		var firstInGroup = initialCaretPosition == 0 || (dataFormat[initialCaretPosition-1] != nextCharacter);
		
		if(e.which == 9 /* tab */ 
			|| e.which == 16 /* shift */
			|| e.which == 17 /* ctrl */
			|| e.which == 18 /* alt */
			|| e.which == 27 /* alt */
			|| e.which == 37 /* <- left arrow */
			|| e.which == 39 /* right arrow -> */ ) {
			// let event through as normal
			return;
		}
		else if(e.which == 13 /* enter */) {
			// treat as escape
			e.preventDefault();
			e.target.blur();
			return;
		}
		else if(e.which == 8 /* backspace */ ) {
			finalCaretPosition = Math.max(0, e.target.selectionEnd-1);
		}
		else if(e.which == 46 /* delete */ ) {
			finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
		}
		else if(e.which == 186 || e.which == 59) {
			// colon
			if(nextCharacter == ':') {
				finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
			}
		}
		else if(e.which == 190 || e.which == 188) {
			// dot (or comma)
			if(nextCharacter == '.' || nextCharacter == ',') {
				finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
			}
		}
		else if(e.which >= 48 /* 0 */ && e.which <= 57 /* 9 */) {
			// only accept number if format allows it
			if(nextCharacter == '0' || nextCharacter == 'S' || nextCharacter == 'h'
					|| (['m','s'].indexOf(nextCharacter.toLowerCase()) != -1 && !firstInGroup)) {
				finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
				if(finalCaretPosition != initialCaretPosition) {
					finalValue = initialValue.substring(0,initialCaretPosition) + (e.which - 48) + initialValue.substring(finalCaretPosition);
				}
			}
			else if(nextCharacter.toLowerCase() == 'm'
					|| nextCharacter.toLowerCase() == 's') {
				// first number in minute/second pair can only be 0-5 inclusive
				if(e.which <= 53) {
					finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
					if(finalCaretPosition != initialCaretPosition) {
						finalValue = initialValue.substring(0,initialCaretPosition) + (e.which - 48) + initialValue.substring(finalCaretPosition);
					}
				}
			}
			else if((nextCharacter == ':' || nextCharacter == '.' || nextCharacter == ',') && 
				['0','h','m','s'].indexOf(characterAfterNext.toLowerCase()) != -1) {
				
				if(firstInGroup && (characterAfterNext.toLowerCase() == 'm' || characterAfterNext == 's')) {
					finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+2);
					finalValue = initialValue.substring(0,initialCaretPosition+1) + (e.which - 48) + initialValue.substring(finalCaretPosition);
				}
				else {
					finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+2);
					finalValue = initialValue.substring(0,initialCaretPosition+1) + (e.which - 48) + initialValue.substring(finalCaretPosition);

				}
			}
		}
		else if(e.which == 32 /* space */) {
			// only accept space if format allows it
			if(nextCharacter == ' ') {
				finalCaretPosition = Math.min(e.target.value.length, initialCaretPosition+1);
			}
		}
		else if(e.which == 67 && e.ctrlKey
			|| e.which == 86 && e.ctrlKey) {
			// CTRL + C = paste
			// CTRL + X = cut (but treat as copy)
			return;
		}
		else if(e.which == 86 && e.ctrlKey) {
			// CTRL + V = paste
			return;
		}
		else if(e.which == 90 && e.ctrlKey) {
			// CTRL + Z = undo
			// (also covers CTRL + SHIFT + Z = redo)
			return;
		}
		else if(e.which == 89 && e.ctrlKey) {
			// CTRL + Y = redo
			return;
		}
		
		e.stopPropagation();
		e.preventDefault();
		
		if(finalValue != initialValue) {
			e.target.value = finalValue;
			e.target.selectionStart = e.target.selectionEnd = finalCaretPosition;
		}
		else if(finalCaretPosition != initialCaretPosition) {
			e.target.selectionStart = e.target.selectionEnd = finalCaretPosition;
		}
		
		// parse value, convert to time in seconds and set data-value
		
		if(dataFormat.indexOf('0') != -1) {
			if(dataFormat.split(/[,.]/g).length <= 2) {
				dataFormat = dataFormat
							.replace(/^0000$/,'mmss')
							.replace(/^000000$/,'hhmmss')
							.replace(/0[.,]0/,'s.S')
							.replace(/0s/,'ss')
							.replace(/S0/,'SS')
							.replace(/S0/,'SS')
							.replace(/S0/,'SS')
							.replace(/0:s/,'m:s')
							.replace(/0m/,'mm')
							.replace(/0:m/,'h:m')
							.replace(/0h/,'hh')
							;
			}
		}
		var partIndex = 0;
		var partSubIndex = 0;
		var parts = dataFormat.split(/[^hmsS0]/g);
		var partsValueMapping = [ ];
		for(var p=0; p<parts.length; p++) {
			partsValueMapping[p] = {
				pattern: parts[p],
				value: ''
			}
		}
		for(var v=0; v<finalValue.length; v++) {
			if('0123456789'.indexOf(finalValue[v]) != -1) {
				var part = partsValueMapping[partIndex];
				part.value = part.value + finalValue[v];
				partSubIndex += 1;
				if(part.pattern.length != 1 && part.pattern.length == part.value.length) {
					partIndex += 1;
					partSubIndex = 0;
				}
			}
			else if(partSubIndex != 0) {
				partIndex += 1;
				partSubIndex = 0;
			}
		}
		
		var numericValue = 0;
		for(var p=0; p<partsValueMapping.length; p++) {
			var number = partsValueMapping[p].value * 1;
			var type = partsValueMapping[p].pattern[0];
			if(type == 'S' && /[.,]S/.test(dataFormat)) {
				number = (('0.' + partsValueMapping[p].value) * 1000);
			}
			var factor = { 'h': 3600, 'H': 3600, 'm': 60, 'M': 60, 's': 1, 'S': 0.001 }[type];
			var component = factor * number;
			numericValue += component;
		}
		
		e.target.setAttribute('data-value', numericValue+'');
		
		e.target.dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': numericValue,
				'text': finalValue
			},
			bubbles: true,
			cancelable: true
		}));
		
		return false;
	}
});

document.addEventListener('input', function(e) {
	if(e && e.target && e.target.matches('.numeric-input')) {
		var value = (e.target.value || '').replace(/[^0-9\.\-]/, '');
		if(e.target.getAttribute('data-format') == 'int') {
			value = value | 0;
		}
		if(e.target.getAttribute('data-max')) {
			var max = e.target.getAttribute('data-max') * 1;
			if(!isNaN(max)) {
				value = Math.min(max, value);
			}
		}
		if(e.target.getAttribute('data-min')) {
			var min = e.target.getAttribute('data-min') * 1;
			if(!isNaN(min)) {
				value = Math.max(min, value);
			}
		}
		
		// counteract js floating point bug
		value = Math.round(value * 1000000) / 1000000;
		
		e.target.value = value;
		
		e.target.dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': value
			},
			bubbles: true,
			cancelable: true
		}));
	}
});

document.addEventListener('change', function(e) {
	if(e && e.target && e.target.matches('.numeric-input')) {
		var value = (e.target.value || '').replace(/[^0-9\.\-]/, '');
		if(e.target.getAttribute('data-format') == 'int') {
			value = value | 0;
		}
		if(e.target.getAttribute('data-max')) {
			var max = e.target.getAttribute('data-max') * 1;
			if(!isNaN(max)) {
				value = Math.min(max, value);
			}
		}
		if(e.target.getAttribute('data-min')) {
			var min = e.target.getAttribute('data-min') * 1;
			if(!isNaN(min)) {
				value = Math.max(min, value);
			}
		}
		
		// counteract js floating point bug
		value = Math.round(value * 1000000) / 1000000;
		
		e.target.value = value;
		
		e.target.dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': value
			},
			bubbles: true,
			cancelable: true
		}));
	}
	if(e && e.target && e.target.matches('.checkbox-and-label input[type=checkbox]')) {
		var checkboxWrapper = e.target.closest('.checkbox-and-label');
		checkboxWrapper.setAttribute('data-value', e.target.checked + '');
		e.target.setAttribute('data-value', e.target.checked + '');
		checkboxWrapper.closest('.checkbox-and-label').dispatchEvent(new CustomEvent("value-modified", {
			detail: {
				'value': e.target.checked
			},
			bubbles: true,
			cancelable: true
		}));
	}
});

document.addEventListener('paste', function(e) {
	var paste = (e.clipboardData || window.clipboardData || { getData: function() { return null; } }).getData('text');
	var selection = window.getSelection();
	
	if(e && e.target && e.target.matches('.temporal-input')) {
		console.log('paste into temporal input');
		console.log('value: ' + e.target.value);
		console.log('data-value: ' + e.target.getAttribute('data-value'));
		console.log('text: ' + paste);
		
		e.preventDefault();
		
		var dataFormat = e.target.getAttribute('data-format') || '';
		
		var initialValue = e.target.value || '';
		var finalValue = initialValue;
		
		// first, check if value being pasted in is in valid format
		// if so, just set value, fire triggers, and return
		
		if(dataFormat.indexOf('0') != -1) {
			if(dataFormat.split(/[,.]/g).length <= 2) {
				dataFormat = dataFormat
							.replace(/^0000$/,'mmss')
							.replace(/^000000$/,'hhmmss')
							.replace(/0[.,]0/,'s.S')
							.replace(/0s/,'ss')
							.replace(/S0/,'SS')
							.replace(/S0/,'SS')
							.replace(/S0/,'SS')
							.replace(/0:s/,'m:s')
							.replace(/0m/,'mm')
							.replace(/0:m/,'h:m')
							.replace(/0h/,'hh')
							;
			}
		}
		
		var partIndex = 0;
		var partSubIndex = 0;
		var parts = dataFormat.split(/[^hmsS0]/g);
		var partsValueMapping = [ ];
		for(var p=0; p<parts.length; p++) {
			partsValueMapping[p] = {
				pattern: parts[p],
				value: ''
			}
		}
		for(var v=0; v<paste.length; v++) {
			if('0123456789'.indexOf(paste[v]) != -1) {
				var part = partsValueMapping[partIndex];
				part.value = part.value + paste[v];
				partSubIndex += 1;
				if(part.pattern.length != 1 && part.pattern.length == part.value.length) {
					partIndex += 1;
					partSubIndex = 0;
				}
			}
			else if(partSubIndex != 0) {
				partIndex += 1;
				partSubIndex = 0;
			}
		}
		
		var numericValue = 0;
		for(var p=0; p<partsValueMapping.length; p++) {
			var number = (partsValueMapping[p].value == '') ? NaN : (partsValueMapping[p].value * 1);
			var type = partsValueMapping[p].pattern[0];
			if(type == 'S' && /[.,]S/.test(dataFormat)) {
				number = (('0.' + partsValueMapping[p].value) * 1000);
			}
			var factor = { 'h': 3600, 'H': 3600, 'm': 60, 'M': 60, 's': 1, 'S': 0.001 }[type];
			var component = factor * number;
			numericValue += component;
		}
		
		if(!Number.isNaN(numericValue)) {
			finalValue = paste;
		}
		else {
			
			// the entire paste isn't a perfect match for the data format
			
			var valueWithPasteInserted = paste;
			
			// TODO: insert the paste text at the selection position overwriting, and check if the resulting format is valid
			
			partIndex = 0;
			partSubIndex = 0;
			parts = dataFormat.split(/[^hmsS0]/g);
			partsValueMapping = [ ];
			for(var p=0; p<parts.length; p++) {
				partsValueMapping[p] = {
					pattern: parts[p],
					value: ''
				}
			}
			for(var v=0; v<valueWithPasteInserted.length; v++) {
				if('0123456789'.indexOf(valueWithPasteInserted[v]) != -1) {
					var part = partsValueMapping[partIndex];
					part.value = part.value + valueWithPasteInserted[v];
					partSubIndex += 1;
					if(part.pattern.length != 1 && part.pattern.length == part.value.length) {
						partIndex += 1;
						partSubIndex = 0;
					}
				}
				else if(partSubIndex != 0) {
					partIndex += 1;
					partSubIndex = 0;
				}
			}
			
			numericValue = 0;
			for(var p=0; p<partsValueMapping.length; p++) {
				var number = (partsValueMapping[p].value == '') ? NaN : (partsValueMapping[p].value * 1);
				var type = partsValueMapping[p].pattern[0];
				if(type == 'S' && /[.,]S/.test(dataFormat)) {
					number = (('0.' + partsValueMapping[p].value) * 1000);
				}
				var factor = { 'h': 3600, 'H': 3600, 'm': 60, 'M': 60, 's': 1, 'S': 0.001 }[type];
				var component = factor * number;
				numericValue += component;
			}
			
			if(!Number.isNaN(numericValue)) {
				finalValue = valueWithPasteInserted;
			}
		}
		
		if(finalValue != initialValue) {
			// parse value, convert to time in seconds and set data-value
			
			e.target.value = finalValue;
			e.target.setAttribute('data-value', numericValue+'');
			
			e.target.dispatchEvent(new CustomEvent("value-modified", {
				detail: {
					'value': numericValue,
					'text': finalValue
				},
				bubbles: true,
				cancelable: true
			}));
			
			return false;
		}
	}

//	if (!selection.rangeCount) return false;
//	selection.deleteFromDocument();
//	selection.getRangeAt(0).insertNode(document.createTextNode(paste));
//
//	event.preventDefault();
});