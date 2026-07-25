#!/usr/bin/env node
/**
 * build-routes.mjs
 *
 * Generates one landing page per entry in content/routes.json, and rewrites
 * the route list on destinations.html plus sitemap.xml to match.
 *
 * Usage:   node tools/build-routes.mjs
 *
 * These pages exist because people search "nice airport to monaco transfer",
 * not "private driver french riviera". One page per route can answer that
 * query properly; a combined destinations page cannot.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.mrfranck.com';
const PHONE_DISPLAY = '+33 6 14 70 30 77';
const WA = 'https://wa.me/33614703077';

const die = (m) => { console.error('\n✗ ' + m + '\n'); process.exit(1); };

let data;
try {
  data = JSON.parse(fs.readFileSync(path.join(root, 'content', 'routes.json'), 'utf8'));
} catch (e) {
  die(`content/routes.json isn't valid JSON — ${e.message}`);
}
const routes = data.routes || [];
if (!routes.length) die('No routes defined in content/routes.json.');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- shared chrome ------------------------------------------- */

const head = (r) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(r.title)}</title>
<meta name="description" content="${esc(r.metaDescription)}">
<link rel="canonical" href="${SITE}/${r.slug}.html">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(r.h1)} — Private Driver | Mr. Franck">
<meta property="og:description" content="${esc(r.metaDescription)}">
<meta property="og:url" content="${SITE}/${r.slug}.html">
<meta property="og:image" content="${SITE}/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Mr. Franck — private driver of the French Riviera">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/img/og-image.jpg">
<meta name="theme-color" content="#0d151d">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<script>document.documentElement.classList.add('js');</script>

<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${SITE}/${r.slug}.html#service`,
      name: `${r.from} to ${r.to} private transfer`,
      serviceType: 'Airport transfer',
      description: r.metaDescription,
      provider: { '@id': `${SITE}/#business` },
      areaServed: { '@type': 'City', name: r.to },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: `${SITE}/book.html`,
        servicePhone: { '@type': 'ContactPoint', telephone: '+33614703077', availableLanguage: ['en', 'fr'] }
      }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Routes & destinations', item: `${SITE}/destinations.html` },
        { '@type': 'ListItem', position: 3, name: r.h1, item: `${SITE}/${r.slug}.html` }
      ]
    },
    {
      '@type': 'FAQPage',
      mainEntity: r.faqs.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ]
}, null, 2)}
</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="header">
  <div class="wrap header__inner">
    <a class="brand" href="/">
      <span class="brand__name">Mr. Franck</span>
      <span class="brand__tag">Private driver &middot; French Riviera</span>
    </a>
    <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="site-nav">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" id="site-nav" aria-label="Main">
      <ul class="nav__list">
        <li><a class="nav__link" href="/services.html">Services</a></li>
        <li><a class="nav__link" href="/destinations.html" aria-current="page">Routes &amp; destinations</a></li>
        <li><a class="nav__link" href="/about.html">About Franck</a></li>
        <li><a class="nav__link" href="/reviews.html">Reviews</a></li>
        <li><a class="nav__link" href="/faq.html">FAQ</a></li>
      </ul>
      <a class="btn btn--primary btn--sm" href="/book.html">Get a fixed price</a>
    </nav>
  </div>
</header>`;

const foot = () => `
<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <span class="brand__name">Mr. Franck</span>
        <p>
          Licensed private driver on the French Riviera. Airport transfers, cruise days
          and excursions from Nice to Saint-Tropez, Monaco and the Italian border.
        </p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="/services.html#airport">Airport transfers</a></li>
          <li><a href="/services.html#cruise">Cruise port days</a></li>
          <li><a href="/services.html#excursions">Day trips</a></li>
          <li><a href="/services.html#hourly">Hourly &amp; daily hire</a></li>
          <li><a href="/services.html#events">Events</a></li>
          <li><a href="/services.html#business">Business travel</a></li>
        </ul>
      </div>
      <div>
        <h4>Popular routes</h4>
        <ul>
${routes.map((x) => `          <li><a href="/${x.slug}.html">${esc(x.from.replace('Nice Côte d\'Azur Airport', 'Nice Airport'))} &rarr; ${esc(x.to)}</a></li>`).join('\n')}
          <li><a href="/destinations.html">All routes</a></li>
        </ul>
      </div>
      <div>
        <h4>Book</h4>
        <ul>
          <li><a href="tel:+33614703077">${PHONE_DISPLAY}</a></li>
          <li><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="/book.html">Booking form</a></li>
          <li><a href="/faq.html">FAQ</a></li>
          <li><a href="/reviews.html">Reviews</a></li>
          <li><a href="/about.html">About Franck</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="mb-0">&copy; <span data-year>2026</span> Mr. Franck &middot; Private driver, French Riviera &middot; Licensed VTC operator, France</p>
      <p class="mb-0">English &amp; French spoken &middot; Serving Alpes-Maritimes, Var &amp; Monaco</p>
    </div>
  </div>
