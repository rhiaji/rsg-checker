import { Geist, Geist_Mono } from 'next/font/google'
import Navbar from '@/component/navbar'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap',
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap',
})

export const metadata = {
	title: 'Rising Star NFT Tracker',
	description: 'Track Rising Star NFT transfers and Pawnshop transactions',
	// Add openGraph and twitter as above for better SEO/social
}

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<a href="#main-content" className="sr-only focus:not-sr-only p-2">
					Skip to main content
				</a>
				<Navbar />
				<main id="main-content">{children}</main>
			</body>
		</html>
	)
}
