import { authenticate } from "../shopify.server";
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
    if (record) {
      settings = {
        threshold: record.threshold,
        progressMessage: record.progressMessage,
        successMessage: record.successMessage,
        barColor: record.barColor,
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
