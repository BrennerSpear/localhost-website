# localhost-website

Site for LOCALHOST: New York's Sovereign AI Hackathon, at The School, NYC.

Static files in `public/`, no build step.

- Run locally: `python3 -m http.server 8731 --directory public`
- Deploy: `wrangler deploy` (Worker with static assets in the Greenpoint Compute Cooperative Cloudflare account) -> https://localhost-website.gpcc.workers.dev

Fonts: Departure Mono and IBM Plex Mono, both SIL Open Font License (see `public/fonts/`).
