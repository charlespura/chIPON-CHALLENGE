# ChIPONChallenge

Gamified savings challenge built with React, Vite, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

This project is configured for GitHub Pages using the workflow in
`.github/workflows/deploy-pages.yml`.

Important:

- `Deploy from a branch` with `main` and `/root` will not build this Vite app.
- GitHub Pages serves files from the branch; it does not run `npm install` or `vite build`.
- For this project, use `GitHub Actions` as the Pages source.

### Pages setup

1. Open your repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main`.

The workflow will build the app and publish the `dist/` output automatically.

## Notes

- `vite.config.js` uses `base: './'` so asset paths work correctly on GitHub Pages.
- If you insist on `main` + `/root`, you would have to commit built static files into the repository root, which is not a good workflow for this source project.
