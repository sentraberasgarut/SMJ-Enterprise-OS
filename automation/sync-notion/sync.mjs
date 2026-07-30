#!/usr/bin/env node
/**
 * Sync satu arah: Markdown di repo -> halaman Notion (mirror read-only).
 *
 * Pemakaian:
 *   node automation/sync-notion/sync.mjs --dry-run   # tidak menulis apa pun
 *   node automation/sync-notion/sync.mjs             # menulis ke Notion
 *
 * Butuh env NOTION_TOKEN (kecuali --dry-run).
 *
 * PENTING: script ini MENIMPA isi halaman Notion target. Jangan pernah
 * arahkan ke halaman yang diedit manual.
 *
 * URUTAN OPERASI (v2 - penting):
 *   1. Catat id blok lama
 *   2. TULIS blok baru
 *   3. Baru HAPUS blok lama
 *
 * Urutan ini dipilih setelah bug 30 Jul 2026: versi lama menghapus dulu,
 * lalu gagal menulis, dan meninggalkan halaman BLANK. Dengan urutan ini,
 * kegagalan menulis tidak merusak apa pun - isi lama tetap ada.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');
const TOKEN = process.env.NOTION_TOKEN;
const API = 'https://api.notion.com/v1';

let NOTION_VERSION = '2022-06-28';

// ---------------------------------------------------------------- utilitas

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(level, msg) {
  const tag = { info: 'INFO ', warn: 'WARN ', err: 'ERROR', ok: 'OK   ', dbg: 'DEBUG' }[level] ?? '     ';
  console.log(`[${tag}] ${msg}`);
}

async function notion(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 429) {
    const retry = Number(res.headers.get('retry-after') ?? 2);
    log('warn', `rate limited, tunggu ${retry}s`);
    await sleep(retry * 1000);
    return notion(path, options);
  }

  const body = await res.text();
  if (!res.ok) {
    const err = new Error(`Notion ${options.method ?? 'GET'} ${path} -> ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }
  return body ? JSON.parse(body) : {};
}

// -------------------------------------------------- inline -> rich_text

const MAX_TEXT = 1900; // batas Notion 2000, sisakan ruang

/**
 * Parse inline markdown: **bold**, *italic*, `code`, [teks](url).
 * Sengaja sederhana dan tidak rekursif - cukup untuk dokumen di repo ini.
 */
function richText(raw) {
  if (raw === undefined || raw === null) return [];
  const s = String(raw);
  if (!s) return [];

  const out = [];
  // Urutan penting: code dulu supaya isinya tidak diproses lagi.
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(\*[^*]+\*)/g;
  let last = 0;
  let m;

  const push = (content, annotations = {}, link = null) => {
    if (!content) return;
    for (let i = 0; i < content.length; i += MAX_TEXT) {
      out.push({
        type: 'text',
        text: { content: content.slice(i, i + MAX_TEXT), link: link ? { url: link } : null },
        annotations: { bold: false, italic: false, code: false, ...annotations },
      });
    }
  };

  while ((m = pattern.exec(s)) !== null) {
    push(s.slice(last, m.index));
    const t = m[0];
    if (m[1]) push(t.slice(1, -1), { code: true });
    else if (m[2]) push(t.slice(2, -2), { bold: true });
    else if (m[3]) {
      const mm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const url = mm[2].trim();
      // Notion menolak link relatif. Link internal repo jadi teks biasa.
      if (/^https?:\/\//.test(url)) push(mm[1], {}, url);
      else push(`${mm[1]} (${url})`);
    } else if (m[4]) push(t.slice(1, -1), { italic: true });
    last = m.index + t.length;
  }
  push(s.slice(last));

  // Notion menolak rich_text kosong pada beberapa konteks - kirim string kosong.
  if (!out.length) out.push({ type: 'text', text: { content: '', link: null } });
  return out;
}

/** Ambil teks polos dari sebuah blok, untuk fallback paragraf. */
function blockToPlainText(b) {
  const t = b[b.type];
  if (!t) return `[blok ${b.type} tidak bisa dikonversi]`;
  if (Array.isArray(t.rich_text)) {
    return t.rich_text.map((r) => r.text?.content ?? '').join('');
  }
  if (b.type === 'table' && Array.isArray(t.children)) {
    return t.children
      .map((row) => (row.table_row?.cells ?? [])
        .map((cell) => cell.map((r) => r.text?.content ?? '').join(''))
        .join(' | '))
      .join('\n');
  }
  return `[blok ${b.type}]`;
}

// ------------------------------------------------- markdown -> blocks

const block = (type, value) => ({ object: 'block', type, [type]: value });

const MAX_TABLE_COLS = 20; // batas praktis; tabel lebih lebar diturunkan jadi teks

function splitTableRow(line) {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim());
}

