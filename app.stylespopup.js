Subtitler = window.Subtitler || { };
Subtitler.StylesPopup = Subtitler.StylesPopup || { };

Subtitler.StylesPopup.popup = document.querySelector('.styles-popup');


Subtitler.StylesPopup.Inputs = { };
Subtitler.StylesPopup.Buttons = { };

Subtitler.StylesPopup.Inputs.catalogDropdown = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-catalog-dropdown');
Subtitler.StylesPopup.Inputs.storageListBox = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box');
Subtitler.StylesPopup.Inputs.scriptListBox = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box');

Subtitler.StylesPopup.Buttons.catalogStorageNew = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-catalog-button-new');
Subtitler.StylesPopup.Buttons.catalogStorageDelete = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-catalog-button-delete');


Subtitler.StylesPopup.Buttons.storageStyleCopyToScript = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-copy-to-storage');
Subtitler.StylesPopup.Buttons.storageStyleNew = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-new');
Subtitler.StylesPopup.Buttons.storageStyleEdit = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-edit');
Subtitler.StylesPopup.Buttons.storageStyleCopy = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-copy');
Subtitler.StylesPopup.Buttons.storageStyleDelete = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-delete');

Subtitler.StylesPopup.Buttons.storageMoveStyleToTop = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box-wrapper .order-button-move-top');
Subtitler.StylesPopup.Buttons.storageMoveStyleUp = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box-wrapper .order-button-move-up');
Subtitler.StylesPopup.Buttons.storageMoveStyleDown = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box-wrapper .order-button-move-down');
Subtitler.StylesPopup.Buttons.storageMoveStyleToBottom = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box-wrapper .order-button-move-bottom');
Subtitler.StylesPopup.Buttons.storageSortStylesAlphabetically = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-storage-list-box-wrapper .order-button-sort-alphabetically');

Subtitler.StylesPopup.Buttons.scriptStyleCopyToStorage = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-copy-to-storage');
Subtitler.StylesPopup.Buttons.scriptStyleImportFromScript = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-import-from-script');
Subtitler.StylesPopup.Buttons.scriptStyleNew = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-new');
Subtitler.StylesPopup.Buttons.scriptStyleEdit = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-edit');
Subtitler.StylesPopup.Buttons.scriptStyleCopy = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-copy');
Subtitler.StylesPopup.Buttons.scriptStyleDelete = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-script-button-delete');

Subtitler.StylesPopup.Buttons.scriptMoveStyleToTop = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box-wrapper .order-button-move-top');
Subtitler.StylesPopup.Buttons.scriptMoveStyleUp = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box-wrapper .order-button-move-up');
Subtitler.StylesPopup.Buttons.scriptMoveStyleDown = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box-wrapper .order-button-move-down');
Subtitler.StylesPopup.Buttons.scriptMoveStyleToBottom = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box-wrapper .order-button-move-bottom');
Subtitler.StylesPopup.Buttons.scriptSortStylesAlphabetically = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-popup-script-list-box-wrapper .order-button-sort-alphabetically');

Subtitler.StylesPopup.Buttons.close = Subtitler.StylesPopup.popup.querySelector('.webapp-styles-button-close');

Subtitler.StylesPopup.show = function() {
	
	// TODO 
	var lastUsedStorage = Subtitler.Garbage.lastStyleStorage || 'Default';
	// Subtitler.StylesPopup.Inputs.catalogDropdown
	
	Subtitler.StylesPopup.refreshStorageList();

	Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-index', '0');
	Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-value', Subtitler.Styles.list[0].name);
	Subtitler.StylesPopup.refreshScriptList();
	
	Subtitler.StylesPopup.popup.classList.add('visible');
	Subtitler.StylesPopup.popup.querySelector('.popup-content').scrollTop = 0;
}

Subtitler.StylesPopup.hide = function() {
	Subtitler.StylesPopup.popup.classList.remove('visible');
}

Subtitler.StylesPopup.refreshStorageList = function() {
	// TODO
}
Subtitler.StylesPopup.refreshScriptList = function() {
	
	var selectedIndex = (Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-index') || 0) * 1;
	if(selectedIndex >= Subtitler.Styles.list.length) {
		selectedIndex = Subtitler.Styles.list.length - 1;
	}
	if(selectedIndex < 0) {
		selectedIndex = 0;
	}
	
	while(Subtitler.StylesPopup.Inputs.scriptListBox.childNodes[0]) {
		Subtitler.StylesPopup.Inputs.scriptListBox.removeChild(Subtitler.StylesPopup.Inputs.scriptListBox.childNodes[0]);
	}
	
	for(var s=0; s<Subtitler.Styles.list.length; s++) {
		var style = Subtitler.Styles.list[s];
		var listElement = document.createElement('DIV');
		listElement.className = 'list-box-item';
		if(selectedIndex == s) {
			listElement.classList.add('list-box-item-selected');
		}
		listElement.setAttribute('data-value', style.name);
		var listElementText = document.createElement('DIV');
		listElementText.className = 'list-box-item-text';
		listElementText.textContent = style.name;
		listElement.appendChild(listElementText);
		Subtitler.StylesPopup.Inputs.scriptListBox.appendChild(listElement);
	}
}

Subtitler.StylesPopup.Buttons.close.addEventListener('click', function() {
	Subtitler.StylesPopup.hide();
});

Subtitler.StylesPopup.Buttons.scriptStyleNew.addEventListener('click', function() {
	Subtitler.StyleEditor.showPopup(null, false, function(style) {
		if(style != null) {
			Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-index', Subtitler.Styles.list.indexOf(style) + '');
			Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-value', style.name);
		}
		Subtitler.StylesPopup.refreshScriptList();
	});
});

Subtitler.StylesPopup.Buttons.scriptStyleEdit.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		Subtitler.StyleEditor.showPopup(Subtitler.Styles.map[selectedStyleName], false, Subtitler.StylesPopup.refreshScriptList);
	}
});

