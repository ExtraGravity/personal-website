FROM node:6

ENV PATH="/usr/local/go/bin:${PATH}"
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update

RUN	apt-get install -y --no-install-recommends source-highlight asciidoc postfix && \
	npm install -g minifier && \
	wget https://storage.googleapis.com/golang/go1.9.1.linux-amd64.tar.gz && \
	tar -C /usr/local -xzf go1.9.1.linux-amd64.tar.gz

WORKDIR /go/src/github.com/enochtsang/personal-website
