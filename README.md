# Architectural CAD Collections

English storefront for the AutoCAD/CAD resource product previously published as a legacy multi-page HTML shop.

Production domain:

```text
https://autocadeng.boss888.net/
```

This repo is designed for GitHub Pages or Cloudflare Pages. It contains the public storefront, English 500tools pages, Cloudflare delivery Worker example, and deployment notes. It does **not** contain the paid product zip.

## What Changed

- Replaced the old product-folder structure with a polished English single-page storefront.
- Removed PayPal and ECPay messaging from the buyer flow.
- Uses Gumroad as the only checkout CTA.
- Imports the full public product-preview gallery from the BOSS888 reference package: `395` images across `30` product tabs.
- Documents the private Cloudflare R2 delivery model for the paid product file.
- Rebuilt `500tools` as English companion pages.
- Added SEO, Open Graph, product JSON-LD, responsive layout, FAQ, support email, and professional-use disclaimer.

## Public Site Files

- `index.html` - main English product page.
- `500tools/` - English tool hub and category pages.
- `assets/cad/` - public preview images only.
- `gallery-data.js` - categorized product-preview data for the tabbed storefront gallery.
- `R2_DELIVERY.md` - product-file upload and fulfillment checklist.
- `cloudflare-worker/` - optional Gumroad webhook to R2 download Worker example.
- `_headers` - Cloudflare Pages security/cache headers.
- `robots.txt` and `sitemap.xml` - baseline crawler files.
- `CNAME` - GitHub Pages custom domain target: `autocadeng.boss888.net`.

## Product File

The paid digital product should be uploaded to Cloudflare R2, not GitHub.

- File name: `01-Architectural CAD Collections.zip`
- Size: `236,651,149` bytes, about `225.69 MiB`
- SHA-256: `bbaf1de88bba38a83193c4a80cb5fec770e1e135bdf5c503dddfb326f2421415`
- Local source checked: `G:/Obsidian雲端/江毓祥資料庫/大腦系統/資源共享/@網站資料/@Autocad 英文版99元/商品下載檔/01-Architectural CAD Collections.zip`

## Checkout

The storefront currently points all buy buttons to:

```text
https://caddesigner.gumroad.com/l/tjnfu
```

If you create a dedicated Gumroad product for this English AutoCAD bundle, replace `SITE_CONFIG.gumroadUrl` and every static `href` in `index.html` with the new Gumroad product URL.

## Delivery Model

Recommended flow:

1. Upload `01-Architectural CAD Collections.zip` to a private Cloudflare R2 bucket.
2. Create a Gumroad product priced for the western market.
3. Register a Gumroad sale webhook or Resource Subscription pointing to a Cloudflare Worker endpoint.
4. Worker verifies the Gumroad sale.
5. Worker creates a private download token and stores it in KV.
6. Worker emails the buyer a time-limited download URL.
7. Buyer downloads from `/download/<token>`, which streams the object from R2.

See `R2_DELIVERY.md` and `cloudflare-worker/`.

## Deployment

### GitHub Pages

Use branch `main` and root folder `/`.

Custom domain:

```text
autocadeng.boss888.net
```

DNS should point this host to the GitHub Pages target for `kingboss568.github.io` unless Cloudflare Pages is used instead.

### Cloudflare Pages

Use these settings:

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `/`

Current production domain has already been applied to:

- `index.html` canonical URL
- Open Graph URL and image URLs
- `sitemap.xml`
- `robots.txt`
- `CNAME`

## Disclaimer

CAD resources are auxiliary drafting references. They do not constitute legal, engineering, code-compliance, appraisal, insurance, credit, or professional design advice. Buyers must review dimensions, layers, local rules, licenses, and project requirements before use.
