import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;

// Register GDPR webhooks once at server startup (production only)
if (process.env.NODE_ENV === "production" && !global.__gdprRegistered) {
  global.__gdprRegistered = true;
  import("./gdpr-register.server.js").catch((e) =>
    console.error("[GDPR] Import error:", e)
  );
}
