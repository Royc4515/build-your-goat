import { defineConfig } from 'vitest/config';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// During the strangler-fig JS->TS migration, plain `.js` files import modules
// that are now `.ts`, using a `.js` specifier. Vite/Rollup only remap `.js`->`.ts`
// for `.ts` importers, so this shim resolves a sibling `.ts` when the `.js` is
// absent. It is a no-op once every module is TypeScript, and can be removed then.
function jsToTsFallback() {
  return {
    name: 'js-to-ts-fallback',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;
      const jsPath = resolve(dirname(importer), source);
      if (existsSync(jsPath)) return null; // a real .js exists — leave it alone
      const tsPath = jsPath.replace(/\.js$/, '.ts');
      return existsSync(tsPath) ? tsPath : null;
    },
  };
}

// Production builds deploy to GitHub Pages under the repo-name subpath, so assets
// must resolve against '/build-your-goat/'. Dev + preview-at-root use '/' so the
// local dev server and the preview tooling can open the app at the origin root.
//
// NOTE: `vite preview` serves the production build, so it uses the Pages base —
// that's intentional: it lets `npm run preview` verify the base is correct before
// the GitHub Action ever deploys (a wrong base = blank page on Pages).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/build-your-goat/' : '/',
  plugins: [jsToTsFallback()],
  test: {
    // The engine is pure (no DOM); default to the fast node environment. UI tests
    // that need the DOM opt into jsdom per-file via a `// @vitest-environment jsdom`
    // pragma at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/engine/**', 'src/data/**'],
    },
  },
}));
