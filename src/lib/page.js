// Grabs the title and visible text of the active tab (activeTab + scripting).
export async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new UserFacingError('No active tab found.');

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ title: document.title, text: document.body?.innerText ?? '' }),
    });
  } catch {
    throw new UserFacingError(
      "Can't read this page. Chrome blocks extensions on chrome:// pages, the Web Store, and some built-in pages."
    );
  }

  const { title, text } = results?.[0]?.result ?? {};
  const clean = (text || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) throw new UserFacingError('This page has no visible text to summarize.');
  return { title: title || tab.title || 'Untitled page', text: clean };
}

// Keep roughly the first `maxWords` words.
export function trimToWords(text, maxWords = 15000) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return { text, trimmed: false };
  return { text: words.slice(0, maxWords).join(' '), trimmed: true };
}

export class UserFacingError extends Error {}
