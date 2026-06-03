import { useState } from "react";
import { redirect, useLoaderData } from "react-router";
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";
import { SHOPIFY_API_KEY } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

const normalizeShop = (shop) => {
  if (!shop) return null;

  const shopWithoutProtocol = shop
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const shopWithDomain = shopWithoutProtocol.includes(".")
    ? shopWithoutProtocol
    : `${shopWithoutProtocol}.myshopify.com`;
  const validShop = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(
    shopWithDomain,
  );

  return validShop ? shopWithDomain.toLowerCase() : null;
};

const shopifyInstallUrl = (shop, apiKey) => {
  const shopName = shop.replace(".myshopify.com", "");

  return `https://admin.shopify.com/store/${shopName}/oauth/install?client_id=${apiKey}`;
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const apiKey = SHOPIFY_API_KEY;
  const shop = url.searchParams.get("shop") || "";

  if (shop) {
    const normalizedShop = normalizeShop(shop);

    if (!normalizedShop) {
      return {
        apiKey,
        errors: loginErrorMessage({ shop: LoginErrorType.InvalidShop }),
        shop,
      };
    }

    throw redirect(shopifyInstallUrl(normalizedShop, apiKey));
  }

  return {
    apiKey,
    errors: {},
    shop: "",
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const [shop, setShop] = useState(loaderData.shop || "");
  const { apiKey, errors } = loaderData;

  const submitLogin = (event) => {
    const normalizedShop = normalizeShop(shop);

    if (!normalizedShop || !apiKey) return;

    event.currentTarget.action = shopifyInstallUrl(normalizedShop, apiKey);
    event.currentTarget.method = "get";
    event.currentTarget.target = "_top";
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.heading}>Log in</h1>
        <form
          action="/auth/login"
          method="get"
          target="_top"
          style={styles.form}
          onSubmit={submitLogin}
        >
          <label style={styles.label}>
            <span>Shop domain</span>
            <input
              name="shop"
              value={shop}
              onChange={(event) => setShop(event.currentTarget.value)}
              autoComplete="on"
              placeholder="example.myshopify.com"
              style={styles.input}
            />
          </label>
          {errors.shop ? <p style={styles.error}>{errors.shop}</p> : null}
          <input type="hidden" name="client_id" value={apiKey} />
          <button type="submit" style={styles.button}>
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  page: {
    alignItems: "flex-start",
    display: "flex",
    fontFamily: "sans-serif",
    justifyContent: "center",
    padding: "4rem 1rem",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #dcdfe4",
    borderRadius: "8px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    maxWidth: "720px",
    padding: "1rem",
    width: "100%",
  },
  heading: {
    fontSize: "1rem",
    margin: "0 0 1rem",
  },
  form: {
    display: "grid",
    gap: "0.75rem",
  },
  label: {
    display: "grid",
    gap: "0.25rem",
  },
  input: {
    border: "1px solid #8c9196",
    borderRadius: "4px",
    font: "inherit",
    padding: "0.5rem",
  },
  error: {
    color: "#8a0000",
    margin: 0,
  },
  button: {
    justifySelf: "start",
    padding: "0.4rem 0.75rem",
  },
};
