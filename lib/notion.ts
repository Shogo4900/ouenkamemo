import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '1ab8b9006adc825891ad81d43963eab0'

export type OuenkaEntry = {
  id: string
  url: string
  選手名: string
  チーム名: string
  歌詞: string
  汎用: boolean
  汎用の対象: string[]
  流用: string[] // related page IDs
}

export const TEAMS = [
  '東北楽天ゴールデンイーグルス',
  '福岡ソフトバンクホークス',
  '千葉ロッテマリーンズ',
  '埼玉西武ライオンズ',
  '北海道日本ハムファイターズ',
  'オリックスバファローズ',
  '読売ジャイアンツ',
  '阪神タイガース',
  '横浜DeNAベイスターズ',
  '中日ドラゴンズ',
  '東京ヤクルトスワローズ',
  '広島東洋カープ',
]

export const TARGETS = [
  '捕手', '日本人野手', '外国人野手', '投手', '若手', '左打者', '右打者', '外国人投手'
]

export async function getEntries(): Promise<OuenkaEntry[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    page_size: 100,
  })

  return response.results.map((page: any) => {
    const props = page.properties
    return {
      id: page.id,
      url: page.url,
      選手名: props['選手名']?.title?.[0]?.plain_text ?? '',
      チーム名: props['チーム名']?.select?.name ?? '',
      歌詞: props['歌詞']?.rich_text?.[0]?.plain_text ?? '',
      汎用: props['汎用(選手名→「名前」)']?.checkbox ?? false,
      汎用の対象: props['汎用の対象']?.multi_select?.map((o: any) => o.name) ?? [],
      流用: props['流用']?.relation?.map((r: any) => r.id) ?? [],
    }
  })
}

export async function createEntry(data: {
  選手名: string
  チーム名: string
  歌詞: string
  汎用: boolean
  汎用の対象: string[]
}) {
  return notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      '選手名': { title: [{ text: { content: data.選手名 } }] },
      'チーム名': { select: { name: data.チーム名 } },
      '歌詞': { rich_text: [{ text: { content: data.歌詞 } }] },
      '汎用(選手名→「名前」)': { checkbox: data.汎用 },
      '汎用の対象': { multi_select: data.汎用の対象.map(name => ({ name })) },
    },
  })
}
