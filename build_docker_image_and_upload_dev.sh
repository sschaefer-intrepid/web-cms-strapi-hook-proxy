#!/bin/bash

aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 524500438133.dkr.ecr.us-west-2.amazonaws.com

docker build -t web-cms-strapi-hook-proxy:v1 .

docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:dev-1.0
docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:dev-preview-1.0
docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:qa-1.0
docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:qa-preview-1.0
docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:stage-1.0
docker tag web-cms-strapi-hook-proxy:v1 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:stage-preview-1.0

docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:dev-1.0
docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:dev-preview-1.0

docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:qa-1.0
docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:qa-preview-1.0

docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:stage-1.0
docker push 524500438133.dkr.ecr.us-west-2.amazonaws.com/web-cms-strapi-hook-proxy:stage-preview-1.0