// utils/utils.js

// Delay function for avoiding rate limits
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Fetch NFT history
export const fetchNFTHistory = async (username, totalRecords, limit = 500) => {
	let allData = []
	let allIds = new Set()
	let offset = 0
	let reachedEnd = false

	try {
		while (!reachedEnd && offset < totalRecords) {
			const url = `https://accounts.hive-engine.com/accountHistory?account=${username}&symbol=STAR&ops=nft_transfer&limit=${limit}&offset=${offset}`
			const response = await fetch(url)

			if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`)

			const data = await response.json()

			if (!data || data.length === 0) {
				reachedEnd = true
				break
			}

			for (const element of data) {
				if (element.operation === 'nft_transfer' && !element.to.toLowerCase().startsWith('rspawnshop')) {
					allIds.add(Number(element.nft))
					allData.push(element)
				}
			}

			offset += limit

			if (data.length < limit) reachedEnd = true
			await delay(2000) // Avoid hitting API rate limits
		}
	} catch (err) {
		throw new Error(`Error fetching data: ${err.message}`)
	}

	return { allData, allIds }
}

// Filter history by sent, received, or all
export const filterHistory = (history, filter, user) => {
	if (filter === 'sent') {
		return history.filter((item) => item.items.some((card) => card.from === user))
	} else if (filter === 'received') {
		return history.filter((item) => item.items.some((card) => card.to === user))
	}
	return history // Default 'all'
}
