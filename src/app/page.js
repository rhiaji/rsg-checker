'use client'
import { useState, useEffect } from 'react'
import SSC from 'sscjs'
import style from '../../public/styles/home.module.css'

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

        try {
            const url = `https://history.hive-engine.com/accountHistory?account=${username}&limit=1000&offset=0&symbol=STAR`
            const response = await fetch(url)
            const data = await response.json()

            for (const element of data) {
                if (element.operation === 'nft_transfer') {
                    try {
                        const result = await ssc.find('nft', 'STARinstances', { _id: Number(element.nft) }, 1, 0)
                        if (result.length > 0) {
                            const card = {
                                nftId: element.nft,
                                name: result[0].properties.type,
                                from: element.from,
                                to: element.to,
                                timestamp: element.timestamp,
                                tx: element.transactionId,
                            }
                            if (!allHistory[card.tx]) {
                                allHistory[card.tx] = {
                                    timestamp: card.timestamp,
                                    items: [],
                                }
                            }
                            allHistory[card.tx].items.push(card)
                        }
                    } catch (error) {
                        console.error('Error fetching NFT details:', error)
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
        fetchCards(user)
    }, [])

    const handleSearch = () => {
        if (inputUser.trim()) {
            setUser(inputUser.trim())
            fetchCards(inputUser.trim())
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
        <div className={style.container}>
            <h1 className={style.header}>Rising Star NFT Transfer Checker</h1>
            <p className={style.infoText}>This filter applies only to the latest 1000 transactions related to Rising Star in the Hive-Engine API.</p>
            <div className={style.searchContainer}>
                <input type="text" placeholder="Enter username..." value={inputUser} onChange={(e) => setInputUser(e.target.value)} />
                <button onClick={handleSearch}>Search</button>
            </div>
            <div className={style.filterContainer}>
                <button onClick={() => filterHistory('all')} className={filter === 'all' ? style.active : ''}>
                    All
                </button>
                <button onClick={() => filterHistory('sent')} className={filter === 'sent' ? style.active : ''}>
                    Sent
                </button>
                <button onClick={() => filterHistory('received')} className={filter === 'received' ? style.active : ''}>
                    Received
                </button>
            </div>
            <div className={style.history}>
                {loading ? (
                    <p>Loading...</p>
                ) : filteredHistory.length > 0 ? (
                    <table className={style.table}>
                        <thead>
                            <tr>
                                <th>Transaction</th>
                                <th>Time</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <a href={`https://hivehub.dev/tx/${item.tx}`} target="_blank" rel="noopener noreferrer">
                                            {item.tx}
                                        </a>
                                    </td>
                                    <td>{new Date(item.timestamp * 1000).toLocaleString()}</td>
                                    <td>
                                        {item.items.map((card, idx) => (
                                            <p key={idx}>
                                                <strong>ID:</strong> {card.nftId} | <strong>Card:</strong> {card.name} | <strong>From:</strong>{' '}
                                                {card.from} | <strong>To:</strong> {card.to}
                                            </p>
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
