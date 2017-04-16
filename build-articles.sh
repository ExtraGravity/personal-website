#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ADOC_SUFFIX=".adoc"

for ADOC_FILE in articles/*$ADOC_SUFFIX; do
	echo \> $ADOC_FILE

	NAME=${ADOC_FILE%$ADOC_SUFFIX}
	TMPL_FILE=$DIR/templates/pages/$NAME.html

	asciidoc -s -o $TMPL_FILE $ADOC_FILE
	sed -i '1i{{define "content"}}' $TMPL_FILE
	sed -i '2i<div class="article-content">' $TMPL_FILE
	echo '</div>' >> $TMPL_FILE
	echo '{{end}}' >> $TMPL_FILE
done