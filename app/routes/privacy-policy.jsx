import fs from "fs";
import path from "path";

export const loader = async () => {
  const filePath = path.join(process.cwd(), "public", "privacy-policy.html");
  const html = fs.readFileSync(filePath, "utf-8");
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
};
