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

const BASE_URL = import.meta.env.BASE_URL as string;

interface HomePageProps {
  onNavigateToCatalog: (query: string) => void;
  onNavigateToSchema: () => void;
}

export function HomePage({ onNavigateToCatalog, onNavigateToSchema }: HomePageProps): JSX.Element {
  return (
    <div className="home-page">
      {/* ── Dark hero ── */}
      <section className="home-hero-dark" aria-label="Hero">
        <div className="hero-logo">
          <img
            src={`${BASE_URL}brand/synthora-logo-horizontal-white.svg`}
            alt="Synthora"
            height="56"
          />
        </div>

        <h1>Synthetic Data<br />for Everyone</h1>

        <p className="home-hero-sub">
          Generate realistic datasets instantly using powerful templates.
          <br />
          No login. No coding. Just data.
        </p>

        <div className="hero-cta-row">
          <button type="button" className="cta-hero-primary" onClick={onNavigateToSchema}>
            Explore the Product &rarr;
          </button>
        </div>
      </section>

      {/* ── Browse by category ── */}
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
