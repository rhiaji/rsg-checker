'use client'
import { useState, useEffect } from 'react'
import SSC from 'sscjs'

const ssc = new SSC('https://api.hive-engine.com/rpc')

export default function Pawnshoppage() {
	// -------------------------------
	// 🔄 States for loading status, error, data and filters
	// -------------------------------
	const [history, setHistory] = useState([])
	const [filteredHistory, setFilteredHistory] = useState([])
	const [loading, setLoading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [totalRecords, setTotalRecords] = useState(5000) // or default it to your cap
	const [error, setError] = useState(null)

	// -------------------------------
	// 🧍 States for user input and filter selection
	// -------------------------------
	const [user, setUser] = useState('')
	const [inputUser, setInputUser] = useState('')
	const [filter, setFilter] = useState('all')

	// -------------------------------
	// 💬 Modal state for showing NFT IDs in an overlay
	// -------------------------------
	const [showModal, setShowModal] = useState(false)
	const [modalData, setModalData] = useState({ name: '', ids: [] })

	// -------------------------------
	// 📦 Fetch NFT transfer history and card metadata
	// -------------------------------
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	const fetchCards = async (username) => {
		setLoading(true)
		setError(null)
		let allHistory = {}
		let allIds = new Set() // Use a Set to avoid duplicate IDs
		const limit = 500
		let offset = 0
		let allData = []
		let reachedEnd = false

		try {
			console.log('Fetching transfer history for user:', username)
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
					if (element.operation === 'nft_transfer' && element.to.toLowerCase().startsWith('rspawnshop')) {
						allIds.add(Number(element.nft)) // Add to Set to avoid duplicates
						allData.push(element)
					}
				}

				offset += limit
				setProgress(offset)
				console.log(`Fetched ${offset} of ${totalRecords} transactions...`)

				if (data.length < limit) reachedEnd = true

				await delay(1000) // Avoid hitting API rate limits
			}

			if (allIds.size > 0) {
				// Convert Set to Array for easy handling
				const allIdsArray = Array.from(allIds)
				console.log('Fetched NFT IDs:', allIdsArray)

				// Split allIds into chunks of 1000
				const batchSize = 1000
				const numBatches = Math.ceil(allIdsArray.length / batchSize)

				let nftMap = {}

				// Iterate through batches
				for (let i = 0; i < numBatches; i++) {
					const batch = allIdsArray.slice(i * batchSize, (i + 1) * batchSize)

					// Fetch data for this batch
					const result = await ssc.find('nft', 'STARinstances', { _id: { $in: batch } }, 1000, 0)

					// Update nftMap with results
					result.forEach((nft) => {
						nftMap[nft._id] = nft
					})
				}

				// Now process all the data with the full nftMap
				for (const element of allData) {
					const nft = nftMap[Number(element.nft)]
					if (!nft) continue

					const card = {
						nftId: element.nft,
						name: nft.properties.type,
						from: element.from,
						to: element.to,
						timestamp: element.timestamp,
						tx: element.transactionId.split('-')[0],
					}

					if (!allHistory[card.tx]) {
						allHistory[card.tx] = {
							timestamp: card.timestamp,
							items: [],
						}
					}
					allHistory[card.tx].items.push(card)
				}
			}

			// ✅ Sort by most recent first (descending timestamp)
			const formattedHistory = Object.entries(allHistory)
				.map(([tx, { timestamp, items }]) => ({ tx, timestamp, items }))
				.sort((a, b) => b.timestamp - a.timestamp)

			setHistory(formattedHistory)
			setFilteredHistory(formattedHistory)

			// ✅ Log data after processing
			console.log('Formatted History:', formattedHistory)
		} catch (err) {
			setError(`Error fetching data: ${err.message}`)
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	// -------------------------------
	// 🪝 Trigger fetch when user is set
	// -------------------------------
	useEffect(() => {
		if (user) fetchCards(user)
	}, [user])

	// -------------------------------
	// 🔍 Handle user search input
	// -------------------------------
	const handleSearch = () => {
		if (inputUser.trim()) {
			setUser(inputUser.trim())
		}
	}

	// -------------------------------
	// 📂 Filter history by sent/received/all
	// -------------------------------
	const filterHistory = (type) => {
		setFilter(type)
		console.log(`Filtering history by: ${type}`)

		if (type === 'sent') {
			setFilteredHistory(history.filter((item) => item.items.some((card) => card.from === user)))
		} else if (type === 'received') {
			setFilteredHistory(history.filter((item) => item.items.some((card) => card.to === user)))
		} else {
			setFilteredHistory(history)
		}
	}

	// Render the component
	return (
		<div className="p-6 max-w-7xl mx-auto text-white">
			{/* Header */}
			<header className="text-center mb-8">
				<h1 className="text-4xl font-bold mb-2">Pawnshop NFT Transfer Checker</h1>
				<p className="text-sm text-gray-400">Analyze the latest 5000 transactions related to Rising Star NFTs.</p>
			</header>

			{/* User Input */}
			<div className="flex flex-col sm:flex-row items-center gap-4 mb-8 flex-wrap">
				<input
					type="text"
					placeholder="Enter username..."
					value={inputUser}
					onChange={(e) => setInputUser(e.target.value)}
					className="px-4 py-2 border border-gray-600 rounded bg-gray-900 text-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={handleSearch}
					className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md transition-all w-full sm:w-auto"
				>
					Search
				</button>
			</div>

			{/* Filter Buttons */}
			<div className="flex justify-center gap-4 mb-8 flex-wrap">
				{['all', 'sent', 'received'].map((type) => (
					<button
						key={type}
						onClick={() => filterHistory(type)}
						className={`px-4 py-2 rounded shadow-md transition-all ${
							filter === type ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-blue-800 hover:text-white'
						}`}
					>
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</button>
				))}
			</div>

			{/* Table Results */}
			<div className="overflow-x-auto">
				{loading ? (
					<div className="flex flex-col items-center gap-4 py-10">
						<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
						<p className="text-gray-400 text-sm">
							Fetching Rising Star NFT data... ({progress}/{totalRecords} transactions)
						</p>
						<div className="w-full sm:w-96 bg-gray-800 h-4 rounded overflow-hidden">
							<div
								className="bg-blue-600 h-full transition-all duration-300"
								style={{ width: `${Math.min((progress / totalRecords) * 100, 100)}%` }}
							></div>
						</div>
					</div>
				) : filteredHistory.length > 0 ? (
					<table className="min-w-full table-auto border border-gray-700 text-sm">
						<thead className="bg-gray-800">
							<tr>
								<th className="p-2 text-left border-b border-gray-600">Transaction</th>
								<th className="p-2 text-left border-b border-gray-600">Time</th>
								<th className="p-2 text-left border-b border-gray-600">Details</th>
							</tr>
						</thead>
						<tbody>
							{filteredHistory.map((item, index) => (
								<tr key={index} className="hover:bg-gray-800 transition">
									<td className="p-2 border-b border-gray-700">
										<a
											href={`https://hivehub.dev/tx/${item.tx}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-400 hover:text-red-400 break-all"
										>
											{item.tx}
										</a>
									</td>
									<td className="p-2 border-b border-gray-700">{new Date(item.timestamp * 1000).toLocaleString()}</td>
									<td className="p-2 border-b border-gray-700">
										{Object.entries(
											item.items.reduce((acc, card) => {
												if (!acc[card.name]) {
													acc[card.name] = { count: 0, ids: [], from: card.from, to: card.to }
												}
												acc[card.name].count += 1
												acc[card.name].ids.push(card.nftId)
												return acc
											}, {})
										).map(([name, details], idx) => (
											<div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg">
												<img
													src={`https://www.risingstargame.com/images/cards/${name.replace(/\s+/g, '%20')}.png`}
													alt={name}
													className="w-32 h-48 sm:w-48 sm:h-64 rounded shadow"
												/>
												<div className="flex flex-col justify-between">
													<p>
														<strong>Card Name:</strong> {name}
													</p>
													<p>
														<strong>From:</strong> {details.from}
													</p>
													<p>
														<strong>To:</strong> {details.to}
													</p>
													<p>
														<strong>Count:</strong> {details.count}
													</p>
													<button
														onClick={() => {
															setModalData({ name, ids: details.ids })
															setShowModal(true)
														}}
														className="px-4 py-2 mt-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
													>
														View NFT IDs
													</button>
												</div>
											</div>
										))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p className="text-gray-400 text-center">No transactions found.</p>
				)}
			</div>

			{/* Modal for NFT IDs */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowModal(false)}>
					<div className="bg-gray-900 p-6 rounded-lg max-w-md w-full text-white shadow-lg relative">
						<h2 className="text-xl font-bold mb-4">Card: {modalData.name}</h2>
						<p className="mb-2">Unique NFT IDs:</p>
						<div className="max-h-64 overflow-y-auto border border-gray-700 rounded p-2 bg-gray-800 text-sm">
							<ul className="list-disc list-inside space-y-1">
								{modalData.ids.map((id, index) => (
									<li key={index}>{id}</li>
								))}
							</ul>
						</div>
						<button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-400">
							✕
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
