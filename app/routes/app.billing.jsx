import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { redirect, useLoaderData, useSearchParams } from "react-router";
import { authenticate, PRO_PLAN_NAME } from "../shopify.server";
import { shouldUseTestBilling } from "../billing.server";

async function getBillingStatus(billing, isTest) {
  const billingCheck = await billing.check({
    plans: [PRO_PLAN_NAME],
    isTest,
  });

  const activeSubscription = billingCheck.appSubscriptions?.[0] || null;

  return {
    hasProPlan: Boolean(activeSubscription),
    activeSubscription,
  };
}

export async function loader({ request }) {
  const { admin, billing, session } = await authenticate.admin(request);
  const isTest = await shouldUseTestBilling(admin);
  const { hasProPlan, activeSubscription } = await getBillingStatus(billing, isTest);
  const billingActionUrl = new URL(request.url);

  billingActionUrl.searchParams.set("shop", session.shop);
  billingActionUrl.searchParams.set("embedded", "1");

  return {
    planName: hasProPlan ? PRO_PLAN_NAME : "Free Plan",
    hasProPlan,
    subscriptionId: activeSubscription?.id || null,
    isTest,
    billingAction: `${billingActionUrl.pathname}${billingActionUrl.search}`,
  };
}

export async function action({ request }) {
  const { admin, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "downgrade") {
    const isTest = await shouldUseTestBilling(admin);
    const { activeSubscription } = await getBillingStatus(billing, isTest);

    if (activeSubscription?.id) {
      await billing.cancel({
        subscriptionId: activeSubscription.id,
        isTest,
        prorate: true,
      });
    }

    return redirect("/app/billing?status=downgraded");
  }

  return redirect("/app/billing");
}

export default function BillingPage() {
  const { planName, hasProPlan, subscriptionId, isTest, billingAction } = useLoaderData();
  const [searchParams] = useSearchParams();
  const shopify = useAppBridge();
  const status = searchParams.get("status");
  const message = searchParams.get("message");
  const [upgradeState, setUpgradeState] = useState({
    loading: false,
    error: "",
  });

  async function handleUpgrade() {
    setUpgradeState({ loading: true, error: "" });

    try {
      await shopify.ready;

      const body = new FormData();
      body.set("intent", "upgrade");
      const token = await shopify.idToken();

      const response = await fetch("/api/billing", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body,
      });
      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : null;

      if (!result) {
        const text = await response.text();
        throw new Error(
          `Expected JSON from billing route, received ${contentType || "unknown response"}: ${text
            .replace(/\s+/g, " ")
            .slice(0, 180)}`,
        );
      }

      if (!response.ok || result.error || !result.confirmationUrl) {
        throw new Error(result.error || "Shopify billing could not be started.");
      }

      const confirmationUrl = new URL(result.confirmationUrl);
      const isShopifyBillingUrl =
        confirmationUrl.hostname.endsWith(".shopify.com") ||
        confirmationUrl.hostname === "shopify.com" ||
        confirmationUrl.hostname.endsWith(".myshopify.com");

      if (!isShopifyBillingUrl) {
        throw new Error(
          `Shopify returned an invalid billing confirmation URL host: ${confirmationUrl.hostname}`,
        );
      }

      window.open(confirmationUrl.toString(), "_top");
    } catch (error) {
      setUpgradeState({
        loading: false,
        error: error.message || "Shopify billing could not be started.",
      });
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <p style={styles.eyebrow}>Current plan</p>
        <h1 style={styles.heading}>{planName}</h1>
        <p style={styles.copy}>
          Manage the free shipping bar plan through Shopify billing.
        </p>
        {isTest ? <p style={styles.testBadge}>Test billing mode</p> : null}
      </section>

      {status === "approved" ? (
        <div style={styles.successBox}>Pro plan is active.</div>
      ) : null}

      {status === "downgraded" ? (
        <div style={styles.successBox}>Free plan is active.</div>
      ) : null}

      {status === "error" ? (
        <div style={styles.errorBox}>
          {message || "Shopify billing could not be started. Please try again."}
        </div>
      ) : null}

      {upgradeState.error ? (
        <div style={styles.errorBox}>{upgradeState.error}</div>
      ) : null}

      <section style={styles.grid}>
        <article style={styles.card}>
          <div>
            <h2 style={styles.cardTitle}>Free Plan</h2>
            <p style={styles.price}>$0/month</p>
            <ul style={styles.list}>
              <li>Basic progress bar</li>
              <li>1 threshold</li>
              <li>Default styling</li>
            </ul>
          </div>

          {hasProPlan ? (
            <form method="post" action={billingAction}>
              <input type="hidden" name="intent" value="downgrade" />
              <button type="submit" style={styles.secondaryButton}>
                Downgrade to Free
              </button>
            </form>
          ) : (
            <p style={styles.activeLabel}>Active</p>
          )}
        </article>

        <article style={{ ...styles.card, ...styles.highlightedCard }}>
          <div>
            <h2 style={styles.cardTitle}>Pro Plan</h2>
            <p style={styles.price}>$9.99/month</p>
            <ul style={styles.list}>
              <li>Custom colors and messages</li>
              <li>Multiple thresholds</li>
              <li>Emoji celebrations</li>
              <li>7-day free trial</li>
            </ul>
          </div>

          {hasProPlan ? (
            <p style={styles.activeLabel}>Active</p>
          ) : (
            <button
              type="button"
              style={styles.primaryButton}
              onClick={handleUpgrade}
              disabled={upgradeState.loading}
            >
              {upgradeState.loading ? "Opening Shopify billing..." : "Start 7-Day Free Trial"}
            </button>
          )}
        </article>
      </section>

      {subscriptionId ? (
        <p style={styles.subscriptionNote}>Subscription ID: {subscriptionId}</p>
      ) : null}
    </main>
  );
}

