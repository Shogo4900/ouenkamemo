import { NextResponse } from 'next/server'
import { getEntries } from '@/lib/notion'

export async function POST(req: Request) {
  try {
    const { 選手名, 歌詞 } = await req.json()
    const entries = await getEntries()

    const duplicates = entries.filter(e =>
      e.選手名.trim() === 選手名.trim() &&
      e.歌詞.trim() === 歌詞.trim()
    )

    return NextResponse.json({ duplicates })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 })
  }
}
