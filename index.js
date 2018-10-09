'use strict'

// TODO: fetch next page based on metas instead of hard-coded number of pages

// core
const { readFileSync } = require('fs')

// npm
const got = require('got')
const cheerio = require('cheerio')
const pMap = require('p-map')
const delay = require('delay')
const deburr = require('lodash.deburr')
const camel = require('lodash.camelcase')

const DELAY = 300

const pageRecords = (cnt) => cheerio.load(cnt)('a.card--link')
  .map(function () { return this.attribs.href })
  .get()

const run = async (p) => {
  console.error('Page', p)
  const { url, body } = await got(`https://www.spca.com/services/animaux-trouves/chats-trouves/page/${p}`)
  await delay(DELAY)
  return pageRecords(body)
}

const one = (c) => {
  const $ = cheerio.load(c)
  const imgs = $('div.pet--thumbnail.rollover--thumbnail > img')
    .map(function () {
      return (this.attribs.src !== 'http://g.petango.com/shared/Photo-Not-Available-cat.gif') && this.attribs.src
    })
    .get()
    .filter((x) => x && !x.indexOf('http'))

  const name = $('div.pet-single-column > h2').text()

  const g2 = $('div.pet-single-column > table tr')
    .map(function () {
      return $(this).children('td').map(function () {
        return $(this).text()
      }).get()
    })
    .get()

  const g3 = { name }
  if (imgs && imgs.length) {
    g3.imgs = imgs
  }
  let r
  for (r = 0; r < g2.length; r += 2) {
    g3[camel(deburr(g2[r]))] = g2[r + 1]
  }

  if (g3.age) {
    g3.age = parseInt(g3.age, 10)
    if (!g3.age) { delete g3.age }
  }

  if (g3.name === g3['noDeReference']) {
    delete g3.name
  }

  return g3
}

const catMapper = async (x) => {
  console.error(new Date().toISOString(), x)
  const { url, body } = await got(x)
  await delay(DELAY)
  return url === x && {
    ...one(body),
    url
  }
}

// FIXME: next page
const wholeThing = async () => {
  const range = Array(23).fill().map((x, i) => i + 1)
  const glm = await pMap(range, run, { concurrency: 2 })
  return pMap(glm.reduce((a, b) => a.concat(b), []), catMapper, { concurrency: 3 })
}

wholeThing()
  .then((x) => console.log(JSON.stringify(x.filter(Boolean), null, '  ')))
  .catch(console.error)
