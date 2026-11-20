import { useEffect, useState } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../lib/storage.js';

const styles = {
  page: { maxWidth: 520, margin: '48px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8, font: 'inherit',
    background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)',
  },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
};

export default function Options() {
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only check whether a key exists — never load it into the page.
    getApiKey().then((k) => setSaved(Boolean(k)));
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    const key = input.trim();
    if (!key) return setError('Paste your API key first.');
    if (!key.startsWith('sk-ant-')) return setError('That doesn\'t look like an Anthropic API key (it should start with "sk-ant-").');
    await setApiKey(key);
    setInput('');
    setError('');
    setSaved(true);
  };

  const onRemove = async () => {
    await clearApiKey();
    setSaved(false);
  };

  return (
    <div style={styles.page}>
      <h1>AI Page Summarizer – Settings</h1>
      <p className="muted">
        Paste your own Anthropic API key. It's stored only in this browser (chrome.storage.local)
        and sent only to api.anthropic.com.
      </p>
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={saved ? 'Paste a new key to replace the saved one' : 'sk-ant-…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
        />
        <div style={styles.row}>
          <button type="submit" className="primary">Save key</button>
          {saved && <button type="button" onClick={onRemove}>Remove key</button>}
        </div>
      </form>
      {error && <div className="error">{error}</div>}
      {saved && !error && <div style={{ color: 'var(--ok)' }}>Key saved ✅</div>}
    </div>
  );
}
