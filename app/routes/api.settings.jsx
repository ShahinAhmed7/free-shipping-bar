import { authenticate, unauthenticated } from "../shopify.server";
import { hasActiveProPlan } from "../billing.server";
import prisma from "../db.server";

const DEFAULTS = {
  threshold: 7500,
  progressMessage: "Add {amount} more for free shipping!",
  successMessage: "You've unlocked free shipping!",
  barColor: "#1D9E75",
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);
  const shop = session?.shop;

  let settings = DEFAULTS;

  if (shop) {
    const record = await prisma.shopSettings.findUnique({ where: { shop } });
    const { admin } = await unauthenticated.admin(shop);
    const hasProPlan = await hasActiveProPlan(admin);

    if (record && hasProPlan) {
      settings = {
        threshold: record.threshold,
        progressMessage: record.progressMessage,
        successMessage: record.successMessage,
        barColor: record.barColor,
      };
    } else if (record) {
      settings = {
        ...DEFAULTS,
        threshold: record.threshold,
      };
    }
  }

  return new Response(JSON.stringify(settings), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const hasProPlan = await hasActiveProPlan(admin);

  const formData = await request.formData();
  const threshold = Math.round((parseFloat(formData.get("threshold")) || 75) * 100);
  const progressMessage = hasProPlan
    ? formData.get("progressMessage") || DEFAULTS.progressMessage
    : DEFAULTS.progressMessage;
  const successMessage = hasProPlan
    ? formData.get("successMessage") || DEFAULTS.successMessage
    : DEFAULTS.successMessage;
  const barColor = hasProPlan
    ? formData.get("barColor") || DEFAULTS.barColor
    : DEFAULTS.barColor;

  await prisma.shopSettings.upsert({
    where: { shop },
    update: { threshold, progressMessage, successMessage, barColor },
    create: { shop, threshold, progressMessage, successMessage, barColor },
  });

  return Response.json({ ok: true });
};
