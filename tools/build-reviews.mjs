#!/usr/bin/env node
/**
 * build-reviews.mjs
 *
 * Renders content/reviews.json into the review cards on reviews.html and the
 * featured three on index.html, replacing whatever sits between the
 * <!-- REVIEWS:START --> and <!-- REVIEWS:END --> markers in each file.
 *
 * Usage:   node tools/build-reviews.mjs
 *
 * Safe to run repeatedly. If reviews.json has no reviews in it, nothing is
 * written and the placeholders stay put — so this can never blank the pages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'content', 'reviews.json');

const START = '<!-- REVIEWS:START -->';
const END = '<!-- REVIEWS:END -->';

const die = (msg) => { console.error('\n✗ ' + msg + '\n'); process.exit(1); };

/* ---------- read + validate ---------------------------------------- */

if (!fs.existsSync(SRC)) die(`Can't find ${path.relative(root, SRC)}`);

let data;
try {
  data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
} catch (e) {
  die(`content/reviews.json isn't valid JSON — ${e.message}\n  A missing or extra comma is the usual cause.`);
}

const reviews = Array.isArray(data.reviews) ? data.reviews : [];

if (reviews.length === 0) {
  console.log(
    '\nNo reviews in content/reviews.json yet, so nothing was changed.\n' +
    'Add them to the "reviews" array (there is an example in the file) and run this again.\n'
  );
  process.exit(0);
}

reviews.forEach((r, i) => {
  if (!r.text || !r.text.trim()) die(`Review ${i + 1} has no "text".`);
  if (!r.name || !r.name.trim()) die(`Review ${i + 1} has no "name".`);
  const n = Number(r.rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) die(`Review ${i + 1} ("${r.name}") needs a "rating" from 1 to 5.`);
});

const featured = reviews.filter((r) => r.featured);
if (featured.length === 0) {
  console.warn('! No review is marked "featured": true — using the first three for the home page.');
}
const homeThree = (featured.length ? featured : reviews).slice(0, 3);

/* ---------- render -------------------------------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Straight quotes and hyphens → typographic equivalents, so pasted-in review
// text matches the rest of the site's typography.
const smarten = (s) =>
  esc(s.trim())
    .replace(/(\w)'(\w)/g, '$1&rsquo;$2')
    .replace(/(^|[\s(])"/g, '$1&ldquo;')
    .replace(/"/g, '&rdquo;')
    .replace(/(^|[\s(])'/g, '$1&lsquo;')
    .replace(/'/g, '&rsquo;')
    .replace(/ -- | — | - /g, ' &mdash; ');

const card = (r) => {
  const stars = '&#9733;'.repeat(r.rating) + '&#9734;'.repeat(5 - r.rating);
  const meta = [r.location, r.date, r.note].filter(Boolean).map(esc).join(' &middot; ');
  const src = r.source ? `<span class="visually-hidden"> (via ${esc(r.source)})</span>` : '';
  return `        <figure class="quote">
          <div class="quote__stars" aria-label="${r.rating} out of 5">${stars}</div>
          <blockquote>&ldquo;${smarten(r.text)}&rdquo;</blockquote>
          <figcaption>${esc(r.name)}${src}${meta ? `<span>${meta}</span>` : ''}</figcaption>
        </figure>`;
};

// The home page shows exactly three, so an equal-height 3-up grid is right.
// The reviews page shows however many exist, so it packs into columns.
const grid = (list, wrapper) =>
  `${START}\n      <div class="${wrapper}">\n${list.map(card).join('\n')}\n      </div>\n      ${END}`;

/* ---------- write ---------------------------------------------------- */

const inject = (file, list, wrapper) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) die(`Can't find ${file}`);
  const html = fs.readFileSync(full, 'utf8');
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a === -1 || b === -1) die(`${file} is missing the ${START} / ${END} markers.`);
  const out = html.slice(0, a) + grid(list, wrapper) + html.slice(b + END.length);
  fs.writeFileSync(full, out);
  console.log(`  ✓ ${file} — ${list.length} review${list.length === 1 ? '' : 's'}`);
};

console.log('\nBuilding reviews…');
inject('reviews.html', reviews, 'quotes');
inject('index.html', homeThree, 'grid grid--3');

/* ---------- aggregate rating: home-page stat + schema ---------------- */

const agg = data.aggregate;

// The rating tile in the home-page trust bar. Generated from the same figures
// as the schema below, so the two can never drift apart.
{
  const file = path.join(root, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const A = '<!-- RATING:START -->';
  const B = '<!-- RATING:END -->';
  const a = html.indexOf(A);
  const b = html.indexOf(B);
  if (a !== -1 && b !== -1) {
    const tile = (agg && agg.ratingValue && agg.reviewCount)
      ? `\n        <div class="trustbar__item">\n` +
        `          <div class="trustbar__stat">${Number(agg.ratingValue).toFixed(1)}</div>\n` +
        `          <div class="trustbar__label">From ${agg.reviewCount}<br>Google reviews</div>\n` +
        `        </div>\n        `
      : '';
    html = html.slice(0, a + A.length) + tile + html.slice(b);
    fs.writeFileSync(file, html);
    console.log(agg && agg.ratingValue
      ? `  ✓ index.html — trust-bar rating tile (${Number(agg.ratingValue).toFixed(1)} / ${agg.reviewCount})`
      : '  · index.html — no rating tile (no aggregate figures set)');
  }
}

if (agg && agg.ratingValue && agg.reviewCount) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    '@id': 'https://www.mrfranck.com/#business',
    name: 'Mr. Franck — Private Driver of the French Riviera',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: agg.ratingValue,
      reviewCount: agg.reviewCount,
      bestRating: 5
    }
  };
  const block = `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
  const file = path.join(root, 'reviews.html');
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('"aggregateRating"')) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?aggregateRating[\s\S]*?<\/script>/, block);
  } else {
    html = html.replace('</head>', block + '\n</head>');
  }
  fs.writeFileSync(file, html);
  console.log(`  ✓ reviews.html — aggregate rating ${agg.ratingValue} from ${agg.reviewCount} reviews`);
} else {
  console.log('  · no "aggregate" figures set, so no star-rating schema was added (correct until they are real)');
}

console.log('\nDone. Open the pages in a browser to check them.\n');
