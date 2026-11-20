import { useEffect, useState } from 'react';
import { getApiKey } from '../lib/storage.js';
import { getPageContent, trimToWords } from '../lib/page.js';
import { summarizePage, explainForBeginner, NoKeyError } from '../lib/claude.js';

function parseBullets(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function SummaryCard({ heading, text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="card">
      <h2>{heading}</h2>
      <ul>
        {parseBullets(text).map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <div className="card-footer">
        <button onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
    </div>
  );
}

export default function Popup() {
  const [hasKey, setHasKey] = useState(null); // null = still checking
  const [page, setPage] = useState(null);
  const [summary, setSummary] = useState('');
  const [simple, setSimple] = useState('');
  const [trimmed, setTrimmed] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getApiKey().then((k) => setHasKey(Boolean(k)));
  }, []);

  const openOptions = () => chrome.runtime.openOptionsPage();

  const run = async (label, fn) => {
    setError('');
    setLoading(label);
    try {
      await fn();
    } catch (err) {
      if (err instanceof NoKeyError) setHasKey(false);
      else setError(err.message || String(err));
    } finally {
      setLoading('');
    }
  };

  const onSummarize = () =>
    run('Summarizing…', async () => {
      setSummary('');
      setSimple('');
      const content = await getPageContent();
      const { text, trimmed } = trimToWords(content.text, 15000);
      setTrimmed(trimmed);
      setPage({ title: content.title });
      setSummary(await summarizePage({ title: content.title, text }));
    });

  const onExplain = () =>
    run('Simplifying…', async () => {
      setSimple(await explainForBeginner({ title: page.title, summary }));
    });

  if (hasKey === null) return <div className="popup" />;

  if (!hasKey) {
    return (
      <div className="popup">
        <h1>AI Page Summarizer</h1>
        <div className="nokey">
          <p>No API key saved. Add your Anthropic API key to start summarizing pages.</p>
          <button className="primary" onClick={openOptions}>Open settings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <h1>AI Page Summarizer</h1>
        <button className="link" onClick={openOptions}>Settings</button>
      </div>

      <div className="actions">
        <button className="primary" onClick={onSummarize} disabled={Boolean(loading)}>
          Summarize this page
        </button>
        {summary && (
          <button onClick={onExplain} disabled={Boolean(loading)}>
            Explain like I'm a beginner
          </button>
        )}
      </div>

      {loading && (
        <div className="loading"><div className="spinner" /> {loading}</div>
      )}

      {error && <div className="error">{error}</div>}

      {summary && <SummaryCard heading={page?.title || 'Summary'} text={summary} />}
      {trimmed && summary && (
        <p className="muted">This page was long, so only its first ~15,000 words were summarized.</p>
      )}
      {simple && <SummaryCard heading="Beginner version" text={simple} />}
    </div>
  );
}
