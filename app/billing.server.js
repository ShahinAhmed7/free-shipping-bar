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

export async function isPartnerDevelopmentShop(admin) {
  const response = await admin.graphql(
    `#graphql
      query ShopBillingPlan {
        shop {
          plan {
            partnerDevelopment
          }
        }
      }
    `,
  );
  const payload = await response.json();

  return payload.data?.shop?.plan?.partnerDevelopment === true;
}

export async function shouldUseTestBilling(admin) {
  if (isBillingTestMode()) {
    return true;
  }

  return isPartnerDevelopmentShop(admin);
}

export async function createProSubscription(admin) {
  const isTest = await shouldUseTestBilling(admin);
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
        test: isTest,
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

export async function getProSubscription(billing, admin) {
  const isTest = await shouldUseTestBilling(admin);
  const billingCheck = await billing.check({
    plans: [PRO_PLAN_NAME],
    isTest,
  });

  return {
    activeSubscription: billingCheck.appSubscriptions?.[0] || null,
    isTest,
  };
}

export async function hasActiveProPlan(admin) {
  const response = await admin.graphql(
    `#graphql
      query ActiveAppSubscriptions {
        currentAppInstallation {
          activeSubscriptions {
            name
            status
          }
        }
      }
    `,
  );
  const payload = await response.json();
  const activeSubscriptions =
    payload.data?.currentAppInstallation?.activeSubscriptions || [];

  return activeSubscriptions.some(
    (subscription) =>
      subscription.name === PRO_PLAN_NAME && subscription.status === "ACTIVE",
  );
}

export async function cancelProSubscription(billing, admin) {
  const { activeSubscription, isTest } = await getProSubscription(billing, admin);

  if (!activeSubscription?.id) {
    return { cancelled: false };
  }

  await billing.cancel({
    subscriptionId: activeSubscription.id,
    isTest,
    prorate: true,
  });

  return { cancelled: true };
}
