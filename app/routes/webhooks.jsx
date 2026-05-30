import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  try {
    switch (topic) {
      case "APP_UNINSTALLED":
        if (session) {
          await db.session.deleteMany({ where: { shop } });
        }
        break;

      case "CUSTOMERS_DATA_REQUEST":
        // No customer PII stored
        break;

      case "CUSTOMERS_REDACT":
        // No customer PII stored
        break;

      case "SHOP_REDACT":
        await db.shopSettings.deleteMany({ where: { shop } }).catch(() => {});
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(`Webhook processing error [${topic}]:`, error);
  }

  return new Response(null, { status: 200 });
};
