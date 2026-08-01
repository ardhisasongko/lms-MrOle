// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from './[token]';

const baseHtml = `<!doctype html><html><head>
<!-- social-meta:start --><meta property="og:title" content="Static"><!-- social-meta:end -->
</head><body><div id="root"></div></body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

function context(token = 'abcdefghijklmnopqrstuv') {
  return {
    request: new Request(`https://lms-mrole.pages.dev/s/${token}`),
    env: {
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
    },
    params: { token },
    next: vi.fn().mockResolvedValue(new Response(baseHtml, {
      headers: { 'Content-Type': 'text/html' },
    })),
  };
}

describe('public quiz social metadata', () => {
  it('injects escaped share metadata before the SPA loads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      score: 88,
      correct_answers: 18,
      total_questions: 20,
      category_name: 'Grammar & <script>',
      display_name: 'Ole "Student"',
    }]), { status: 200 })));

    const response = await onRequestGet(context());
    const html = await response.text();

    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain('Ole &quot;Student&quot; meraih nilai 88 di Grammar &amp; &lt;script&gt; | Mr Ole');
    expect(html).toContain('18/20 jawaban benar');
    expect(html).toContain('https://lms-mrole.pages.dev/social-preview.png');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image:alt"');
    expect(html).toContain('name="robots" content="noindex,nofollow"');
    expect(response.headers.get('X-Social-Preview')).toBe('share');
    expect(html).not.toContain('content="Static"');
  });

  it('uses generic metadata without querying invalid tokens', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await onRequestGet(context('invalid-token'));
    const html = await response.text();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(html).toContain('Challenge Bahasa Inggris | LMS Mr Ole');
    expect(html).toContain('/social-preview.png');
    expect(response.headers.get('X-Social-Preview')).toBe('generic');
  });

  it('does not reuse the SPA asset validator for personalized metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })));
    const ctx = context();
    ctx.request = new Request(ctx.request, { headers: { 'If-None-Match': '"stale-index"' } });
    ctx.next.mockImplementation(async (assetRequest) => {
      expect(assetRequest.url).toBe('https://lms-mrole.pages.dev/');
      expect(assetRequest.headers.has('If-None-Match')).toBe(false);
      return new Response(baseHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          ETag: '"root-asset"',
          'Last-Modified': 'Sat, 01 Aug 2026 00:00:00 GMT',
        },
      });
    });

    const response = await onRequestGet(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.has('ETag')).toBe(false);
    expect(response.headers.has('Last-Modified')).toBe(false);
  });
});
