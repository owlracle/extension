#!/bin/bash
VERSION="1.2.0.3"
zip "release/owlracle-ext-chrome-v$VERSION.zip" css/*.css script/*.min.js img/* popup.html manifest.json

mv manifest.json manifest_chrome.json
mv manifest_edge.json manifest.json
zip "release/owlracle-ext-edge-v$VERSION.zip" css/*.css script/*.min.js img/* popup.html manifest.json
mv manifest.json manifest_edge.json
mv manifest_chrome.json manifest.json