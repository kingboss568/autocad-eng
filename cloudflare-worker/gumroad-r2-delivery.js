export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/webhooks/gumroad") {
      return handleGumroadWebhook(request, env, url.origin);
    }

    if (request.method === "GET" && url.pathname.startsWith("/download/")) {
      const token = url.pathname.replace("/download/", "").trim();
      return handleDownload(token, env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleGumroadWebhook(request, env, origin) {
  const payload = await readPayload(request);
  const saleId = payload.sale_id || payload.saleId || payload.id;
  const email = payload.email || payload.purchaser_email;
  const productName = payload.product_name || "Architectural CAD Collections";

  if (!saleId || !email) {
    return json({ ok: false, error: "Missing sale_id or email" }, 400);
  }

  const verified = await verifyGumroadSale(saleId, env);
  if (!verified.ok) {
    return json({ ok: false, error: "Sale verification failed" }, 403);
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const ttl = Number(env.DOWNLOAD_TTL_SECONDS || 604800);
  const expiresAt = Date.now() + ttl * 1000;
  const objectKey = env.PRODUCT_OBJECT_KEY || "01-Architectural CAD Collections.zip";
  const downloadUrl = `${origin}/download/${token}`;

  await env.FULFILLMENT_KV.put(token, JSON.stringify({
    saleId,
    email,
    productName,
    objectKey,
    expiresAt,
    createdAt: new Date().toISOString()
  }), { expirationTtl: ttl });

  await sendDeliveryEmail({
    env,
    to: email,
    productName,
    downloadUrl,
    expiresAt,
    fileName: objectKey,
    checksum: env.PRODUCT_SHA256 || "bbaf1de88bba38a83193c4a80cb5fec770e1e135bdf5c503dddfb326f2421415"
  });

  return json({ ok: true });
}

async function handleDownload(token, env) {
  if (!token || token.length < 24) {
    return new Response("Invalid download link.", { status: 400 });
  }

  const recordRaw = await env.FULFILLMENT_KV.get(token);
  if (!recordRaw) {
    return new Response("This download link is invalid or expired.", { status: 404 });
  }

  const record = JSON.parse(recordRaw);
  if (Date.now() > record.expiresAt) {
    await env.FULFILLMENT_KV.delete(token);
    return new Response("This download link has expired.", { status: 410 });
  }

  const object = await env.PRODUCT_BUCKET.get(record.objectKey);
  if (!object) {
    return new Response("Product file is not available yet. Please contact support.", { status: 503 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", object.httpMetadata?.contentType || "application/zip");
  headers.set("content-disposition", `attachment; filename="${record.objectKey}"`);
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");

  return new Response(object.body, { headers });
}

async function verifyGumroadSale(saleId, env) {
  if (!env.GUMROAD_ACCESS_TOKEN) {
    return { ok: false };
  }

  const response = await fetch(`https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}`, {
    headers: { authorization: `Bearer ${env.GUMROAD_ACCESS_TOKEN}` }
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = await response.json();
  return { ok: data.success !== false, data };
}

async function readPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const form = await request.formData();
  const payload = {};
  for (const [key, value] of form.entries()) {
    payload[key] = value;
  }
  return payload;
}

async function sendDeliveryEmail({ env, to, productName, downloadUrl, expiresAt, fileName, checksum }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.log("Email provider is not configured. Delivery URL:", downloadUrl);
    return;
  }

  const support = env.SUPPORT_EMAIL || "kingboss568@gmail.com";
  const expires = new Date(expiresAt).toUTCString();
  const body = [
    `Thank you for purchasing ${productName}.`,
    "",
    `Download link: ${downloadUrl}`,
    `Expires: ${expires}`,
    `File: ${fileName}`,
    `SHA-256: ${checksum}`,
    "",
    "Please download the file before the link expires. If you need help, reply to this email or contact support.",
    `Support: ${support}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to,
      subject: `Your ${productName} download link`,
      text: body
    })
  });

  if (!response.ok) {
    console.log("Email send failed", response.status, await response.text());
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