const styles = {
  page: {
    padding: "2rem",
    fontFamily: "sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "1.5rem",
  },
  eyebrow: {
    color: "#5c5f62",
    fontSize: "14px",
    margin: "0 0 4px",
  },
  heading: {
    fontSize: "28px",
    margin: "0 0 8px",
  },
  copy: {
    color: "#5c5f62",
    margin: "0",
  },
  testBadge: {
    display: "inline-block",
    marginTop: "12px",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "#fff4e5",
    color: "#7c4a00",
    fontSize: "13px",
  },
  successBox: {
    background: "#eafaf3",
    border: "1px solid #9de0c5",
    borderRadius: "8px",
    color: "#005c3f",
    marginBottom: "1rem",
    padding: "12px 16px",
  },
  errorBox: {
    background: "#fff4f4",
    border: "1px solid #ffd0d0",
    borderRadius: "8px",
    color: "#8a0000",
    marginBottom: "1rem",
    padding: "12px 16px",
  },
  grid: {
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  card: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "340px",
    padding: "24px",
  },
  highlightedCard: {
    border: "2px solid #008060",
  },
  cardTitle: {
    fontSize: "22px",
    margin: "0 0 18px",
  },
  price: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 20px",
  },
  list: {
    lineHeight: "1.5",
    margin: "0",
    paddingLeft: "20px",
  },
  primaryButton: {
    width: "100%",
    padding: "12px",
    background: "#008060",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    padding: "12px",
    background: "white",
    color: "#202223",
    border: "1px solid #c9cccf",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  activeLabel: {
    alignSelf: "flex-start",
    background: "#eafaf3",
    borderRadius: "6px",
    color: "#005c3f",
    fontWeight: "bold",
    margin: "0",
    padding: "8px 12px",
  },
  subscriptionNote: {
    color: "#6d7175",
    fontSize: "12px",
    marginTop: "16px",
    wordBreak: "break-all",
  },
};
