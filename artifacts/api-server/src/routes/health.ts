import { sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (request, response): Promise<void> => {
  try {
    // Query the application table, not only the TCP connection. This catches
    // an unavailable database and a schema that has not been applied yet.
    await db.execute(sql`select 1 from pendaftar limit 1`);
    const data = HealthCheckResponse.parse({ status: "ok", database: "ok" });
    response.json(data);
  } catch (error) {
    request.log.error({ err: error }, "Health check database query failed");
    const data = HealthCheckResponse.parse({ status: "error", database: "error" });
    response.status(503).json(data);
  }
});

export default router;
