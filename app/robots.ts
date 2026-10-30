import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      // ── Wildcard: all crawlers including Bingbot, DuckDuckBot, etc. ──
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/shop',
          '/blog',
          '/contact',
          '/policy/',
          '/product/',
          '/product-category/',
          '/images/',
          '/decorations/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/account',
          '/setup',
          '/login',
          '/register',
        ],
      },
      // ── Googlebot override: full access minus auth/admin ──
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account',
          '/setup',
          '/login',
          '/register',
        ],
      },
      // ── AI training crawlers: block training, allow search citability ──
      // GPTBot = OpenAI model training only (not ChatGPT Search — see OAI-SearchBot).
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      // OAI-SearchBot governs ChatGPT Search citability — allow for visibility.
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/'],
      },
      // ClaudeBot = Anthropic training only (not Claude search — see Claude-SearchBot).
      {
        userAgent: 'ClaudeBot',
        disallow: ['/'],
      },
      // Claude-SearchBot governs citability in Claude search results — allow.
      {
        userAgent: 'Claude-SearchBot',
        allow: ['/'],
      },
      // PerplexityBot = Perplexity search index (not model training) — allow.
      {
        userAgent: 'PerplexityBot',
        allow: ['/'],
      },
      // Google-Extended = Gemini training/grounding opt-out (no effect on Search ranking).
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      // Bytespider = ByteDance model training — block.
      {
        userAgent: 'Bytespider',
        disallow: ['/'],
      },
      // CCBot = Common Crawl open dataset — block.
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // 'host' field removed — non-standard directive not recognised by Google or Bing.
  };
}

