import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

const STORAGE_KEY = "shipping-bar-settings";

const DEFAULT_SETTINGS = {
  threshold: "75",
  position: "top",
  barColor: "#1D9E75",
  message: "Add {amount} more for free shipping!",
};

export default function SettingsPage() {
  const shopify = useAppBridge();

  const [settings, setSettings] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isDirty, setIsDirty] = useState(false);

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function handleSave() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsDirty(false);
      shopify.toast.show("Settings saved");
    } catch {
      shopify.toast.show("Failed to save settings", { isError: true });
    }
  }

  return (
    <s-page heading="Free Shipping Bar Settings">
      <s-button
        slot="primary-action"
        onClick={handleSave}
        {...(!isDirty ? { disabled: true } : {})}
      >
        Save
      </s-button>

      <s-section heading="Bar settings">
        <s-stack direction="block" gap="base">

          <s-text-field
            label="Free shipping threshold"
            type="number"
            value={settings.threshold}
            prefix="$"
            min="0"
            helpText="Customers unlock free shipping when their cart reaches this amount."
            onInput={(e) => handleChange("threshold", e.target.value)}
          />

          <s-select
            label="Bar position"
            value={settings.position}
            onChange={(e) => handleChange("position", e.target.value)}
          >
            <s-option value="top">Top of cart page</s-option>
            <s-option value="bottom">Bottom of cart page</s-option>
          </s-select>

          <s-text-field
            label="Bar color"
            value={settings.barColor}
            helpText="Enter a hex color code, e.g. #1D9E75"
            onInput={(e) => handleChange("barColor", e.target.value)}
            connectedRight={
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: settings.barColor,
                  border: "1px solid #ccc",
                  flexShrink: 0,
                }}
              />
            }
          />

          <s-text-field
            label="Custom message"
            value={settings.message}
            helpText='Use {amount} as a placeholder for the remaining amount. E.g. "Add {amount} more for free shipping!"'
            onInput={(e) => handleChange("message", e.target.value)}
          />

        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Preview">
        <s-paragraph>
          Threshold: <strong>${settings.threshold}</strong>
        </s-paragraph>
        <s-paragraph>
          Position: <strong>{settings.position === "top" ? "Top of cart page" : "Bottom of cart page"}</strong>
        </s-paragraph>
        <s-paragraph>
          Message: <em>{settings.message}</em>
        </s-paragraph>
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 13, textAlign: "center", margin: "0 0 8px", color: "#3f3f46" }}>
            {settings.message.replace("{amount}", "$25.00")}
          </p>
          <div style={{ height: 10, background: "#e4e4e7", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "67%",
                background: settings.barColor,
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </s-section>
    </s-page>
  );
}
