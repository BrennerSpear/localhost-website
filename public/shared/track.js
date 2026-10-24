// Where visitors come from, and the ad tags. Two parts:
//
// 1. SOURCE (first-party, always on): the utm_* tags, ad click id (gclid from Google Ads, twclid
//    from X), referring host and landing path of the visit that brought someone here, kept in this
//    browser for 30 days and sent with an application or sponsor form (GPCC Forms stores it beside
//    the answers; the results page shows it). A tagged or ad-clicked visit replaces an older one.
//
// 2. The Google tag (Analytics page views + Google Ads conversions) and the X pixel, loaded only
//    when their ids below are filled in, and never for a browser sending Global Privacy Control.
//    convert("hacker" | "sponsor") reports a finished form to both.
const IDS = {
  ga4: "", // Google Analytics: "G-XXXXXXXXXX"
  googleAds: "", // Google Ads tag: "AW-XXXXXXXXXX"
  googleAdsLabel: { hacker: "", sponsor: "" }, // conversion labels, from Ads > Goals > Conversions
  xPixel: "", // X pixel id: "abc12"
  xEvent: { hacker: "", sponsor: "" }, // X conversion event ids: "tw-abc12-def34"
};

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "twclid"];
const DAYS = 30;
const clip = (s) => String(s).trim().slice(0, 300);

export const SOURCE = (() => {
  const q = new URLSearchParams(location.search);
  const now = {};
  for (const k of KEYS) if (q.get(k)) now[k] = clip(q.get(k));
  let ref = "";
  try {
    const r = new URL(document.referrer);
    if (r.hostname && r.hostname !== location.hostname) ref = r.hostname;
  } catch {}
  let kept = null;
  try {
    kept = JSON.parse(localStorage.getItem("localhost-src") || "null");
    if (kept && !(Date.now() - kept.at < DAYS * 864e5)) kept = null;
  } catch {}
  // A tagged link or ad click always wins; a plain outside referrer only fills an empty slot.
  if (Object.keys(now).length || (ref && !kept)) {
    kept = { at: Date.now(), src: { ...now, ...(ref ? { referrer: ref } : {}), landing: clip(location.pathname) } };
    try {
      localStorage.setItem("localhost-src", JSON.stringify(kept));
    } catch {}
  }
  return kept ? kept.src : {};
})();

const gpc = navigator.globalPrivacyControl === true;
const load = (src) => {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

if (!gpc && (IDS.ga4 || IDS.googleAds)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    dataLayer.push(arguments);
  };
  gtag("js", new Date());
  if (IDS.ga4) gtag("config", IDS.ga4);
  if (IDS.googleAds) gtag("config", IDS.googleAds);
  load("https://www.googletagmanager.com/gtag/js?id=" + (IDS.ga4 || IDS.googleAds));
}
if (!gpc && IDS.xPixel) {
  // X's base code: queue calls until uwt.js arrives.
  const t = (window.twq = function () {
    t.exe ? t.exe.apply(t, arguments) : t.queue.push(arguments);
  });
  t.version = "1.1";
  t.queue = [];
  load("https://static.ads-twitter.com/uwt.js");
  twq("config", IDS.xPixel);
}

/** A form went through: count it in Analytics, Google Ads and X (whichever are on). */
export function convert(kind) {
  if (window.gtag) {
    if (IDS.ga4) gtag("event", "generate_lead", { form: kind });
    if (IDS.googleAds && IDS.googleAdsLabel[kind]) gtag("event", "conversion", { send_to: IDS.googleAds + "/" + IDS.googleAdsLabel[kind] });
  }
  if (window.twq && IDS.xEvent[kind]) twq("event", IDS.xEvent[kind], {});
}
