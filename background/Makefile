../extension/background.js: components index.js lib/activator.js lib/server-connector.js lib/script-connector.js
	@component build -o ../extension --name background --standalone liverefresh
	@echo build ../extension/background.js

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
