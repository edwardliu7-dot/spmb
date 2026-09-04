import express, { type ErrorRequestHandler, type Express } from "express";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for committee authentication.");
}
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 100 }));

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (response.headersSent) return;

  if (error?.type === "entity.too.large") {
    response.status(413).json({
      error: "Data yang dikirim terlalu besar. Kurangi ukuran isian atau berkas.",
    });
    return;
  }

  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : 500;

  request.log.error({ err: error, status }, "Unhandled API error");
  response.status(status).json({
    error: status === 500
      ? "Terjadi kesalahan pada layanan. Silakan coba lagi."
      : "Permintaan tidak dapat diproses.",
  });
};

app.use(errorHandler);

export default app;
