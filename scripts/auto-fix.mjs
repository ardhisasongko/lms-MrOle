import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const MAX_ATTEMPTS = parseInt(process.env.MAX_FIX_ATTEMPTS || '3', 10);
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

// ── Report readers ──

function readPlaywrightReport() {
  const path = resolve(ROOT, 'playwright-report/results.json');
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf-8');
  const data = JSON.parse(raw);
  const failures = [];
  for (const suite of data.suites || []) {
    extractFailures(suite, failures);
  }
  return failures;
}

function extractFailures(suite, out) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      if (test.status !== 'expected' && test.status !== 'passed') {
        out.push({
          title: spec.title,
          project: test.projectName,
          error: test.errors?.[0]?.message || 'Unknown error',
        });
      }
    }
  }
  for (const child of suite.suites || []) {
    extractFailures(child, out);
  }
}

function readLighthouseReport() {
  const dir = resolve(ROOT, 'lighthouse-report');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.report.json'));
  const audits = [];
  for (const file of files) {
    const raw = readFileSync(resolve(dir, file), 'utf-8');
    const data = JSON.parse(raw);
    for (const [key, audit] of Object.entries(data.audits || {})) {
      if (audit.score !== null && audit.score < 0.5) {
        audits.push({
          url: data.finalDisplayedUrl,
          audit: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
        });
      }
    }
  }
  return audits;
}

function readConsoleErrors() {
  const dir = resolve(ROOT, 'test-results');
  if (!existsSync(dir)) return [];
  const errors = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) walk(full);
    }
  };
  walk(dir);
  return errors;
}

// ── Fixers ──

function fixHorizontalScroll() {
  const files = [
    'src/App.jsx',
    'src/pages/Landing.jsx',
    'src/pages/Login.jsx',
    'src/pages/Register.jsx',
  ];
  let fixed = false;
  for (const file of files) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    let content = readFileSync(path, 'utf-8');
    if (!content.includes('overflow-x-hidden')) {
      const clsMatch = content.match(/className="([^"]*)min-h-screen([^"]*)"/);
      if (clsMatch) {
        const newCls = clsMatch[0].replace('min-h-screen', 'min-h-screen overflow-x-hidden');
        content = content.replace(clsMatch[0], newCls);
        writeFileSync(path, content);
        console.log(`  ✓ Fixed: Added overflow-x-hidden to ${file}`);
        fixed = true;
      }
    }
  }
  return fixed;
}

function fixMissingAriaLabels() {
  const files = [
    'src/components/navigation/Navbar.jsx',
    'src/components/layout/MainLayout.jsx',
    'src/components/layout/DashboardLayout.jsx',
  ];
  let fixed = false;
  for (const file of files) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    let content = readFileSync(path, 'utf-8');
    const buttonMatches = content.matchAll(/<button([^>]*)>/g);
    for (const match of buttonMatches) {
      const btn = match[0];
      if (!btn.includes('aria-label') && !btn.includes('aria-labelledby')) {
        const text = btn.match(/>([^<]*)</);
        if (text && text[1].trim()) {
          const label = text[1].trim().slice(0, 30);
          const newBtn = btn.replace('<button', `<button aria-label="${label}"`);
          content = content.replace(btn, newBtn);
          fixed = true;
        }
      }
    }
    if (fixed) writeFileSync(path, content);
  }
  if (fixed) console.log('  ✓ Fixed: Added missing aria-labels to buttons');
  return fixed;
}

function fixAltText() {
  const files = [
    'src/pages/Landing.jsx',
    'src/components/navigation/Navbar.jsx',
  ];
  let fixed = false;
  for (const file of files) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    let content = readFileSync(path, 'utf-8');
    const imgMatches = content.matchAll(/<img([^>]*)>/g);
    for (const match of imgMatches) {
      const img = match[0];
      if (!img.includes('alt=')) {
        const src = img.match(/src="([^"]+)"/);
        const alt = src ? `${src[1].split('/').pop().split('.').shift() || 'image'}` : 'image';
        const newImg = img.replace('<img', `<img alt="${alt}"`);
        content = content.replace(img, newImg);
        fixed = true;
      }
    }
    if (fixed) writeFileSync(path, content);
  }
  if (fixed) console.log('  ✓ Fixed: Added alt text to images');
  return fixed;
}

