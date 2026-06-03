import { useState } from "react";
import { redirect, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    throw redirect(`/app?shop=${encodeURIComponent(shop)}`);
  }

  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const shop = formData.get("shop");

  if (typeof shop === "string" && shop.trim()) {
    throw redirect(`/app?shop=${encodeURIComponent(shop.trim())}`);
  }

  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  function handleLogin(event) {
    event.preventDefault();

    const normalizedShop = shop.trim();

    if (!normalizedShop) {
      return;
    }

    const target = `/app?shop=${encodeURIComponent(normalizedShop)}`;

    if (window.top) {
      window.top.location.href = target;
      return;
    }

    window.location.href = target;
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.heading}>Log in</h1>
        <form method="post" style={styles.form} onSubmit={handleLogin}>
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
