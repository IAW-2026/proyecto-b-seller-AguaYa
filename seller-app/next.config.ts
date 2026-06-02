/**
 * next.config.ts — Configuración de Next.js.
 *
 * Habilita imágenes AVIF/WebP, permite el dominio de Cloudinary
 * y activa el compilador experimental de React.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
