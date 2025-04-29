'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
	const pathname = usePathname()

	const navItems = [
		{ name: 'NFT Transfers', path: '/' },
		{ name: 'Pawnshop Transfers', path: '/pawnshop' },
	]

	return (
		<nav className="bg-gray-900 text-white px-6 py-4 shadow-md">
			<div className="max-w-7xl mx-auto flex justify-between items-center">
				<Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition">
					Risingstar NFT Tracker
				</Link>

				{/* 🔗 Navigation Links */}
				<div className="flex gap-4">
					{navItems.map((item) => (
						<Link
							key={item.path}
							href={item.path}
							className={`px-3 py-2 rounded ${
								pathname === item.path ? 'bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							{item.name}
						</Link>
					))}
				</div>
			</div>
		</nav>
	)
}
