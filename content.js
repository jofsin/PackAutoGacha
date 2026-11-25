(() => {
  if (window.__demonGachaAutoOpenerLoaded) return;
  window.__demonGachaAutoOpenerLoaded = true;

  const STATUS_KEY = "dgaStatus";
  const SCREEN_TIMEOUT_MS = 120000;
  let enabled = false;
  let runnerPromise = null;
  let currentWaitWake = null;

  const onTargetSite = () => location.hostname === "demongacha.com" || location.hostname.endsWith(".demongacha.com");

  function setStatus(message, extra = {}) {
    chrome.storage.local.set({
      [STATUS_KEY]: { message, updatedAt: Date.now(), ...extra }
    });
  }

  function isUsable(button) {
    return Boolean(button && !button.disabled && button.getAttribute("aria-disabled") !== "true");
  }

  function getOpenPackButton() {
    return [...document.querySelectorAll("button.open-btn[data-open]")].find(button => {
      const label = (button.innerText || button.textContent || "").trim();
      return label === "Open pack" && isUsable(button) && button.getClientRects().length > 0;
    }) || null;
  }

  function findButtonByExactText(text, selector = "button") {
    return [...document.querySelectorAll(selector)].find(button =>
      (button.textContent || "").trim() === text && isUsable(button) && button.getClientRects().length > 0
    ) || null;
  }

  // Wake any pending wait immediately when the user switches automation off.
  function wakeCurrentWait() {
    if (currentWaitWake) currentWaitWake();
  }

  // MutationObserver reacts to page changes even when Chrome throttles timers in a
  // background tab. A slow interval remains as a fallback for state changes that
  // do not produce DOM mutations.
  function waitFor(predicate, description, timeoutMs = 0) {
    return new Promise(resolve => {
      let finished = false;
      let observer = null;
      let intervalId = null;
      let timeoutId = null;

      const cleanup = () => {
        if (observer) observer.disconnect();
        if (intervalId !== null) clearInterval(intervalId);
        if (timeoutId !== null) clearTimeout(timeoutId);
        if (currentWaitWake === check) currentWaitWake = null;
      };

      const finish = value => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(value);
      };

      const check = () => {
        if (!enabled) return finish(null);
        try {
          const result = predicate();
          if (result) return finish(result);
        } catch (error) {
          setStatus(`Error while checking for ${description}.`, { error: String(error) });
        }
      };

      currentWaitWake = check;
      check();
      if (finished) return;

      const root = document.documentElement;
      if (root) {
        observer = new MutationObserver(check);
        observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-disabled", "class"] });
      }
      intervalId = window.setInterval(check, 2000);
      if (timeoutMs > 0) {
        timeoutId = window.setTimeout(() => {
          if (!finished) {
            setStatus(`Still waiting for ${description}. Keeping automation active…`);
            // A screen transition can take longer in a throttled background tab.
            // Do not abandon the sequence; continue waiting for the real control.
            timeoutId = null;
          }
        }, timeoutMs);
      }
    });
  }

  async function automationLoop() {
    while (enabled && onTargetSite()) {
      setStatus("Watching for an available pack…");
      const openPack = await waitFor(getOpenPackButton, "an available Open pack button");
      if (!openPack || !enabled) break;

      setStatus("Opening one pack…");
      openPack.click();

      const tearButton = await waitFor(
        () => findButtonByExactText("Tear open", "button.btn.sm"),
        'the "Tear open" button', SCREEN_TIMEOUT_MS
      );
      if (!tearButton || !enabled) break;

      setStatus("Tearing open the pack…");
      tearButton.click();

      // Skip is part of the pack-opening animation. Wait for this exact,
      // visible control before clicking so unrelated buttons are untouched.
      const skipButton = await waitFor(() => {
        const button = document.querySelector("button.btn.skip");
        const label = (button?.textContent || "").trim();
        return button && label.startsWith("Skip") && isUsable(button) && button.getClientRects().length > 0
          ? button : null;
      }, 'the "Skip" button', SCREEN_TIMEOUT_MS);
      if (!skipButton || !enabled) break;

      setStatus("Skipping the pack animation…");
      skipButton.click();

      const continueButton = await waitFor(() => {
        const button = document.querySelector("button#done");
        return button && (button.textContent || "").trim() === "Continue" && isUsable(button) && button.getClientRects().length > 0
          ? button : null;
      }, 'the "Continue" button', SCREEN_TIMEOUT_MS);
      if (!continueButton || !enabled) break;

      setStatus("Cards revealed. Returning to the pack screen…");
      continueButton.click();

      const returnedToPacks = await waitFor(
        () => !document.querySelector("button#done") && getOpenPackButton(),
        "the pack screen"
      );
      if (!returnedToPacks || !enabled) break;
    }
  }

  function startRunner() {
    if (!enabled || !onTargetSite() || runnerPromise) return;
    runnerPromise = automationLoop()
      .catch(error => {
        setStatus("Automation hit an error. It will retry when the page changes or becomes active.", { error: String(error) });
      })
      .finally(() => {
        runnerPromise = null;
        if (!enabled) setStatus("Stopped.");
        else if (onTargetSite()) {
          // If a route transition interrupted the loop, restart without a page refresh.
          window.setTimeout(startRunner, 1000);
        }
      });
  }

  async function loadSetting() {
    try {
      const result = await chrome.storage.local.get({ enabled: false });
      enabled = Boolean(result.enabled);
      if (enabled) {
        setStatus("Starting background-aware automation…");
        startRunner();
      } else {
        setStatus("Stopped.");
      }
    } catch (error) {
      enabled = false;
      setStatus("Could not read extension settings.", { error: String(error) });
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.enabled) return;
    enabled = Boolean(changes.enabled.newValue);
    if (enabled) {
      setStatus("Automation enabled. Watching the page…");
      startRunner();
    } else {
      wakeCurrentWait();
      setStatus("Stopped.");
    }
  });

  function resumeIfEnabled() {
    if (!enabled || !onTargetSite()) return;
    if (!runnerPromise) {
      setStatus("Resuming page monitoring…");
      startRunner();
    } else {
      wakeCurrentWait();
    }
  }

  window.addEventListener("pageshow", resumeIfEnabled);
  window.addEventListener("focus", resumeIfEnabled);
  window.addEventListener("hashchange", resumeIfEnabled);
  window.addEventListener("popstate", resumeIfEnabled);
  document.addEventListener("visibilitychange", resumeIfEnabled);

  loadSetting();
})();