const isTableSeparator = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

/**
 * Bangun blok tabel Notion dengan pengerasan:
 *   - baris header yang seluruhnya kosong dibuang (has_column_header = false)
 *   - jumlah kolom dinormalkan ke lebar maksimum
 *   - lebar di luar 1..MAX_TABLE_COLS -> tabel diturunkan jadi baris teks
 */
function buildTable(rows) {
  let hasHeader = true;
  if (rows.length && rows[0].every((c) => c === '')) {
    rows = rows.slice(1);
    hasHeader = false;
  }
  if (!rows.length) return null;

  const width = Math.max(...rows.map((r) => r.length));
  if (width < 1 || width > MAX_TABLE_COLS) {
    // Terlalu lebar untuk tabel Notion yang nyaman - jadikan daftar teks.
    return rows.map((r) => block('paragraph', { rich_text: richText(r.join(' | ')) }));
  }

  return block('table', {
    table_width: width,
    has_column_header: hasHeader,
    has_row_header: false,
    children: rows.map((r) => block('table_row', {
      cells: Array.from({ length: width }, (_, c) => richText(r[c] ?? '')),
    })),
  });
}

function markdownToBlocks(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  const push = (b) => {
    if (!b) return;
    if (Array.isArray(b)) blocks.push(...b);
    else blocks.push(b);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // code fence
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'plain text';
      const body = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) body.push(lines[i++]);
      i++;
      push(block('code', {
        language: normaliseLang(lang),
        rich_text: [{ type: 'text', text: { content: body.join('\n').slice(0, MAX_TEXT) } }],
      }));
      continue;
    }

    // divider
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      push(block('divider', {}));
      i++;
      continue;
    }

    // tabel
    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(lines[i]);
      i += 2;
      const rows = [header];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      push(buildTable(rows));
      continue;
    }

    // heading
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const depth = h[1].length;
      const text = h[2];
      if (depth <= 3) push(block(`heading_${depth}`, { rich_text: richText(text) }));
      else push(block('heading_3', { rich_text: richText(`**${text}**`) }));
      i++;
      continue;
    }

    // quote
    if (trimmed.startsWith('>')) {
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        body.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      push(block('quote', { rich_text: richText(body.join(' ').trim()) }));
      continue;
    }

    // bulleted list
    if (/^[-*+]\s+/.test(trimmed)) {
      push(block('bulleted_list_item', { rich_text: richText(trimmed.replace(/^[-*+]\s+/, '')) }));
      i++;
      continue;
    }

    // numbered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      push(block('numbered_list_item', { rich_text: richText(trimmed.replace(/^\d+[.)]\s+/, '')) }));
      i++;
      continue;
    }

    // paragraf
    const para = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^(#{1,6})\s/.test(t) || t.startsWith('>') || t.startsWith('```')
        || t.startsWith('|') || /^[-*+]\s/.test(t) || /^\d+[.)]\s/.test(t)
        || /^(-{3,}|\*{3,}|_{3,})$/.test(t)) break;
      para.push(t);
      i++;
    }
    push(block('paragraph', { rich_text: richText(para.join(' ')) }));
  }

  return blocks;
}

function normaliseLang(lang) {
  const known = new Set(['javascript', 'typescript', 'python', 'bash', 'shell', 'json',
    'yaml', 'html', 'css', 'sql', 'markdown', 'plain text', 'diff']);
  const l = lang.toLowerCase();
  if (l === 'js') return 'javascript';
  if (l === 'ts') return 'typescript';
  if (l === 'sh' || l === 'zsh') return 'bash';
  if (l === 'yml') return 'yaml';
  if (l === 'text' || l === 'txt' || l === '') return 'plain text';
  return known.has(l) ? l : 'plain text';
}

// ------------------------------------------------------ operasi Notion

