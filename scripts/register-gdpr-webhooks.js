#!/usr/bin/env node
/**
 * One-time script to register GDPR webhook subscriptions via Shopify Admin REST API.
 * Usage:
 *   SHOPIFY_ACCESS_TOKEN=shpat_xxx node scripts/register-gdpr-webhooks.js
 *   OR
 *   node scripts/register-gdpr-webhooks.js shpat_xxx
 */

const SHOP = "dawn-test-shahin.myshopify.com";
const API_VERSION = "2025-07";
const APP_URL = "https://free-shipping-bar-production-ffdd.up.railway.app";

const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.argv[2];

if (!ACCESS_TOKEN) {
  console.error("❌ Missing access token.");
  console.error("   Run: SHOPIFY_ACCESS_TOKEN=shpat_xxx node scripts/register-gdpr-webhooks.js");
  process.exit(1);
}

const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/webhooks.json`;

const TOPICS = [
  "customers/data_request",
  "customers/redact",
  "shop/redact",
];

async function registerWebhook(topic) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ACCESS_TOKEN,
    },
    body: JSON.stringify({
      webhook: {
        topic,
        address: `${APP_URL}/webhooks`,
        format: "json",
      },
    }),
  });

  const data = await res.json();

  if (res.ok && data.webhook) {
    console.log(`✅ Registered: ${topic} → id=${data.webhook.id}`);
  } else {
    const errors = data.errors || data;
    // "address for this topic has already been taken" means it's already registered
    const msg = JSON.stringify(errors);
    if (msg.includes("already been taken")) {
      console.log(`ℹ️  Already registered: ${topic}`);
    } else {
      console.error(`❌ Failed: ${topic}`, msg);
    }
  }
}

async function listWebhooks() {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/webhooks.json`,
    { headers: { "X-Shopify-Access-Token": ACCESS_TOKEN } }
  );
  const data = await res.json();
  console.log("\n📋 Current webhooks registered on store:");
  for (const wh of data.webhooks || []) {
    console.log(`   [${wh.id}] ${wh.topic} → ${wh.address}`);
  }
}

(async () => {
  console.log(`\n🔧 Registering GDPR webhooks on ${SHOP}\n`);
  for (const topic of TOPICS) {
    await registerWebhook(topic);
  }
  await listWebhooks();
  console.log("\n✅ Done.\n");
})();
