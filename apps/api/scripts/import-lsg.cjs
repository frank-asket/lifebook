#!/usr/bin/env node
// Converts the public-domain Louis Segond 1910 (eBible.org fraLSG, USFM) into the files the API serves
// from content/bibles/lsg. Only the 1910 verse text is kept: the edition's introductions, section headings,
// cross-references and Strong's numbers are modern additions and are dropped.
//
//   curl -LO https://ebible.org/Scriptures/fraLSG_usfm.zip && unzip fraLSG_usfm.zip -d fraLSG
//   node apps/api/scripts/import-lsg.cjs fraLSG
//
// Each book file is { id, name, chapters }, where a chapter is a list of paragraphs and a paragraph is a
// list of [verse number, text] pairs.
const { readdirSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const source = process.argv[2];
if (!source) { console.error('Usage: import-lsg.cjs <folder of fraLSG .usfm files>'); process.exit(2); }
const out = join(__dirname, '../content/bibles/lsg');
mkdirSync(out, { recursive: true });

/** Removes notes and cross-references, and keeps the words of \w, \wj, \it, \qs and \ord spans. */
function clean(text) {
  return text
    .replace(/\\x .*?\\x\*/g, '')
    .replace(/\\f .*?\\f\*/g, '')
    .replace(/\\\+?w ([^|\\]*)(?:\|[^\\]*)?\\\+?w\*/g, '$1')
    .replace(/\\\+?(?:wj|it|qs|ord|nd|add|bd|em|sc)\*?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const books = [];
let verses = 0;
for (const file of readdirSync(source).filter(f => f.endsWith('.usfm')).sort()) {
  const usfm = readFileSync(join(source, file), 'utf8').replace(/^﻿/, '');
  const id = /^\\id ([A-Z0-9]{3})/m.exec(usfm)?.[1];
  const name = /^\\toc2 (.+)$/m.exec(usfm)?.[1].trim();
  if (!id || !name) throw new Error(`${file}: no \\id or \\toc2`);
  const chapters = [];
  let chapter = null; let paragraph = null; let verse = null; let breakNext = true; let lastMarker = '';
  const flush = () => { if (verse) { verse[1] = clean(verse[1]); if (!verse[1]) throw new Error(`${id} ${chapters.length}:${verse[0]} is empty`); verse = null; } };
  for (const line of usfm.split(/\r?\n/)) {
    const m = /^\\([a-z]+[0-9]?)\s?(.*)$/.exec(line.trim());
    if (!m) { if (verse && line.trim()) verse[1] += ' ' + line; continue; }
    const [, marker, rest] = m;
    if (marker === 'c') { flush(); chapter = []; chapters.push(chapter); if (Number(rest) !== chapters.length) throw new Error(`${id}: chapter ${rest} out of order`); breakNext = true; continue; }
    if (!chapter) continue; // introduction
    if (['p', 'm', 'pi1', 'b'].includes(marker) || (marker === 'q1' && lastMarker !== 'q1')) breakNext = true;
    if (['p', 'm', 'pi1', 'b', 'q1'].includes(marker)) {
      lastMarker = marker === 'b' ? lastMarker : marker;
      if (rest.trim() && verse) verse[1] += ' ' + rest;
      if (!rest.startsWith('\\v')) continue;
    }
    const v = /^\\v ([0-9]+) (.*)$/.exec(marker === 'v' ? line.trim() : rest.trim());
    if (marker === 'v' || v) {
      if (!v) throw new Error(`${id} ${chapters.length}: bad verse line`);
      flush();
      // In poetry each verse starts its own line, as API.Bible lays out the other versions.
      if (breakNext || !paragraph || lastMarker === 'q1') { paragraph = []; chapter.push(paragraph); breakNext = false; }
      verse = [v[1], v[2]]; paragraph.push(verse); verses++;
      continue;
    }
    // Headings, cross-reference lines and other study helps are not part of the 1910 text.
  }
  flush();
  writeFileSync(join(out, `${id}.json`), JSON.stringify({ id, name, chapters }) + '\n');
  books.push({ id, name, chapters: chapters.length });
}
writeFileSync(join(out, 'index.json'), JSON.stringify({
  id: 'lsg', name: 'Louis Segond 1910', abbreviation: 'LSG', language: 'fra',
  copyright: 'Domaine public. Texte de la Bible Louis Segond 1910, d’après l’édition eBible.org (fraLSG).',
  books,
}, null, 1) + '\n');
console.log(`Wrote ${books.length} books, ${verses} verses to ${out}`);
