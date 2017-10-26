#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

GREEN='\033[0;32m'
NC='\033[0m'

ADOC_SUFFIX=".adoc"
HIGHLIGHTER=coderay

SED=sed
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED=gsed
fi

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
for ADOC_FILE in articles/*$ADOC_SUFFIX; do
    echo \> $ADOC_FILE

    NAME=${ADOC_FILE%$ADOC_SUFFIX}
    TMPL_FILE=$DIR/templates/pages/$NAME.html

    asciidoc -s -o $TMPL_FILE $ADOC_FILE
    $SED -i '1i{{define "content"}}' $TMPL_FILE
    $SED -i '2i<div class="article-content">' $TMPL_FILE
    echo '</div>' >> $TMPL_FILE
    echo '{{end}}' >> $TMPL_FILE
done

echo "Building Website"
go build -o personal-website

if [ $? -eq 0 ]; then
    printf "${GREEN}|*******| BUILD SUCCESSFUL |*******|${NC}\n"
    exit 0
else
    printf "${RED}|*******| BUILD FAILED |*******|${NC}\n"
    exit 1
fi
