FROM node:22.11.0-alpine

COPY ./dist /var/www/
COPY ./docker /var/www/docker
COPY ./node_modules /var/www/node_modules

WORKDIR /var/www/

RUN apk update && apk upgrade && apk add --no-cache git
RUN apk add --no-cache --virtual .build-deps alpine-sdk python3 \
 && apk del .build-deps

ENV TZ=America/Sao_Paulo
RUN apk add --update tzdata

RUN chmod +x /var/www/docker/init-docker.sh

ENTRYPOINT ["/bin/sh","/var/www/docker/init-docker.sh"]
