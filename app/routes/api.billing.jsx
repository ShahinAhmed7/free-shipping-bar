import { authenticate } from "../shopify.server";
import { createProSubscription } from "../billing.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const { confirmationUrl, error } = await createProSubscription(admin);

  if (error) {
    return Response.json({ error }, { status: 422 });
  }

  return Response.json({ confirmationUrl });
}
