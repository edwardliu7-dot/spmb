import { scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Response as ExpressResponse } from "express";

export const committeeCookieName = "spmb_committee_session";
export const committeeStatuses = ["Baru", "Diverifikasi", "Perlu Perbaikan", "Diterima", "Ditolak"] as const;
export const allJenjang = ["Playgroup", "Daycare", "TK-A", "TK-B", "SD", "SMP"] as const;

type AccountDefinition = {
  username: string;
  passwordHash: string;
  salt: string;
  label: string;
  allowedJenjang: readonly string[];
};

export type CommitteeAccount = Omit<AccountDefinition, "passwordHash" | "salt">;

const accountDefinitions: Record<string, AccountDefinition> = {
  admin: {
    username: "admin",
    passwordHash: "e3ed5e9f81bb7300dc3fefa4b6a7f2369324bdbfde003e7e390c346cf1bfc6afbc2f5c34464a418d8744652c94784343f688ff93c7c50db7af7d47d1759ffc7e",
    salt: "spmb-admin-2027",
    label: "Administrator",
    allowedJenjang: allJenjang,
  },
  datapgtk: {
    username: "datapgtk",
    passwordHash: "563d1600d5ad2770cdafac0c4bb4a20c332f22e6d7764304dd2b215e8471f9cbd96b2bea1d7d91f8bb60818d28449bdfb936a82ed4d97200aef40f2544a209e1",
    salt: "spmb-pgtk-2027",
    label: "Data PGTK",
    allowedJenjang: ["Playgroup", "Daycare", "TK-A", "TK-B"],
  },
  datasd: {
    username: "datasd",
    passwordHash: "b96b2c1639ccdcd951d93237c2c9be9fef43b750cf7ff95f2cc967efe03d60d9a5f40625244a92862d0e235446aba8d871af2e717ad66af3b3c9d84281a4cc28",
    salt: "spmb-sd-2027",
    label: "Data SD",
    allowedJenjang: ["SD"],
  },
  datasmp: {
    username: "datasmp",
    passwordHash: "01ca1c71bf16d13da178adc4828f6f2712f53d7e276e902761280a29ec05c0673249ccf19dda07d178a7781c408a35714382463934890dfbab37addceaa23ab3",
    salt: "spmb-smp-2027",
    label: "Data SMP",
    allowedJenjang: ["SMP"],
  },
};

function publicAccount(account: AccountDefinition): CommitteeAccount {
  return {
    username: account.username,
    label: account.label,
    allowedJenjang: account.allowedJenjang,
  };
}

function passwordMatches(password: string, account: AccountDefinition): boolean {
  const actual = scryptSync(password, account.salt, 64);
  const expected = Buffer.from(account.passwordHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function authenticateCommittee(username: string, password: string): CommitteeAccount | null {
  const account = accountDefinitions[username.trim().toLowerCase()];
  return account && passwordMatches(password, account) ? publicAccount(account) : null;
}

export function getCommitteeAccount(request: Request): CommitteeAccount | null {
  const username = request.signedCookies?.[committeeCookieName];
  const account = typeof username === "string" ? accountDefinitions[username] : undefined;
  return account ? publicAccount(account) : null;
}

export function setCommitteeCookie(response: ExpressResponse, account: CommitteeAccount) {
  response.cookie(committeeCookieName, account.username, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function requireCommitteeAuth(request: Request, response: Response, next: NextFunction) {
  const account = getCommitteeAccount(request);
  if (!account) return response.status(401).json({ error: "Silakan masuk sebagai panitia terlebih dahulu." });
  request.committeeAccount = account;
  return next();
}

export function canAccessJenjang(account: CommitteeAccount, jenjang: string): boolean {
  return account.allowedJenjang.includes(jenjang);
}

export function isKnownJenjang(jenjang: string): boolean {
  return allJenjang.includes(jenjang as (typeof allJenjang)[number]);
}

declare global {
  namespace Express {
    interface Request {
      committeeAccount?: CommitteeAccount;
    }
  }
}