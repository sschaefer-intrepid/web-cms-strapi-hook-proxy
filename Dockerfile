FROM node:21.1-alpine

ENV PORT=3000


# The following environment variable NEED to be set by the corresponding Kubernetes ConfigMap
ENV STRAPI_WEBHOOK_TOKEN="XXX" 

# provide value for below as comma-separated list of modes example: MODELS_TO_UPDATE_ON_STARTUP=wallpapers,foo,bar
ENV MODELS_TO_UPDATE_ON_STARTUP="media-wallpaper,media-screenshot,media-video,race,archetype,article,general-purpose-page,home-page"

ENV WEB_AOC_PORT=3000

# The following two environment variables NEED to be set by the correspoding Kubernetes ConfigMap
ENV WEB_AOC_NAMESPACE_NAME="XXX"
ENV WEB_AOC_DEPLOYMENT_NAME="XXX"


WORKDIR /app

COPY package*.json ./

RUN npm install

COPY app.js .
COPY logger.js .

EXPOSE ${PORT}

ENTRYPOINT node app.js