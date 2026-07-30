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
 * URUTAN OPERASI (penting):
 *   1. Preflight - GET halaman, pastikan ada dan bisa diakses
 *   2. Catat id blok lama
 *   3. TULIS blok baru
 *   4. Baru HAPUS blok lama
 *
 * Urutan ini dipilih setelah bug 30 Jul 2026: versi pertama menghapus dulu,
 * lalu gagal menulis, dan meninggalkan halaman BLANK. Dengan urutan ini,
 * kegagalan menulis tidak merusak apa pun.
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
  const tag = { info: 'INFO ', warn: 'WARN ', err: 'ERROR', ok: 'OK   ' }[level] ?? '     ';
  console.log(`[${tag}] ${msg}`);
}

const pageUrl = (id) => `https://www.notion.so/${String(id).replace(/-/g, '')}`;

/** Error izin dari Notion - butuh tindakan manusia, tidak ada gunanya retry. */
class PermissionError extends Error {
  constructor(pageId, detail) {
    super(
      `Notion menolak akses (403 restricted_resource) ke halaman ${pageId}\n`
      + `\n`
      + `        Token sampai ke Notion, tapi integration TIDAK punya izin EDIT.\n`
      + `        Ini bukan masalah kode - butuh dua hal diperiksa manual:\n`
      + `\n`
      + `        1. CAPABILITIES integration:\n`
      + `           https://www.notion.so/profile/integrations\n`
      + `           Buka "SMJ Repo Sync" -> Configuration -> Capabilities\n`
      + `           WAJIB tercentang: "Read content" DAN "Update content"\n`
      + `           Hanya "Read content" = 403 persis seperti ini.\n`
      + `\n`
      + `        2. AKSES ke halaman:\n`
      + `           ${pageUrl(pageId)}\n`
      + `           Buka halaman INDUK "SMJ Enterprise OS" -> tombol ... (kanan atas)\n`
      + `           -> Connections -> sambungkan "SMJ Repo Sync"\n`
      + `           Halaman anak otomatis mewarisi akses, jadi cukup sekali di induk.\n`
      + `\n`
      + `        Detail dari Notion: ${detail}`,
    );
    this.name = 'PermissionError';
    this.isPermission = true;
  }
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
    let code = '';
    let message = body;
    try {
      const parsed = JSON.parse(body);
      code = parsed.code ?? '';
      message = parsed.message ?? body;
    } catch { /* body bukan JSON, pakai apa adanya */ }

    const err = new Error(`Notion ${options.method ?? 'GET'} ${path} -> ${res.status} ${code}: ${message}`);
    err.status = res.status;
    err.code = code;
    err.notionMessage = message;
    throw err;
  }
  return body ? JSON.parse(body) : {};
}

const isPermissionIssue = (err) => err.status === 403 || err.code === 'restricted_resource'
  || err.code === 'unauthorized' || err.code === 'insufficient_permissions';

// -------------------------------------------------- inline -> rich_text

const MAX_TEXT = 1900; // batas Notion 2000, sisakan ruang

function richText(raw) {
  if (raw === undefined || raw === null) return [];
  const s = String(raw);
  if (!s) return [{ type: 'text', text: { content: '', link: null } }];

  const out = [];
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
      if (/^https?:\/\//.test(url)) push(mm[1], {}, url);
      else push(`${mm[1]} (${url})`);
    } else if (m[4]) push(t.slice(1, -1), { italic: true });
    last = m.index + t.length;
  }
  push(s.slice(last));

  if (!out.length) out.push({ type: 'text', text: { content: '', link: null } });
  return out;
}

function blockToPlainText(b) {
  const t = b[b.type];
  if (!t) return `[blok ${b.type} tidak bisa dikonversi]`;
  if (Array.isArray(t.rich_text)) return t.rich_text.map((r) => r.text?.content ?? '').join('');
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

const MAX_TABLE_COLS = 20;

function splitTableRow(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
}

const isTableSeparator = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

function buildTable(rows) {
  let hasHeader = true;
  if (rows.length && rows[0].every((c) => c === '')) {
    rows = rows.slice(1);
    hasHeader = false;
  }
  if (!rows.length) return null;

  const width = Math.max(...rows.map((r) => r.length));
  if (width < 1 || width > MAX_TABLE_COLS) {
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
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }

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

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      push(block('divider', {}));
      i++;
      continue;
    }

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

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const depth = h[1].length;
      if (depth <= 3) push(block(`heading_${depth}`, { rich_text: richText(h[2]) }));
      else push(block('heading_3', { rich_text: richText(`**${h[2]}**`) }));
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        body.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      push(block('quote', { rich_text: richText(body.join(' ').trim()) }));
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      push(block('bulleted_list_item', { rich_text: richText(trimmed.replace(/^[-*+]\s+/, '')) }));
      i++;
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      push(block('numbered_list_item', { rich_text: richText(trimmed.replace(/^\d+[.)]\s+/, '')) }));
      i++;
      continue;
    }

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

