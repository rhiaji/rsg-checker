'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
	const pathname = usePathname()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	const navItems = [
		{ name: 'NFT Transfers', path: '/' },
		{ name: 'Pawnshop Transfers', path: '/pawnshop' },
	]

	return (
		<nav className="sticky top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-md text-white shadow-md">
			<div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
				<Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition" onClick={() => setMobileMenuOpen(false)}>
					Risingstar NFT Tracker
				</Link>

				{/* Desktop Menu */}
				<div className="hidden md:flex gap-6">
					{navItems.map((item) => (
						<Link
							key={item.path}
							href={item.path}
							className={`px-3 py-2 rounded-md font-medium transition ${
								pathname === item.path ? 'bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							{item.name}
						</Link>
					))}
				</div>

				{/* Mobile Hamburger */}
				<button
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
				>
					<svg
						className="h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						{mobileMenuOpen ? (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						) : (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						)}
					</svg>
				</button>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden bg-gray-800 bg-opacity-95 backdrop-blur-md shadow-inner">
					<div className="flex flex-col px-4 py-3 space-y-1">
						{navItems.map((item) => (
							<Link
								key={item.path}
								href={item.path}
								className={`block px-3 py-2 rounded-md font-medium transition ${
									pathname === item.path ? 'bg-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
								}`}
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			)}
		</nav>
	)
}
