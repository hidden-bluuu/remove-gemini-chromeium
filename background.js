importScripts("defaults.js");

const SEARCH_URL = String.raw`^https://(www\.)?google\.[a-z.]+/search\?`;
const RULE_IDS = [1, 2, 3];

async function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

function buildRules(s) {
  if (!s.enabled) return [];

  const params = [];
  let skipKeys = "";
  if (s.method === "web") {
    params.push({ key: "udm", value: "14" });
    skipKeys = "udm|tbm";
  }
  if (s.forceEnglish) {
    params.push({ key: "hl", value: "en" });
    if (!skipKeys) skipKeys = "hl";
  }
  if (!params.length) return [];

  const resourceTypes = ["main_frame"];
  return [
    // "Show AI for this search" (popup button) opts a single page out.
    {
      id: 3,
      priority: 3,
      action: { type: "allow" },
      condition: { regexFilter: `${SEARCH_URL}(.*&)?show_ai=1`, resourceTypes },
    },
    // Already has the parameter (or is Images/Videos/etc.): leave it alone.
    {
      id: 2,
      priority: 2,
      action: { type: "allow" },
      condition: { regexFilter: `${SEARCH_URL}(.*&)?(${skipKeys})=`, resourceTypes },
    },
    {
      id: 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { transform: { queryTransform: { addOrReplaceParams: params } } },
      },
      condition: { regexFilter: SEARCH_URL, resourceTypes },
    },
  ];
}

async function apply() {
  const s = await getSettings();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: RULE_IDS,
    addRules: buildRules(s),
  });
  await chrome.action.setBadgeText({ text: s.enabled ? "" : "OFF" });
  await chrome.action.setBadgeBackgroundColor({ color: "#6b7280" });
  await chrome.action.setTitle({
    title: s.enabled ? "No Google AI (on)" : "No Google AI (off)",
  });
}

chrome.runtime.onInstalled.addListener(apply);
chrome.runtime.onStartup.addListener(apply);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") apply();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-enabled") return;
  const { enabled } = await getSettings();
  await chrome.storage.sync.set({ enabled: !enabled });
});
