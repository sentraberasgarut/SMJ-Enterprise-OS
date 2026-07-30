#!/usr/bin/env node
/**
 * Cek konsistensi repo. Dijalankan CI di setiap push dan pull request.
 *
 * Yang dicek:
 *   1. Setiap link Markdown relatif menunjuk ke file yang benar-benar ada
 *   2. Setiap file di manifest sync benar-benar ada
 *   3. Target manifest yang enabled harus punya pageId
 *   4. Hanya boleh ada satu roadmap aktif di roadmap/ (sisanya di roadmap/archive/)
 *   5. Tidak ada ADR berstatus "Diterima" yang saling membalik tanpa disebut
 *
 * Cek nomor 4 dan 5 ada karena repo ini punya sejarah menyimpan dua dokumen
 * yang saling bertentangan tanpa terdeteksi (CEO Memo 24 Jul vs SOP TSS 27 Jul).
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];

const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'archive'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// 1 — link relatif
async function checkLinks(files) {
  for (const file of files) {
    const md = await readFile(file, 'utf8');
    const links = [...md.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
    for (const link of links) {
      if (/^(https?:|mailto:|#)/.test(link)) continue;
      const target = resolve(dirname(file), link.split('#')[0]);
      if (!(await exists(target))) {
        problems.push(`${relative(REPO_ROOT, file)}: link mati -> ${link}`);
      }
    }
  }
}

// 2 & 3 — manifest sync
async function checkManifest() {
  const path = join(REPO_ROOT, 'automation/sync-notion/manifest.json');
  if (!(await exists(path))) { problems.push('manifest.json sync tidak ditemukan'); return; }

  const manifest = JSON.parse(await readFile(path, 'utf8'));
  for (const t of manifest.targets ?? []) {
    if (!(await exists(join(REPO_ROOT, t.file)))) {
      problems.push(`manifest: file tidak ada -> ${t.file}`);
    }
    if (t.enabled && !t.pageId) {
      problems.push(`manifest: ${t.file} enabled tapi pageId kosong`);
    }
    if (!t.enabled) {
      notes.push(`manifest: ${t.file} belum aktif (pageId belum diisi)`);
    }
  }
}

// 4 — satu roadmap aktif
async function checkRoadmap() {
  const dir = join(REPO_ROOT, 'roadmap');
  if (!(await exists(dir))) return;
  const active = (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'readme.md')
    .map((e) => e.name);
  if (active.length > 1) {
    problems.push(`roadmap/: ada ${active.length} roadmap aktif (${active.join(', ')}). Hanya boleh satu — sisanya pindahkan ke roadmap/archive/`);
  }
}

// 5 — ADR yang membalik
async function checkAdrs() {
  const dir = join(REPO_ROOT, 'adr');
  if (!(await exists(dir))) return;
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
  const accepted = [];
  for (const f of files) {
    const md = await readFile(join(dir, f), 'utf8');
    if (/\*\*Status\*\*\s*\|\s*Diterima/i.test(md) || /^status:\s*diterima/im.test(md)) {
      accepted.push({ f, md });
    }
  }
  for (const { f, md } of accepted) {
    if (/\bMembalik\b/i.test(md) && !/ADR-\d{4}|22 Jul|keputusan \d/i.test(md)) {
      problems.push(`adr/${f}: menyebut membalik keputusan tapi tidak menunjuk ADR atau tanggal yang jelas`);
    }
  }
  notes.push(`adr/: ${accepted.length} ADR berstatus Diterima`);
}

const files = await walk(REPO_ROOT);
await checkLinks(files);
await checkManifest();
await checkRoadmap();
await checkAdrs();

console.log(`Diperiksa ${files.length} file Markdown.\n`);
for (const n of notes) console.log(`[catatan] ${n}`);
if (notes.length) console.log('');

if (problems.length) {
  console.error(`GAGAL — ${problems.length} masalah:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('LULUS — tidak ada masalah konsistensi.');
