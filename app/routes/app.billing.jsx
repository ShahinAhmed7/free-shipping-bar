import { authenticate } from "../shopify.server";
export async function loader({ request }) {
  await authenticate.admin(request);
  return {};
}
export async function action({ request }) {
  const { billing, session } = await authenticate.admin(request);

  const returnUrl = `https://free-shipping-bar-production-ffdd.up.railway.app/auth?shop=${session.shop}`;

  await billing.request({
    plan: "Pro Plan",
    isTest: true,
    returnUrl: returnUrl,
  });

  return new Response(JSON.stringify({ billingUrl: returnUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
export default function BillingPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "2rem" }}>Upgrade to Pro</h1>
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px" }}>
          <h2>Free Plan</h2>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>$0/month</p>
          <ul><li>Basic progress bar</li><li>1 threshold</li><li>Default styling</li></ul>
        </div>
        <div style={{ flex: 1, border: "2px solid #008060", borderRadius: "12px", padding: "24px" }}>
          <h2>Pro Plan</h2>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>$9.99/month</p>
          <ul><li>Custom colors and messages</li><li>Multiple thresholds</li><li>Emoji celebrations</li><li>7-day free trial</li></ul>
          <form method="post">
            <button type="submit" style={{ width: "100%", padding: "12px", background: "#008060", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>
              Start 7-Day Free Trial
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "12px" }}>
            After approving, click "Home" in the sidebar to return to the app.
          </p>
        </div>
      </div>
    </div>
  );
}
