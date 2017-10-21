FROM node:8-alpine

# Install latest chrome browser
RUN apk add --no-cache \
      udev \
      ttf-freefont \
      chromium \
      git
RUN git clone --depth=1 https://github.com/val92130/openaio-api.git \
    && cd openaio-api/ \
    && yarn \
    && npm install -g pm2

WORKDIR openaio-api

EXPOSE 8081
CMD ["pm2-docker", "process.yml"]
