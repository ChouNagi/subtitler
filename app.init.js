
Subtitler.Importer.fromJSON({
	info: {
		title: Subtitler.Translations.get('initialFileName')
	},
	garbage: {
		lastUsedStyle: Subtitler.Styles.DefaultStyle.name
	},
	styles: [
		Subtitler.Styles.DefaultStyle
	],
	lines: [
		{ start: 0, end: 5, text_src: '', style: Subtitler.Styles.DefaultStyle.name }
	]
}, false, Subtitler.Translations.get('initialFileName'));

if(window.ontouchstart) {
	Subtitler.app.classList.remove('supports-hover');
}

Subtitler.Video.zoomDropdown.dispatchEvent(new CustomEvent("set-value", { detail: { 'value': 'auto' }, bubbles: true, cancelable: true }));
Subtitler.Video.zoomDropdown.dispatchEvent(new CustomEvent("value-modified", { detail: { 'value': 'auto' }, bubbles: true, cancelable: true }));
