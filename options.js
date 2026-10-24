const $ = (id) => document.getElementById(id);
let statusTimer;

function flashSaved() {
  const el = $("status");
  el.classList.add("show");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => el.classList.remove("show"), 1200);
}

async function renderCount() {
  const { cleaned } = await chrome.storage.local.get({ cleaned: 0 });
  $("count").textContent = cleaned.toLocaleString("en-US");
}

async function init() {
  const s = await chrome.storage.sync.get(DEFAULTS);

  for (const input of document.querySelectorAll("[data-key]")) {
    const key = input.dataset.key;
    if (input.type === "radio") {
      input.checked = s[key] === input.value;
    } else {
      input.checked = !!s[key];
    }
    input.addEventListener("change", async () => {
      const value = input.type === "radio" ? input.value : input.checked;
      await chrome.storage.sync.set({ [key]: value });
      flashSaved();
    });
  }

  renderCount();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.cleaned) renderCount();
  });

  $("reset").addEventListener("click", async () => {
    await chrome.storage.local.set({ cleaned: 0 });
    flashSaved();
  });
  $("shortcuts").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
}

init();
