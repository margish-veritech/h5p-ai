/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // PDF.js resolves its fake worker relative to its own package at runtime.
    // Bundling it into a Next vendor chunk breaks that relative import.
    serverComponentsExternalPackages: ["pdfjs-dist"]
  }
};

export default nextConfig;
