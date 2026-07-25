# Content to collect from Franck before launch

The site is structurally complete and will run as-is. The items below are things
**only Franck can supply** — everything here is either a placeholder or a
deliberate omission, because inventing it would be misrepresenting a real
business.

Ordered by conversion impact. The first three are worth more than everything
else on this list combined.

---

## 🔴 Blockers — do not launch without these

### 1. Real reviews
**Files:** `content/reviews.json` (the only file to edit)

Every quote currently on `reviews.html` and `index.html` is placeholder text,
visually flagged with `class="is-placeholder"` (a hatched background and dashed
outline) so it cannot be published by accident.

**Don't edit the HTML.** Paste the reviews into `content/reviews.json`, then run:

```bash
node tools/build-reviews.mjs
```

That regenerates the cards on `reviews.html` and the featured three on
`index.html`, converts quotes and dashes to match the site's typography, and
adds the `AggregateRating` schema — but only if you fill in the `aggregate`
object with the **real** rating and review count from the Google profile.

Rules that matter:

- Reviews must be **verbatim**. Don't tidy them up or write them yourself.
- Mark exactly three as `"featured": true` — those are the home-page three.
- If there are only three good reviews, ship three. Three real ones beat six
  invented ones, and invented ones are a legal and reputational risk.
- Never invent the star rating. A fabricated `AggregateRating` breaches
  Google's review-snippet policy and gets rich results suppressed site-wide.

The script refuses to run on invalid JSON or a review with no rating, and does
nothing at all if the array is empty — it can't blank the pages by accident.

**Source:** Franck's Google Business Profile —
<https://maps.app.goo.gl/KxWfuFHCHUpErrmb9>

### 2. ~~A Google Business Profile~~ ✅ Already exists

Franck's profile is live at <https://maps.app.goo.gl/KxWfuFHCHUpErrmb9> and is
now linked from `reviews.html` (both "read every review" and "leave a review")
and referenced in the homepage `sameAs` structured data.

Two small follow-ups:

- Swap the `sameAs` value in `index.html` for the **full** canonical Google
  Maps URL rather than the `maps.app.goo.gl` short link — search engines
  associate entities more reliably with the canonical form.
- Keep asking guests for reviews. A steady trickle is what holds a one-man
  operation in the map pack against the transfer aggregators, and it's the
  cheapest marketing available to him.

### 3. Photography
**Files:** `assets/img/`

Everything in `assets/img/` is generated placeholder artwork — abstract Riviera
coastlines. They look deliberate rather than broken, so the site is presentable
today, but real photographs will convert meaningfully better.

Shoot list, in priority order:

| Replaces | What to shoot |
|---|---|
| `franck-portrait.svg` | **Franck himself.** Beside the car, daylight, smiling, no sunglasses. This is the most important image on the site — people are buying a person. |
| `vehicle.svg` | The car, clean, exterior three-quarter view; plus one interior shot of the rear seats. |
| `hero-riviera.svg` | A wide Riviera landscape — the coast road, Èze, or the bay at Villefranche. Landscape, high resolution. |
| `dest-*.svg` | One recognisable shot per destination: Monaco, Cannes, Saint-Tropez, Èze, Villefranche, Antibes, Provence, Italy. |

Keep the same filenames (swap the extension to `.jpg`/`.webp` and update the
`src` attributes), export at roughly 1600px wide, and compress. Update the
`alt` text at the same time — the placeholders currently say "Placeholder
image", which must not go live.

---

## 🟠 High value — do these in week one

### 4. Publish real fixed prices
**Files:** `index.html`, `destinations.html`

Every route row currently reads **"Fixed price — quoted before you book"**.
That is honest and the page works, but published prices are the biggest single
conversion lever for this kind of business: English-speaking travellers
comparing options will silently drop anyone who makes them ask.

Once Franck confirms his rates, swap the fare block in each `.route` link:

```html
<!-- from -->
<div class="route__fare"><strong>Fixed price</strong>quoted before you book</div>

<!-- to -->
<div class="route__fare"><strong>from €120</strong>fixed, all-in</div>
```

