export type ReleaseEnvironment = {
  [key: string]: string | undefined;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  DIS_TRUSTED_UPLOAD_SUBJECTS?: string;
};

/**
 * A Vercel production deployment is not an identity release when configured
 * with Clerk development credentials. Never return or log key material.
 */
export function productionIdentityBlocked(env: ReleaseEnvironment): boolean {
  if (env.VERCEL_ENV !== "production") return false;
  return !(
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_") &&
    env.CLERK_SECRET_KEY?.startsWith("sk_live_")
  );
}

/**
 * Malware scanning and document lifecycle acceptance remain open.
 * Until those are passed, production uploads are allowlisted beta only.
 * A missing or empty allowlist is deliberately deny-all.
 */
export function trustedProductionUploader(
  subjectId: string,
  env: ReleaseEnvironment,
): boolean {
  if (!subjectId || productionIdentityBlocked(env)) return false;
  if (env.VERCEL_ENV !== "production") return true;
  const ids = new Set(
    (env.DIS_TRUSTED_UPLOAD_SUBJECTS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  return ids.has(subjectId);
}

export const RELEASE_NOTICE =
  "Private DIS features are not publicly released until production identity and independent acceptance checks pass.";
