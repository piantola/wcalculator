import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const REPO_NAME = "wcalculator";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${REPO_NAME}` : "",
  assetPrefix: isProd ? `/${REPO_NAME}/` : "",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: {},
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: !isProd,
  workboxOptions: { disableDevLogs: true },
})(nextConfig);
