import { defineConfig } from 'vitest/config';

// Production builds deploy to GitHub Pages under the repo-name subpath, so assets
// must resolve against '/build-your-goat/'. Dev + preview-at-root use '/' so the
// local dev server and the preview tooling can open the app at the origin root.
//
// NOTE: `vite preview` serves the production build, so it uses the Pages base —
// that's intentional: it lets `npm run preview` verify the base is correct before
// the GitHub Action ever deploys (a wrong base = blank page on Pages).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/build-your-goat/' : '/',
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
