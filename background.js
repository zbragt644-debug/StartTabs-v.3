function openTabs(urls) {
  urls.forEach(url => chrome.tabs.create({ url }));
}

// Open tabs when browser starts
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(["urls"], (data) => {
    if (data.urls && data.urls.length > 0) {
      openTabs(data.urls);
    }
  });
});

// Also when extension is installed for first time
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["urls"], (data) => {
    if (data.urls && data.urls.length > 0) {
      openTabs(data.urls);
    }
  });
});

// ✅ Handle "LINK START" button click from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openTabs") {
    chrome.storage.sync.get(["urls"], (data) => {
      if (data.urls && data.urls.length > 0) {
        openTabs(data.urls);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No URLs saved" });
      }
    });
    return true; // keeps sendResponse async
  }
});
