import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Signalpost Intelligence | Analyst Workspace",
  description: "Explore company intelligence, inspect original JSON sources, and compare company records side by side.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