async function listChildIds(pageId) {
  let cursor;
  const ids = [];
  do {
    const q = new URLSearchParams({ page_size: '100' });
    if (cursor) q.set('start_cursor', cursor);
    const res = await notion(`/blocks/${pageId}/children?${q}`);
    ids.push(...res.results.map((b) => b.id));
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return ids;
}

async function deleteBlocks(ids) {
  let removed = 0;
  for (const id of ids) {
    try {
      await notion(`/blocks/${id}`, { method: 'DELETE' });
      removed++;
    } catch (err) {
      log('warn', `gagal hapus blok ${id}: ${err.message.slice(0, 120)}`);
    }
    await sleep(120); // hormati batas ~3 req/s
  }
  return removed;
}

/**
 * Tulis blok, dengan isolasi kegagalan.
 * Kalau satu chunk ditolak, retry per blok untuk menemukan yang bermasalah,
 * lalu turunkan blok itu jadi paragraf biasa supaya sisanya tetap masuk.
 */
async function appendBlocks(pageId, blocks) {
  let written = 0;
  let degraded = 0;

  for (let i = 0; i < blocks.length; i += 100) {
    const chunk = blocks.slice(i, i + 100);
    try {
      await notion(`/blocks/${pageId}/children`, {
        method: 'PATCH',
        body: JSON.stringify({ children: chunk }),
      });
      written += chunk.length;
      await sleep(150);
    } catch (err) {
      log('warn', `chunk blok ${i}-${i + chunk.length - 1} ditolak, isolasi per blok...`);
      for (let j = 0; j < chunk.length; j++) {
        const b = chunk[j];
        try {
          await notion(`/blocks/${pageId}/children`, {
            method: 'PATCH',
            body: JSON.stringify({ children: [b] }),
          });
          written++;
        } catch (e2) {
          log('err', `blok #${i + j} tipe "${b.type}" ditolak: ${e2.message.slice(0, 300)}`);
          // Fallback: turunkan jadi paragraf teks polos.
          try {
            await notion(`/blocks/${pageId}/children`, {
              method: 'PATCH',
              body: JSON.stringify({
                children: [block('paragraph', { rich_text: richText(blockToPlainText(b)) })],
              }),
            });
            written++;
            degraded++;
          } catch (e3) {
            log('err', `fallback paragraf untuk blok #${i + j} juga gagal: ${e3.message.slice(0, 200)}`);
          }
        }
        await sleep(150);
      }
    }
  }

  return { written, degraded };
}

// ------------------------------------------------------------------ main

async function main() {
  const manifestPath = join(__dirname, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.notionVersion) NOTION_VERSION = manifest.notionVersion;

  if (DRY_RUN) log('info', 'MODE DRY-RUN - tidak ada yang ditulis ke Notion');
  else if (!TOKEN) {
    log('err', 'NOTION_TOKEN tidak ada. Set repository secret NOTION_TOKEN, atau jalankan dengan --dry-run.');
    process.exit(1);
  }

  const active = manifest.targets.filter((t) => t.enabled);
  const skipped = manifest.targets.filter((t) => !t.enabled);

  if (skipped.length) {
    log('info', `${skipped.length} target dilewati (enabled: false): ${skipped.map((t) => t.file).join(', ')}`);
  }
  if (!active.length) {
    log('warn', 'Tidak ada target aktif. Isi pageId lalu set enabled: true di manifest.json.');
    return;
  }

  let failed = 0;

  for (const target of active) {
    const label = `${target.file} -> ${target.title}`;
    try {
      if (!target.pageId) throw new Error('pageId kosong padahal enabled: true');

      const md = await readFile(join(REPO_ROOT, target.file), 'utf8');
      const blocks = markdownToBlocks(md);

      if (!blocks.length) throw new Error('konversi menghasilkan 0 blok - kemungkinan file kosong');

      if (DRY_RUN) {
        const counts = blocks.reduce((a, b) => ({ ...a, [b.type]: (a[b.type] ?? 0) + 1 }), {});
        log('ok', `${label} - ${blocks.length} blok: ${JSON.stringify(counts)}`);
        continue;
      }

      // 1. Catat blok lama SEBELUM menulis apa pun.
      const oldIds = await listChildIds(target.pageId);
      log('info', `${label} - ${oldIds.length} blok lama tercatat, menulis ${blocks.length} blok baru...`);

      // 2. Tulis blok baru DULU. Kalau ini gagal, isi lama masih utuh.
      const { written, degraded } = await appendBlocks(target.pageId, blocks);

      if (written === 0) {
        throw new Error('nol blok berhasil ditulis - isi lama TIDAK dihapus, halaman tetap utuh');
      }

      // 3. Baru hapus blok lama.
      const removed = await deleteBlocks(oldIds);

      // 4. Verifikasi pasca-tulis.
      const finalCount = (await listChildIds(target.pageId)).length;
      if (finalCount === 0) {
        throw new Error('VERIFIKASI GAGAL: halaman kosong setelah sync');
      }

      const note = degraded ? ` (${degraded} blok diturunkan jadi paragraf)` : '';
      log('ok', `${label} - ${written} blok ditulis, ${removed} blok lama dihapus, ${finalCount} blok final${note}`);
    } catch (err) {
      failed++;
      log('err', `${label} - ${err.message}`);
    }
  }

  if (failed) {
    log('err', `${failed} dari ${active.length} target gagal`);
    process.exit(1);
  }
  log('ok', `Selesai. ${active.length} target tersinkron.`);
}

main().catch((err) => {
  log('err', err.stack ?? err.message);
  process.exit(1);
});
