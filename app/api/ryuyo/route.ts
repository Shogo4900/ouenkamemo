import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

/**
 * POST /api/ryuyo
 * body: { pageIds: string[] }
 * 
 * 指定した全ページの「流用」リレーションを互いに繋ぎ合わせる（グループ化）。
 * 既存の流用リレーションも保持しつつ、グループ内の全ページURLを全員に設定。
 */
export async function POST(req: Request) {
  try {
    const { pageIds }: { pageIds: string[] } = await req.json()

    if (!pageIds || pageIds.length < 2) {
      return NextResponse.json({ error: '2件以上選択してください' }, { status: 400 })
    }

    // 各ページの現在の流用リレーションを取得し、既存グループも含める
    const existingRelated = new Set<string>(pageIds)

    for (const id of pageIds) {
      const page = await notion.pages.retrieve({ page_id: id }) as any
      const current = page.properties['流用']?.relation ?? []
      current.forEach((r: any) => existingRelated.add(r.id))
    }

    const allIds = Array.from(existingRelated)

    // グループ内の全ページに対して「自分以外の全員」を流用リレーションとして設定
    await Promise.all(
      allIds.map(id => {
        const others = allIds.filter(x => x !== id).map(x => ({ id: x }))
        return notion.pages.update({
          page_id: id,
          properties: {
            '流用': { relation: others },
          },
        })
      })
    )

    return NextResponse.json({ success: true, groupSize: allIds.length })
  } catch (e: any) {
    console.error('POST /api/ryuyo error:', e)
    return NextResponse.json({ error: e.message ?? 'Failed to set ryuyo' }, { status: 500 })
  }
}

/**
 * DELETE /api/ryuyo
 * body: { pageId: string }
 * 
 * 指定したページをグループから外す（流用リレーションを空にし、他のメンバーからも削除）
 */
export async function DELETE(req: Request) {
  try {
    const { pageId }: { pageId: string } = await req.json()

    const page = await notion.pages.retrieve({ page_id: pageId }) as any
    const currentGroup: string[] = (page.properties['流用']?.relation ?? []).map((r: any) => r.id)

    // 自分の流用を空にする
    await notion.pages.update({
      page_id: pageId,
      properties: { '流用': { relation: [] } },
    })

    // 残りのメンバーから自分を取り除く
    await Promise.all(
      currentGroup.map(async memberId => {
        const memberPage = await notion.pages.retrieve({ page_id: memberId }) as any
        const memberRelations = (memberPage.properties['流用']?.relation ?? [])
          .map((r: any) => r.id)
          .filter((id: string) => id !== pageId)
          .map((id: string) => ({ id }))

        return notion.pages.update({
          page_id: memberId,
          properties: { '流用': { relation: memberRelations } },
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/ryuyo error:', e)
    return NextResponse.json({ error: e.message ?? 'Failed to remove ryuyo' }, { status: 500 })
  }
}
