import type { SchemaField } from "../lib/types";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: SchemaField[];
}

const TEMPLATES: Template[] = [
  {
    id: "user-profile",
    name: "User Profile",
    icon: "👤",
    description: "Complete user record with contact details",
    fields: [
      { name: "full_name", method: "name", kwargs: {} },
      { name: "email", method: "email", kwargs: {} },
      { name: "phone", method: "phone_number", kwargs: {} },
      { name: "address", method: "address", kwargs: {} },
      { name: "date_of_birth", method: "date_of_birth", kwargs: {} },
    ],
  },
  {
    id: "ecommerce-order",
    name: "E-commerce Order",
    icon: "🛒",
    description: "Order records with customer and payment info",
    fields: [
      { name: "customer_name", method: "name", kwargs: {} },
      { name: "company", method: "company", kwargs: {} },
      { name: "email", method: "email", kwargs: {} },
      { name: "card_provider", method: "credit_card_provider", kwargs: {} },
      { name: "shipping_address", method: "address", kwargs: {} },
    ],
  },
  {
    id: "employee-record",
    name: "Employee Record",
    icon: "🏢",
    description: "HR data for workforce simulations",
    fields: [
      { name: "name", method: "name", kwargs: {} },
      { name: "job_title", method: "job", kwargs: {} },
      { name: "company", method: "company", kwargs: {} },
      { name: "email", method: "company_email", kwargs: {} },
      { name: "hire_date", method: "date", kwargs: {} },
    ],
  },
  {
    id: "api-test-payload",
    name: "API Test Payload",
    icon: "⚡",
    description: "JSON-ready records for API and integration testing",
    fields: [
      { name: "id", method: "uuid4", kwargs: {} },
      { name: "created_at", method: "date_time", kwargs: {} },
      { name: "username", method: "user_name", kwargs: {} },
      { name: "email", method: "email", kwargs: {} },
      { name: "active", method: "boolean", kwargs: {} },
    ],
  },
  {
    id: "social-media-user",
    name: "Social Media User",
    icon: "📱",
    description: "Profiles for social platform prototypes",
    fields: [
      { name: "username", method: "user_name", kwargs: {} },
      { name: "display_name", method: "name", kwargs: {} },
      { name: "bio", method: "sentence", kwargs: {} },
      { name: "website", method: "url", kwargs: {} },
      { name: "favorite_color", method: "color_name", kwargs: {} },
    ],
  },
];

interface TemplatesPageProps {
  onUseTemplate: (fields: SchemaField[]) => void;
}

export function TemplatesPage({ onUseTemplate }: TemplatesPageProps): JSX.Element {
  return (
    <section className="panel" aria-label="Templates">
      <header>
        <p className="eyebrow">Pre-built schemas</p>
        <h2>Templates</h2>
        <p>Start with a template and customize it in the dataset builder. All templates are fully editable.</p>
      </header>

      <div className="template-grid">
        {TEMPLATES.map((template) => (
          <article key={template.id} className="template-card">
            <div className="template-card-header">
              <span className="template-icon">{template.icon}</span>
              <div>
                <h3 className="template-name">{template.name}</h3>
                <p className="muted">{template.description}</p>
              </div>
            </div>

            <ul className="template-fields">
              {template.fields.map((field) => (
                <li key={field.name}>
                  <span className="template-field-name">{field.name}</span>
                  <code className="template-field-method">{field.method}</code>
                </li>
              ))}
            </ul>

            <button type="button" className="template-use-btn" onClick={() => onUseTemplate(template.fields)}>
              Use this template &rarr;
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
