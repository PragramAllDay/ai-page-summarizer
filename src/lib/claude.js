import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from './storage.js';
import { UserFacingError } from './page.js';

const MODEL = 'claude-opus-5-5';

export class NoKeyError extends Error {}
export class RefusalError extends Error {}

async function makeClient() {
  const apiKey = await getApiKey();
  if (!apiKey) throw new NoKeyError('No API key saved.');
  // The key is the user's own, read from chrome.storage.local at runtime,
  // so calling the API straight from the extension page is acceptable here.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function ask(prompt) {
  const client = await makeClient();

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    throw toFriendlyError(err);
  }

  if (response.stop_reason === 'refusal') {
    throw new RefusalError(
      "Claude declined to summarize this page. Try a different page, or a page with less sensitive content."
    );
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new UserFacingError('Claude returned an empty response. Please try again.');
  return text;
}

function toFriendlyError(err) {
  // APIConnectionError extends APIError, so check it first.
  if (err instanceof Anthropic.APIConnectionError) {
    return new UserFacingError('Network error: could not reach the Claude API. Check your internet connection.');
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new UserFacingError('API error (401): your API key was rejected. Check it on the options page.');
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new UserFacingError("API error (403): this API key doesn't have access to this model.");
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new UserFacingError('API error (429): rate limit reached. Wait a moment and try again.');
  }
  if (err instanceof Anthropic.APIError) {
    const detail = err.error?.error?.message || err.message;
    return new UserFacingError(`API error (${err.status ?? 'unknown'}): ${detail}`);
  }
  return new UserFacingError(`Unexpected error: ${err?.message || err}`);
}

export function summarizePage({ title, text }) {
  return ask(
    `Summarize the web page below in exactly 5 short bullet points.
Each bullet starts with "- " and is a single sentence. Output only the 5 bullets, nothing else.

Page title: ${title}

<page_text>
${text}
</page_text>`
  );
}

export function explainForBeginner({ title, summary }) {
  return ask(
    `Here is a 5-bullet summary of a web page titled "${title}":

${summary}

Rewrite it for a complete beginner: exactly 5 short bullet points, each starting with "- ",
using plain everyday words, no jargon (or explain any term you must use). Output only the 5 bullets.`
  );
}
