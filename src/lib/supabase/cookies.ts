const SESSION_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

function getSiteHostname() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;

  try {
    return new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function normalizeHostname(host: string | null | undefined) {
  if (!host) return undefined;
  return host.split(":")[0]?.toLowerCase().replace(/^www\./, "");
}

export function getSessionCookieDomain(host: string | null | undefined) {
  const siteHostname = getSiteHostname();
  const requestHostname = normalizeHostname(host);

  if (!siteHostname || !requestHostname || !siteHostname.includes(".")) {
    return undefined;
  }

  if (
    requestHostname === siteHostname ||
    requestHostname.endsWith(`.${siteHostname}`)
  ) {
    return `.${siteHostname}`;
  }

  return undefined;
}

export function getSessionCookieOptions(host: string | null | undefined) {
  const domain = getSessionCookieDomain(host);

  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    maxAge: SESSION_COOKIE_MAX_AGE,
    ...(domain ? { domain } : {}),
  };
}
