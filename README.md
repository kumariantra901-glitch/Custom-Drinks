# Marigold Sip Co. — Website

A premium, fully responsive 5-page marketing site for a custom drink & specialty beverage business, built with plain HTML, CSS and JavaScript (no build step, no dependencies to install).

## Pages
- `index.html` — Home
- `signature-drinks.html` — Signature Drinks menu with filters
- `build-your-own.html` — Interactive drink builder with a live SVG cup preview and order queue
- `about.html` — Story, timeline, sourcing, team
- `contact.html` — Contact form, FAQ accordion, hours, map, newsletter

## Folder structure
```
/
├── index.html
├── signature-drinks.html
├── build-your-own.html
├── about.html
├── contact.html
├── robots.txt
├── sitemap.xml
├── .nojekyll
├── css/
│   └── styles.css
├── js/
│   ├── main.js       (nav, scroll reveals, FAQ, filters, forms, toasts)
│   └── builder.js     (drink builder logic — this page only)
└── images/            (all SVG icons & illustrations, relative paths only)
```

## Deploying to GitHub Pages
1. Create a new GitHub repository (or use an existing one).
2. Upload/commit **the entire contents of this folder** to the repository root (not inside a subfolder), keeping the folder structure intact.
3. In the repo, go to **Settings → Pages**, set **Source** to the `main` branch, root folder, and save.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a few minutes.

No build tools, npm install, or configuration are required — every path in the HTML/CSS/JS is relative, so the site works immediately after upload.

## Notes on the contact & newsletter forms
This is a static site with no backend, so the contact and newsletter forms currently validate input client-side and show a success confirmation, but **do not actually deliver email** on their own. Two easy ways to make them fully functional without writing a server:
- **Formspree / Getform / Basin**: sign up for a free form-endpoint service, then change the `<form>` tag's behavior in `contact.html` / the newsletter forms to POST to your endpoint (their docs give you the exact snippet).
- **Mailto fallback**: already included — the contact card links directly to `mailto:hello@marigoldsipco.example`, and the drink builder's "Email This Order to Us" button opens a pre-filled email in the visitor's mail client.

Update the placeholder email address, phone number, and street address (search for `marigoldsipco.example`, `(503) 555-0148`, and `214 Marigold Lane`) with your real business details before launch.

## Customizing
- **Colors & type**: all design tokens live at the top of `css/styles.css` under `:root`.
- **Drinks menu**: edit the `<article class="drink-card">` blocks in `index.html` and `signature-drinks.html`.
- **Builder options/pricing**: edit the `data-value` / `data-price` attributes on the `.option-tile` buttons in `build-your-own.html`; the pricing logic reads them automatically in `js/builder.js`.
- **Images**: everything in `/images` is hand-built SVG (no external image licensing to worry about) — swap any file for a JPG/PNG of your own and update the matching `<img src="images/...">` reference.

## Performance & accessibility
- No external JS frameworks; total custom CSS/JS is a few hundred KB uncompressed.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), alt text on all meaningful images, visible focus states, and `prefers-reduced-motion` support are included.
- Fonts (Fraunces, Plus Jakarta Sans) load from Google Fonts with `preconnect` for speed; swap for self-hosted fonts if you need to work fully offline.
