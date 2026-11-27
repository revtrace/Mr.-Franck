#!/usr/bin/env python3
"""Mirror the live Squarespace site at www.mrfranck.com into ./public as plain static files.

What it does, per page:
  * keeps Squarespace's own HTML and CSS, so layout and styling match the live site
  * removes every Squarespace script (analytics, editor runtime, cart, reCAPTCHA)
  * downloads every stylesheet, font and image into public/assets so nothing loads
    from Squarespace once the subscription is cancelled
  * replaces the background video player with a plain <video> tag (assets/video/hero.mp4)
  * rebuilds the two Squarespace forms as plain HTML forms with the same fields
  * substitutes Archivo for Acumin Pro (Adobe Fonts, licensed to Squarespace only)

Run while the Squarespace site is still online:
    python3 tools/mirror.py
The hero video is fetched separately by tools/fetch-video.sh.
"""
import hashlib, html, json, os, re, subprocess, sys, urllib.parse
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public")
BASE = "https://www.mrfranck.com"
PAGES = {  # Squarespace slug -> output file
    "home": "index.html",
    "about": "about.html",
    "services": "services.html",
    "destinations": "destinations.html",
    "reviews": "reviews.html",
    "contact": "contact.html",
    "contact-1": "contact-1.html",
    "this-page-does-not-exist": "404.html",  # Squarespace's own "page not found" page
}
failed = []
cache = {}


def fetch(url, allow_404=False):
    flags = "-sSL" if allow_404 else "-sSLf"
    r = subprocess.run(["curl", flags, "--max-time", "60", url], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode()[:200])
    return r.stdout


def absolute(url, base):
    if url.startswith("//"):
        url = "https:" + url
    url = urllib.parse.urljoin(base, url)
    return url.replace("http://", "https://", 1)


def local_name(url):
    p = urllib.parse.urlparse(url)
    name = urllib.parse.unquote(os.path.basename(p.path)) or "file"
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-").lower() or "file"
    return hashlib.sha1(url.encode()).hexdigest()[:8] + "-" + name


def download(url, kind):
    """Save url under public/assets/<kind>/ and return its site-root path."""
    if url in cache:
        return cache[url]
    rel = f"/assets/{kind}/{local_name(url)}"
    try:
        data = fetch(url)
    except Exception as e:
        failed.append((url, str(e)))
        cache[url] = None
        return None
    if kind == "css":
        data = rewrite_css(data.decode("utf-8", "replace"), url).encode()
    path = OUT + rel
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    cache[url] = rel
    return rel


def kind_for(url):
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
    if ext in (".woff", ".woff2", ".ttf", ".eot", ".otf") or "/fonts/" in url:
        return "fonts"
    return "img"


def rewrite_css(css, base):
    def repl(m):
        raw = m.group(2).strip()
        if raw.startswith(("data:", "#", "%23")):
            return m.group(0)
        frag = ""
        if "#" in raw:
            raw, frag = raw.split("#", 1)
            frag = "#" + frag
        url = absolute(raw, base)
        rel = download(url.split("?")[0] if "squarespace-cdn.com/content/v2" in url else url, kind_for(url))
        return f"url('{rel}{frag}')" if rel else m.group(0)
    return re.sub(r"url\((['\"]?)([^)'\"]+)\1\)", repl, css)


def build_form(cfg, form_id):
    """Plain HTML version of a Squarespace form block, using its field definitions."""
    rows = []
    for f in cfg["formFields"]:
        t, fid, title = f["type"], f["id"], html.escape(f.get("title", ""))
        req = f.get("required")
        star = ' <span class="mf-req">(required)</span>' if req else ""
        r = " required" if req else ""
        desc = f'<p class="mf-desc">{html.escape(f["description"])}</p>' if f.get("description") else ""
        if t == "name":
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>'
                        f'<input type="text" name="{title}" autocomplete="name"{r}></label>')
        elif t == "email":
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>'
                        f'<input type="email" name="{title}" autocomplete="email"{r}></label>')
        elif t == "phone":
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>'
                        f'<input type="tel" name="{title}" autocomplete="tel" placeholder="+33 6 00 00 00 00"{r}></label>')
        elif t == "date":
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>'
                        f'<input type="date" name="{title}"{r}></label>')
        elif t == "textarea":
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>{desc}'
                        f'<textarea name="{title}" rows="5"{r}></textarea></label>')
        else:
            rows.append(f'<label class="mf-field"><span class="mf-title">{title}{star}</span>'
                        f'<input type="text" name="{title}"{r}></label>')
    thanks = cfg.get("formSubmissionMessage", {}).get("html") or "<p>Thank you!</p>"
    button = html.escape(cfg.get("formSubmitButtonText") or "Submit")
    name = html.escape(cfg.get("formName") or "Website form")
    return (
        f'<form class="mf-form" data-mf-form novalidate>'
        f'<input type="hidden" name="_subject" value="mrfranck.com: {name}">'
        f'<input type="hidden" name="Form" value="{name}">'
        f'<input type="text" name="_honey" class="mf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">'
        + "".join(rows) +
        f'<p class="mf-error" role="alert" hidden></p>'
        f'<button type="submit" class="sqs-block-button-element--medium sqs-button-element--primary sqs-block-button-element mf-submit">{button}</button>'
        f'</form><div class="mf-thanks" hidden>{thanks}</div>'
    )


