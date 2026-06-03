import { useState } from "react";
import { useLoaderData, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { hasActiveProPlan } from "../billing.server";
import prisma from "../db.server";

const DEFAULT_SETTINGS = {
  threshold: 7500,
  progressMessage: "Add {amount} more for free shipping!",
  successMessage: "You've unlocked free shipping! 🎉",
  barColor: "#1D9E75",
};

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const hasProPlan = await hasActiveProPlan(admin);

  const settings = await prisma.shopSettings.findUnique({ where: { shop } });

  return {
    hasProPlan,
    threshold: ((settings?.threshold ?? DEFAULT_SETTINGS.threshold) / 100).toString(),
    progressMessage: hasProPlan
      ? settings?.progressMessage ?? DEFAULT_SETTINGS.progressMessage
      : DEFAULT_SETTINGS.progressMessage,
    successMessage: hasProPlan
      ? settings?.successMessage ?? DEFAULT_SETTINGS.successMessage
      : DEFAULT_SETTINGS.successMessage,
    barColor: hasProPlan
      ? settings?.barColor ?? DEFAULT_SETTINGS.barColor
      : DEFAULT_SETTINGS.barColor,
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const hasProPlan = await hasActiveProPlan(admin);

  const formData = await request.formData();
  const threshold = Math.round((parseFloat(formData.get("threshold")) || 75) * 100);
  const progressMessage = hasProPlan
    ? formData.get("progressMessage") || DEFAULT_SETTINGS.progressMessage
    : DEFAULT_SETTINGS.progressMessage;
  const successMessage = hasProPlan
    ? formData.get("successMessage") || DEFAULT_SETTINGS.successMessage
    : DEFAULT_SETTINGS.successMessage;
  const barColor = hasProPlan
    ? formData.get("barColor") || DEFAULT_SETTINGS.barColor
    : DEFAULT_SETTINGS.barColor;

  await prisma.shopSettings.upsert({
    where: { shop },
    update: { threshold, progressMessage, successMessage, barColor },
    create: { shop, threshold, progressMessage, successMessage, barColor },
  });

  return { ok: true };
};

export default function SettingsPage() {
  const data = useLoaderData();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const isSaving = navigation.state === "submitting";
  const hasProPlan = data.hasProPlan;

  const [threshold, setThreshold] = useState(String(data.threshold));
  const [progressMessage, setProgressMessage] = useState(data.progressMessage);
  const [successMessage, setSuccessMessage] = useState(data.successMessage);
  const [barColor, setBarColor] = useState(data.barColor);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    fetch(form.action || window.location.href, { method: "POST", body: formData })
      .then(() => shopify.toast.show("Settings saved"))
      .catch(() => shopify.toast.show("Failed to save settings", { isError: true }));
  }

  return (
    <s-page heading="Free Shipping Bar Settings">
      <form method="post" onSubmit={handleSubmit}>
        <s-section heading="Bar settings">
          <s-stack direction="block" gap="base">
            {!hasProPlan ? (
              <s-banner tone="info">
                Free plan includes one threshold with default styling. Upgrade to Pro to unlock custom messages, emoji celebrations, and colors.
              </s-banner>
            ) : null}

            <s-text-field
              label="Free shipping threshold"
              name="threshold"
              type="number"
              value={threshold}
              prefix="$"
              helpText="Customers get free shipping when cart reaches this amount."
              onInput={(e) => setThreshold(e.target.value)}
            />

            <s-text-field
              label="Progress message (Pro)"
              name="progressMessage"
              value={progressMessage}
              disabled={!hasProPlan}
              helpText={
                hasProPlan
                  ? 'Use {amount} as a placeholder. E.g. "Add {amount} more for free shipping!"'
                  : "Upgrade to Pro to customize progress text."
              }
              onInput={(e) => setProgressMessage(e.target.value)}
            />

            <s-text-field
              label="Success message (Pro)"
              name="successMessage"
              value={successMessage}
              disabled={!hasProPlan}
              helpText={
                hasProPlan
                  ? "Shown when the customer has reached the free shipping threshold."
                  : "Upgrade to Pro to customize the success message and emoji celebration."
              }
              onInput={(e) => setSuccessMessage(e.target.value)}
            />

            <s-text-field
              label="Bar color (Pro)"
              name="barColor"
              value={barColor}
              disabled={!hasProPlan}
              helpText={
                hasProPlan
                  ? "Hex color code for the progress bar fill."
                  : "Upgrade to Pro to customize the progress bar color."
              }
              onInput={(e) => setBarColor(e.target.value)}
            />

          </s-stack>
        </s-section>

        <s-page-actions>
          <s-button
            slot="primary-action"
            submit
            {...(isSaving ? { loading: true } : {})}
          >
            Save
          </s-button>
        </s-page-actions>
      </form>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
