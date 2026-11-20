# AI Page Summarizer

A Chrome extension (Manifest V3) that summarizes the page you're on into 5 short bullet points using Claude. Built with Vite + React (JavaScript), using a plain Vite multi-page build with no extension plugin.

## Features

- **Summarize this page:** sends the page title and visible text (trimmed to about 15,000 words) to Claude and shows a 5-bullet summary.
- **Explain like I'm a beginner:** rewrites the summary in simpler words.
- **Copy** button on each summary.
- Loading spinner and clear error messages (no key saved, network error, API error, page can't be read, request declined).
- Dark theme.

## Requirements

- Node.js 20+
- Google Chrome
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

## Build

```bash
npm install
npm run build
```

The extension is written to `dist/`. Use `npm run dev` to rebuild automatically on every save.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist` folder.
4. Pin **AI Page Summarizer** from the puzzle-piece menu.
5. After each rebuild, click the reload ↻ button on the extension's card.

## Add your API key

Click the extension icon and choose **Open settings** (or right-click the icon → **Options**). Paste your key and click **Save key**.

The key is stored only in this browser (`chrome.storage.local`) and is sent only to `api.anthropic.com`. It is never in the code or in a `.env` file, and the settings page never shows it again after saving.

## How it calls Claude

- Official SDK: `@anthropic-ai/sdk`, with `dangerouslyAllowBrowser: true` because the call is made from the extension page using the user's own key.
- Model `claude-opus-5-5`, effort `low`.
- Beta messages endpoint with the server-side fallback beta (`server-side-fallback-2026-07-01`) and `fallbacks: "default"`.
- If `stop_reason` is `"refusal"`, the popup shows a friendly message instead of a summary.

## Project structure

```
public/manifest.json    Extension manifest (copied into dist/)
popup.html              Popup entry page
options.html            Options (settings) entry page
src/popup/              Popup UI
src/options/            Options UI
src/lib/claude.js       Claude API calls, prompts, error handling
src/lib/page.js         Reads the active tab's title and text
src/lib/storage.js      Saves and reads the API key
src/theme.css           Shared dark theme
vite.config.js          Multi-page build config
```

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab when you click the extension |
| `scripting` | Run the script that grabs the page's visible text |
| `storage` | Save your API key in `chrome.storage.local` |
| `https://api.anthropic.com/*` | Call the Claude API |

## Original prompt

This project was built from the following prompt:

> Create a Chrome extension (Manifest V3) using Vite + React + JavaScript. When I click the extension icon, a popup opens with a "Summarize this page" button. For now, the button should just grab the visible text of the current tab and show the first 300 characters in the popup. Use the activeTab and scripting permissions. Use a plain Vite multi-page build, no extension plugin. Tell me the exact npm run build command and how to load the dist folder in Chrome.
>
> Add an options page where the user pastes their own Anthropic API key. Save it with chrome.storage.local. In the popup, if there's no key saved, show a message with a button that opens the options page. Never put the API key in the code or in a .env file. Make the key input a password field so the key shows as dots, and after saving show only "Key saved ✅", never the key itself.
>
> Now send the page title and text to the Claude API and show a 5-bullet summary in the popup. Use the official Anthropic JavaScript SDK (@anthropic-ai/sdk) with model claude-opus-5-5, reading the key from chrome.storage.local. Because this runs inside the extension, enable the SDK's dangerouslyAllowBrowser option. Ask for exactly 5 short bullet points and set the effort to "low". Use the beta messages endpoint with the server-side fallback beta (server-side-fallback-2026-07-01) and fallbacks: "default". Check stop_reason for "refusal" and show a friendly message if the request is declined. Trim the page text to about 15,000 words before sending. Add https://api.anthropic.com/* to host_permissions.
>
> Add an "Explain like I'm a beginner" button that asks for a simpler version of the summary, a Copy button, a loading spinner, and clear error messages (no key saved, network error, API error). Style the popup with a clean dark theme.
