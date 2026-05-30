import { authenticate } from "../shopify.server";
export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);
  console.log(`Webhook received: ${topic} for ${shop}`);
  return new Response(null, { status: 200 });
};
