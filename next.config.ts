import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: Next 16 blocks cross-origin requests to the dev server by
  // default, which breaks testing from a phone on the LAN (and makes the page
  // render black). Production is unaffected.
  allowedDevOrigins: ["192.168.0.162", "www.baserush-test.fun"],
};

export default nextConfig;
