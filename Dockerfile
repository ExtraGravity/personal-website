FROM node:6

ENV PATH="/usr/local/go/bin:${PATH}"

RUN apt-get update

RUN apt-get install -y --no-install-recommends source-highlight asciidoc && \
    sed -i -e 's/inet_interfaces\ =\ all/inet_interfaces\ =\ 127.0.0.1/g' /etc/postfix/main.cf && \
    npm install -g minifier && \
    wget https://storage.googleapis.com/golang/go1.9.1.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.9.1.linux-amd64.tar.gz

WORKDIR /go/src/github.com/enochtsang/personal-website
