#!/usr/bin/env bash

./personal-website $1 2>&1 | tee -a ./log/personal-website.log