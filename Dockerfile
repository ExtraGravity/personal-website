FROM node:6

ENV PATH="/usr/local/go/bin:${PATH}"

RUN apt-get update

RUN apt-get install -y --no-install-recommends source-highlight asciidoc
RUN npm install -g minifier
RUN wget https://storage.googleapis.com/golang/go1.9.1.linux-amd64.tar.gz && \
	tar -C /usr/local -xzf go1.9.1.linux-amd64.tar.gz
RUN go get gopkg.in/yaml.v2

WORKDIR /go/src/github.com/enochtsang/personal-website
