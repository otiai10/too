build:
	npm run build
	npm run test
	npm run test:bin
	chmod a+x ./dist/bin/*

publish: build
	npm publish
