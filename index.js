const Parser = require('rss-parser')
const { Feed } = require('feed')
const express = require('express')
const feeds = require('./config')
const queue = require('./queue')

const app = express()
const parser = new Parser()
const port = process.env.PORT || 3000
const timeout = process.env.TIMEOUT || 3 * 60 * 1000
const feedContent = {}

async function startFeedCollecter(title, feedLink, feedUrls) {
	if (Array.isArray(feedUrls)) {
		let promises = feedUrls.map(url => () =>
			parser.parseURL(url).then(feed =>
				feed.items.map(item => {
					item.title = `${feed.title} | ${item.title}`
					return item
				})
			)
		)
		let sortedFeeds = [].concat(await queue(promises, 4)).sort((a, b) => {
			let getDataNum = date => Number(new Date(date)) | 0
			return getDataNum(b.isoDate) - getDataNum(a.isoDate)
		})
		let rss = new Feed({
			title: name,
			copyright: 'DarkSky',
			updated: new Date(sortedFeeds[0].isoDate)
		})
		sortedFeeds.forEach(item => {
			rss.addItem({
				title,
				link: item.link,
				date: new Date(item.isoDate),
				content: item.content,
				published: new Date(item.pubDate)
			})
		})
		feedContent[feedLink] = rss.rss2()
		return setTimeout(() => startFeedCollecter(...arguments, timeout), timeout)
	}
}

feeds.forEach(({ name, link, content }) => {
	startFeedCollecter(name, link, content)
	app.get(`/${link}`, (req, res) => {
		return res.send(feedContent[link])
	})
})

app.listen(port, () => console.log(`Listening on port ${port}`))
