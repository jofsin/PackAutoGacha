PackPilot — version 1.6.0

INSTALL / UPDATE
1. Extract this ZIP file to a normal folder.
2. Open chrome://extensions in Chrome.
3. Find DemonGacha Auto Opener and click its Reload icon.
   If this is a new installation, enable Developer mode, choose Load unpacked,
   and select the extracted folder containing manifest.json.
4. Refresh the already-open DemonGacha tab once after updating the extension.
   This one-time refresh loads the updated content script; you do not need to
   keep refreshing afterward.

USE
1. Open https://demongacha.com/#/ and sign in normally.
2. Turn on Continuous automation in the extension popup.
3. Leave the DemonGacha tab open. You can switch to another Chrome tab while
   it watches for packs and runs the visible pack-opening sequence.

AUTOMATED SEQUENCE
1. Watches for the actual Open pack control (button.open-btn[data-open]).
2. Opens one pack as soon as that button is available.
3. Waits for and clicks Tear open.
4. Waits for the visible Skip button and clicks it to finish the animation.
5. Waits for and clicks Continue.
6. Watches for the pack screen to return, then repeats.

BACKGROUND TAB NOTES
- Uses a MutationObserver to react to page changes without relying only on
  frequent polling. This is designed to keep working in a background tab.
- Chrome may throttle background tabs, so actions can be delayed while the tab
  is in the background. For reliable timing, keep the tab open and avoid putting
  the PC to sleep or allowing Chrome to discard the tab.
- It cannot run if Chrome is closed, the tab is closed/unloaded, or the PC sleeps.

SAFETY / LIMITATIONS
- Uses the site's visible UI; it does not call the pack API directly.
- Does not store your password, cookies, or authentication tokens.
- Test while watching the page after installing the update. It clicks only the
  game's existing Open pack, Tear open, Skip, and Continue controls.

VERSION 1.6.0
- Redesigns the popup with a dark, modern interface, clearer automation state, live activity, and workflow overview.
- Updates the extension name and version metadata.

VERSION 1.5.0
- Adds automatic clicking of the visible Skip button after Tear open, then
  continues through the existing Continue control.

VERSION 1.4.0
- Adds MutationObserver-based detection for DOM changes in background tabs.
- Keeps waiting through slow screen transitions instead of timing out and
  abandoning the sequence.
- Improves restart handling and avoids overlapping automation loops.
- Clarifies one-time refresh after updating and background-tab limitations.

VERSION 1.3.0
- Fixes pack detection by targeting button.open-btn[data-open].
- Avoids matching decorative pack artwork that also carries data-open.

PUBLIC RELEASE NOTE
- This build is a prototype. Before public distribution, obtain permission from the game operator for automated interaction and review the applicable game rules and Chrome Web Store policies.
- The extension is unofficial and is not endorsed by the game developer.
