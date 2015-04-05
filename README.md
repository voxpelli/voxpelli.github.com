To start local Jekyll server do:

	jekyll server --watch

To ping Superfeedr after you have added a new post - run this in terminal:

	curl -X POST  http://voxpelli.superfeedr.com/ -d "hub.mode=publish" -d"hub.url=http://voxpelli.com/all.xml"
	curl -X POST  http://voxpelli.superfeedr.com/ -d "hub.mode=publish" -d"hub.url=http://voxpelli.com/english.xml"
