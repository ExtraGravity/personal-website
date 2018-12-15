#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
IMAGE_NAME="enoch/personal-website"
DOCKER_HOME="/go/src/"
ARG_NUM=2

if [ "$1" == "init" ]; then
    docker build -t $IMAGE_NAME $DIR
elif [ "$1" == "build" ]; then
    echo $DIR
    docker run --rm -v /$DIR:/go/src/github.com/enochtsang/personal-website \
        $IMAGE_NAME ./build.sh "${@:2}"
elif [ "$1" == "run" ]; then
    ./docker-build.sh build
    PORT="8000"
    if [ ! -z "$2" ]; then
        PORT=$2
    fi
    echo ""
    echo "STARTING WEBSITE ON PORT $PORT"
    docker run --rm -v $DIR:/go/src/github.com/enochtsang/personal-website \
        -p $PORT:$PORT $IMAGE_NAME ./run.sh $PORT
else
    echo "usage: docker_build [init | build | run]"
fi
