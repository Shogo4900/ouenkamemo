import { NextResponse } from 'next/server'
import { getEntries, createEntry } from '@/lib/notion'

export async function GET() {
  try {
    const entries = await getEntries()
    // Always return an array even on partial failure
    return NextResponse.json(Array.isArray(entries) ? entries : [])
  } catch (e) {
    console.error('GET /api/entries error:', e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createEntry(body)
    return NextResponse.json(result)
  } catch (e) {
    console.error('POST /api/entries error:', e)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
