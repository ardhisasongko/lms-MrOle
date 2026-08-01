const META_PATTERN = /<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMeta({ title, description, url, image, indexable = true }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);

  return `<!-- social-meta:start -->
    <link rel="canonical" href="${safeUrl}" />
    <meta name="robots" content="${indexable ? 'index,follow' : 'noindex,nofollow'}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LMS Mr Ole" />
    <meta property="og:locale" content="id_ID" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:secure_url" content="${safeImage}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="LMS Mr Ole, platform latihan bahasa Inggris dengan sesi 20 soal" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:image:alt" content="LMS Mr Ole, platform latihan bahasa Inggris dengan sesi 20 soal" />
    <!-- social-meta:end -->`;
}

async function getShare(env, token) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !TOKEN_PATTERN.test(token)) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_quiz_share`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_token: token }),
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

export async function onRequestGet({ request, env, params, next }) {
  const assetHeaders = new Headers(request.headers);
  assetHeaders.delete('If-Modified-Since');
  assetHeaders.delete('If-None-Match');
  const assetRequest = new Request(new URL('/', request.url), {
    method: 'GET',
    headers: assetHeaders,
  });
  const assetResponse = await next(assetRequest);
  if (!assetResponse.ok) return assetResponse;

  const requestUrl = new URL(request.url);
  const canonicalUrl = `${requestUrl.origin}/s/${encodeURIComponent(params.token)}`;
  const imageUrl = `${requestUrl.origin}/social-preview.png`;
  let share = null;
  try {
    share = await getShare(env, params.token);
  } catch {
    // Generic metadata still gives revoked or temporarily unavailable links a safe preview.
  }

  const score = Math.round(Number(share?.score) || 0);
  const owner = share?.display_name || 'Seorang siswa';
  const category = share?.category_name || 'Bahasa Inggris';
  const title = share
    ? `${owner} meraih nilai ${score} di ${category} | Mr Ole`
    : 'Challenge Bahasa Inggris | LMS Mr Ole';
  const description = share
    ? `${share.correct_answers}/${share.total_questions} jawaban benar. Berani mencoba sesi yang sama?`
    : 'Buka challenge dan mulai sesi latihan Bahasa Inggris bersama Mr Ole.';

  const html = await assetResponse.text();
  const meta = buildMeta({
    title,
    description,
    url: canonicalUrl,
    image: imageUrl,
    indexable: false,
  });
  const body = META_PATTERN.test(html)
    ? html.replace(META_PATTERN, meta)
    : html.replace('</head>', `${meta}\n</head>`);
  const headers = new Headers(assetResponse.headers);
  headers.delete('ETag');
  headers.delete('Last-Modified');
  headers.set('Content-Type', 'text/html; charset=UTF-8');
  headers.set('Cache-Control', 'public, max-age=300, must-revalidate');
  headers.set('X-Social-Preview', share ? 'share' : 'generic');

  return new Response(body, { status: assetResponse.status, headers });
}
