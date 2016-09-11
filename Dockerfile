# Build instructions here:
# http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html

FROM node

RUN useradd --user-group --create-home --shell /bin/false restgram \
  # https://github.com/npm/npm/issues/9863
  #&& npm install --global npm
  #&& npm install --production \
  #&& mv ./node_modules ./node_modules.tmp && mv ./node_modules.tmp ./node_modules && npm install
  && curl -L https://npmjs.org/install.sh | sh

ENV HOME=/home/restgram

COPY package.json npm-shrinkwrap.json $HOME/data/
RUN chown -R restgram:restgram $HOME/*

USER restgram
WORKDIR $HOME/data
RUN npm install \
  && npm cache clean

USER root
COPY . $HOME/data
RUN chown -R restgram:restgram $HOME/*
USER restgram

CMD ["node", "main.js"]
