/* global globalThis:readonly */
import { PRO_PLAN_NAME } from "./shopify.server";

const DEFAULT_APP_URL = "https://free-shipping-bar-production-ffdd.up.railway.app";

export function getAppUrl() {
  const serverProcess = globalThis.process;

  return serverProcess
    ? serverProcess.env.SHOPIFY_APP_URL || DEFAULT_APP_URL
    : DEFAULT_APP_URL;
}

export function isBillingTestMode() {
  const serverProcess = globalThis.process;

  return serverProcess?.env.SHOPIFY_BILLING_TEST === "true";
}

export async function createProSubscription(admin) {
  const response = await admin.graphql(
    `#graphql
      mutation AppSubscriptionCreate(
        $name: String!
        $returnUrl: URL!
        $test: Boolean
        $trialDays: Int
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          test: $test
          trialDays: $trialDays
          replacementBehavior: APPLY_IMMEDIATELY
          lineItems: $lineItems
        ) {
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        name: PRO_PLAN_NAME,
        returnUrl: `${getAppUrl()}/app/billing-success`,
        test: isBillingTestMode(),
        trialDays: 7,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                interval: "EVERY_30_DAYS",
                price: {
                  amount: 9.99,
                  currencyCode: "USD",
                },
              },
            },
          },
        ],
      },
    },
  );

  const payload = await response.json();
  const billingResult = payload.data?.appSubscriptionCreate;
  const userErrors = billingResult?.userErrors || [];

  if (payload.errors?.length || userErrors.length || !billingResult?.confirmationUrl) {
    return {
      confirmationUrl: null,
      error:
        userErrors.map((error) => error.message).join(", ") ||
        payload.errors?.map((error) => error.message).join(", ") ||
        "Unable to create Shopify billing confirmation URL.",
    };
  }

  return {
    confirmationUrl: billingResult.confirmationUrl,
    error: null,
  };
}
