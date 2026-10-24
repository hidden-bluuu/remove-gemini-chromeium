(() => {
  const params = new URLSearchParams(location.search);
  const isSearch = location.pathname === "/search";
  const bypass = params.get("show_ai") === "1";

  const STOP_IDS = new Set(["rso", "center_col", "res", "search", "main"]);
  const hidden = new Set();
  let settings = null;
  let styleEl = null;
  let observer = null;
  let scheduled = false;
  let counted = false;

  function bump() {
    if (counted || !isSearch) return;
    counted = true;
    chrome.storage.local.get({ cleaned: 0 }).then(({ cleaned }) => {
      chrome.storage.local.set({ cleaned: cleaned + 1 });
    });
  }

  function buildCss(s) {
    const css = [];
    if (s.hideAiMode) {
      css.push(
        'a[href*="udm=50"], [role="listitem"]:has(> a[href*="udm=50"]) { display: none !important; }'
      );
    }
    if (s.hideAds) {
      css.push("#tads, #tadsb, #bottomads, [data-text-ad] { display: none !important; }");
    }
    return css.join("\n");
  }

  // Organic results are links with an <h3>; a section never contains those.
  const resultCount = (el) => el.querySelectorAll("a h3").length;

  function sectionOf(heading) {
    let node = heading;
    while (node.parentElement) {
      const parent = node.parentElement;
      if (parent === document.body || STOP_IDS.has(parent.id)) break;
      if (resultCount(parent) > resultCount(node)) break;
      node = parent;
    }
    return node;
  }

  function hide(el) {
    el.style.setProperty("display", "none", "important");
    hidden.add(el);
  }

  function restore() {
    for (const el of hidden) el.style.removeProperty("display");
    hidden.clear();
  }

  function sweep() {
    scheduled = false;
    if (!settings || !settings.enabled || !isSearch) return;

    const targets = [];
    if (settings.method === "hide" && !bypass) {
      targets.push({ re: /^AI Overviews?\b/i, counts: true });
    }
    if (settings.hidePaa) targets.push({ re: /^People also ask$/i, counts: false });
    if (!targets.length) return;

    for (const h of document.querySelectorAll('h1, h2, h3, [role="heading"]')) {
      const text = h.textContent.trim();
      if (!text || text.length > 40) continue;
      const target = targets.find((t) => t.re.test(text));
      if (!target || h.closest("[style*='display: none']")) continue;

      const section = sectionOf(h);
      if (hidden.has(section)) continue;
      hide(section);
      if (target.counts) bump();
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sweep);
  }

  function apply() {
    restore();
    if (!styleEl) {
      styleEl = document.createElement("style");
      document.documentElement.appendChild(styleEl);
    }
    styleEl.textContent = settings.enabled ? buildCss(settings) : "";

    if (settings.enabled && isSearch) {
      if (settings.method === "web" && params.get("udm") === "14" && !bypass) bump();
      if (!observer) {
        observer = new MutationObserver(schedule);
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
      schedule();
    } else if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  async function load() {
    settings = await chrome.storage.sync.get(DEFAULTS);
    apply();
  }

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "sync") load();
  });
  load();
})();
