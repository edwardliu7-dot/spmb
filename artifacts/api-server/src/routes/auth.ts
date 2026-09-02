import { Router } from "express";
import {
  authenticateCommittee,
  committeeCookieName,
  requireCommitteeAuth,
  setCommitteeCookie,
} from "../middlewares/committee-auth";

const router = Router();

router.post("/auth/login", (request, response) => {
  const username = typeof request.body?.username === "string" ? request.body.username : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  const account = authenticateCommittee(username, password);
  if (!account) return response.status(401).json({ error: "Username atau password tidak benar." });

  setCommitteeCookie(response, account);
  return response.json({ success: true, user: account });
});

router.get("/auth/me", requireCommitteeAuth, (request, response) => {
  return response.json({ user: request.committeeAccount });
});

router.post("/auth/logout", (_request, response) => {
  response.clearCookie(committeeCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response.json({ success: true });
});

export default router;