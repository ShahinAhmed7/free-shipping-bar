import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
export async function loader({ request }) {
  await authenticate.admin(request);
  return redirect("/app/billing?status=approved");
}
export default function BillingSuccess() {
  return <div>Redirecting...</div>;
}
