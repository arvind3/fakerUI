import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

import { downloadText } from "../lib/download";
import { coerceParameterValue, parseKwargsJson } from "../lib/kwargs";
import type { ActiveFormatter, OutputFormat } from "../lib/types";
import { fakerRuntimeClient } from "../pyodide/client";

interface TryPanelProps {
  open: boolean;
  formatter: ActiveFormatter | null;
  locales: string[];
  ensureRuntime: () => Promise<void>;
  onClose: () => void;
}

const FORMAT_OPTIONS: OutputFormat[] = ["table", "json", "csv"];

function SkeletonRows(): JSX.Element {
  return (
    <div className="skeleton-wrap" aria-label="Loading Python runtime, please wait" role="status">
      <div className="skeleton-row wide" />
      <div className="skeleton-row medium" />
      <div className="skeleton-row wide" />
      <div className="skeleton-row narrow" />
      <div className="skeleton-row wide" />
      <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
        Loading Python runtime&hellip; this takes a moment on first use.
      </p>
    </div>
  );
}

export function TryPanel({ open, formatter, locales, ensureRuntime, onClose }: TryPanelProps): JSX.Element | null {
  const [locale, setLocale] = useState("en_US");
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("table");
  const [seedInput, setSeedInput] = useState("");
  const [unique, setUnique] = useState(false);
  const [rawKwargs, setRawKwargs] = useState("{}");
  const [parameterInputs, setParameterInputs] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<unknown[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!formatter) {
      return;
    }

    const nextInputs: Record<string, string> = {};
    for (const parameter of formatter.parameters) {
      nextInputs[parameter.name] = "";
    }

    setLocale(locales[0] || "en_US");
    setCount(10);
    setFormat("table");
    setSeedInput("");
    setUnique(false);
    setRawKwargs("{}");
    setParameterInputs(nextInputs);
    setRows([]);
    setProgress(0);
    setError(null);
    setCopied(false);
  }, [formatter, locales]);

  const tableRows = useMemo(() => {
    return rows.map((row) => {
      if (row !== null && typeof row === "object" && !Array.isArray(row)) {
        return row as Record<string, unknown>;
      }
      return { value: row };
    });
  }, [rows]);

  const tableColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of tableRows) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }, [tableRows]);

  if (!open || !formatter) {
    return null;
  }

  const handleGenerate = async () => {
    setError(null);
    setProgress(0);
    setCopied(false);

    const parsedCount = Math.max(1, Math.min(5000, count));
    const parsedSeed = seedInput.trim() ? Number.parseInt(seedInput, 10) : null;

    if (seedInput.trim() && Number.isNaN(parsedSeed as number)) {
      setError("Seed must be an integer");
      return;
    }

    const { parsed, error: kwargsError } = parseKwargsJson(rawKwargs);
    if (kwargsError) {
      setError(kwargsError);
      return;
    }

    const autoKwargs: Record<string, unknown> = {};
    for (const parameter of formatter.parameters) {
      const input = parameterInputs[parameter.name] || "";
      const coerced = coerceParameterValue(input, parameter);
      if (coerced !== undefined) {
        autoKwargs[parameter.name] = coerced;
      }
    }

    const mergedKwargs = { ...autoKwargs, ...parsed };

    try {
      setIsGenerating(true);
      setIsRuntimeLoading(true);
      await ensureRuntime();
      setIsRuntimeLoading(false);
      const generated = await fakerRuntimeClient.generate({
        method: formatter.name,
        locale,
        count: parsedCount,
        seed: parsedSeed,
        unique,
        kwargs: mergedKwargs,
        onProgress: (next) => setProgress(next)
      });
      setRows(generated);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : String(generationError));
    } finally {
      setIsGenerating(false);
      setIsRuntimeLoading(false);
    }
  };

  const handleDownload = () => {
    if (rows.length === 0) {
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "json") {
      downloadText(`${formatter.name}-${stamp}.json`, "application/json", JSON.stringify(rows, null, 2));
      return;
    }

    const csvRows = tableRows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key] =
          value === null || value === undefined
            ? ""
            : typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
      }
      return normalized;
    });

    const csv = Papa.unparse(csvRows);
    downloadText(`${formatter.name}-${stamp}.csv`, "text/csv", csv);
  };

  const handleCopy = () => {
    if (rows.length === 0) return;
    const text = format === "csv"
      ? Papa.unparse(
          tableRows.map((row) => {
            const normalized: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) {
              normalized[key] = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
            }
            return normalized;
          })
        )
      : JSON.stringify(rows.slice(0, 50), null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* clipboard unavailable */});
  };

  const kwargsDisplay = Object.entries({ ...Object.fromEntries(formatter.parameters.map(p => [p.name, parameterInputs[p.name] || ""])), ...(() => { try { return JSON.parse(rawKwargs) as Record<string, unknown>; } catch { return {}; } })() })
    .filter(([, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");

  const codeSnippet = `from faker import Faker
fake = Faker("${locale}")
results = [fake.${formatter.name}(${kwargsDisplay}) for _ in range(${count})]`;

  return (
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="try-panel-title">
      <div className="modal-content panel">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Interactive generator</p>
            <h2 id="try-panel-title">
              {formatter.name} <code>{formatter.signature}</code>
            </h2>
            <p>{formatter.doc || "No docstring summary provided."}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close try panel">
            Close
          </button>
        </header>

        <div className="form-grid">
          <label>
            Locale
            <select value={locale} onChange={(event) => setLocale(event.target.value)}>
              {locales.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            Count (1&ndash;5000)
            <input
              type="number"
              min={1}
              max={5000}
              value={count}
              onChange={(event) => setCount(Number.parseInt(event.target.value || "1", 10))}
            />
          </label>

          <label>
            Output format
            <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}>
              {FORMAT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label>
            Seed (advanced)
            <input value={seedInput} onChange={(event) => setSeedInput(event.target.value)} placeholder="Optional integer" />
          </label>

          <label className="checkbox-row">
            <input type="checkbox" checked={unique} onChange={(event) => setUnique(event.target.checked)} />
            Use <code>faker.unique</code> (best effort)
          </label>
        </div>

        {formatter.parameters.length > 0 && (
          <section>
            <h3>Detected parameters</h3>
            <div className="param-grid">
              {formatter.parameters.map((parameter) => (
                <label key={parameter.name}>
                  {parameter.name}
                  <input
                    value={parameterInputs[parameter.name] || ""}
                    onChange={(event) =>
                      setParameterInputs((current) => ({
                        ...current,
                        [parameter.name]: event.target.value
                      }))
                    }
                    placeholder={parameter.default || parameter.annotation || "value"}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3>Raw Python kwargs JSON fallback</h3>
          <textarea
            aria-label="Raw kwargs JSON"
            rows={4}
            value={rawKwargs}
            onChange={(event) => setRawKwargs(event.target.value)}
          />
          <p className="muted">Example: {"{\"min\": 10, \"max\": 100}"}</p>
        </section>

        <div className="action-row">
          <button type="button" disabled={isGenerating} onClick={handleGenerate}>
            {isGenerating ? (isRuntimeLoading ? "Starting runtime\u2026" : "Generating\u2026") : "Generate"}
          </button>
          <button type="button" onClick={handleDownload} disabled={rows.length === 0}>
            Download
          </button>
          <progress value={progress} max={1} aria-label="Generation progress" />
        </div>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <section className="preview">
          <div className="preview-header">
            <h3>Preview</h3>
            {rows.length > 0 && (
              <button
                type="button"
                className={`copy-btn${copied ? " copied" : ""}`}
                onClick={handleCopy}
                aria-label="Copy output to clipboard"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {isRuntimeLoading && <SkeletonRows />}

          {!isRuntimeLoading && rows.length === 0 && !isGenerating && (
            <p className="muted">No output yet. Configure options above and click Generate.</p>
          )}

          {rows.length > 0 && format === "json" && <pre>{JSON.stringify(rows.slice(0, 50), null, 2)}</pre>}

          {rows.length > 0 && (format === "table" || format === "csv") && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {tableColumns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(0, 100).map((row, index) => (
                    <tr key={`${formatter.name}-${index}`}>
                      {tableColumns.map((column) => (
                        <td key={`${index}-${column}`}>{String(row[column] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <details className="code-snippet">
              <summary>Show Python code snippet</summary>
              <pre>{codeSnippet}</pre>
            </details>
          )}
        </section>
      </div>
    </section>
  );
}
