# mrfranck.com

A static copy of the Mr. Franck Squarespace site, for hosting on Cloudflare. Same design, same
text, same pages, same URLs. Nothing loads from Squarespace, so it keeps working after the
Squarespace subscription is cancelled.

```
public/              the website: this folder is what gets deployed
  index.html         /            (Squarespace "home")
  about.html         /about
  services.html      /services
  destinations.html  /destinations
  reviews.html       /reviews
  contact.html       /contact     (contact form)
  contact-1.html     /contact-1   ("Book Now" page and form)
  404.html           page-not-found
  assets/            Squarespace's CSS, fonts and logo, the hero video, plus mirror.css / mirror.js
  _redirects         /home -> /
  _headers           security and caching headers
wrangler.jsonc       Cloudflare config (Workers static assets, serves ./public)
tools/mirror.py      re-creates public/*.html from the live Squarespace site
tools/fetch-video.sh re-downloads the homepage video
```

## What differs from Squarespace

- **Heading font.** Squarespace uses Acumin Pro through its own Adobe Fonts licence, which does
  not transfer. Headings use Archivo instead (free, very similar). With an Adobe Fonts licence for
  the domain, add your kit's `<link>` to each page and delete the four `@font-face` rules at the
  top of `public/assets/css/mirror.css`.
- **Forms.** Squarespace forms only run on Squarespace. Both forms are rebuilt with the same fields,
  button text and thank-you message, and send each submission through FormSubmit (formsubmit.co)
  to kris@hutch.agency, copied to mrfranckdriver@gmail.com. Replying to the email replies to the
  visitor. Recipients are set at the top of `public/assets/js/mirror.js`.
  **The first real submission sends a one-time activation email to kris@hutch.agency; click it
  before forms are delivered.** Squarespace's reCAPTCHA is replaced by a hidden honeypot field.
- **No Squarespace extras**: no cookie banner, cart, analytics or newsletter sign-ups. The
  "Email" fields used to add people to a Squarespace mailing list; that list stays in Squarespace,
  so export it before cancelling if it matters.

## Deploy to Cloudflare

1. Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo and
   branch. Leave the build command empty; the deploy command is `npx wrangler deploy` (it reads
   `wrangler.jsonc`). Check the site on the `*.workers.dev` URL it gives you.
2. Move DNS: add `mrfranck.com` to Cloudflare (Websites → Add a domain), then change the
   nameservers at the registrar. If the domain was bought through Squarespace Domains, the
   nameservers are changed in the Squarespace domain panel; the registration itself can stay there
   or be transferred to Cloudflare Registrar later.
3. In the Worker → Settings → Domains & Routes, add custom domains `www.mrfranck.com` and
   `mrfranck.com`. Keep `www` as the main one (all canonical links use it) and add a redirect rule
   from the bare domain to `https://www.mrfranck.com`.
4. Send a test message through `/contact`, click the FormSubmit activation email in kris@hutch.agency,
   send another, and confirm it reaches both inboxes.
5. Only then cancel Squarespace.

## Editing text later

Edit the HTML in `public/` directly. The markup is Squarespace's, so it is verbose; search for the
sentence you want to change. Do not re-run `tools/mirror.py` after hand edits: it overwrites the
pages from the live Squarespace site, and it stops working once that site is gone.
