import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  console.log(`Webhook received: ${topic} for ${shop}`);

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;

    case "CUSTOMERS_DATA_REQUEST":
      // No customer PII stored — respond with 200
      console.log(`customers/data_request for ${shop} — no customer data stored`);
      break;

    case "CUSTOMERS_REDACT":
      // No customer PII stored — nothing to delete
      console.log(`customers/redact for ${shop} — no customer data to redact`);
      break;

    case "SHOP_REDACT":
      // Delete shop settings 48h after uninstall
      await db.shopSettings.deleteMany({ where: { shop } }).catch(() => {});
      console.log(`shop/redact for ${shop} — shop settings deleted`);
      break;

    default:
      console.log(`Unhandled webhook topic: ${topic}`);
      break;
  }

  return new Response(null, { status: 200 });
};
