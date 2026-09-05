import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.basename(moduleDirectory) === "lib"
  ? path.resolve(moduleDirectory, "../..")
  : path.resolve(moduleDirectory, "..");

const configuredUploadsDirectory = process.env.UPLOADS_DIRECTORY?.trim();
export const uploadsDirectory = configuredUploadsDirectory
  ? path.resolve(configuredUploadsDirectory)
  : path.join(packageRoot, "uploads");
export const legacyUploadDirectory = path.resolve(packageRoot, "artifacts/api-server/uploads");

mkdirSync(uploadsDirectory, { recursive: true });

function isInside(root: string, candidate: string): boolean {
  return candidate.startsWith(`${root}${path.sep}`);
}

export function resolveStoredUpload(relativePath: unknown): string | null {
  if (typeof relativePath !== "string" || !relativePath || path.isAbsolute(relativePath)) return null;

  const roots = [uploadsDirectory, legacyUploadDirectory];
  for (const root of roots) {
    const candidates = [
      path.resolve(path.dirname(root), relativePath),
      path.resolve(root, path.basename(relativePath)),
    ];
    for (const candidate of candidates) {
      if (isInside(root, candidate) && existsSync(candidate)) return candidate;
    }
  }

  return null;
}