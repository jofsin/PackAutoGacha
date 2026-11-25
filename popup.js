const toggle = document.getElementById("enabledToggle");
const stateText = document.getElementById("stateText");
const statusText = document.getElementById("statusText");
const updatedText = document.getElementById("updatedText");
const headerBadge = document.getElementById("headerBadge");

function renderEnabled(enabled) {
  toggle.checked = enabled;
  stateText.textContent = enabled ? "Enabled — monitoring for available packs." : "Stopped — turn on to begin monitoring.";
  headerBadge.textContent = enabled ? "ON" : "IDLE";
  headerBadge.className = enabled ? "badge active" : "badge neutral";
}

function renderStatus(status) {
  if (!status) {
    statusText.textContent = "Open the supported game page to get started.";
    updatedText.textContent = "";
    return;
  }
  statusText.textContent = status.message || "No recent activity.";
  updatedText.textContent = status.updatedAt
    ? `Updated ${new Date(status.updatedAt).toLocaleTimeString()}`
    : "";
}

async function refresh() {
  const data = await chrome.storage.local.get({
    enabled: false,
    dgaStatus: null
  });
  renderEnabled(Boolean(data.enabled));
  renderStatus(data.dgaStatus);
}

toggle.addEventListener("change", async () => {
  await chrome.storage.local.set({ enabled: toggle.checked });
  renderEnabled(toggle.checked);
  if (!toggle.checked) {
    await chrome.storage.local.set({
      dgaStatus: { message: "Stopped.", updatedAt: Date.now() }
    });
    renderStatus({ message: "Stopped.", updatedAt: Date.now() });
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.enabled) renderEnabled(Boolean(changes.enabled.newValue));
  if (changes.dgaStatus) renderStatus(changes.dgaStatus.newValue);
});

document.getElementById("openSite").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://demongacha.com/#/" });
});

refresh();