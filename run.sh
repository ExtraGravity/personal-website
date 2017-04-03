#!/usr/bin/env bash

go build -o personal-website

echo "Minifying CSS"
minify \
	resources/css/reset.css \
	resources/css/lib/animate.css \
	resources/css/base.css \
	resources/css/home.css \
	resources/css/resume.css \
    --output resources/min.css

echo "Minifying JS"
minify \
	resources/js/lib/jquery-3.2.0.min.js \
	resources/js/base.js \
	resources/js/pentagon.js \
    --output resources/min.js

echo "================"
echo "Starting Website"
./personal-website 2>&1 | tee -a ./log/personal-website.log
