#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
IMAGE_NAME="enoch/personal-website"
DOCKER_HOME="/go/src/"
ARG_NUM=2

# DOCKER_INSTANCE="true" is used to indicate scripts that we are running inside docker

if [ "$1" == "init" ]; then
	docker build -t $IMAGE_NAME $DIR
elif [ "$1" == "run" ]; then
	docker run --rm -v $DIR:/go/src/github.com/enochtsang/personal-website \
		-p 8000:8000 $IMAGE_NAME ./run.sh "${@:2}"
elif [ "$1" == "articles" ]; then
	docker run --rm -v $DIR:/go/src/github.com/enochtsang/personal-website \
		$IMAGE_NAME ./build-articles.sh "${@:2}"
else
	echo "usage: docker_build [init | run | articles]"
fi