Prices needed (Nice Airport, one way, per car, up to 4 passengers):
Nice centre · Villefranche · Antibes/Juan-les-Pins · Cannes · Èze/Cap Ferrat ·
Monaco · Saint-Paul-de-Vence · Menton · Saint-Tropez · Ventimiglia/San Remo.

Also useful: an hourly rate, a half-day rate and a full-day rate for
`services.html#hourly`, which currently says "minimum booking applies — ask".

### 5. Set the booking form endpoint
**File:** `book.html`

The form posts to `action="REPLACE_WITH_FORM_ENDPOINT"`. Until that's replaced,
`assets/js/site.js` detects it and gracefully composes a pre-filled WhatsApp
message instead — so the form never silently fails, but Franck also never gets
an email.

Replace it with a free form endpoint:
- **Formspree** (`https://formspree.io/f/xxxxxxx`) — easiest, free tier is fine.
- **Netlify Forms** — if hosting on Netlify, add `netlify` and
  `name="booking"` attributes to the `<form>` instead of an action URL.
- **Basin** or **Formsubmit** — equivalent alternatives.

The hidden `_subject` and `_next` fields are already set up for Formspree, and
`_gotcha` is a spam honeypot. `_next` points at `/thank-you.html`.

### 6. Confirm Franck's real credentials
**File:** `about.html` (the "boring, important part" section)

The page states he is a registered French VTC operator holding the
professional driver's card, and carries commercial passenger-transport
insurance — which is what the licence requires. Please confirm both are current,
and consider adding:

- The **VTC registration number** (it builds real trust with cautious travellers).
- The **exact vehicle**: make, model, passenger capacity, luggage capacity.
  There's a TODO comment in the card. "Mercedes-Benz E-Class · up to 4
  passengers · 3 large cases" converts; "a comfortable saloon" does not.

### 7. Franck's own story
**File:** `about.html`

There's a marked TODO block waiting for 3–5 sentences of genuine background:
where he grew up, what he did before driving, why he started, what he still
likes about the coast. On a one-person service business this paragraph is
routinely the highest-performing copy on the whole site. It needs to be his
words, not invented ones.

---

## 🟡 Worth doing soon

### 8. Facts to verify or correct
These are written from the current mrfranck.com and reasonable industry norms.
Franck should confirm each, and anything he doesn't do should be deleted:

- [ ] Child and booster seats provided free of charge
- [ ] Payment by card **and** cash accepted at the end of the journey
- [ ] No deposit taken at booking
- [ ] Flight tracking with delays absorbed at no extra cost
- [ ] Meet inside the arrivals hall with a name sign
- [ ] Airports covered: Nice, Marseille, Toulon-Hyères, Genoa
- [ ] Cruise ports covered: Villefranche, Cannes, Monaco, Marseille
- [ ] Cross-border trips into Italy
- [ ] Wheelchair / reduced-mobility capability (claimed as "usually fine" in the FAQ)
- [ ] Larger vehicles available for 5+ passengers
- [ ] Business invoicing / account arrangements
- [ ] Telegram on the same number (carried over from the old site)
- [ ] Actual response time — the site says "usually within the hour"
- [ ] The cancellation policy described in `faq.html`

### 9. Legal pages
France and the EU expect two things this site doesn't yet have:

- **Mentions légales** — legally required for a French business website
  (trading name, SIRET, address, contact, hosting provider).
- **Privacy notice** — GDPR, because the booking form collects personal data.

Both are short. Add them as `legal.html` and `privacy.html`, and link them from
the footer's bottom row.

### 10. A French version
Franck's market is English-speaking, and this site is built for that market
deliberately. But a French-language version at `/fr/` would pick up local and
corporate work, with `hreflang` tags linking the two. Worth revisiting once the
English site is earning.

---

## Notes on what was deliberately *not* written

To be explicit about where the line was drawn, because a real business's
reputation depends on it:

- **No invented testimonials, names or ratings.**
- **No invented prices** — a published price can be held to.
- **No invented licence or registration numbers.**
- **No invented biography** for a real person.
- **No specific vehicle make or model**, since it isn't known.
- Journey times and distances are stated as *approximate estimates* and labelled
  as such, because real Riviera traffic makes anything firmer dishonest.
