#!/usr/bin/env bash

service postfix start
./personal-website $1 2>&1 | tee -a ./log/personal-website.log