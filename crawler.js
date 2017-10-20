const puppeteer = require('puppeteer');
const fs = require('fs');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchStock(page) {
  await page.goto('https://supremenewyork.com/shop/all', { waitUntil: 'load', timeout: 3000 });
  const categories = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#nav-categories li a')).map(x => ({ name: x.innerText, url: x.href }))
      .filter(x => ['new', 'all'].indexOf(x.name) === -1);
  });
  const wantedCompletionSeconds = 6;
  const timeout = (wantedCompletionSeconds / categories.length) * 1000;
  const allProducts = [];
  const now = new Date();
  for (let category of categories) {
    await page.goto(category.url, { waitUntil: 'load', timeout: 3000 });
    let products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('article')).map((x) => ({
        url: x.querySelector('a').href,
        name: x.querySelector('h1').innerText,
        color: x.querySelector('p').innerText,
        soldOut: x.querySelector('.sold_out_tag') !== null,
        imageUrl: x.querySelector('img').src,
        timestamp: now.getTime(),
      }));
    });
    products = products.map(x => Object.assign(x, { category: category.name }));
    allProducts.push(...products);
    await sleep(timeout);
  }
  return allProducts;
}

async function loop(browser, page, cancellationToken = {}) {
  try {
    const products = await fetchStock(page);
    fs.writeFileSync('stock.json', JSON.stringify(products));
    console.log('New products fetched successfully');
    if (!cancellationToken.cancel) {
      await loop(browser, page);
    }
  } catch (e) {
    console.error('Error while fetching products');
    console.error(e);
    await browser.close();
    await run();
  }
}

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await loop(browser, page);
}

(async () => {
  await run();
})();