// ── AI Fixer (optional, requires API key) ──

async function aiFix(failures) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('  ⚠ No AI API key found. Skipping AI-powered fixes.');
    return false;
  }

  const isOpenAI = !!process.env.OPENAI_API_KEY;
  const endpoint = isOpenAI
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.anthropic.com/v1/messages';

  const prompt = `You are a UI fixer for a React + Tailwind CSS app. Fix the following test failures by editing the source code.

FAILURES:
${JSON.stringify(failures, null, 2)}

Rules:
- Only edit existing files
- Use Tailwind CSS classes
- Keep all existing functionality
- Fix the root cause, not the symptom
- Respond with a JSON array of {file, oldString, newString} edits only`;

  console.log(`  Calling ${isOpenAI ? 'OpenAI' : 'Anthropic'}...`);
  try {
    const body = isOpenAI
      ? { model: AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }
      : { model: 'claude-3-5-haiku-latest', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] };

    const headers = { 'Content-Type': 'application/json' };
    headers[isOpenAI ? 'Authorization' : 'x-api-key'] = isOpenAI ? `Bearer ${apiKey}` : apiKey;
    if (!isOpenAI) headers['anthropic-version'] = '2023-06-01';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ✗ AI API error: ${err}`);
      return false;
    }

    const data = await res.json();
    const text = isOpenAI
      ? data.choices?.[0]?.message?.content || ''
      : data.content?.[0]?.text || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('  ⚠ No valid JSON edits in AI response');
      return false;
    }

    const edits = JSON.parse(jsonMatch[0]);
    let applied = 0;
    for (const edit of edits) {
      const filePath = resolve(ROOT, edit.file);
      if (!existsSync(filePath)) continue;
      let content = readFileSync(filePath, 'utf-8');
      if (content.includes(edit.oldString)) {
        content = content.replace(edit.oldString, edit.newString);
        writeFileSync(filePath, content);
        applied++;
      }
    }
    console.log(`  ✓ AI applied ${applied}/${edits.length} fixes`);
    return applied > 0;
  } catch (err) {
    console.error(`  ✗ AI fix error: ${err.message}`);
    return false;
  }
}

// ── Main ──

async function main() {
  console.log('\n=== Auto-Fix Script ===\n');

  const failures = readPlaywrightReport();
  const lighthouseIssues = readLighthouseReport();

  if (!failures && !lighthouseIssues) {
    console.log('No reports found. Run Playwright and Lighthouse first.');
    process.exit(0);
  }

  if (failures && failures.length > 0) {
    console.log(`Playwright failures: ${failures.length}`);
    failures.forEach(f => console.log(`  - [${f.project}] ${f.title}: ${f.error.slice(0, 100)}`));
    console.log();

    // Rule-based fixes
    console.log('Running rule-based fixes...');
    const cssFixed = fixHorizontalScroll();
    const ariaFixed = fixMissingAriaLabels();
    const altFixed = fixAltText();
    console.log();

    // AI fixes
    console.log('Running AI-powered fixes...');
    await aiFix(failures);
  }

  if (lighthouseIssues && lighthouseIssues.length > 0) {
    console.log(`\nLighthouse issues: ${lighthouseIssues.length}`);
    lighthouseIssues.slice(0, 5).forEach(a =>
      console.log(`  - [${a.audit}] ${a.title} (score: ${a.score})`)
    );
  }

  console.log('\n=== Auto-Fix Complete ===\n');
}

main().catch(console.error);
