/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  reactStrictMode: false,
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };  
    config.stats = "errors-only"; 
    return config;
  },
};

export default nextConfig;

