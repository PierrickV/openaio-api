# The api powering OpenAIO

## Routes

### /drops/

Returns an array of object representing upcoming and previous drops.

### /drops/:drop-slug/products

Returns every products released for a drop.

### /stock

List every products available on the online shop.


## Usage
It is recommend to run the crawler and the api using pm2

```bash
$ yarn
$ npm install -g pm2
$ pm2 start process.yml
```

## Deployment with docker

```bash
$ docker build -t api .
$ docker run -d -p 8081:8081 api
```
