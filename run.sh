#!/usr/bin/env bash

echo "Minifying CSS"
minify \
    resources/css/reset.css \
    resources/css/base.css \
    resources/css/asciidoc.css \
    resources/css/home.css \
    resources/css/resume.css \
    resources/css/about.css \
    resources/css/contact.css \
    resources/css/portfolio.css \
    resources/css/articles.css \
    --output resources/min.css

echo "Minifying JS"
minify \
    resources/js/lib/jquery-3.2.0.min.js \
    resources/js/lib/velocity.min.js \
    resources/js/base.js \
    resources/js/search.js \
    resources/js/pentagon.js \
    --output resources/min.js

echo "Building Articles"
./build-articles.sh

echo "Building Website"
go build -o personal-website

echo "================"
echo "Starting Website"
./personal-website "${@:1}" 2>&1 | tee -a ./log/personal-website.log
