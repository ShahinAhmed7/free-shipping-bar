import { useFetcher } from "react-router";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
export async function loader({ request }) {
  await authenticate.admin(request);
  return { hasProPlan: false };
}
export async function action({ request }) {
  const { billing, session } = await authenticate.admin(request);
  const returnUrl = `https://${session.shop}/admin/apps/free-shipping-bar`;
  const billingUrl = await billing.request({
    plan: "Pro Plan",
    isTest: true,
    returnUrl: returnUrl,
  });
  return new Response(JSON.stringify({ billingUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
export default function BillingPage() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  useEffect(() => {
    if (fetcher.data?.billingUrl) {
      window.top.location.href = fetcher.data.billingUrl;
    }
  }, [fetcher.data]);
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "2rem" }}>Upgrade to Pro</h1>
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Free Plan</h2>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "12px 0" }}>$0<span style={{ fontSize: "14px", fontWeight: "normal" }}>/month</span></p>
          <ul style={{ paddingLeft: "20px", color: "#444", lineHeight: "2" }}>
            <li>Basic progress bar</li>
            <li>1 threshold</li>
            <li>Default styling</li>
          </ul>
        </div>
        <div style={{ flex: 1, border: "2px solid #008060", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Pro Plan</h2>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: "12px 0" }}>$9.99<span style={{ fontSize: "14px", fontWeight: "normal" }}>/month</span></p>
          <ul style={{ paddingLeft: "20px", color: "#444", lineHeight: "2", marginBottom: "20px" }}>
            <li>Custom colors and messages</li>
            <li>Multiple thresholds</li>
            <li>Emoji celebrations</li>
            <li>Priority support</li>
            <li>7-day free trial</li>
          </ul>
          <fetcher.Form method="post">
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "12px", background: "#008060", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}
            >
              {isLoading ? "Redirecting..." : "Start 7-Day Free Trial"}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
