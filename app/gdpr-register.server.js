import prisma from "./db.server.js";

const APP_URL = "https://free-shipping-bar-production-ffdd.up.railway.app";
const SHOP = "dawn-test-shahin.myshopify.com";
const API_VERSION = "2025-07";

const TOPICS = ["CUSTOMERS_DATA_REQUEST", "CUSTOMERS_REDACT", "SHOP_REDACT"];

async function registerTopic(accessToken, topic) {
  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
              webhookSubscription { id }
              userErrors { field message }
            }
          }
        `,
        variables: {
          topic,
          webhookSubscription: {
            callbackUrl: `${APP_URL}/webhooks`,
            format: "JSON",
          },
        },
      }),
    }
  );

  const data = await res.json();
  const result = data?.data?.webhookSubscriptionCreate;
  const errors = result?.userErrors;

  if (errors?.length) {
    const msg = errors[0].message;
    if (msg.includes("already")) {
      console.log(`[GDPR] Already registered: ${topic}`);
    } else {
      console.error(`[GDPR] Error registering ${topic}:`, msg);
    }
  } else if (result?.webhookSubscription?.id) {
    console.log(`[GDPR] Registered: ${topic} → ${result.webhookSubscription.id}`);
  } else {
    console.warn(`[GDPR] Unexpected response for ${topic}:`, JSON.stringify(data));
  }
}

export async function registerGdprWebhooks() {
  try {
    const session = await prisma.session.findFirst({
      where: { shop: SHOP },
      orderBy: { expires: "desc" },
    });

    if (!session?.accessToken) {
      console.log("[GDPR] No session found — skipping GDPR webhook registration");
      return;
    }

    console.log("[GDPR] Registering GDPR webhooks...");
    for (const topic of TOPICS) {
      await registerTopic(session.accessToken, topic);
    }
  } catch (err) {
    console.error("[GDPR] Registration failed:", err);
  }
}

// Run once at module load (server startup)
registerGdprWebhooks();
