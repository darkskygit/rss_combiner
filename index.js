const Parser = require('rss-parser')
const { Feed } = require('feed')
const express = require('express')
const feeds = require('./config')

const app = express()
const parser = new Parser()
const port = process.env.PORT || 3000

async function mergeFeeds(feedUrls, feedName) {
	let feeds = []
	if (Array.isArray(feedUrls)) {
		for (let url of feedUrls) {
			try {
				let feed = await parser.parseURL(url)
				feeds = feeds.concat(
					feed.items.map(item => {
						item.title = `${feed.title} | ${item.title}`
						return item
					})
				)
			} catch (e) {
				console.log(new Date(), e)
			}
		}
	}
	let sortedFeeds = feeds.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate))

	let rss = new Feed({
		title: feedName,
		copyright: 'DarkSky',
		updated: new Date(sortedFeeds[0].isoDate)
	})
	sortedFeeds.forEach(item => {
		rss.addItem({
			title: item.title,
			link: item.link,
			date: new Date(item.isoDate),
			content: item.content,
			published: new Date(item.pubDate)
		})
	})
	return rss.rss2()
}

feeds.forEach(({ name, link, content }) => {
	app.get(`/${link}`, (req, res) => {
		mergeFeeds(content, name).then(res.send.bind(res))
	})
})

app.listen(port, () => console.log(`Listening on port ${port}`))
