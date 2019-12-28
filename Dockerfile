FROM node:8-alpine

RUN apk update && apk add --no-cache git

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . /usr/src/app

#RUN npm install -g bower
#RUN npm install -g http-server
RUN npm install
#RUN bower install --allow-root

CMD [ "node", "app.js" ]
