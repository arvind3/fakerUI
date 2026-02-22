import { useEffect, useState } from "react";

const ROTATING_SAMPLES = [
  { label: "Name", value: "Alexandra Morrison" },
  { label: "Email", value: "alex.morrison@example.com" },
  { label: "Address", value: "742 Elm Street, Springfield, IL 62701" },
  { label: "Company", value: "Innovatech Solutions LLC" },
  { label: "Phone", value: "+1 (555) 867-5309" },
  { label: "UUID", value: "a3f8c2d1-4b7e-4a9f-8c1d-2e5b6f7a8c9d" },
  { label: "URL", value: "https://api.innovatech.example.com/v1" },
  { label: "Date", value: "1990-03-15" },
  { label: "Color", value: "#3A7BD5" },
  { label: "Job", value: "Senior Software Engineer" },
];

const CATEGORIES = [
  {
    id: "person",
    icon: "👤",
    label: "Person",
    description: "Names, gender, profiles",
    methods: ["name", "email", "phone_number"],
    query: "person",
  },
  {
    id: "address",
    icon: "📍",
    label: "Address",
    description: "Streets, cities, countries",
    methods: ["address", "city", "country"],
    query: "address",
  },
  {
    id: "company",
    icon: "🏢",
    label: "Company",
    description: "Companies, jobs, catchphrases",
    methods: ["company", "job", "catch_phrase"],
    query: "company",
  },
  {
    id: "internet",
    icon: "🌐",
    label: "Internet",
    description: "URLs, IPs, usernames",
    methods: ["url", "ipv4", "username"],
    query: "internet",
  },
  {
    id: "financial",
    icon: "💳",
    label: "Financial",
    description: "Cards, IBAN, currency",
    methods: ["credit_card_number", "iban", "currency_code"],
    query: "bank credit",
  },
  {
    id: "content",
    icon: "📝",
    label: "Content",
    description: "Text, sentences, paragraphs",
    methods: ["sentence", "paragraph", "word"],
    query: "lorem",
  },
  {
    id: "datetime",
    icon: "📅",
    label: "Date & Time",
    description: "Dates, times, timestamps",
    methods: ["date", "date_of_birth", "past_date"],
    query: "date time",
  },
  {
    id: "color",
    icon: "🎨",
    label: "Color",
    description: "Hex, RGB, color names",
    methods: ["color_name", "hex_color", "rgb_color"],
    query: "color",
  },
  {
    id: "security",
    icon: "🔐",
    label: "Security",
    description: "UUIDs, hashes, tokens",
    methods: ["uuid4", "md5", "sha256"],
    query: "uuid",
  },
  {
    id: "automotive",
    icon: "🚗",
    label: "Automotive",
    description: "License plates, makes",
    methods: ["license_plate"],
    query: "automotive",
  },
];

interface HomePageProps {
  onNavigateToCatalog: (query: string) => void;
  onNavigateToSchema: () => void;
}

export function HomePage({ onNavigateToCatalog, onNavigateToSchema }: HomePageProps): JSX.Element {
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSampleIndex((current) => (current + 1) % ROTATING_SAMPLES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const sample = ROTATING_SAMPLES[sampleIndex];

  return (
    <div className="home-page">
      <section className="home-hero panel">
        <p className="eyebrow">No sign-up. No limits. Runs offline.</p>
        <h1>Generate any fake data, instantly</h1>
        <p className="home-subtitle">
          Every method from the Faker library, available through a clean UI. Perfect for testing, demos, and
          development.
        </p>

        <div className="home-sample" aria-live="polite" aria-label="Example output rotating">
          <span className="home-sample-label">{sample.label}</span>
          <span className="home-sample-value">{sample.value}</span>
        </div>

        <div className="home-cta-row">
          <button type="button" className="cta-primary" onClick={onNavigateToSchema}>
            Build a dataset &rarr;
          </button>
          <button type="button" className="cta-secondary" onClick={() => onNavigateToCatalog("")}>
            Browse all methods
          </button>
        </div>

        <div className="home-pills">
          <span>&#10003; Runs fully in-browser</span>
          <span>&#10003; No sign-up required</span>
          <span>&#10003; Every Faker method</span>
          <span>&#10003; Export CSV or JSON</span>
        </div>
      </section>

      <section className="panel">
        <h2 className="home-section-title">Browse by category</h2>
        <p className="muted">Click any category to explore its methods and generate data.</p>

        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className="category-card"
              onClick={() => onNavigateToCatalog(cat.query)}
              aria-label={`Browse ${cat.label} methods`}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
              <span className="category-desc">{cat.description}</span>
              <span className="category-methods">
                {cat.methods.map((m) => (
                  <code key={m}>{m}</code>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
