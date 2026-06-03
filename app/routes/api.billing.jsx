import { authenticate } from "../shopify.server";
import { cancelProSubscription, createProSubscription } from "../billing.server";

export async function action({ request }) {
  const { admin, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "downgrade") {
    await cancelProSubscription(billing, admin);

    return Response.json({ success: true });
  }

  const { confirmationUrl, error } = await createProSubscription(admin);

  if (error) {
    return Response.json({ error }, { status: 422 });
  }

  return Response.json({ confirmationUrl });
}
