import devServer from "@hono/vite-dev-server"
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
const __dirname = import.meta.dirname
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react(), tailwindcss()],
    build: {
      assetsInlineLimit: 100000000, // inline every asset (css/js/images) as data URIs
      cssCodeSplit: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
  envDir: path.resolve(__dirname),
});
