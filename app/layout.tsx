import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './ClientLayout'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'EvalTool — LLM Evaluation Platform',
  description: 'Systematic LLM evaluation, regression testing, and red-teaming platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}