import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Elon Reply Agent', description: 'Generate concise, Elon-inspired replies to any X post.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#000000', viewportFit: 'cover' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
