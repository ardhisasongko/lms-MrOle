import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public', 'social-preview.png');
const fontUrl = pathToFileURL(path.join(root, 'public', 'fonts', 'Inter-Variable.woff2')).href;

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

  await page.setContent(`
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <style>
    @font-face { font-family: Inter; src: url('${fontUrl}') format('woff2'); font-weight: 100 900; }
    * { box-sizing: border-box; }
    body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #1A1D26; background: #F7F8FA; }
    .canvas { position: relative; width: 100%; height: 100%; padding: 64px 72px; display: grid; grid-template-columns: 1.12fr .88fr; align-items: center; gap: 56px; }
    .grid { position: absolute; inset: 0; opacity: .32; background-image: linear-gradient(rgba(26,29,38,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(26,29,38,.035) 1px, transparent 1px); background-size: 32px 32px; }
    .glow { position: absolute; border-radius: 999px; filter: blur(4px); }
    .glow-a { width: 480px; height: 480px; left: -180px; top: -190px; background: radial-gradient(circle, rgba(253,188,180,.72), rgba(253,188,180,0)); }
    .glow-b { width: 430px; height: 430px; right: -120px; bottom: -180px; background: radial-gradient(circle, rgba(173,216,230,.78), rgba(173,216,230,0)); }
    .copy, .visual { position: relative; z-index: 1; }
    .brand { display: inline-flex; align-items: center; gap: 14px; }
    .mark { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 18px; color: #D96B5E; background: rgba(255,255,255,.9); border: 1px solid rgba(0,0,0,.06); box-shadow: 0 12px 36px rgba(0,0,0,.08), inset 0 1px 0 white; }
    .brand-name { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
    .brand-note { margin-top: 2px; font-size: 12px; font-weight: 700; letter-spacing: .12em; color: #6B7280; }
    h1 { max-width: 610px; margin: 44px 0 20px; font-size: 60px; line-height: 1.04; letter-spacing: -.052em; font-weight: 680; }
    h1 span { color: #C85E52; }
    .lead { max-width: 560px; margin: 0; font-size: 21px; line-height: 1.5; color: #6B7280; }
    .proof { margin-top: 32px; display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 700; color: #166534; }
    .proof-dot { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: white; background: #15803D; box-shadow: 0 8px 20px rgba(21,128,61,.22); }
    .visual { transform: rotate(2deg); }
    .shell { padding: 9px; border-radius: 34px; background: rgba(255,255,255,.68); border: 1px solid rgba(255,255,255,.92); box-shadow: 0 28px 64px rgba(26,29,38,.15), 0 8px 20px rgba(26,29,38,.08); }
    .card { position: relative; min-height: 430px; padding: 34px; overflow: hidden; border-radius: 27px; background: linear-gradient(145deg, #FFFFFF 0%, #FFF4F1 58%, #EEF8F4 100%); border: 1px solid rgba(0,0,0,.05); }
    .card:after { content: ''; position: absolute; width: 240px; height: 240px; border-radius: 50%; right: -90px; top: -90px; background: rgba(253,188,180,.42); filter: blur(2px); }
    .session-label { position: relative; z-index: 1; font-size: 12px; font-weight: 750; letter-spacing: .12em; color: #9A4B42; }
    .count { position: relative; z-index: 1; margin-top: 22px; display: flex; align-items: flex-end; gap: 10px; }
    .count strong { font-size: 112px; line-height: .85; letter-spacing: -.08em; color: #C85E52; }
    .count span { padding-bottom: 8px; font-size: 22px; font-weight: 700; color: #6B7280; }
    .line { position: relative; z-index: 1; height: 12px; margin-top: 34px; overflow: hidden; border-radius: 999px; background: rgba(26,29,38,.07); }
    .line i { display: block; width: 72%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #D96B5E, #FDBCB4); }
    .facts { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
    .fact { padding: 16px; border-radius: 18px; background: rgba(255,255,255,.82); border: 1px solid rgba(0,0,0,.05); box-shadow: 0 8px 24px rgba(0,0,0,.05); }
    .fact b { display: block; font-size: 14px; }
    .fact span { display: block; margin-top: 5px; font-size: 12px; color: #6B7280; }
    .cta { position: relative; z-index: 1; margin-top: 20px; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; border-radius: 18px; color: white; background: #15803D; box-shadow: 0 12px 28px rgba(21,128,61,.22); font-size: 15px; font-weight: 750; }
  </style>
</head>
<body>
  <main class="canvas">
    <div class="grid"></div><div class="glow glow-a"></div><div class="glow glow-b"></div>
    <section class="copy">
      <div class="brand">
        <div class="mark">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M5 7.5C8.8 6.2 12.1 6.7 15 9v15c-2.9-2.3-6.2-2.8-10-1.5v-15Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M25 7.5C21.2 6.2 17.9 6.7 15 9v15c2.9-2.3 6.2-2.8 10-1.5v-15Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
        </div>
        <div><div class="brand-name">LMS Mr Ole</div><div class="brand-note">ENGLISH LEARNING SPACE</div></div>
      </div>
      <h1>Belajar Inggris, <span>satu sesi bermakna</span> setiap hari.</h1>
      <p class="lead">Latihan terarah, hasil yang mudah dipahami, dan progres yang terus terlihat.</p>
      <div class="proof"><span class="proof-dot">✓</span><span>Mulai dari 20 soal. Tumbuh dari setiap jawaban.</span></div>
    </section>
    <section class="visual" aria-hidden="true">
      <div class="shell"><div class="card">
        <div class="session-label">SESI BELAJAR HARI INI</div>
        <div class="count"><strong>20</strong><span>soal terarah</span></div>
        <div class="line"><i></i></div>
        <div class="facts"><div class="fact"><b>Grammar</b><span>Pilih fokus belajarmu</span></div><div class="fact"><b>Progress</b><span>Pantau hasil setiap sesi</span></div></div>
        <div class="cta"><span>Mulai latihan</span><span>→</span></div>
      </div></div>
    </section>
  </main>
</body>
</html>
  `, { waitUntil: 'load' });

  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, type: 'png' });

  console.log(`Generated ${output}`);
} finally {
  await browser.close();
}
