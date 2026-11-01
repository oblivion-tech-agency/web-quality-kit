import type { NextConfig } from 'next';

const config: NextConfig = {
  // El paquete del kit se consume desde el código fuente (TypeScript).
  transpilePackages: ['@oblivion/fx'],
};

export default config;
