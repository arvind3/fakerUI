export interface ParameterMetadata {
  name: string;
  kind: string;
  required: boolean;
  default: string | null;
  annotation: string | null;
}

export interface CatalogMethod {
  name: string;
  signature: string;
  doc: string;
  parameters: ParameterMetadata[];
}

export interface ProviderEntry {
  id: string;
  module: string;
  class_name: string;
  source: string;
  locales_hint: string[];
  description: string;
  methods: CatalogMethod[];
}

export interface ActiveFormatter {
  name: string;
  provider_module: string;
  provider_class: string;
  source: string;
  signature: string;
  doc: string;
  parameters: ParameterMetadata[];
}

export interface PluginPack {
  name: string;
  version: string;
  provider_modules: string[];
  python_package?: string;
}

export interface CoverageScope {
  builtin: string;
  plugin_packs: Array<{
    name: string;
    version: string;
    provider_modules: string[];
    label: string;
  }>;
  not_included: string;
}

export interface CatalogData {
  schema_version: number;
  generated_at: string;
  faker_version: string;
  pyodide_version: string;
  available_locales: string[];
  coverage_scope: CoverageScope;
  plugin_packs: PluginPack[];
  providers: ProviderEntry[];
  active_formatters: ActiveFormatter[];
  whitelist: string[];
}

export interface RuntimeManifest {
  generated_at: string;
  faker_version: string;
  pyodide_version: string;
  plugin_packs: PluginPack[];
  coverage_scope: CoverageScope;
  whitelist_count: number;
  provider_count: number;
}

export type OutputFormat = "table" | "json" | "csv";

export interface GenerateOptions {
  method: string;
  locale: string;
  count: number;
  seed: number | null;
  unique: boolean;
  kwargs: Record<string, unknown>;
  onProgress?: (progress: number) => void;
}

export interface SchemaField {
  name: string;
  method: string;
  kwargs: Record<string, unknown>;
}

export interface SchemaOptions {
  locale: string;
  count: number;
  seed: number | null;
  fields: SchemaField[];
  onProgress?: (progress: number) => void;
}
