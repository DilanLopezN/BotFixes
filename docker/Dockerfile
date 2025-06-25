FROM node:18.17.1-alpine

COPY ./dist /var/www/
COPY ./docker /var/www/docker
COPY ./node_modules /var/www/node_modules
COPY ./Makefile /var/www/Makefile
COPY ./package.json /var/www/package.json

WORKDIR /var/www/

RUN apk update && apk upgrade && apk add --no-cache git
RUN apk add --no-cache --virtual .build-deps alpine-sdk python3 make g++ \
 && apk del .build-deps

RUN apk add tzdata
RUN cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime
RUN echo "America/Sao_Paulo" > /etc/timezone
RUN npm rebuild grpc --force

RUN chmod +x /var/www/docker/init-docker.sh

ENTRYPOINT ["/bin/sh", "/var/www/docker/init-docker.sh"]
