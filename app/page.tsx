'use client'

import { FormEvent, useState } from 'react'
import { Check, Clipboard, Loader2, MessageCircle, Repeat2, Send, Sparkles, Heart, Quote as QuoteIcon } from 'lucide-react'

type Mode = 'reply' | 'quote'
type Post = { text: string; author: string; handle: string; avatar: string; likes: number; replies: number }
type Result = { post: Post; reply: string; mode: Mode }

const demoPost: Post = {
  text: 'The future of transportation is electric, autonomous, and increasingly powered by intelligence.',
  author: 'Elon Musk', handle: 'elonmusk', avatar: 'https://unavatar.io/x/elonmusk', likes: 12800, replies: 1420,
}

function formatCount(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : value.toString() }

export default function Page() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<Mode>('reply')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate(event?: FormEvent) {
    event?.preventDefault()
    setError('')
    setCopied(false)
    setLoading(true)
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, mode }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate a reply.')
      setResult(data)
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setLoading(false) }
  }

  function copyReply() {
    if (!result) return
    navigator.clipboard.writeText(result.reply)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-black text-[#e7e9ea] selection:bg-white selection:text-black">
      <header className="sticky top-0 z-20 border-b border-[#2f3336] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[680px] items-center justify-between px-5">
          <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"><span className="text-lg font-black tracking-[-0.18em]">X</span></div><span className="text-[15px] font-bold tracking-tight">Elon Reply Agent</span></div>
          <div className="flex items-center gap-1.5 text-[#71767b]"><Sparkles size={14}/><span className="text-xs font-medium">AI powered</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-[680px] px-5 pb-36 pt-10 sm:pt-14">
        <section className="mb-10 text-center"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#71767b]">The shortest distance to a great reply</p><h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">What would Elon say?</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#71767b]">Drop in any post. Get a concise, on-brand response in seconds.</p></section>

        {!result && !loading && <div className="mb-8 rounded-2xl border border-[#2f3336] bg-[#16181c] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm font-semibold">Choose a mode</span><div className="flex rounded-full bg-[#2f3336] p-1" role="group" aria-label="Generation mode">{(['reply', 'quote'] as Mode[]).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${mode === item ? 'bg-white text-black' : 'text-[#aab0b5] hover:text-white'}`}>{item}</button>)}</div></div><p className="text-sm text-[#71767b]">Paste an X post link below to get started.</p></div>}

        {loading && <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl border border-[#2f3336] bg-[#16181c]"><Loader2 className="animate-spin text-white" size={24}/><p className="text-sm text-[#71767b]">Thinking in 280 characters or less...</p></div>}
        {error && <div role="alert" className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>}

        {result && !loading && <div className="space-y-4"><article className="rounded-2xl border border-[#2f3336] bg-[#16181c] p-5"><div className="flex gap-3"><img src={result.post.avatar || demoPost.avatar} alt="" className="h-11 w-11 rounded-full bg-[#2f3336] object-cover"/><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="font-bold">{result.post.author}</span><span className="text-sm text-[#71767b]">@{result.post.handle}</span><span className="text-[#71767b]">·</span><span className="text-sm text-[#71767b]">now</span></div><p className="mt-2 text-[15px] leading-6">{result.post.text}</p><div className="mt-4 flex gap-8 text-[#71767b]"><span className="flex items-center gap-2 text-xs"><MessageCircle size={15}/>{formatCount(result.post.replies)}</span><span className="flex items-center gap-2 text-xs"><Repeat2 size={15}/>{formatCount(Math.round(result.post.likes * .18))}</span><span className="flex items-center gap-2 text-xs"><Heart size={15}/>{formatCount(result.post.likes)}</span></div></div></div></article><div className="flex justify-end"><div className="max-w-[88%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-[15px] font-medium leading-6 text-black"><div className="mb-2 flex items-center justify-between gap-8 text-[10px] font-bold uppercase tracking-widest text-[#53606b]"><span>{result.mode === 'quote' ? 'Quote' : 'Reply'}</span><button onClick={copyReply} className="flex items-center gap-1.5 text-[#53606b] transition hover:text-black" aria-label="Copy generated reply">{copied ? <Check size={14}/> : <Clipboard size={14}/>} {copied ? 'Copied' : 'Copy'}</button></div>{result.reply}</div></div><button onClick={() => { setResult(null); setUrl('') }} className="mx-auto mt-5 block text-xs font-semibold text-[#71767b] hover:text-white">Generate another</button></div>}
      </div>

      {!result && !loading && <form onSubmit={generate} className="fixed inset-x-0 bottom-0 z-20 border-t border-[#2f3336] bg-black/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl"><div className="mx-auto flex max-w-[680px] items-center gap-3"><div className="flex h-12 flex-1 items-center rounded-2xl border border-[#2f3336] bg-[#16181c] px-4 focus-within:border-[#71767b]"><input aria-label="X post URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an X post URL..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#71767b]"/><span className="hidden text-xs text-[#71767b] sm:block">{mode === 'reply' ? 'Reply' : 'Quote'}</span></div><button disabled={!url.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black transition hover:bg-[#d7d9db] disabled:cursor-not-allowed disabled:bg-[#2f3336] disabled:text-[#71767b]" aria-label="Generate reply"><Send size={18}/></button></div></form>}
    </main>
  )
}
