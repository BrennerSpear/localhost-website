# localhost-website

Site for LOCALHOST: New York's Sovereign AI Hackathon, at The School, NYC.

Static files in `public/`, no build step.

- Run locally: `python3 -m http.server 8731 --directory public`
- Deploy: automatic. Every push or merge to `main` runs `.github/workflows/deploy.yml` (`wrangler deploy`, Worker with static assets in the Greenpoint Compute Cooperative Cloudflare account) -> https://localhost-website.gpcc.workers.dev. Re-run by hand from the Actions tab (Deploy to Cloudflare, Run workflow). The token is `CLOUDFLARE_API_TOKEN` in the repo's `production` environment (main only).

Fonts: Departure Mono and IBM Plex Mono, both SIL Open Font License (see `public/fonts/`).
