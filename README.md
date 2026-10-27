# Toolbench

A static, zero-build collection of browser-based developer tools, set up for
overseas hosting plus Google AdSense.

Everything runs client-side. No backend, no database, no npm install, no bundler.
Open the HTML files and they work.

---

## Structure

```
toolbench/
├── index.html              homepage with searchable tool grid
├── about.html              author / site story  (edit this)
├── contact.html            contact details      (edit this)
├── privacy.html            privacy policy, incl. AdSense cookie disclosure
├── terms.html              terms of use
├── robots.txt
├── sitemap.xml
├── ads.txt                 placeholder — fill in after AdSense approval
├── assets/
│   ├── style.css           full design system, light + dark, CSS variables
│   └── app.js              theme toggle, search, copy buttons, ad bootstrap
└── tools/
    ├── json-formatter.html      beautify / minify / sort keys / error positions
    ├── base64.html              UTF-8 safe, URL-safe, image to Data URI
    ├── diff-checker.html        line-level LCS diff, whitespace/case options
    ├── case-converter.html      10 naming conventions at once
    ├── url-encoder.html         encodeURI vs encodeURIComponent + URL breakdown
    ├── jwt-decoder.html         header/payload/claims, expiry in plain English
    ├── hash-generator.html      MD5 + SHA-1/256/512, text or file
    ├── regex-tester.html        live highlighting, capture groups, positions
    ├── uuid-generator.html      bulk v4 via crypto, format options
    ├── timestamp-converter.html seconds/ms/µs/ns auto-detection
    └── color-converter.html     HEX/RGB/HSL/HSV + WCAG contrast
```

---

## Before you deploy — replace these

Everything below is a placeholder. Nothing works correctly until they are changed.

| What | Where | Current value |
|---|---|---|
| Domain | `canonical`, `og:url`, `sitemap.xml`, `robots.txt` | `toolbench-tools.pages.dev` |
| Brand name | `brand` element in every page, `<title>` tags | `Toolbench` |
| Email | `contact.html`, privacy/terms references | `hello@toolbench-tools.pages.dev` |
| `about.html` author section | the paragraph under "Who runs this site" | generic text |
| AdSense publisher ID | `assets/app.js`, `AD_CLIENT` constant | empty |
| `ads.txt` | uncomment the line and add your pub ID | commented out |

Change the domain later with the script — it reads the current value from
`sitemap.xml`, so running it repeatedly is safe:

```bash
python scripts/set-domain.py yourdomain.com
```

It rewrites `canonical`, `og:url`, `sitemap.xml` and `robots.txt` together. The
`example.com` strings left in `tools/json-formatter.html`, `regex-tester.html`
and `url-encoder.html` are demo data inside sample payloads — leave those alone.

---

## Preview locally

A local server is needed because `canonical` and relative paths behave oddly
under `file://`, and because `crypto.randomUUID` requires a secure context.

```bash
cd toolbench
python -m http.server 8080
# then open http://localhost:8080
```

`localhost` counts as a secure context, so the UUID generator's
`crypto.randomUUID` path is exercised properly.

---

## Deploy

Three routes. Pick by how often you expect to ship.

### Option 1 — Git auto-deploy (set up once, then just push)

1. Create an **empty** GitHub repo named `toolbench-tools` — no README, no
   .gitignore, no license. It must be empty or the first push will conflict.
2. From this folder:

   ```bash
   git remote add origin https://github.com/<your-username>/toolbench-tools.git
   git push -u origin main
   ```

3. Cloudflare dashboard → Compute (Workers & Pages) → Create → Pages →
   **Connect to Git** → authorise GitHub → pick the repo.
4. Settings: Framework preset **None**, Build command **empty**, Build output
   directory **`/`**. Save and Deploy.

The first build takes about 30 seconds. After that every `git push` to `main`
redeploys automatically, and pushes to other branches produce preview URLs you
can review before merging.

**The project name must match the domain in the files.** If you name the
Cloudflare project something other than `toolbench-tools`, the site will live at
a different `*.pages.dev` host — run this once to fix every canonical URL:

```bash
python scripts/set-domain.py your-actual-project.pages.dev
```

