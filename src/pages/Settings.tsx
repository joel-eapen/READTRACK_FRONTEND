import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Input } from "../components/ui";
import { useCreateApiKey } from "../services/useCreateApiKey";
import { useApiKeys, type ApiKeyMeta } from "../services/useApiKeys";
import { useDeleteApiKey } from "../services/useDeleteApiKey";
import "./Settings.css";

/** Format an ISO date for display, tolerating null/undefined. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function Settings() {
  const createApiKey = useCreateApiKey();
  const listApiKeys = useApiKeys();
  const deleteApiKey = useDeleteApiKey();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // The freshly-created plaintext key. Held ONLY in component state — never
  // persisted — so a refresh, navigation, or tab close removes it for good.
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Existing keys (metadata only — never the key value).
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState("");

  const loadKeys = useCallback(async () => {
    setKeysError("");
    setKeysLoading(true);
    try {
      setKeys(await listApiKeys());
    } catch (err) {
      setKeysError(
        err instanceof Error ? err.message : "Couldn't load your API keys.",
      );
    } finally {
      setKeysLoading(false);
    }
  }, [listApiKeys]);

  // Load existing keys on mount. The async work (and its setState calls) runs
  // after the effect returns, not synchronously within it.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await listApiKeys();
        if (active) setKeys(result);
      } catch (err) {
        if (active) {
          setKeysError(
            err instanceof Error ? err.message : "Couldn't load your API keys.",
          );
        }
      } finally {
        if (active) setKeysLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listApiKeys]);

  // Per-key revoke state: the id currently being revoked, plus any error.
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState("");

  const handleRevoke = async (key: ApiKeyMeta) => {
    if (!key._id || revokingId) return;
    const label = key.name || "this key";
    if (
      !window.confirm(
        `Revoke ${label}? Any application using it will stop working. This can't be undone.`,
      )
    ) {
      return;
    }

    setRevokeError("");
    setRevokingId(key._id);
    try {
      await deleteApiKey(key._id);
      // Refresh so the key shows as revoked (backend soft-deletes).
      await loadKeys();
    } catch (err) {
      setRevokeError(
        err instanceof Error ? err.message : "Couldn't revoke the key.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setError("");
    setCopied(false);
    setLoading(true);
    try {
      const key = await createApiKey(trimmed);
      setNewKey(key);
      // Refresh the metadata list so the new key appears.
      void loadKeys();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the API key.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      setError("Couldn't copy automatically — select and copy the key manually.");
    }
  };

  // Clear the key from memory once the user confirms they've saved it.
  const handleDismiss = () => {
    setNewKey(null);
    setCopied(false);
    setName("");
  };

  return (
    <div className="settings">
      <header className="settings__head">
        <h1>Developer Settings</h1>
        <p className="settings__sub">
          Create API keys to access the READTRACK API programmatically.
        </p>
      </header>

      <section className="settings__card" aria-labelledby="create-key-title">
        <h2 id="create-key-title" className="settings__card-title">
          Create an API key
        </h2>

        {newKey ? (
          // ---- One-time reveal ----
          <div className="settings__reveal">
            <div className="settings__warning" role="alert">
              <Badge tone="warning">Copy it now</Badge>
              <p className="settings__warning-text">
                This key is shown <strong>only once</strong>. We store a hashed
                version and can&apos;t show it again. If you lose it, you&apos;ll
                need to create a new one.
              </p>
            </div>

            <label className="settings__key-label label-caps" htmlFor="new-key">
              Your new API key
            </label>
            <div className="settings__key-row">
              <code id="new-key" className="settings__key" tabIndex={0}>
                {newKey}
              </code>
              <Button
                type="button"
                variant={copied ? "neutral" : "primary"}
                onClick={handleCopy}
              >
                {copied ? "Copied ✓" : "Copy"}
              </Button>
            </div>

            {error ? (
              <p className="settings__error label-caps" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="button" variant="secondary" onClick={handleDismiss}>
              I&apos;ve saved it — done
            </Button>
          </div>
        ) : (
          // ---- Create form ----
          <form className="settings__form" onSubmit={handleSubmit}>
            <Input
              label="Key name"
              placeholder="e.g. My laptop, CI pipeline…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hint="A label to help you recognise this key later."
              error={error || undefined}
              aria-label="API key name"
            />
            <Button type="submit" size="lg" loading={loading} disabled={!name.trim()}>
              Generate API key
            </Button>
          </form>
        )}
      </section>

      <section className="settings__card" aria-labelledby="keys-list-title">
        <div className="settings__list-head">
          <h2 id="keys-list-title" className="settings__card-title">
            Your API keys
          </h2>
          <Button
            type="button"
            variant="neutral"
            size="sm"
            onClick={loadKeys}
            disabled={keysLoading}
          >
            Refresh
          </Button>
        </div>

        {keysError ? (
          <div className="settings__list-error" role="alert">
            <p className="label-caps">{keysError}</p>
            <Button variant="neutral" size="sm" onClick={loadKeys}>
              Retry
            </Button>
          </div>
        ) : null}

        {keysLoading && keys.length === 0 ? (
          <p className="settings__muted label-caps">Loading keys…</p>
        ) : null}

        {!keysLoading && !keysError && keys.length === 0 ? (
          <p className="settings__muted">
            You don&apos;t have any API keys yet. Create one above.
          </p>
        ) : null}

        {keys.length > 0 ? (
          <ul className="settings__keys">
            {keys.map((k, i) => {
              const revoked = Boolean(k.revokedAt);
              return (
                <li
                  key={k._id ?? `${k.name ?? "key"}-${k.createdAt ?? i}`}
                  className="settings__key-item"
                >
                  <div className="settings__key-main">
                    <span className="settings__key-name">
                      {k.name || "Unnamed key"}
                    </span>
                    <Badge tone={revoked ? "danger" : "success"}>
                      {revoked ? "Revoked" : "Active"}
                    </Badge>
                  </div>
                  <dl className="settings__key-meta">
                    <div>
                      <dt className="label-caps">Created</dt>
                      <dd>{formatDate(k.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="label-caps">Last used</dt>
                      <dd>{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}</dd>
                    </div>
                    {revoked ? (
                      <div>
                        <dt className="label-caps">Revoked</dt>
                        <dd>{formatDate(k.revokedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {!revoked ? (
                    <div className="settings__key-actions">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={revokingId === k._id}
                        disabled={!k._id || revokingId !== null}
                        onClick={() => handleRevoke(k)}
                      >
                        Revoke
                      </Button>
                      {!k._id ? (
                        <span className="settings__muted label-caps">
                          Revoke unavailable (no id returned)
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {revokeError ? (
          <p className="settings__error label-caps" role="alert">
            {revokeError}
          </p>
        ) : null}
      </section>

      <section className="settings__card settings__note">
        <h2 className="settings__card-title">Using your key</h2>
        <p className="settings__note-text">
          Send the key in the <code>Authorization</code> header as a bearer
          token:
        </p>
        <pre className="settings__code">
          <code>Authorization: Bearer rt_your_key_here</code>
        </pre>
        <p className="settings__note-text">
          Keep keys secret. Anyone with a key can access the API as you.
        </p>
      </section>
    </div>
  );
}
