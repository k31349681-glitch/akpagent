import { NextResponse } from 'next/server'

type Mode = 'reply' | 'quote'

function getStatus(url: string) {
  try {
    const parsed = new URL(url)
    if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(parsed.hostname)) return null
    const match = parsed.pathname.match(/(?:status|statuses)\/(\d+)/)
    if (!match) return null
    const beforeStatus = parsed.pathname.slice(0, parsed.pathname.indexOf('/status')).split('/').filter(Boolean)
    return { id: match[1], username: beforeStatus[0] }
  } catch { return null }
}

function normalize(raw: any) {
  const tweet = raw?.tweet ?? raw?.post ?? raw
  const author = tweet?.author ?? tweet?.user ?? {}
  return {
    text: tweet?.text ?? tweet?.rawText ?? '',
    author: author?.name ?? author?.displayName ?? 'Unknown',
    handle: author?.screen_name ?? author?.username ?? 'unknown',
    avatar: author?.avatar_url ?? author?.profile_image_url ?? '',
    likes: Number(tweet?.likes ?? tweet?.likeCount ?? 0),
    replies: Number(tweet?.replies ?? tweet?.replyCount ?? 0),
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const mode: Mode = body.mode === 'quote' ? 'quote' : 'reply'
    const status = getStatus(url)
    if (!status) return NextResponse.json({ error: 'Enter a valid x.com or twitter.com post URL.' }, { status: 400 })
    const endpoints = [`https://api.fxtwitter.com/2/status/${status.id}`, ...(status.username ? [`https://api.fxtwitter.com/${status.username}/status/${status.id}`] : [])]
    let post: ReturnType<typeof normalize> | null = null
    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, next: { revalidate: 0 } })
      if (response.ok) { const data = await response.json(); const candidate = normalize(data); if (candidate.text) { post = candidate; break } }
    }
    if (!post) return NextResponse.json({ error: 'Could not fetch that post. Check the link and try again.' }, { status: 502 })
    if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: 'OpenRouter is not configured yet. Add OPENROUTER_API_KEY to continue.' }, { status: 503 })
    const prompt = mode === 'quote' ? 'Write a quote-post reaction to this X post.' : 'Write a direct reply to this X post.'
    const completion = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', ...(process.env.NEXT_PUBLIC_APP_URL ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL } : {}), 'X-Title': 'Elon Reply Agent' }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openrouter/free', temperature: 0.7, max_tokens: 120, messages: [{ role: 'system', content: 'You write concise social media replies inspired by Elon Musk’s public posting style. Be ultra-brief: one word or an emoji is preferred (examples: “True”, “Interesting”, “Exactly”, “😂”). Keep it low-filter but not hateful, threatening, or abusive. Use no hashtags. Only expand slightly when the topic is Tesla, SpaceX, or AI. Output ONLY the reply text, with no quotes, preamble, or explanation.' }, { role: 'user', content: `${prompt}\n\nAuthor: @${post.handle}\nPost: ${post.text}` }] }) })
    if (!completion.ok) return NextResponse.json({ error: 'The reply model is unavailable right now.' }, { status: 502 })
    const generated = await completion.json()
    const reply = generated?.choices?.[0]?.message?.content?.trim()
    if (!reply) return NextResponse.json({ error: 'No reply was generated. Try again.' }, { status: 502 })
    return NextResponse.json({ post, reply, mode })
  } catch { return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 }) }
}
