// IndexNow API Route — submits URLs to Bing/Yandex/Naver for fast indexing.
// Call this server-side after creating or updating products, categories, or policies.
//
// Usage (internal):
//   POST /api/indexnow
//   Body: { urls: ['https://indian-flowers.com/product/rose-garland', ...] }
//
// The IndexNow key file is at /public/f30c00d778fe40aa9da89d2394597a15.txt
// Register at https://www.bing.com/indexnow once the site is live.

import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

const INDEXNOW_KEY = 'f30c00d778fe40aa9da89d2394597a15';
// Bing is the primary IndexNow endpoint; it propagates to Yandex and Naver.
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 });
    }

    if (urls.length > 10000) {
      return NextResponse.json({ error: 'Max 10,000 URLs per submission' }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    const host = new URL(siteUrl).host;

    const body = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });

    if (response.ok || response.status === 202) {
      return NextResponse.json({
        success: true,
        submitted: urls.length,
        status: response.status,
      });
    }

    return NextResponse.json(
      { success: false, status: response.status, message: await response.text() },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
