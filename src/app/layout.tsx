import '@/styles/index.scss'

export const metadata = {
  title: 'Baby Shower Games',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
