# localhost-website

Site for LOCALHOST: New York's Sovereign AI Hackathon, at The School, NYC.

Static files in `public/`, no build step.

- Run locally: `python3 -m http.server 8731 --directory public`
- Deploy: automatic. Every push or merge to `main` runs `.github/workflows/deploy.yml` (`wrangler deploy`, Worker with static assets in the Greenpoint Compute Cooperative Cloudflare account) -> https://localhost-website.gpcc.workers.dev. Re-run by hand from the Actions tab (Deploy to Cloudflare, Run workflow). The token is `CLOUDFLARE_API_TOKEN` in the repo's `production` environment (main only).

Fonts: Departure Mono and IBM Plex Mono, both SIL Open Font License (see `public/fonts/`).

## Tracks review preview

The `brenner/tracks-preview` branch adds `/tracks`, based on the organizer draft of October 26, 2026. Tracks, sponsor assignments, eligibility and prize amounts remain proposals.

Independent Vercel preview: https://localhostai-dev.brennerspear.com/tracks

The original Cloudflare deployment above stays attached to `main`. The preview uses the separate Vercel project `localhostai-dev` in `tychohq`; Git auto-deployment is not connected. To update it from this branch:

```sh
vercel link -p localhostai-dev --scope tychohq -y
vercel deploy --prod --scope tychohq --local-config vercel.preview.json -y
```

`vercel.preview.json` serves `public/` with clean URLs and asks search engines not to index the review site. `.vercelignore` limits uploads to static website files and excludes Finder metadata. Existing application and sponsor forms still use the live form service; preview review does not require submitting them.
