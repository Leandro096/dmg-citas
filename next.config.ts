import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Subida de estudios médicos: hasta 3 archivos de 10 MB por envío.
    serverActions: { bodySizeLimit: "32mb" },
  },
};

export default nextConfig;