/**
 * Preflight: pastikan halaman ada dan bisa diakses SEBELUM menyentuh apa pun.
 * Membedakan dengan jelas antara "tidak ditemukan / belum di-share" dan
 * "ditemukan tapi tidak punya izin".
 */
async function preflight(pageId) {
  try {
    const page = await notion(`/pages/${pageId}`);
    if (page.archived) throw new Error(`halaman ${pageId} sudah diarsipkan di Notion - pulihkan dulu`);
    return true;
  } catch (err) {
    if (err.code === 'object_not_found') {
      throw new Error(
        `Halaman ${pageId} tidak ditemukan oleh integration.\n`
        + `\n`
        + `        Halamannya mungkin ada, tapi integration tidak bisa melihatnya.\n`
        + `        Notion menyembunyikan halaman yang belum di-share ke integration.\n`
        + `\n`
        + `        Perbaikan: buka halaman INDUK "SMJ Enterprise OS"\n`
        + `        -> tombol ... (kanan atas) -> Connections -> sambungkan "SMJ Repo Sync"\n`
        + `        Halaman anak otomatis mewarisi akses.\n`
        + `\n`
        + `        Halaman ini: ${pageUrl(pageId)}`,
      );
    }
    if (isPermissionIssue(err)) throw new PermissionError(pageId, err.notionMessage ?? err.message);
    throw err;
  }
}

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
      log('warn', `gagal hapus blok ${id}: ${(err.notionMessage ?? err.message).slice(0, 120)}`);
    }
    await sleep(120);
  }
  return removed;
}

/**
 * Tulis blok. Error izin -> berhenti segera (retry tidak ada gunanya).
 * Error validasi -> isolasi per blok untuk menemukan yang bermasalah.
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
      // Error izin: berhenti sekarang. Mencoba 100 blok satu-satu hanya
      // menghasilkan 100 kegagalan identik dan memperlambat pesan errornya.
      if (isPermissionIssue(err)) throw new PermissionError(pageId, err.notionMessage ?? err.message);

      log('warn', `chunk blok ${i}-${i + chunk.length - 1} ditolak (${err.status} ${err.code}), isolasi per blok...`);
      for (let j = 0; j < chunk.length; j++) {
        const b = chunk[j];
        try {
          await notion(`/blocks/${pageId}/children`, {
            method: 'PATCH',
            body: JSON.stringify({ children: [b] }),
          });
          written++;
        } catch (e2) {
          if (isPermissionIssue(e2)) throw new PermissionError(pageId, e2.notionMessage ?? e2.message);
          log('err', `blok #${i + j} tipe "${b.type}" ditolak: ${(e2.notionMessage ?? e2.message).slice(0, 300)}`);
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
            if (isPermissionIssue(e3)) throw new PermissionError(pageId, e3.notionMessage ?? e3.message);
            log('err', `fallback paragraf blok #${i + j} juga gagal: ${(e3.notionMessage ?? e3.message).slice(0, 200)}`);
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
  const manifest = JSON.parse(await readFile(join(__dirname, 'manifest.json'), 'utf8'));
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
  let permissionProblem = false;

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

      // 1. Preflight - gagal cepat dengan pesan jelas kalau akses bermasalah.
      await preflight(target.pageId);

      // 2. Catat blok lama SEBELUM menulis apa pun.
      const oldIds = await listChildIds(target.pageId);
      log('info', `${label} - ${oldIds.length} blok lama, menulis ${blocks.length} blok baru...`);

      // 3. Tulis dulu. Kalau gagal, isi lama masih utuh.
      const { written, degraded } = await appendBlocks(target.pageId, blocks);
      if (written === 0) throw new Error('nol blok ditulis - isi lama TIDAK dihapus, halaman tetap utuh');

      // 4. Baru hapus blok lama.
      const removed = await deleteBlocks(oldIds);

      // 5. Verifikasi.
      const finalCount = (await listChildIds(target.pageId)).length;
      if (finalCount === 0) throw new Error('VERIFIKASI GAGAL: halaman kosong setelah sync');

      const note = degraded ? ` (${degraded} blok diturunkan jadi paragraf)` : '';
      log('ok', `${label} - ${written} blok ditulis, ${removed} lama dihapus, ${finalCount} blok final${note}`);
    } catch (err) {
      failed++;
      if (err.isPermission) permissionProblem = true;
      log('err', `${label}\n        ${err.message}`);
    }
  }

  if (failed) {
    if (permissionProblem) {
      log('err', 'Kegagalan ini BUKAN masalah kode - butuh perbaikan izin manual di Notion. Baca instruksi di atas.');
    }
    log('err', `${failed} dari ${active.length} target gagal`);
    process.exit(1);
  }
  log('ok', `Selesai. ${active.length} target tersinkron.`);
}

main().catch((err) => {
  log('err', err.stack ?? err.message);
  process.exit(1);
});
