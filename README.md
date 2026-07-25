# mrfranck.com

A rebuild of the website for **Mr. Franck** — Franck Auger, licensed private
driver on the French Riviera — replacing the existing Squarespace site.

Static HTML, CSS and vanilla JS. No framework, no build step, no dependencies.
Open `index.html` and it works.

---

## What changed, and why

The old Squarespace site said the right things but left the visitor with work to
do. The rebuild keeps its meaning — private driver, French Riviera, over a decade
of experience, fluent English, airport transfers and excursions from Nice to
Monaco, Cannes and Saint-Tropez — and rebuilds it around how an English-speaking
traveller actually decides.

**Positioning.** From *"Private Driver of the French Riviera"* (a description) to
**"The Riviera, without the driving"** (a reason to book). The site now argues a
case rather than listing services.

**The four objections, answered head-on.** Every visitor is silently asking the
same things: what will this cost me, who is going to turn up, will they speak
English, and what happens if my flight is late. Each now has a dedicated,
findable answer.

**A direct comparison against taxis and Uber.** The real competition isn't other
chauffeurs, it's *"can't we just get a taxi?"* — so the homepage answers that
question in a table instead of ignoring it.

**Fixed pricing as the central promise.** Repeated on every page: one flat,
all-in figure, tolls and parking included, agreed in writing before you travel.
The single biggest anxiety in this market is the fare surprise.

**WhatsApp as the primary call to action.** How this audience actually contacts a
driver abroad, with a sticky call/WhatsApp/quote bar on mobile.

**A booking form that ends the back-and-forth.** Flight number, passengers,
luggage, date, time — captured once, so Franck can quote on the first reply
instead of the third.

**Segments the old site left on the table.** Cruise shore days (Villefranche,
Cannes, Monaco) and event weeks (Cannes Film Festival, Monaco Grand Prix) are
high-value, heavily-searched, and English-speaking by default.

**Routes as content.** Each Nice Airport route lists a realistic journey time and
distance — the thing people are actually searching for, and something
Squarespace's template never surfaced.

**SEO and technical.** Unique titles and meta descriptions per page,
`TaxiService` and `FAQPage` structured data, a sitemap, `robots.txt`, semantic
headings, and 301 redirects preserving the old `/contact` and `/contact-1` URLs.

**Performance and accessibility.** A single ~31KB stylesheet, a ~6KB script, SVG
imagery, no third-party scripts or trackers — about 330KB for the whole site.
Keyboard-navigable, visible focus rings, labelled form fields,
`prefers-reduced-motion` respected, no content hidden behind JavaScript, and all
text checked to WCAG AA contrast (the brass accent is decorative only; small
text on light backgrounds uses a darker `--brass-ink`).

---

## ⚠️ Before this goes live

Read **[CONTENT-TODO.md](CONTENT-TODO.md)** first.

Reviews are **real and live** — four verbatim from Franck's Google profile, with
his 5.0 rating in the trust bar. Still needed before launch: **photography**
(above all a photo of Franck himself), a **form endpoint**, and ideally
**published prices**. Nothing about a real business — testimonials, prices,
licence numbers, biography — was invented to fill space.

To change reviews, edit `content/reviews.json` and run
`node tools/build-reviews.mjs`. It rewrites both pages plus the rating tile and
schema, and refuses to run on bad data rather than half-publishing.

---

## Structure

```
index.html            Home — the argument, comparison, routes, proof
services.html         Airport · cruise · excursions · hourly · events · business
destinations.html     Route table with journey times + destination guides
about.html            Franck, credentials, how he works
reviews.html          Testimonials (placeholders — see CONTENT-TODO.md)
content/reviews.json  Review data — the only file to edit when reviews change
tools/build-reviews.mjs  Renders that data into reviews.html and index.html
faq.html              Prices, arrivals, the car, booking (+ FAQPage schema)
book.html             Booking form with WhatsApp fallback
thank-you.html        Post-submission page
404.html              Not found
robots.txt            Crawler directives
sitemap.xml           Sitemap
netlify.toml          Hosting config, redirects, security headers, caching
assets/css/styles.css Design system + all styles
assets/js/site.js     Nav, accordions, reveals, form fallback
assets/img/           Generated placeholder artwork (see CONTENT-TODO.md)
```

## Design system

Defined as custom properties at the top of `assets/css/styles.css`.

- **Ink** `#0d151d` — near-black navy, the Mediterranean at night
- **Sand** `#f7f2e9` — warm ivory, Riviera stone
- **Brass** `#c1994f` — the single accent; used sparingly and always to mean "act"
- **Sea** `#1d5560` — deep teal, secondary
- **Type** — Cormorant Garamond for display (editorial, unhurried, expensive),
  Inter for interface. Both from Google Fonts with `display=swap`; both degrade
  to good system fallbacks if the network is slow.

## Local preview

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deployment

Any static host. Point it at the repository root; there is nothing to build.

- **Netlify** — `netlify.toml` is ready: publish directory `.`, no build
  command. Redirects, security headers and asset caching are configured.
- **Cloudflare Pages** — build command empty, output directory `/`. Recreate the
  redirects from `netlify.toml` in a `_redirects` file.
- **GitHub Pages** — works, but the root-relative paths (`/assets/...`) require
  a custom domain or a user/organisation site rather than a project subpath.

After DNS is switched from Squarespace, confirm the two legacy redirects
(`/contact`, `/contact-1`) resolve, then resubmit the sitemap in Google Search
Console.

## Contact details in the markup

Franck's number appears as `tel:+33614703077` and `https://wa.me/33614703077`
throughout. If it ever changes, those two strings plus the displayed
`+33 6 14 70 30 77` are the only things to update — and the WhatsApp fallback in
`assets/js/site.js`.