Subtitler.StylesPopup.Buttons.scriptStyleCopy.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		Subtitler.StyleEditor.showPopup(Subtitler.Styles.map[selectedStyleName],  true, Subtitler.StylesPopup.refreshScriptList);
	}
});

Subtitler.StylesPopup.Buttons.scriptStyleDelete.addEventListener('click', function() {
	// TODO - maybe warn if there are lines with this style
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var styleToDelete = Subtitler.Styles.map[selectedStyleName];
		delete Subtitler.Styles.map[selectedStyleName];
		var index = Subtitler.Styles.list.indexOf(styleToDelete);
		Subtitler.Styles.list.splice(index, 1);
		var selectedIndex = (Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-index') || 0) * 1;
		if(selectedIndex >= Subtitler.Styles.list.length) {
			selectedIndex = Subtitler.Styles.list.length-1;
		}
		Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-value', (Subtitler.Styles.list[selectedIndex-1] || { }).name || '');
		Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-index', selectedIndex+'');
		Subtitler.StylesPopup.refreshScriptList();
	}
});

Subtitler.StylesPopup.__reorderScriptStyles = function( styleToMove, newIndex ) {
	var reorderedStyles = [ ];
	for(var s=0; s<Subtitler.Styles.list.length; s++) {
		var style = Subtitler.Styles.list[s];
		if(reorderedStyles.length == newIndex) {
			reorderedStyles.push(styleToMove);
		}
		if(style == styleToMove) {
			continue;
		}
		reorderedStyles.push(style);
	}
	if(reorderedStyles.length != Subtitler.Styles.list.length) {
		// will only when happen when moving style to end of list
		reorderedStyles.push(styleToMove);
	}
	Subtitler.Styles.list = reorderedStyles;
	
	Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-index', newIndex+'');
	Subtitler.StylesPopup.refreshScriptList();
}

Subtitler.StylesPopup.Buttons.scriptMoveStyleToTop.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var selectedStyle = Subtitler.Styles.map[selectedStyleName];
		Subtitler.StylesPopup.__reorderScriptStyles(selectedStyle, 0);
	}
});

Subtitler.StylesPopup.Buttons.scriptMoveStyleUp.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var selectedStyle = Subtitler.Styles.map[selectedStyleName];
		var selectedStyleIndex = Subtitler.Styles.list.indexOf(selectedStyle);
		Subtitler.StylesPopup.__reorderScriptStyles(selectedStyle, Math.max(selectedStyleIndex-1, 0));
	}
});
Subtitler.StylesPopup.Buttons.scriptMoveStyleDown.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var selectedStyle = Subtitler.Styles.map[selectedStyleName];
		var selectedStyleIndex = Subtitler.Styles.list.indexOf(selectedStyle);
		Subtitler.StylesPopup.__reorderScriptStyles(selectedStyle, Math.min(selectedStyleIndex+1, Subtitler.Styles.list.length-1));
	}
});
Subtitler.StylesPopup.Buttons.scriptMoveStyleToBottom.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var selectedStyle = Subtitler.Styles.map[selectedStyleName];
		Subtitler.StylesPopup.__reorderScriptStyles(selectedStyle, Subtitler.Styles.list.length-1);
	}
});

Subtitler.StylesPopup.Buttons.scriptSortStylesAlphabetically.addEventListener('click', function() {
	var selectedStyleName = Subtitler.StylesPopup.Inputs.scriptListBox.getAttribute('data-value');
	
	Subtitler.Styles.list = Subtitler.Styles.list.sort(function(a,b) {
		if(a.name < b.name) {
			return -1;
		}
		if(a.name > b.name) {
			return 1;
		}
		return 0;
	});
	
	var selectedIndex;
	if(selectedStyleName && Subtitler.Styles.map.hasOwnProperty(selectedStyleName)) {
		var selectedStyle = Subtitler.Styles.map[selectedStyleName];
		selectedIndex = Subtitler.Styles.list.indexOf(selectedStyle);
		if(selectedIndex < 0) {
			selectedIndex = 0;
		}
	}
	else {
		selectedIndex = 0;
	}
	
	Subtitler.StylesPopup.Inputs.scriptListBox.setAttribute('data-index', selectedIndex+'');
	Subtitler.StylesPopup.refreshScriptList();
});
