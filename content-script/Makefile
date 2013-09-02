
build/app.js: components index.js
	@component build --name app --standalone app
	@echo build build/app.js

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
