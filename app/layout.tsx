import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '応援歌メモ管理',
  description: '野球応援歌の歌詞・選手情報を管理するツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
