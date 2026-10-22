// Forms on this site post to GPCC Forms (form.theschool.nyc). Served from localhost, they post to a
// local one instead (`npm run dev` in gpcc-forms on :8787, or ?api=<origin>) with Cloudflare's
// always-pass Turnstile test key (set inline in apply.html). Production is unchanged.
export const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
export const FORMS_API = LOCAL
  ? (new URLSearchParams(location.search).get("api") || "http://127.0.0.1:8787").replace(/\/+$/, "")
  : "https://form.theschool.nyc";

// ?ref=<code> (an applicant's share link) on any page: kept in this browser so it survives
// navigation, then sent with an application (GPCC Forms stores it as referred_by).
const okRef = (x) => (/^[a-z2-7]{8}$/.test(x || "") ? x : "");
export const REF = (() => {
  const q = okRef((new URLSearchParams(location.search).get("ref") || "").trim().toLowerCase());
  try {
    if (q) localStorage.setItem("localhost-ref", q);
    return okRef(localStorage.getItem("localhost-ref")) || q;
  } catch {
    return q;
  }
})();
