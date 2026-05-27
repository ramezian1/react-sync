// Attempt to open the extension popup from a user-gesture context.
// chrome.action.openPopup() is the only API that opens the toolbar popup
// programmatically. Availability:
//   - Chrome 127+ for general use
//   - Older Chrome: only policy-installed extensions, otherwise throws
//   - Firefox: not supported
// On failure, we leave the onboarding tab open so the user can still find
// their way back. The hint text is updated to make the fallback obvious.
async function tryOpenPopup(hintEl) {
  try {
    if (chrome.action && typeof chrome.action.openPopup === 'function') {
      await chrome.action.openPopup();
      return true;
    }
  } catch (e) {
    // Fall through — typically "No active browser window" or unsupported
  }
  if (hintEl) {
    hintEl.textContent = 'Your browser version can\'t open the popup automatically — click the ⟳ icon in your toolbar to continue.';
    hintEl.classList.add('cta-hint-fallback');
  }
  return false;
}

document.getElementById('openPopupBtn').addEventListener('click', () => {
  tryOpenPopup(document.getElementById('quickCtaHint'));
});

document.getElementById('doneBtn').addEventListener('click', async () => {
  const opened = await tryOpenPopup(document.getElementById('ctaHint'));
  // If the popup opened, close the onboarding tab. The popup lives on the
  // toolbar so the user no longer needs this tab for navigation.
  if (opened) window.close();
});
