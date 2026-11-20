// The API key lives only in chrome.storage.local — never in code or .env.
const KEY_NAME = 'anthropicApiKey';

export async function getApiKey() {
  const result = await chrome.storage.local.get(KEY_NAME);
  return result[KEY_NAME] || '';
}

export async function setApiKey(key) {
  await chrome.storage.local.set({ [KEY_NAME]: key });
}

export async function clearApiKey() {
  await chrome.storage.local.remove(KEY_NAME);
}