VIDEO = ('<video class="mf-video" autoplay muted loop playsinline preload="auto" '
         'poster="/assets/video/hero-poster.jpg" style="width:100%;height:100%;object-fit:cover;display:block">'
         '<source src="/assets/video/hero.mp4" type="video/mp4"></video>')


def process(slug, outfile):
    raw = fetch(f"{BASE}/{slug}", allow_404=(outfile == "404.html")).decode("utf-8")
    soup = BeautifulSoup(raw, "html.parser")

    # Forms: read the field definitions before scripts are stripped.
    forms = {}
    for s in soup.find_all("script", id=re.compile(r"^form-context-")):
        try:
            forms[s["id"].replace("form-context-", "")] = json.loads(s.string)
        except Exception:
            pass

    for s in soup.find_all("script"):
        if s.get("type") != "application/ld+json":
            s.decompose()
    for tag in soup.find_all("link", rel=lambda v: v and any(x in v for x in ("preconnect", "dns-prefetch", "preload"))):
        tag.decompose()
    for n in soup.find_all("noscript"):
        n.decompose()

    for link in soup.find_all("link", rel="stylesheet"):
        rel = download(absolute(link["href"], BASE), "css")
        if rel:
            link["href"] = rel
    for st in soup.find_all("style"):
        if st.string and "url(" in st.string:
            st.string = rewrite_css(st.string, BASE)

    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-image"):
            if img.get(attr) and not img[attr].startswith("data:"):
                rel = download(absolute(img[attr], BASE), "img")
                if rel:
                    img[attr] = rel
        for attr in ("srcset", "sizes", "data-loader", "elementtiming"):
            if attr in img.attrs and attr == "srcset":
                del img[attr]

    for link in soup.find_all("link", rel=lambda v: v and ("icon" in v or "image_src" in v)):
        rel = download(absolute(link["href"], BASE), "img")
        if rel:
            link["href"] = rel
    for meta in soup.find_all("meta"):
        c = meta.get("content", "")
        if "squarespace" in c and re.search(r"\.(png|jpe?g|gif|webp)", c, re.I):
            rel = download(absolute(c, BASE), "img")
            if rel:
                meta["content"] = BASE + rel

    # Cart link and "/home" links.
    for a in soup.find_all("a", href=True):
        if a["href"] in ("/home", f"{BASE}/home"):
            a["href"] = "/"
    for el in soup.select('[class*="header-actions-action--cart"], .sqs-cart-dropzone, #floatingCart'):
        el.decompose()

    # Background video.
    for v in soup.select(".sqs-native-video"):
        player = v.select_one(".native-video-player")
        if player:
            player.clear()
            player.append(BeautifulSoup(VIDEO, "html.parser"))
        for a in ("data-config-video", "data-config-settings", "data-config-loading"):
            v.attrs.pop(a, None)

    # Forms.
    for block in soup.select(".sqs-block-form"):
        content = block.select_one(".sqs-block-content")
        fid = next((k for k in forms if k in str(block)), None) or (list(forms)[0] if forms else None)
        if content and fid:
            content.clear()
            content.append(BeautifulSoup(build_form(forms[fid], fid), "html.parser"))

    # Editor/runtime data that only Squarespace's scripts read (~90% of the homepage's weight).
    for t in soup.find_all(True):
        for a in ("data-current-styles", "data-current-context", "data-language-picker",
                  "data-block-scripts", "data-block-css", "data-block-json"):
            t.attrs.pop(a, None)

    # Structured data and social tags: point the logo at our copy.
    logo = next((v for k, v in cache.items() if v and "logo" in k.lower()), None)
    for s in soup.find_all("script", type="application/ld+json"):
        if logo and s.string:
            s.string = re.sub(r'(https?:)?//[a-z0-9.-]*squarespace[a-z0-9.-]*/[^"]*', BASE + logo, s.string)

    # Our CSS and JS.
    soup.head.append(BeautifulSoup('<link rel="stylesheet" href="/assets/css/mirror.css">', "html.parser"))
    soup.body.append(BeautifulSoup('<script src="/assets/js/mirror.js" defer></script>', "html.parser"))

    out = str(soup)
    out = re.sub(r"\n\s*\n\s*\n+", "\n\n", out)  # Squarespace emits thousands of blank lines
    with open(os.path.join(OUT, outfile), "w", encoding="utf-8") as f:
        f.write(out)
    print(f"{slug:14} -> {outfile}  ({len(out)//1024} KB)")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for slug, outfile in PAGES.items():
        process(slug, outfile)
    if failed:
        print(f"\n{len(failed)} asset(s) could not be downloaded (left pointing at Squarespace):")
        for u, e in failed:
            print("  ", u, "-", e.strip())
