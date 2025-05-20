'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SSC from 'sscjs'

const ssc = new SSC('https://api.hive-engine.com/rpc')

const BATCH_SIZE = 1000
const LIMIT = 500
const MAX_RECORDS = 5000

export default function Home() {
	// States
	const [history, setHistory] = useState([])
	const [filteredHistory, setFilteredHistory] = useState([])
	const [loading, setLoading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [error, setError] = useState(null)

	const [inputUser, setInputUser] = useState('')
	const [user, setUser] = useState('')
	const [filter, setFilter] = useState('all')

	const [showModal, setShowModal] = useState(false)
	const [modalData, setModalData] = useState({ name: '', ids: [] })

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	const fetchCards = useCallback(async (username) => {
		setLoading(true)
		setError(null)

		const allHistory = {}
		const allIds = new Set()
		const allData = []

		let offset = 0
		let reachedEnd = false

		try {
			while (!reachedEnd && offset < MAX_RECORDS) {
				const url = `https://accounts.hive-engine.com/accountHistory?account=${username}&symbol=STAR&ops=nft_transfer&limit=${LIMIT}&offset=${offset}`
				const res = await fetch(url)
				if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`)
				const data = await res.json()

				if (!data?.length) {
					reachedEnd = true
					break
				}

				for (const element of data) {
					if (element.operation === 'nft_transfer' && !element.to.toLowerCase().startsWith('rspawnshop')) {
						allIds.add(Number(element.nft))
						allData.push(element)
					}
				}

				offset += LIMIT
				setProgress(offset)
				if (data.length < LIMIT) reachedEnd = true

				await delay(1000)
			}

			if (allIds.size > 0) {
				const allIdsArray = Array.from(allIds)
				const numBatches = Math.ceil(allIdsArray.length / BATCH_SIZE)
				const nftMap = {}

				for (let i = 0; i < numBatches; i++) {
					const batch = allIdsArray.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
					const result = await ssc.find('nft', 'STARinstances', { _id: { $in: batch } }, BATCH_SIZE, 0)
					result.forEach((nft) => {
						nftMap[nft._id] = nft
					})
				}

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

			const formattedHistory = Object.entries(allHistory)
				.map(([tx, { timestamp, items }]) => ({ tx, timestamp, items }))
				.sort((a, b) => b.timestamp - a.timestamp)

			setHistory(formattedHistory)
			setFilteredHistory(formattedHistory)
		} catch (err) {
			setError(`Error fetching data: ${err.message}`)
			console.error(err)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		if (user) fetchCards(user)
	}, [user, fetchCards])

	const handleSearch = useCallback(() => {
		const trimmed = inputUser.trim()
		if (trimmed) setUser(trimmed)
	}, [inputUser])

	const filterHistory = useCallback(
		(type) => {
			setFilter(type)
			if (type === 'sent') {
				setFilteredHistory(history.filter((item) => item.items.some((card) => card.from === user)))
			} else if (type === 'received') {
				setFilteredHistory(history.filter((item) => item.items.some((card) => card.to === user)))
			} else {
				setFilteredHistory(history)
			}
		},
		[history, user]
	)

	const renderedHistory = useMemo(() => filteredHistory, [filteredHistory])

	// Skeleton Loader component for cards
	const SkeletonCard = () => (
		<div className="bg-gray-800 rounded-lg shadow-md p-5 animate-pulse flex flex-col">
			<div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
			<div className="flex flex-col gap-4">
				{[...Array(2)].map((_, i) => (
					<div key={i} className="flex gap-4">
						<div className="w-28 h-40 bg-gray-700 rounded-md" />
						<div className="flex-1 space-y-2 py-1">
							<div className="h-4 bg-gray-700 rounded w-1/2" />
							<div className="h-4 bg-gray-700 rounded w-1/3" />
							<div className="h-4 bg-gray-700 rounded w-1/4" />
							<div className="h-6 bg-gray-700 rounded w-20 mt-2" />
						</div>
					</div>
				))}
			</div>
		</div>
	)

	return (
		<div className="min-h-screen bg-gray-900 text-white flex flex-col">
			{/* Header */}
			<header className="p-8 bg-gradient-to-r from-blue-700 to-purple-700 shadow-lg rounded-b-lg">
				<h1 className="text-4xl font-extrabold text-center max-w-5xl mx-auto leading-tight">Player NFT Transfer Checker</h1>
				<p className="text-center text-sm text-gray-300 mt-2 max-w-4xl mx-auto tracking-wide">
					Analyze the latest {MAX_RECORDS} Rising Star NFT transactions.
				</p>
			</header>

			{/* Main Content */}
			<main className="flex flex-1 max-w-7xl mx-auto w-full p-6 gap-10">
				{/* Sidebar */}
				<aside className="w-64 bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700 sticky top-6 self-start h-[calc(100vh-120px)] flex flex-col justify-start">
					<div className="mb-8">
						<label htmlFor="username" className="block mb-3 font-semibold text-gray-200 tracking-wide">
							Enter Username
						</label>
						<input
							id="username"
							type="text"
							placeholder="Username..."
							value={inputUser}
							onChange={(e) => setInputUser(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
							className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500 transition"
							autoComplete="off"
							spellCheck={false}
						/>
						<button
							onClick={handleSearch}
							disabled={loading}
							className="mt-5 w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-semibold tracking-wide text-white shadow-lg transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
						>
							Search
						</button>
					</div>

					{/* Progress Bar */}
					{loading && (
						<div className="mt-4">
							<p className="text-sm text-gray-300 mb-2 tracking-wide font-medium">
								Fetching transactions... {Math.min(progress, MAX_RECORDS)} / {MAX_RECORDS}
							</p>
							<div className="w-full bg-gray-700 rounded-full h-5 overflow-hidden shadow-inner">
								<div
									className="bg-blue-600 h-full transition-all duration-500"
									style={{ width: `${Math.min((progress / MAX_RECORDS) * 100, 100)}%` }}
								/>
							</div>
						</div>
					)}

					{/* Filters */}
					<div className="mt-10">
						<h3 className="mb-4 font-semibold text-lg text-gray-200 tracking-wide">Filter Transactions</h3>
						<div className="flex flex-col gap-4">
							{['all', 'sent', 'received'].map((type) => (
								<button
									key={type}
									onClick={() => filterHistory(type)}
									className={`w-full text-left px-5 py-3 rounded-lg font-medium tracking-wide transition-shadow ${
										filter === type
											? 'bg-blue-600 text-white shadow-lg shadow-blue-700/60'
											: 'bg-gray-700 text-gray-300 hover:bg-blue-700 hover:text-white shadow-sm cursor-pointer'
									}`}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>
					</div>
				</aside>

				{/* Content Area */}
				<section className="flex-grow overflow-y-auto max-h-[calc(100vh-160px)]">
					{loading ? (
						<div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
							{[...Array(6)].map((_, i) => (
								<SkeletonCard key={i} />
							))}
						</div>
					) : error ? (
						<p className="text-red-500 text-center text-lg mt-10">{error}</p>
					) : renderedHistory.length === 0 ? (
						<p className="text-center text-gray-400 mt-10 text-lg">No transactions found.</p>
					) : (
						<div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
							{renderedHistory.map((txData, idx) => {
								const grouped = txData.items.reduce((acc, card) => {
									if (!acc[card.name]) {
										acc[card.name] = { count: 0, ids: [], from: card.from, to: card.to }
									}
									acc[card.name].count += 1
									acc[card.name].ids.push(card.nftId)
									return acc
								}, {})

								return (
									<article
										key={idx}
										className="bg-gray-800 rounded-lg shadow-md p-5 flex flex-col"
										tabIndex={0}
										aria-label={`Transaction ${txData.tx} on ${new Date(txData.timestamp * 1000).toLocaleString()}`}
									>
										<header className="mb-4">
											<a
												href={`https://hivehub.dev/tx/${txData.tx}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-400 font-semibold break-all hover:text-blue-600"
											>
												Tx: {txData.tx}
											</a>
											<p className="text-gray-400 text-sm mt-1">{new Date(txData.timestamp * 1000).toLocaleString()}</p>
										</header>

										<div className="flex flex-col gap-6">
											{Object.entries(grouped).map(([name, details], i) => (
												<div key={i} className="flex flex-col sm:flex-row gap-4 bg-gray-700 rounded-md p-4 shadow-inner">
													<img
														src={`https://www.risingstargame.com/images/cards/${name}.png`}
														alt={name}
														loading="lazy"
														decoding="async"
														className="w-28 h-40 rounded-md shadow-md flex-shrink-0"
													/>
													<div className="flex flex-col justify-between text-sm flex-grow">
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
														<motion.button
															onClick={() => {
																setModalData({ name, ids: details.ids })
																setShowModal(true)
															}}
															whileTap={{ scale: 0.95 }}
															className="mt-3 self-start px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 transition text-white font-medium"
														>
															View NFT IDs
														</motion.button>
													</div>
												</div>
											))}
										</div>
									</article>
								)
							})}
						</div>
					)}
				</section>
			</main>

			<AnimatePresence>
				{showModal && (
					<motion.div
						key="modal-backdrop"
						className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-6"
						onClick={() => setShowModal(false)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
					>
						<motion.div
							key="modal-content"
							className="bg-gray-900 rounded-xl max-w-lg w-full p-8 relative shadow-2xl overflow-auto max-h-[80vh] focus:outline-none focus:ring-4 focus:ring-blue-600"
							onClick={(e) => e.stopPropagation()}
							initial={{ scale: 0.85, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.85, opacity: 0 }}
							transition={{ type: 'spring', stiffness: 300, damping: 25 }}
							tabIndex={-1}
						>
							<h2 id="modal-title" className="text-3xl font-extrabold mb-6 tracking-wide text-white">
								Card: {modalData.name}
							</h2>
							<p className="mb-4 font-semibold text-gray-300 tracking-wide">Unique NFT IDs:</p>
							<div className="max-h-64 overflow-y-auto border border-gray-700 rounded-lg p-5 bg-gray-800 text-base text-gray-200 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-700">
								<ul className="list-disc list-inside space-y-2">
									{modalData.ids.map((id, index) => (
										<li key={index} className="hover:text-blue-400 transition-colors cursor-default">
											{id}
										</li>
									))}
								</ul>
							</div>
							<button
								onClick={() => setShowModal(false)}
								className="absolute top-5 right-5 text-gray-400 hover:text-red-500 text-4xl font-extrabold leading-none cursor-pointer"
								aria-label="Close modal"
								type="button"
							>
								&times;
							</button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