</footer>

<div class="actionbar">
  <a class="btn btn--dark btn--sm" href="tel:+33614703077">Call</a>
  <a class="btn btn--wa btn--sm" href="${WA}" target="_blank" rel="noopener">WhatsApp</a>
  <a class="btn btn--primary btn--sm" href="/book.html">Get a price</a>
</div>

<script src="/assets/js/site.js" defer></script>
</body>
</html>`;

/* ---------- page body ------------------------------------------------ */

const page = (r) => {
  const others = routes.filter((x) => x.slug !== r.slug);
  const bookHref = `/book.html?service=Airport%20transfer&pickup=${encodeURIComponent(r.from)}&dropoff=${encodeURIComponent(r.to)}`;

  return `${head(r)}

<main id="main">

  <nav class="wrap" aria-label="Breadcrumb" style="padding-top:1.25rem">
    <ol style="list-style:none;display:flex;flex-wrap:wrap;gap:.5rem;padding:0;margin:0;font-size:.8125rem;color:var(--text-soft)">
      <li><a href="/" style="color:inherit">Home</a></li>
      <li aria-hidden="true">/</li>
      <li><a href="/destinations.html" style="color:inherit">Routes &amp; destinations</a></li>
      <li aria-hidden="true">/</li>
      <li aria-current="page">${esc(r.h1)}</li>
    </ol>
  </nav>

  <section class="page-hero" style="padding-top:clamp(2.5rem,5vw,4rem)">
    <div class="wrap">
      <p class="eyebrow">Private transfer</p>
      <h1>${esc(r.h1)}</h1>
      <p class="lead">${esc(r.lead)}</p>
      <div class="btn-row" style="margin-top:2rem">
        <a class="btn btn--wa" href="${WA}?text=${encodeURIComponent(`Hello Franck, I'd like a price for ${r.from} to ${r.to}.`)}" target="_blank" rel="noopener">
          <span>WhatsApp for a price</span>
        </a>
        <a class="btn btn--primary" href="${bookHref}">Get a fixed price</a>
      </div>
    </div>
  </section>

  <section class="trustbar" aria-label="At a glance">
    <div class="wrap">
      <div class="trustbar__inner">
        <div class="trustbar__item">
          <div class="trustbar__stat">${esc(r.duration)}</div>
          <div class="trustbar__label">Typical journey<br>in normal traffic</div>
        </div>
        <div class="trustbar__item">
          <div class="trustbar__stat">${esc(r.distance)}</div>
          <div class="trustbar__label">Door to door<br>by road</div>
        </div>
        <div class="trustbar__item">
          <div class="trustbar__stat">Fixed</div>
          <div class="trustbar__label">Price agreed<br>before you travel</div>
        </div>
        <div class="trustbar__item">
          <div class="trustbar__stat">Per car</div>
          <div class="trustbar__label">Not per person &mdash;<br>four cost the same as one</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap--narrow">
      <div class="stack">
${r.intro.map((p) => `        <p class="lead">${esc(p)}</p>`).join('\n')}
      </div>

      <h2 class="mt-3">What the journey looks like</h2>
      <ul class="checklist">
${r.expect.map((li) => `        <li>${esc(li)}</li>`).join('\n')}
      </ul>
    </div>
  </section>

  <section class="section section--dark">
    <div class="wrap">
      <div class="section-head">
        <hr class="rule">
        <h2>How else could you do it?</h2>
        <p class="lead">Honestly, including where the alternatives are the better call.</p>
      </div>
      <div class="grid grid--2up">
