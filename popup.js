const $ = (id) => document.getElementById(id);

async function init() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  $("enabled").checked = s.enabled;
  $("enabled").addEventListener("change", (e) => {
    chrome.storage.sync.set({ enabled: e.target.checked });
  });

  const { cleaned } = await chrome.storage.local.get({ cleaned: 0 });
  $("count").textContent = cleaned.toLocaleString("en-US");

  $("settings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // "Show AI for this search" only makes sense on a Google results page.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url;
  try {
    url = new URL(tab.url);
  } catch {
    return;
  }
  if (!/^www\.google\./.test(url.hostname) || url.pathname !== "/search") return;

  const showing = url.searchParams.get("show_ai") === "1";
  const btn = $("aiBtn");
  btn.textContent = showing ? "Hide AI again" : "Show AI for this search";
  btn.hidden = false;
  btn.addEventListener("click", () => {
    if (showing) {
      url.searchParams.delete("show_ai");
    } else {
      if (url.searchParams.get("udm") === "14") url.searchParams.delete("udm");
      url.searchParams.set("show_ai", "1");
    }
    chrome.tabs.update(tab.id, { url: url.toString() });
    window.close();
  });
}

init();
