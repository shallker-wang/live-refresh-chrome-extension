../extension/content-script.js: components index.js
	@component build -o ../extension --name content-script --standalone liverefresh
	@echo build ../extension/content-script.js

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