${r.alternatives.map(([name, body]) => `        <article class="card card--dark">
          <h3>${esc(name)}</h3>
          <p>${esc(body)}</p>
        </article>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap--narrow">
      <div class="section-head">
        <hr class="rule">
        <h2>${esc(r.to)} transfers &mdash; your questions</h2>
      </div>
      <div class="faq">
${r.faqs.map(([q, a]) => `        <div class="faq__item">
          <h3 style="margin:0">
            <button class="faq__q" type="button" aria-expanded="false">
              ${esc(q)}
              <span class="faq__icon" aria-hidden="true"></span>
            </button>
          </h3>
          <div class="faq__a"><div><p>${esc(a)}</p></div></div>
        </div>`).join('\n')}
      </div>
      <div class="btn-row mt-3">
        <a class="link-arrow" href="/faq.html">All questions answered <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </section>

  <section class="section section--sand section--tight">
    <div class="wrap">
      <div class="section-head">
        <hr class="rule">
        <h2>Other routes from Nice Airport</h2>
      </div>
      <div class="routes">
${others.map((x) => `        <a class="route" href="/${x.slug}.html">
          <div>
            <p class="route__name">${esc(x.h1)}</p>
            <p class="route__meta"><span>approx. ${esc(x.duration)}</span><span>${esc(x.distance)}</span></p>
          </div>
          <div class="route__fare"><strong>Fixed price</strong>quoted before you book</div>
        </a>`).join('\n')}
        <a class="route" href="/destinations.html">
          <div>
            <p class="route__name">Everywhere else on the Riviera</p>
            <p class="route__meta"><span>Villefranche, Antibes, Èze, Menton, Provence, Italy</span></p>
          </div>
          <div class="route__fare"><strong>See all</strong>routes &amp; journey times</div>
        </a>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="wrap">
      <div class="cta-panel">
        <h2>Get a price for ${esc(r.to)}.</h2>
        <p class="lead">
          Send the date, the flight number and how many of you there are. Franck replies
          himself, usually within the hour.
        </p>
        <div class="btn-row btn-row--center">
          <a class="btn btn--wa" href="${WA}" target="_blank" rel="noopener"><span>WhatsApp ${PHONE_DISPLAY}</span></a>
          <a class="btn btn--primary" href="${bookHref}">Use the booking form</a>
        </div>
      </div>
    </div>
  </section>

</main>
${foot()}`;
};

/* ---------- write pages ---------------------------------------------- */

console.log('\nBuilding route pages…');
for (const r of routes) {
  for (const k of ['slug', 'from', 'to', 'title', 'h1', 'metaDescription', 'lead', 'distance', 'duration']) {
    if (!r[k]) die(`Route "${r.slug || '(no slug)'}" is missing "${k}".`);
  }
  const file = path.join(root, `${r.slug}.html`);
  fs.writeFileSync(file, page(r));
  console.log(`  ✓ ${r.slug}.html — ${r.faqs.length} FAQs`);
}

/* ---------- sitemap --------------------------------------------------- */

const staticPages = [
  ['/', '1.0', 'monthly'],
  ['/services.html', '0.9', 'monthly'],
  ['/destinations.html', '0.9', 'monthly'],
  ['/book.html', '0.9', 'monthly'],
  ['/about.html', '0.7', 'yearly'],
  ['/faq.html', '0.7', 'monthly'],
  ['/reviews.html', '0.7', 'monthly']
];
const urls = [
  ...staticPages.map(([loc, pri, freq]) => ({ loc, pri, freq })),
  ...routes.map((r) => ({ loc: `/${r.slug}.html`, pri: '0.8', freq: 'monthly' }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`  ✓ sitemap.xml — ${urls.length} URLs`);

/* ---------- link the pages from destinations.html --------------------- */

{
  const file = path.join(root, 'destinations.html');
  let html = fs.readFileSync(file, 'utf8');
  const A = '<!-- ROUTEPAGES:START -->';
  const B = '<!-- ROUTEPAGES:END -->';
  const a = html.indexOf(A);
  const b = html.indexOf(B);
  if (a === -1 || b === -1) {
    console.log('  · destinations.html has no ROUTEPAGES markers — skipped');
  } else {
    const block = `\n      <div class="section-head" style="margin-top:clamp(3rem,6vw,4.5rem)">
        <hr class="rule">
        <h2>Routes in detail</h2>
        <p class="lead">Journey times, what the drive is actually like, and the questions people ask about each one.</p>
      </div>
      <div class="grid grid--3">
${routes.map((r) => `        <article class="card">
          <h3>${esc(r.h1)}</h3>
          <p>${esc(r.lead)}</p>
          <a class="link-arrow" href="/${r.slug}.html">${esc(r.to)} transfers <span aria-hidden="true">&rarr;</span></a>
        </article>`).join('\n')}
      </div>
      `;
    html = html.slice(0, a + A.length) + block + html.slice(b);
    fs.writeFileSync(file, html);
    console.log(`  ✓ destinations.html — linked ${routes.length} route pages`);
  }
}

console.log('\nDone.\n');
