import { NextResponse } from 'next/server'

type Mode = 'reply' | 'quote'
type Tone = 'balanced' | 'sarcastic' | 'serious' | 'one-word' | 'meme'
type AccountFocus = 'personal' | 'founder-tech' | 'news-opinion'

function getStatus(url: string) { try { const parsed = new URL(url); if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(parsed.hostname)) return null; const match = parsed.pathname.match(/(?:status|statuses)\/(\d+)/); if (!match) return null; const beforeStatus = parsed.pathname.slice(0, parsed.pathname.indexOf('/status')).split('/').filter(Boolean); return { id: match[1], username: beforeStatus[0] } } catch { return null } }
function normalize(raw: any) { const tweet = raw?.tweet ?? raw?.post ?? raw; const author = tweet?.author ?? tweet?.user ?? {}; return { text: tweet?.text ?? tweet?.rawText ?? '', author: author?.name ?? author?.displayName ?? 'Unknown', handle: author?.screen_name ?? author?.username ?? 'unknown', avatar: author?.avatar_url ?? author?.profile_image_url ?? '', likes: Number(tweet?.likes ?? tweet?.likeCount ?? 0), replies: Number(tweet?.replies ?? tweet?.replyCount ?? 0) } }

export async function POST(request: Request) {
  try {
    const body = await request.json(); const url = typeof body.url === 'string' ? body.url.trim() : ''; const mode: Mode = body.mode === 'quote' ? 'quote' : 'reply'; const tone: Tone = ['balanced', 'sarcastic', 'serious', 'one-word', 'meme'].includes(body.tone) ? body.tone : 'balanced'; const accountFocus: AccountFocus = ['personal', 'founder-tech', 'news-opinion'].includes(body.accountFocus) ? body.accountFocus : 'founder-tech'; const media = Array.isArray(body.media) ? body.media.filter((item: unknown) => typeof item === 'string' && item.startsWith('data:image/')).slice(0, 4) : []
    const status = url ? getStatus(url) : null
    let post = { text: 'Attached media', author: 'Media drop', handle: 'media', avatar: '', likes: 0, replies: 0 }
    if (url && !status) return NextResponse.json({ error: 'Enter a valid x.com or twitter.com post URL.' }, { status: 400 })
    if (status) { for (const endpoint of [`https://api.fxtwitter.com/2/status/${status.id}`, ...(status.username ? [`https://api.fxtwitter.com/${status.username}/status/${status.id}`] : [])]) { const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, next: { revalidate: 0 } }); if (response.ok) { const candidate = normalize(await response.json()); if (candidate.text) { post = candidate; break } } } }
    if (url && post.text === 'Attached media') return NextResponse.json({ error: 'Could not fetch that post. Check the link and try again.' }, { status: 502 })
    if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: 'OpenRouter is not configured yet. Add OPENROUTER_API_KEY in Project Settings → Vars.' }, { status: 503 })
    const focus = { personal: 'personal thought leadership: sound like a distinct human with a clear point of view', 'founder-tech': 'founder and technology commentary: add sharp product, engineering, or business insight', 'news-opinion': 'news and opinion: identify the key claim, add context, and take a defensible position' }[accountFocus]; const prompt = mode === 'quote' ? 'Write a quote-post reaction' : 'Write a direct reply'; const context = `${prompt} to this X post. Account strategy: ${focus}. Tone: ${tone}.\n\nAuthor: @${post.handle}\nPost: ${post.text}`
    const userContent: any[] = [{ type: 'text', text: context }]; media.forEach((image: string) => userContent.push({ type: 'image_url', image_url: { url: image } }))
    const completion = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', ...(process.env.NEXT_PUBLIC_APP_URL ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL } : {}), 'X-Title': 'Elon Reply Agent' }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openrouter/free', temperature: tone === 'one-word' ? 0.4 : 0.7, max_tokens: 120, messages: [{ role: 'system', content: 'Write concise social media replies inspired by Elon Musk public posting style. Analyze attached image frames carefully; they may be selected frames from a video. Be ultra-brief: one word or emoji is preferred. Keep it low-filter but not hateful, threatening, or abusive. No hashtags. Output ONLY the reply text.' }, { role: 'user', content: userContent }] }) })
    if (!completion.ok) return NextResponse.json({ error: 'The vision reply model is unavailable. Try again or choose another model in Vars.' }, { status: 502 })
    const generated = await completion.json(); const reply = generated?.choices?.[0]?.message?.content?.trim(); if (!reply) return NextResponse.json({ error: 'No reply was generated. Try again.' }, { status: 502 })
    return NextResponse.json({ post, reply, mode, mediaAnalyzed: media.length > 0 })
  } catch { return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 }) }
}
