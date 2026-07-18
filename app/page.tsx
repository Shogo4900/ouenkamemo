'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TEAMS, TARGETS, OuenkaEntry } from '@/lib/notion'

const TEAM_LEAGUE: Record<string, 'PL' | 'CL'> = {
  '東北楽天ゴールデンイーグルス': 'PL', '福岡ソフトバンクホークス': 'PL',
  '千葉ロッテマリーンズ': 'PL', '埼玉西武ライオンズ': 'PL',
  '北海道日本ハムファイターズ': 'PL', 'オリックスバファローズ': 'PL',
  '読売ジャイアンツ': 'CL', '阪神タイガース': 'CL',
  '横浜DeNAベイスターズ': 'CL', '中日ドラゴンズ': 'CL',
  '東京ヤクルトスワローズ': 'CL', '広島東洋カープ': 'CL',
}

type FormData = {
  選手名: string; チーム名: string; 歌詞: string; 汎用: boolean; 汎用の対象: string[]
}

const empty: FormData = { 選手名: '', チーム名: '', 歌詞: '', 汎用: false, 汎用の対象: [] }

// ─── colour helpers ───────────────────────────────────────────────────────────
const css = (v: string) => `var(${v})`
const S: React.CSSProperties = {}

// ─── sub-components ──────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: css('--text3'), letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' as const }}>{children}</div>
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width: '100%', background: css('--bg'), border: `1px solid ${focused ? css('--border2') : css('--border')}`, borderRadius: 8, padding: '10px 14px', color: css('--text'), fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
  )
}

// ─── Ryuyo Group Modal ────────────────────────────────────────────────────────
function RyuyoModal({ entries, onClose, onDone }: {
  entries: OuenkaEntry[]
  onClose: () => void
  onDone: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; msg?: string } | null>(null)
  const [mode, setMode] = useState<'add' | 'remove'>('add')

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || e.選手名.includes(q) || e.チーム名.includes(q)
  })

  const toggle = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

