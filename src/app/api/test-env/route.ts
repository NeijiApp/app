import { env } from "~/env.js";

export async function GET() {
  return Response.json({
    envUrl: env.ASSEMBLY_SERVICE_URL,
    processEnvUrl: process.env.ASSEMBLY_SERVICE_URL,
    isUsingFallback: process.env.ASSEMBLY_SERVICE_URL === undefined,
    message: "This endpoint checks the actual value of ASSEMBLY_SERVICE_URL in Vercel's runtime."
  });
}
