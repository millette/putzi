'use strict'

// TODO: deburr object keys

// core
const { readFileSync } = require('fs')

// npm
const got = require('got')
const cheerio = require('cheerio')
const pMap = require('p-map')
const delay = require('delay')

/*
const oy = got.extend({
  baseUrl: 'https://www.spca.com/services/animaux-trouves/chats-trouves/'
})
*/

const pageRecords = (cnt) => cheerio.load(cnt)('a.card--link')
  .map(function () { return this.attribs.href })
  .get()

const run = async (p) => {
  console.error('Page', p)
  const { url, body } = await got(`https://www.spca.com/services/animaux-trouves/chats-trouves/page/${p}`)
  console.error('url:', url, body.length)
  await delay(2)
  return pageRecords(body)
}

// const data = require('./cats.json').reduce((a, b) => a.concat(b), [])

/*
// console.log(data.join(', '))
got(data[0])
  .then(( { body }) => console.log(body))
*/

const one = (c) => {
  const $ = cheerio.load(c)
  const imgs = $('div.pet--thumbnail.rollover--thumbnail > img')
    .map(function () {
      return (this.attribs.src !== 'http://g.petango.com/shared/Photo-Not-Available-cat.gif') && this.attribs.src
    })
    .get()
    .filter((x) => !x.indexOf('http'))

  const name = $('div.pet-single-column > h2').text()

  const g2 = $('div.pet-single-column > table tr')
    .map(function () {
      return $(this).children('td').map(function () {
        return $(this).text()
      }).get()
    })
    .get()

  const g3 = { name }
  let r
  // FIXME: deburr object keys
  for (r = 0; r < g2.length; r += 2) {
    g3[g2[r]] = g2[r + 1]
  }

  if (g3.Âge) {
    g3.Âge = parseInt(g3.Âge, 10)
    if (!g3.Âge) { delete g3.Âge }
  }

  return {
    imgs,
    g3
  }
}

const catMapper = async (x) => {
  console.error(new Date().toISOString(), x)
  const { body } = await got(x)
  await delay(3)
  return {
    ...one(body),
    url: x
  }
}
// const data77 = ['https://www.spca.com/trouvee/dory-cat-39798281/']

/*
mapper(data[1])
  .then(console.log)
  .catch(console.error)
*/

/*
const cat0 = readFileSync('cat-0.html', 'utf-8')
const tada = one(cat0)
console.log(JSON.stringify(tada, null, '  '))
*/

/*
run()
  .then(console.log)
  .catch(console.error)
*/

/*
const u = pageRecords(readFileSync('outs.txt', 'utf-8'))
console.log(u)
*/

/*
const range = Array(23).fill().map((x, i) => `${i + 1}`)

Promise.all(range.map(run))
  .then((x) => console.log(JSON.stringify(x)))
  .catch(console.error)
*/

const wholeThing = async () => {
  // const range = Array(23).fill().map((x, i) => `${i + 1}`)
  const range = Array(23).fill().map((x, i) => i + 1)
  // const glm = await Promise.all(range.map(run))
  const glm = await pMap(range, run, { concurrency: 2 })
  const data99 = glm.reduce((a, b) => a.concat(b), [])
  const x = await pMap(data99, catMapper, { concurrency: 3 })
  console.log(JSON.stringify(x))
}

wholeThing()
  .catch(console.error)
