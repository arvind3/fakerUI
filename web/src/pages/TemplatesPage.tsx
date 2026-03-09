import type { SchemaField } from "../lib/types";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: SchemaField[];
}

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  templates: Template[];
}

const TEMPLATE_SECTIONS: TemplateSection[] = [
  {
    id: "retail-industry",
    title: "Retail Industry",
    description: "Ready-to-use records for merchandising, inventory, promotions, and supply chain workflows.",
    templates: [
      {
        id: "retail-promotions-campaign",
        name: "Promotions Campaign",
        icon: "🏷️",
        description: "Campaign data for seasonal offers, discount programs, and channel launches",
        fields: [
          { name: "promotion_code", method: "bothify", kwargs: { text: "PROMO-####" } },
          { name: "campaign_name", method: "catch_phrase", kwargs: {} },
          { name: "store_id", method: "bothify", kwargs: { text: "STORE-###" } },
          { name: "start_date", method: "iso8601", kwargs: {} },
          { name: "channel", method: "word", kwargs: {} },
        ],
      },
      {
        id: "retail-product-catalog",
        name: "Product Catalog",
        icon: "📦",
        description: "SKU-ready product records for commerce systems and retail demos",
        fields: [
          { name: "sku", method: "bothify", kwargs: { text: "SKU-#####??" } },
          { name: "product_name", method: "catch_phrase", kwargs: {} },
          { name: "category", method: "word", kwargs: {} },
          { name: "brand", method: "company", kwargs: {} },
          { name: "price_currency", method: "currency_code", kwargs: {} },
        ],
      },
      {
        id: "retail-inventory-snapshot",
        name: "Inventory Snapshot",
        icon: "🏬",
        description: "Store and warehouse stock records for replenishment and allocation testing",
        fields: [
          { name: "inventory_id", method: "uuid4", kwargs: {} },
          { name: "sku", method: "bothify", kwargs: { text: "SKU-#####??" } },
          { name: "warehouse", method: "city", kwargs: {} },
          { name: "store_id", method: "bothify", kwargs: { text: "STORE-###" } },
          { name: "status", method: "word", kwargs: {} },
        ],
      },
      {
        id: "retail-supply-chain-shipment",
        name: "Supply Chain Shipment",
        icon: "🚚",
        description: "Shipment and fulfillment records for logistics and delivery simulations",
        fields: [
          { name: "shipment_id", method: "uuid4", kwargs: {} },
          { name: "origin_warehouse", method: "city", kwargs: {} },
          { name: "destination_store", method: "bothify", kwargs: { text: "STORE-###" } },
          { name: "shipment_status", method: "word", kwargs: {} },
          { name: "estimated_arrival", method: "iso8601", kwargs: {} },
        ],
      },
    ],
  },
  {
    id: "testing-azure-devops",
    title: "Testing / Azure DevOps",
    description: "Structured templates for QA planning, execution tracking, defects, and backlog-ready test assets.",
    templates: [
      {
        id: "ado-test-plan",
        name: "Test Plan",
        icon: "🧪",
        description: "Plan-level metadata for test cycles, suites, and release validation",
        fields: [
          { name: "test_plan_id", method: "bothify", kwargs: { text: "TP-####" } },
          { name: "title", method: "sentence", kwargs: { nb_words: 4 } },
          { name: "suite_name", method: "catch_phrase", kwargs: {} },
          { name: "owner", method: "name", kwargs: {} },
          { name: "target_release", method: "bothify", kwargs: { text: "R##.#" } },
        ],
      },
      {
        id: "ado-test-case",
        name: "Test Case",
        icon: "✅",
        description: "Execution-ready cases with steps, expected results, and priority tags",
        fields: [
          { name: "test_case_id", method: "bothify", kwargs: { text: "TC-#####" } },
          { name: "requirement_id", method: "bothify", kwargs: { text: "REQ-####" } },
          { name: "priority", method: "word", kwargs: {} },
          { name: "steps", method: "sentence", kwargs: { nb_words: 8 } },
          { name: "expected_result", method: "sentence", kwargs: { nb_words: 6 } },
        ],
      },
      {
        id: "ado-defect",
        name: "Defect / Bug",
        icon: "🐞",
        description: "Bug records for triage, severity modeling, and sprint defect dashboards",
        fields: [
          { name: "bug_id", method: "bothify", kwargs: { text: "BUG-#####" } },
          { name: "title", method: "sentence", kwargs: { nb_words: 5 } },
          { name: "severity", method: "word", kwargs: {} },
          { name: "assigned_to", method: "name", kwargs: {} },
          { name: "created_at", method: "iso8601", kwargs: {} },
        ],
      },
      {
        id: "ado-requirement",
        name: "Requirement / User Story",
        icon: "📋",
        description: "Backlog-style requirement records for traceability across planning and testing",
        fields: [
          { name: "requirement_id", method: "bothify", kwargs: { text: "REQ-####" } },
          { name: "user_story", method: "sentence", kwargs: { nb_words: 7 } },
          { name: "owner", method: "name", kwargs: {} },
          { name: "area_path", method: "word", kwargs: {} },
          { name: "iteration_path", method: "word", kwargs: {} },
        ],
      },
    ],
  },
  {
    id: "servicenow-itsm",
    title: "ServiceNow / ITSM",
    description: "Operational records for IT support teams handling incidents, requests, problems, and change processes.",
    templates: [
      {
        id: "servicenow-incident",
        name: "Incident",
        icon: "🚨",
        description: "Service desk incident records for outage response and support queue testing",
        fields: [
          { name: "incident_number", method: "bothify", kwargs: { text: "INC#######" } },
          { name: "caller", method: "name", kwargs: {} },
          { name: "assignment_group", method: "company", kwargs: {} },
          { name: "impact", method: "word", kwargs: {} },
          { name: "urgency", method: "word", kwargs: {} },
        ],
      },
      {
        id: "servicenow-change-request",
        name: "Change Request",
        icon: "🔧",
        description: "Change management records for approvals, scheduling, and release governance",
        fields: [
          { name: "change_number", method: "bothify", kwargs: { text: "CHG#######" } },
          { name: "change_type", method: "word", kwargs: {} },
          { name: "requested_by", method: "name", kwargs: {} },
          { name: "implementation_window", method: "iso8601", kwargs: {} },
          { name: "risk_summary", method: "sentence", kwargs: { nb_words: 6 } },
        ],
      },
      {
        id: "servicenow-service-request",
        name: "Service Request",
        icon: "📨",
        description: "Request fulfillment data for access, hardware, and standard service workflows",
        fields: [
          { name: "request_number", method: "bothify", kwargs: { text: "REQ#######" } },
          { name: "requested_for", method: "name", kwargs: {} },
          { name: "catalog_item", method: "word", kwargs: {} },
          { name: "requested_on", method: "iso8601", kwargs: {} },
          { name: "fulfillment_group", method: "company", kwargs: {} },
        ],
      },
      {
        id: "servicenow-problem-record",
        name: "Problem Record",
        icon: "🧩",
        description: "Problem management data for recurring issue analysis and root cause workflows",
        fields: [
          { name: "problem_number", method: "bothify", kwargs: { text: "PRB#######" } },
          { name: "short_description", method: "sentence", kwargs: { nb_words: 5 } },
          { name: "root_cause_owner", method: "name", kwargs: {} },
          { name: "known_error", method: "boolean", kwargs: {} },
          { name: "opened_at", method: "iso8601", kwargs: {} },
        ],
      },
    ],
  },
  {
    id: "crm-support",
    title: "CRM / Customer Support",
    description: "Customer, sales, and support records for account operations, pipeline demos, and service workflows.",
    templates: [
      {
        id: "crm-customer-account",
        name: "Customer Account",
        icon: "🏢",
        description: "Account master data for CRM onboarding, segmentation, and account reviews",
        fields: [
          { name: "account_id", method: "uuid4", kwargs: {} },
          { name: "account_name", method: "company", kwargs: {} },
          { name: "industry", method: "word", kwargs: {} },
          { name: "owner", method: "name", kwargs: {} },
          { name: "billing_country", method: "country", kwargs: {} },
        ],
      },
      {
        id: "crm-sales-opportunity",
        name: "Sales Opportunity",
        icon: "💼",
        description: "Pipeline records for forecasting, deal tracking, and sales-stage demos",
        fields: [
          { name: "opportunity_id", method: "uuid4", kwargs: {} },
          { name: "account_name", method: "company", kwargs: {} },
          { name: "opportunity_stage", method: "word", kwargs: {} },
          { name: "owner", method: "name", kwargs: {} },
          { name: "close_date", method: "date", kwargs: {} },
        ],
      },
      {
        id: "crm-support-ticket",
        name: "Support Ticket",
        icon: "🎫",
        description: "Case records for support teams handling queue, SLA, and escalation testing",
        fields: [
          { name: "ticket_number", method: "bothify", kwargs: { text: "TKT-######" } },
          { name: "customer_name", method: "name", kwargs: {} },
          { name: "issue_summary", method: "sentence", kwargs: { nb_words: 6 } },
          { name: "priority", method: "word", kwargs: {} },
          { name: "opened_at", method: "iso8601", kwargs: {} },
        ],
      },
      {
        id: "crm-contact-lead",
        name: "Contact / Lead",
        icon: "🤝",
        description: "Lead and contact records for handoff, qualification, and outreach workflows",
        fields: [
          { name: "lead_id", method: "uuid4", kwargs: {} },
          { name: "full_name", method: "name", kwargs: {} },
          { name: "email", method: "email", kwargs: {} },
          { name: "lead_source", method: "word", kwargs: {} },
          { name: "owner", method: "name", kwargs: {} },
        ],
      },
    ],
  },
  {
    id: "general-purpose",
    title: "General purpose",
    description: "Flexible starter schemas for broader demos, mock payloads, and lightweight dataset generation.",
    templates: [
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
          { name: "date_of_birth", method: "date", kwargs: {} },
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
          { name: "created_at", method: "iso8601", kwargs: {} },
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
    ],
  },
];

