// Shared by the service worker, content script, popup and options page.
const DEFAULTS = {
  enabled: true,
  // "web": send searches to Google's "Web" tab (no AI Overviews at all).
  // "hide": stay on the normal results page and hide the AI Overview box.
  method: "web",
  // Adds hl=en so the page headings match the English text the "hide" method looks for.
  forceEnglish: false,
  // Hide the "AI Mode" tab and button.
  hideAiMode: true,
  // Hide sponsored results.
  hideAds: false,
  // Hide the "People also ask" box.
  hidePaa: false,
};
