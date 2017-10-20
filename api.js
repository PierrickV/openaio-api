const request = require('request-promise-native');
const express = require('express');
const app = express();
const cheerio = require('cheerio');
const cached = require('./cache');
const utils = require('./utils');
const fs = require('fs');

const baseCommunityUrl = 'https://supremecommunity.com';

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

async function get (url) {
  const data = await request({
    url,
    timeout: 3000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.45 Safari/535.19',
    }
  });
  return cheerio.load(data);
}

async function getDropList() {
  const $ = await get(`${baseCommunityUrl}/season/latest/droplists/`);
  return Array.from($('.block').map((i, x) => ({
    url: x.attribs.href,
    name: $(x).text().replace(/\s\s+/g, ' ').trim(),
    slug: utils.slugify($(x).text().trim())
  })));
}

async function getProducts(url) {
  const $ = await get(baseCommunityUrl + url);
  const cards = $('.card-details');
  return Array.from(cards.map((i, card) => {
    const imageUrl = `${baseCommunityUrl}/${$(card).find('img')[0].attribs.src}`;
    let name = $($(card).find('.name')[0]).text().trim();
    const labelPrice = $($(card).find('.label-price')[0]);
    const price = labelPrice ? labelPrice.text().trim() : 'unknown';
    const category = $($(card).parent().find('.category')[0]).text().replace(/\s\s+/g, ' ').trim();
    name = name.replace(/\s\s+/g, ' ').trim();
    return {imageUrl, name, price, keywords: name.split(' ').filter(x => !!x), category};
  }));
}

function getSupremeProducts(raw = false) {
  if (!fs.existsSync('./stock.json')) return [];
  const data = fs.readFileSync('./stock.json');
  if (raw) return data;
  return JSON.parse(data);
}

const getProductsCached = cached(getProducts, 10);
const getDropsCached = cached(getDropList, 10);
const getSupremeProductsCached = cached(getSupremeProducts, 0.06);

app.get('/stock', (req, res) => {
  res.json(getSupremeProductsCached());
});

app.get('/drops', async (req, res) => {
  res.json(await getDropsCached());
});

app.get('/drops/:slug/products/', async (req, res) => {
  const drops = await getDropsCached();
  const slug = req.params.slug;
  if (!slug) return res.sendStatus(404);
  const drop = drops.find(x => x.slug === slug);
  if (!drop) return res.sendStatus(404);

  return res.json(await getProductsCached(drop.url));
});

console.log('server listening on port 8081');
app.listen(8081);
