# Gumroad + Cloudflare R2 Delivery Checklist

This file documents how to deliver the paid product file after Gumroad checkout.

## Verified Product File

```text
File: 01-Architectural CAD Collections.zip
Size: 236,651,149 bytes
Size: 225.69 MiB
SHA-256: bbaf1de88bba38a83193c4a80cb5fec770e1e135bdf5c503dddfb326f2421415
Source checked: 2026-05-18
```

Do not commit this zip to GitHub. Upload it to a private Cloudflare R2 bucket.

## R2 Setup

1. Create an R2 bucket such as `autocad-eng-products`.
2. Upload the object with this exact key:

```text
01-Architectural CAD Collections.zip
```

3. Keep the bucket private.
4. Bind the bucket to the Worker as `PRODUCT_BUCKET`.
5. Create a KV namespace and bind it as `FULFILLMENT_KV`.

## Gumroad Setup

Use Gumroad for checkout only. Do not add ECPay or PayPal buttons to this storefront.

Recommended product fields:

- Product name: `Architectural CAD Collections`
- Price: `US$99`
- Support email: `kingboss568@gmail.com`
- Receipt note: mention that the secure download link will be emailed after payment confirmation.

Gumroad Resource Subscriptions can post sale events to a webhook endpoint. The public Gumroad API documentation says Resource Subscriptions support `sale` events, require `view_sales` scope, and send POST notifications to the configured `post_url`. It also recommends verifying webhook requests by retrieving the sale from Gumroad before fulfillment.

Reference: https://www.mintlify.com/antiwork/gumroad/api/resource-subscriptions

## Worker Setup

The example Worker is in:

```text
cloudflare-worker/gumroad-r2-delivery.js
```

It provides:

- `POST /webhooks/gumroad` - receives Gumroad sale events.
- `GET /download/<token>` - streams the paid zip from R2 when the token is valid.
- `GET /health` - health check.

Required bindings/secrets:

```text
PRODUCT_BUCKET
FULFILLMENT_KV
GUMROAD_ACCESS_TOKEN
RESEND_API_KEY
FROM_EMAIL
```

Optional variables:

```text
PRODUCT_OBJECT_KEY=01-Architectural CAD Collections.zip
PRODUCT_SHA256=bbaf1de88bba38a83193c4a80cb5fec770e1e135bdf5c503dddfb326f2421415
DOWNLOAD_TTL_SECONDS=604800
SUPPORT_EMAIL=kingboss568@gmail.com
```

## Buyer Email Content

The email should include:

- Product name.
- Download link.
- Link expiry date.
- File name.
- SHA-256 checksum.
- Support email.

## Operations Notes

- Rotate download links by deleting the KV token.
- If a buyer reports an expired link, verify the Gumroad sale before issuing a new token.
- Keep the R2 bucket private.
- Do not expose a public R2 object URL in the storefront.
- Update `index.html` after a dedicated Gumroad product URL is created.
