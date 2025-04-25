'use client'
import { useState, useEffect } from 'react'
import SSC from 'sscjs'

const ssc = new SSC('https://api.hive-engine.com/rpc')

export default function Home() {
	const [history, setHistory] = useState([])
	const [filteredHistory, setFilteredHistory] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [user, setUser] = useState('')
	const [inputUser, setInputUser] = useState('')
	const [filter, setFilter] = useState('all')

	const fetchCards = async (username) => {
		setLoading(true)
		setError(null)
		let allHistory = {}
		let allIds = []

		try {
			const url = `https://accounts.hive-engine.com/accountHistory?account=${username}&symbol=STAR&ops=nft_transfer`
			const response = await fetch(url)
			const data = await response.json()

			for (const element of data) {
				if (element.operation === 'nft_transfer') {
					allIds.push(Number(element.nft))
				}
			}

			if (allIds.length > 0) {
				const result = await ssc.find('nft', 'STARinstances', { _id: { $in: allIds } }, 1000, 0)
				const nftMap = Object.fromEntries(result.map((nft) => [nft._id, nft]))

				for (const element of data) {
					if (element.operation === 'nft_transfer') {
						const nft = nftMap[Number(element.nft)]
						if (nft) {
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
				}
			}
		} catch (error) {
			setError(error.message)
		}

		const formattedHistory = Object.entries(allHistory).map(([tx, { timestamp, items }]) => ({ tx, timestamp, items }))
		setHistory(formattedHistory)
		setFilteredHistory(formattedHistory)
		setLoading(false)
	}

	useEffect(() => {
		if (user) fetchCards(user)
	}, [user])

	const handleSearch = () => {
		if (inputUser.trim()) {
			setUser(inputUser.trim())
		}
	}

	const filterHistory = (type) => {
		setFilter(type)
		if (type === 'sent') {
			setFilteredHistory(history.filter((item) => item.items.some((card) => card.from === user)))
		} else if (type === 'received') {
			setFilteredHistory(history.filter((item) => item.items.some((card) => card.to === user)))
		} else {
			setFilteredHistory(history)
		}
	}

	return (
		<div className="p-6 max-w-7xl mx-auto text-white">
			<h1 className="text-3xl font-bold mb-2">Rising Star NFT Transfer Checker</h1>
			<p className="text-sm text-gray-400 mb-6">
				This filter applies only to the latest 1000 transactions related to Rising Star in the Hive-Engine API.
			</p>

			<div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
				<input
					type="text"
					placeholder="Enter username..."
					value={inputUser}
					onChange={(e) => setInputUser(e.target.value)}
					className="px-4 py-2 border border-gray-600 rounded bg-gray-900 text-white w-full sm:w-64"
				/>
				<button onClick={handleSearch} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
					Search
				</button>
			</div>

			<div className="flex gap-2 mb-6">
				{['all', 'sent', 'received'].map((type) => (
					<button
						key={type}
						onClick={() => filterHistory(type)}
						className={`px-4 py-2 rounded ${filter === type ? 'bg-blue-700' : 'bg-gray-700'} hover:bg-blue-800`}
					>
						{type.charAt(0).toUpperCase() + type.slice(1)}
					</button>
				))}
			</div>

			<div className="overflow-x-auto">
				{loading ? (
					<p>Loading...</p>
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
											className="text-blue-400 hover:text-red-400"
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
											<div key={idx} className="flex gap-4 p-4 rounded-lg">
												{/* Card Image */}
												<img
													src={`https://www.risingstargame.com/images/cards/${name.replace(/\s+/g, '%20')}.png`}
													alt={name}
													className="w-48 h-64 rounded shadow"
												/>
												{/* Card Details */}
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
													{/* Show IDs Button */}
													<button
														onClick={() => alert(`Unique IDs for ${name}: ${details.ids.join(', ')}`)}
														className="px-4 py-2 mt-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
													>
														Show IDs
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
					<p>No transactions found.</p>
				)}
			</div>
		</div>
	)
}