const handleSubmit = async () => {
    if(!form.選手名?.trim()){showToast("選手名は必須です",false);return;}
    if(!form.チーム名){showToast("球団名を選択してください",false);return;}
    setLoading(true)
    try {
      if (mode === 'add') {
        const res = await fetch('/api/ryuyo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIds: Array.from(selected) }),
        })
        const data = await res.json()
        if (data.success) setResult({ ok: true, msg: `${data.groupSize}件をグループ化しました` })
        else setResult({ ok: false, msg: data.error })
      } else {
        // Remove each selected from their groups
        for (const id of selected) {
          await fetch('/api/ryuyo', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId: id }),
          })
        }
        setResult({ ok: true, msg: `${selected.size}件をグループから解除しました` })
      }
    } catch (e) {
      setResult({ ok: false, msg: '操作に失敗しました' })
    }
    setLoading(false)
    setTimeout(() => { onDone(); onClose() }, 1500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 14, width: '100%', maxWidth: 560,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }} className="animate-in">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'Noto Serif JP, serif', fontSize: 16, color: 'var(--accent)' }}>🔗 流用グループ管理</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['add', 'remove'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setSelected(new Set()) }} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontFamily: 'inherit', fontWeight: mode === m ? 700 : 400,
                background: mode === m ? (m === 'add' ? 'var(--accent)' : 'var(--accent2)') : 'var(--surface2)',
                color: mode === m ? '#000' : 'var(--text2)',
              }}>
                {m === 'add' ? '➕ グループ化' : '🗑 グループ解除'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            {mode === 'add'
              ? '2件以上選択して「グループ化」すると、流用リレーションで互いに繋がります。'
              : '選択した選手を流用グループから外します。'}
          </p>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 選手名・チームで絞り込み"
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 24px' }}>
          {filtered.map(e => {
            const isSelected = selected.has(e.id)
            const hasGroup = e.流用.length > 0
            return (
              <div key={e.id} onClick={() => toggle(e.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                background: isSelected ? (mode === 'add' ? 'rgba(232,184,75,0.1)' : 'rgba(201,64,64,0.1)') : 'transparent',
                border: `1px solid ${isSelected ? (mode === 'add' ? 'var(--accent)' : 'var(--accent2)') : 'transparent'}`,
                transition: 'all 0.12s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${isSelected ? (mode === 'add' ? 'var(--accent)' : 'var(--accent2)') : 'var(--border2)'}`,
                  background: isSelected ? (mode === 'add' ? 'var(--accent)' : 'var(--accent2)') : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <span style={{ fontSize: 11, color: '#fff' }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{e.選手名}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.チーム名}</div>
                </div>
                {hasGroup && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(75,184,122,0.1)', color: 'var(--success)', border: '1px solid rgba(75,184,122,0.3)' }}>
                    流用 {e.流用.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {result && (
            <div style={{ marginBottom: 10, fontSize: 13, color: result.ok ? 'var(--success)' : 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {result.ok ? '✓' : '✕'} {result.msg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>
              {selected.size > 0 ? `${selected.size}件を選択中` : '選手を選択してください'}
            </span>
            <button
                          onClick={async()=>{
                            const next=!song.良曲;
                            setAllSongs(prev=>prev.map(s=>s.id===song.id?{...s,良曲:next}:s));
                            try{
                              const r=await fetch(`/api/songs/${encodeURIComponent(song.id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({良曲:next})});
                              const d=await r.json();
                              if(d.error){showToast(d.error,false);setAllSongs(prev=>prev.map(s=>s.id===song.id?{...s,良曲:!next}:s));}
                              else showToast(next?"⭐ 良曲に追加":"良曲を解除");
                            }catch{showToast("更新に失敗しました",false);setAllSongs(prev=>prev.map(s=>s.id===song.id?{...s,良曲:!next}:s));}
                          }}
                          title={song.良曲?"良曲を解除":"良曲に追加"}
                          style={{...css.btn(),padding:"3px 9px",fontSize:13,
                            color:song.良曲?"#fbbf24":"var(--text-muted)",
                            borderColor:song.良曲?"#92400e":"var(--border)"}}>
                          ⭐
                        </button>
                        <button onClick={()=>startEdit(song)} style={{...css.btn(),padding:"3px 9px",fontSize:12}}>編集</button>
                        <button onClick={()=>setDeleteConfirm(song.id)} style={{...css.btn(false,true),padding:"3px 9px",fontSize:12}}>削除</button>
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: loading || selected.size < (mode === 'add' ? 2 : 1) ? 'not-allowed' : 'pointer',
              background: selected.size >= (mode === 'add' ? 2 : 1) ? (mode === 'add' ? 'var(--accent)' : 'var(--accent2)') : 'var(--surface2)',
              color: selected.size >= (mode === 'add' ? 2 : 1) ? '#000' : 'var(--text3)',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            }}>
              {loading ? '処理中…' : mode === 'add' ? 'グループ化する' : 'グループ解除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [entries, setEntries] = useState<OuenkaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormData>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [duplicates, setDuplicates] = useState<OuenkaEntry[]>([])
  const [dupChecked, setDupChecked] = useState(false)
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list')
  const [showRyuyo, setShowRyuyo] = useState(false)
  const checkTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/entries')
      const data = await res.json()
      // Guard: ensure we always have an array
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Auto duplicate check
  useEffect(() => {
    setDuplicates([])
    setDupChecked(false)
    if (!form.選手名.trim() || !form.歌詞.trim()) return
    clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 選手名: form.選手名, 歌詞: form.歌詞 }),
        })
        const data = await res.json()
        setDuplicates(data.duplicates ?? [])
        setDupChecked(true)
      } catch {}
    }, 600)
  }, [form.選手名, form.歌詞])

  async function handleSubmit() {
    if (!form.選手名 || !form.チーム名 || !form.歌詞) return
    setSubmitting(true)
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSuccess(true)
      setForm(empty)
      setDuplicates([])
      setDupChecked(false)
      fetchEntries()
      setTimeout(() => setSuccess(false), 3000)
    } catch {}
    setSubmitting(false)
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.選手名.includes(q) || e.歌詞.includes(q) || e.チーム名.includes(q)
    const matchTeam = !filterTeam || e.チーム名 === filterTeam
    return matchSearch && matchTeam
  })

  const toggleTarget = (t: string) => {
    setForm(f => ({
      ...f,
      汎用の対象: f.汎用の対象.includes(t) ? f.汎用の対象.filter(x => x !== t) : [...f.汎用の対象, t],
    }))
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {showRyuyo && (
        <RyuyoModal entries={entries} onClose={() => setShowRyuyo(false)} onDone={fetchEntries} />
      )}

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚾</span>
          <h1 style={{ fontFamily: 'Noto Serif JP, serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em', color: 'var(--accent)' }}>応援歌メモ</h1>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)', letterSpacing: '0.1em' }}>NOTION SYNC</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {activeTab === 'list' && (
            <button onClick={() => setShowRyuyo(true)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
              fontSize: 12, fontFamily: 'inherit',
            }}>🔗 流用グループ</button>
          )}
          {(['list', 'add'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontFamily: 'inherit', fontWeight: activeTab === tab ? 700 : 400,
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--text2)', transition: 'all 0.15s',
            }}>
              {tab === 'list' ? '📋 一覧' : '➕ 追加'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* ── ADD TAB ── */}
        {activeTab === 'add' && (
          <div className="animate-in">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
              <h2 style={{ fontFamily: 'Noto Serif JP, serif', fontSize: 20, marginBottom: 28, color: 'var(--accent)' }}>新しい応援歌を追加</h2>

              {/* Duplicate Warning */}
              {dupChecked && duplicates.length > 0 && (
                <div style={{ background: 'rgba(232,122,42,0.08)', border: '1px solid var(--warning)', borderRadius: 8, padding: '14px 18px', marginBottom: 24, animation: 'pulse-warn 2s infinite' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <strong style={{ color: 'var(--warning)', fontSize: 14 }}>重複が検出されました（{duplicates.length}件）</strong>
                  </div>
                  {duplicates.map(d => (
                    <div key={d.id} style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 0', borderTop: '1px solid rgba(232,122,42,0.2)' }}>
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--warning)', textDecoration: 'none' }}>{d.選手名} — {d.チーム名}</a>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>選手名と歌詞が完全一致するエントリが存在します。続けて登録もできます。</p>
                </div>
              )}

              {success && (
                <div style={{ background: 'rgba(75,184,122,0.08)', border: '1px solid var(--success)', borderRadius: 8, padding: '12px 18px', marginBottom: 24, color: 'var(--success)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✓</span> Notionに登録しました！
                </div>
              )}

              <div style={{ display: 'grid', gap: 20 }}>
                <div><Label>選手名 *</Label><Input value={form.選手名} onChange={v => setForm(f => ({ ...f, 選手名: v }))} placeholder="例：田中将大" /></div>

                <div>
                  <Label>チーム名 *</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['PL', 'CL'] as const).map(league => (
                      <div key={league}>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.1em' }}>{league === 'PL' ? 'パ・リーグ' : 'セ・リーグ'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {TEAMS.filter(t => TEAM_LEAGUE[t] === league).map(team => (
                            <button key={team} onClick={() => setForm(f => ({ ...f, チーム名: team }))} style={{
                              padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${form.チーム名 === team ? 'var(--accent)' : 'var(--border)'}`,
                              background: form.チーム名 === team ? 'rgba(232,184,75,0.12)' : 'var(--bg)',
                              color: form.チーム名 === team ? 'var(--accent)' : 'var(--text2)',
                              cursor: 'pointer', fontSize: 12, textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.12s',
                            }}>{team}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>歌詞 *</Label>
                  <textarea value={form.歌詞} onChange={e => setForm(f => ({ ...f, 歌詞: e.target.value }))}
                    placeholder="応援歌の歌詞を入力..." rows={5}
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.7 }}
                    onFocus={e => e.target.style.borderColor = 'var(--border2)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  {form.選手名 && form.歌詞 && !dupChecked && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>重複チェック中…</p>}
                  {dupChecked && duplicates.length === 0 && <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>✓ 重複なし</p>}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div onClick={() => setForm(f => ({ ...f, 汎用: !f.汎用 }))} style={{
                      width: 20, height: 20, borderRadius: 4,
                      border: `2px solid ${form.汎用 ? 'var(--accent)' : 'var(--border2)'}`,
                      background: form.汎用 ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
                    }}>
                      {form.汎用 && <span style={{ fontSize: 12, color: '#000' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>汎用（選手名→「名前」で使用可能）</span>
                  </label>
                </div>

                <div>
                  <Label>汎用の対象</Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TARGETS.map(t => (
                      <button key={t} onClick={() => toggleTarget(t)} style={{
                        padding: '5px 12px', borderRadius: 20,
                        border: `1px solid ${form.汎用の対象.includes(t) ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.汎用の対象.includes(t) ? 'rgba(232,184,75,0.12)' : 'transparent',
                        color: form.汎用の対象.includes(t) ? 'var(--accent)' : 'var(--text3)',
                        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.12s',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={submitting || !form.選手名 || !form.チーム名 || !form.歌詞} style={{
                  padding: '12px 24px', borderRadius: 8, border: 'none',
                  background: submitting || !form.選手名 || !form.チーム名 || !form.歌詞 ? 'var(--surface2)' : 'var(--accent)',
                  color: submitting || !form.選手名 || !form.チーム名 || !form.歌詞 ? 'var(--text3)' : '#000',
                  cursor: submitting || !form.選手名 || !form.チーム名 || !form.歌詞 ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {submitting ? <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
                    登録中…
                  </> : 'Notionに登録する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LIST TAB ── */}
        {activeTab === 'list' && (
          <div className="animate-in">
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 選手名・歌詞・チームで検索"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '10px 14px', color: filterTeam ? 'var(--text)' : 'var(--text3)',
                fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', minWidth: 180,
              }}>
                <option value="">全チーム</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '12px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
              <span>全 <strong style={{ color: 'var(--accent)' }}>{entries.length}</strong> 件</span>
              {(search || filterTeam) && <span>表示中 <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> 件</span>}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ width: 32, height: 32, margin: '0 auto 12px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="animate-spin" />
                <p style={{ fontSize: 14 }}>Notionから読み込み中…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>⚾</p>
                <p style={{ fontSize: 14 }}>該当する応援歌がありません</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.map((e, i) => (
                  <div key={e.id} className="animate-in" style={{
                    animationDelay: `${i * 0.03}s`,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '16px 20px',
                    display: 'grid', gridTemplateColumns: '140px 1fr auto',
                    gap: 16, alignItems: 'start', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={ev => (ev.currentTarget.style.borderColor = 'var(--border2)')}
                    onMouseLeave={ev => (ev.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{e.選手名}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', display: 'inline-block' }}>
                        {e.チーム名.length > 8 ? e.チーム名.slice(0, 8) + '…' : e.チーム名}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{e.歌詞}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {e.汎用 && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(232,184,75,0.12)', color: 'var(--accent)', border: '1px solid rgba(232,184,75,0.3)', whiteSpace: 'nowrap' }}>汎用</span>
                      )}
                      {e.流用.length > 0 && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(75,184,122,0.1)', color: 'var(--success)', border: '1px solid rgba(75,184,122,0.3)', whiteSpace: 'nowrap' }}>
                          🔗 流用 {e.流用.length}件
                        </span>
                      )}
                      {e.汎用の対象.map(t => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{t}</span>
                      ))}
                      <a href={e.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--text3)', textDecoration: 'none', marginTop: 4 }}>Notion ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
