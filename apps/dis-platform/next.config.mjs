export default {
  reactStrictMode: true,
  // The authenticated raw-original route independently enforces its exact
  // reservation size, 100 MiB bound and two concurrent quarantine spools.
  // Proxy's default 10 MiB buffer would otherwise truncate valid originals.
  experimental: { proxyClientMaxBodySize: 104857600 },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=()" },
      ],
    }];
  },
};