### Option 2 — Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=toolbench-tools
```

Useful when you want to ship without a commit, or from a machine that is not
set up with git credentials.

### Option 3 — Drag and drop

Cloudflare dashboard → Create → Pages → **Upload assets** → drop this folder in.
No git, no CLI. The catch is that every update means re-uploading the whole
folder by hand.

### Custom domain later

Under the Pages project's *Custom domains* tab, add the domain and point its
nameservers at Cloudflare (or use the CNAME it gives you). Certificates issue
automatically. Then run `scripts/set-domain.py` with the new host so `canonical`,
`sitemap.xml` and `robots.txt` stay in sync.

Also redirect `www` to the apex (or the reverse) with a Cloudflare redirect rule.
Serving both with a 200 makes them duplicate content in Google's eyes.

### Why Cloudflare over Vercel

Unlimited bandwidth on the free tier, and no commercial-use restriction on the
free plan. Vercel's Hobby tier is limited to non-commercial projects, and an
ad-supported site is commercial. GitHub Pages has a similar restriction on
commercial use.

---

## Enabling AdSense

### The realistic timeline

Do not apply the moment the site is live. AdSense rejects freshly launched sites
with too little content, and repeated rejections make later reviews harder.
The commonly cited bar is **at least 30 substantial, original pages**; the
"content insufficient" rejection accounts for roughly 70% of all rejections.

Realistic order of operations:

1. **Now → week 2.** Deploy with the ad slots empty. The site ships with 11 tools;
   target 20–30. Each tool page here already carries ~800 words of genuine
   explanation and FAQ — that is what gets counted as content, so keep that standard.
2. **Week 2 → week 8.** Get the site indexed. Submit the sitemap in Google
   Search Console, request indexing for each new page, and wait for pages to
   actually start appearing in results.
3. **Week 8+.** Once you have 30+ pages and at least some organic traffic,
   apply at <https://adsense.google.com>.

### Turning ads on

1. Get approved, note your `ca-pub-…` ID.
2. In `assets/app.js`, set:

   ```js
   var AD_CLIENT = 'ca-pub-1234567890123456';
   ```

3. Add the AdSense loader script to the `<head>` of each page (or inject it in
   `app.js` — one edit instead of five):

   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```

4. Every `.ad-slot` with a `data-ad-slot` attribute is now filled automatically
   by the code in `initAdSlots()`. Slots without a real ad unit ID will stay as
   dashed placeholders — create the units in the AdSense dashboard first, then
   replace the dummy numbers `1234567890`–`1234567894` with the real slot IDs.
5. Fill in `ads.txt` and make sure it is reachable at
   `https://yourdomain.com/ads.txt`.

### Where ads should go

Three placements earn most of the revenue:

- **Below the fold on the homepage**, after the tool grid — readers who scroll
  that far are engaged.
- **In-article**, between the tool panel and the explanation text. This is the
  highest-performing slot on a tool page.
- **Above the footer**, on long explanation pages only.

Avoid: sticky sidebars on mobile (they get flagged as intrusive), pop-overs,
and any placement that shifts content after load (hurts Core Web Vitals).

---

## Adding a new tool

1. Copy `tools/json-formatter.html` as a starting point. It has the full
   structure: breadcrumb, tool panel, ad slot, prose section, FAQ, related tools.
2. Rename and rewrite the `<title>`, `<meta name="description">`, `<link rel="canonical">`,
   `<h1>` and prose. The description should be one specific sentence, not a
   keyword list.
3. Add a card to `index.html` in the right `data-tool-group`, plus a
   `data-keywords` attribute so search picks it up.
4. Add the URL to `sitemap.xml`.

Content standard for each page, if AdSense approval matters to you:

- One `<h1>`, matching the search intent exactly.
- A working tool, not a screenshot of one.
- At least two `<h2>` sections explaining the mechanism, including edge cases.
- A FAQ block with 3–5 real questions. Adding `FAQPage` structured data helps
  the page win a rich result.
- Internal links to 2–3 related tools.

---

## Design system

All colours are CSS custom properties in `assets/style.css`, defined twice —
once for light, once under `html[data-theme="dark"]`. To rebrand, change
`--primary` in both blocks and everything follows.

The theme is applied by a small inline script in each page's `<head>`, which
runs before first paint to avoid a flash of the wrong theme. Order matters:
it reads `localStorage`, falls back to `prefers-color-scheme`.

---

## Known gaps

- No `FAQPage` JSON-LD. Worth knowing: Google narrowed FAQ rich results in 2023
  to a small set of authoritative government and health sites, so the markup
  now wins you almost nothing. The visible FAQ blocks are doing the SEO work
  here — keep them.
- No `Article` / `SoftwareApplication` schema. This one *does* still pay off for
  tool pages; `SoftwareApplication` with `applicationCategory` and
  `offers: { price: 0 }` can surface a rich snippet.
- No Open Graph image. A 1200×630 PNG referenced from `og:image` lifts
  click-through on social shares.
- No 404 page. Cloudflare Pages serves its own default; a branded one is nicer.
- Ad slot IDs are placeholders and will render as dashed boxes until filled in.
- No consent banner. Required if you get meaningful EU/UK traffic — Google's
  Funding Choices (free, inside AdSense) covers it without extra code.
