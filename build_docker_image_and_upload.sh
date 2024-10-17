#!/bin/bash

aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 524500438133.dkr.ecr.us-west-2.amazonaws.com

docker build -t web-cms-strapi-hook-proxy:v1 .

docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:v1

docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:v1