interface TemplatesPageProps {
  onUseTemplate: (fields: SchemaField[]) => void;
}

export function TemplatesPage({ onUseTemplate }: TemplatesPageProps): JSX.Element {
  return (
    <section className="panel templates-page" aria-label="Templates">
      <header>
        <p className="eyebrow">Pre-built schemas</p>
        <h2>Templates</h2>
        <p>
          Start with an industry-ready template and customize it in the dataset builder. Every template remains fully
          editable.
        </p>
      </header>

      <div className="template-sections">
        {TEMPLATE_SECTIONS.map((section) => (
          <section key={section.id} className="template-section" aria-labelledby={`template-section-${section.id}`}>
            <div className="template-section-header">
              <p className="template-section-kicker">{section.title}</p>
              <h3 id={`template-section-${section.id}`} className="template-section-title">
                {section.title}
              </h3>
              <p className="template-section-description">{section.description}</p>
            </div>

            <div className="template-grid">
              {section.templates.map((template) => (
                <article key={template.id} className="template-card">
                  <div className="template-card-header">
                    <span className="template-icon">{template.icon}</span>
                    <div>
                      <h4 className="template-name">{template.name}</h4>
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

                  <button
                    type="button"
                    className="template-use-btn"
                    onClick={() => onUseTemplate(template.fields)}
                  >
                    Use this template &rarr;
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
