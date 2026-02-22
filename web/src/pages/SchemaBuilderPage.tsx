import { useMemo, useState } from "react";
import Papa from "papaparse";

import { downloadText } from "../lib/download";
import { parseKwargsJson } from "../lib/kwargs";
import type { CatalogData, SchemaField } from "../lib/types";
import { fakerRuntimeClient } from "../pyodide/client";

interface SchemaBuilderPageProps {
  catalog: CatalogData;
  ensureRuntime: () => Promise<void>;
  initialFields?: SchemaField[];
}

interface EditableField {
  id: number;
  name: string;
  method: string;
  kwargsJson: string;
}

function schemaFieldsToEditable(fields: SchemaField[]): EditableField[] {
  return fields.map((field, index) => ({
    id: index + 1,
    name: field.name,
    method: field.method,
    kwargsJson: Object.keys(field.kwargs).length > 0 ? JSON.stringify(field.kwargs) : "{}"
  }));
}

export function SchemaBuilderPage({ catalog, ensureRuntime, initialFields }: SchemaBuilderPageProps): JSX.Element {
  const formatterNames = useMemo(
    () => catalog.active_formatters.map((formatter) => formatter.name).sort((a, b) => a.localeCompare(b)),
    [catalog.active_formatters]
  );

  const [locale, setLocale] = useState(catalog.available_locales[0] || "en_US");
  const [count, setCount] = useState(100);
  const [seedInput, setSeedInput] = useState("");
  const [fields, setFields] = useState<EditableField[]>(() => {
    if (initialFields && initialFields.length > 0) {
      return schemaFieldsToEditable(initialFields);
    }
    return [{ id: 1, name: "name", method: formatterNames[0] || "name", kwargsJson: "{}" }];
  });
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    setFields((current) => [
      ...current,
      {
        id: current.length === 0 ? 1 : Math.max(...current.map((field) => field.id)) + 1,
        name: `field_${current.length + 1}`,
        method: formatterNames[0] || "name",
        kwargsJson: "{}"
      }
    ]);
  };

  const removeField = (id: number) => {
    setFields((current) => current.filter((field) => field.id !== id));
  };

  const updateField = (id: number, next: Partial<EditableField>) => {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...next } : field)));
  };

  const handleGenerate = async () => {
    setError(null);
    setProgress(0);

    if (fields.length === 0) {
      setError("Add at least one field.");
      return;
    }

    const parsedSeed = seedInput.trim() ? Number.parseInt(seedInput, 10) : null;
    if (seedInput.trim() && Number.isNaN(parsedSeed as number)) {
      setError("Seed must be an integer.");
      return;
    }

    const schemaFields: Array<{ name: string; method: string; kwargs: Record<string, unknown> }> = [];
    for (const field of fields) {
      if (!field.name.trim()) {
        setError("Field names cannot be empty.");
        return;
      }

      const parsed = parseKwargsJson(field.kwargsJson);
      if (parsed.error) {
        setError(`Invalid kwargs for ${field.name}: ${parsed.error}`);
        return;
      }

      schemaFields.push({
        name: field.name.trim(),
        method: field.method,
        kwargs: parsed.parsed
      });
    }

    try {
      setIsGenerating(true);
      await ensureRuntime();
      const generated = await fakerRuntimeClient.generateSchema({
        locale,
        count: Math.max(1, Math.min(5000, count)),
        seed: parsedSeed,
        fields: schemaFields,
        onProgress: (value) => setProgress(value)
      });
      setRows(generated);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : String(generationError));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJson = () => {
    if (rows.length === 0) {
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadText(`schema-${stamp}.json`, "application/json", JSON.stringify(rows, null, 2));
  };

  const handleDownloadCsv = () => {
    if (rows.length === 0) {
      return;
    }
    const csvRows = rows.map((row) => {
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
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadText(`schema-${stamp}.csv`, "text/csv", csv);
  };

  return (
    <section className="panel schema-page" aria-label="Schema builder">
      <header>
        <p className="eyebrow">No-code dataset builder</p>
        <h2>Schema Builder</h2>
        <p>Compose fields, set row count, and generate downloadable JSON/CSV from whitelisted Faker methods.</p>
      </header>

      <div className="form-grid">
        <label>
          Locale
          <select value={locale} onChange={(event) => setLocale(event.target.value)}>
            {catalog.available_locales.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          Rows (1-5000)
          <input
            type="number"
            min={1}
            max={5000}
            value={count}
            onChange={(event) => setCount(Number.parseInt(event.target.value || "1", 10))}
          />
        </label>

        <label>
          Seed
          <input value={seedInput} onChange={(event) => setSeedInput(event.target.value)} placeholder="Optional integer" />
        </label>
      </div>

      <section className="fields-panel">
        <div className="action-row">
          <h3>Fields</h3>
          <button type="button" onClick={addField}>
            Add field
          </button>
        </div>

        <div className="schema-field-list">
          {fields.map((field) => (
            <div key={field.id} className="schema-field">
              <label>
                Field name
                <input value={field.name} onChange={(event) => updateField(field.id, { name: event.target.value })} />
              </label>

              <label>
                Faker method
                <select value={field.method} onChange={(event) => updateField(field.id, { method: event.target.value })}>
                  {formatterNames.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                kwargs JSON
                <input
                  value={field.kwargsJson}
                  onChange={(event) => updateField(field.id, { kwargsJson: event.target.value })}
                  placeholder='{"min": 1, "max": 5}'
                />
              </label>

              <button type="button" onClick={() => removeField(field.id)} disabled={fields.length === 1}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="action-row">
        <button type="button" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate dataset"}
        </button>
        <button type="button" onClick={handleDownloadJson} disabled={rows.length === 0}>
          Download JSON
        </button>
        <button type="button" onClick={handleDownloadCsv} disabled={rows.length === 0}>
          Download CSV
        </button>
        <progress value={progress} max={1} aria-label="Schema generation progress" />
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <section className="preview">
        <h3>Preview ({rows.length} rows)</h3>
        {rows.length === 0 && <p className="muted">No dataset generated yet.</p>}
        {rows.length > 0 && <pre>{JSON.stringify(rows.slice(0, 25), null, 2)}</pre>}
      </section>
    </section>
  );
}
