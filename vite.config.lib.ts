import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// Config for building the library package itself
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/lib'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'MediaStack',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'es.js' : 'umd.js'}`,
    },
    rollupOptions: {
      // Exclude peer dependencies and subpaths (like react/jsx-runtime) from bundled library code
      external: (id) => /^react(-dom)?(\/|$)/.test(id),
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'JSX',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css';
          return assetInfo.name || '';
        },
      },
    },
  },
});
