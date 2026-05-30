import { useState } from "react";
import { Form, useLoaderData, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.shopSettings.findUnique({ where: { shop } });

  return {
    threshold: ((settings?.threshold ?? 7500) / 100).toString(),
    progressMessage: settings?.progressMessage ?? "Add {amount} more for free shipping!",
    successMessage: settings?.successMessage ?? "You've unlocked free shipping! 🎉",
    barColor: settings?.barColor ?? "#1D9E75",
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const threshold = Math.round((parseFloat(formData.get("threshold")) || 75) * 100);
  const progressMessage = formData.get("progressMessage") || "Add {amount} more for free shipping!";
  const successMessage = formData.get("successMessage") || "You've unlocked free shipping! 🎉";
  const barColor = formData.get("barColor") || "#1D9E75";

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

            <s-text-field
              label="Free shipping threshold (cents)"
              name="threshold"
              type="number"
              value={threshold}
              prefix="$"
              helpText="Customers get free shipping when cart reaches this amount. 7500 = $75.00"
              onInput={(e) => setThreshold(e.target.value)}
            />

            <s-text-field
              label="Progress message"
              name="progressMessage"
              value={progressMessage}
              helpText='Use {amount} as a placeholder. E.g. "Add {amount} more for free shipping!"'
              onInput={(e) => setProgressMessage(e.target.value)}
            />

            <s-text-field
              label="Success message"
              name="successMessage"
              value={successMessage}
              helpText="Shown when the customer has reached the free shipping threshold."
              onInput={(e) => setSuccessMessage(e.target.value)}
            />

            <s-text-field
              label="Bar color"
              name="barColor"
              value={barColor}
              helpText="Hex color code for the progress bar fill."
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
