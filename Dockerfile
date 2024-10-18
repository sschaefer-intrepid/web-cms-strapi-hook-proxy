FROM node:21.1-alpine

ENV PORT=3000

# TEMP
ENV STRAPI_WEBHOOK_TOKEN="7f63639d05d3ab98a304b0a280be448c62520581f10a2e9ee0467241b0cee086" 
# TEMP

# provide value for below as comma-separated list of modes example: MODELS_TO_UPDATE_ON_STARTUP=wallpapers,foo,bar
# ENV MODELS_TO_UPDATE_ON_STARTUP

ENV WEB_AOC_PORT=3000
ENV WEB_AOC_NAMESPACE_NAME=web-aoc-dev 
ENV WEB_AOC_DEPLOYMENT_NAME=web-aoc-dev 

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY app.js .

EXPOSE ${PORT}

ENTRYPOINT node app.js