export type ReleaseEnvironment = {
  [key: string]: string | undefined;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  DIS_TRUSTED_UPLOAD_SUBJECTS?: string;
};

/** The alternate host must enforce production gates, even if stale Vercel
 * preview variables exist. Local development and existing Vercel previews
 * retain their separate test behavior. */
export function productionRelease(env: ReleaseEnvironment): boolean {
  return env.DIS_HOST_PRODUCTION === "1" || env.VERCEL_ENV === "production" ||
    (env.VERCEL_ENV === undefined && env.NODE_ENV === "production");
}

/** Production requires live identity credentials. Never return or log keys. */
export function productionIdentityBlocked(env: ReleaseEnvironment): boolean {
  if (!productionRelease(env)) return false;
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
  if (!productionRelease(env)) return true;
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
