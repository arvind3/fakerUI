# SKILL: Repo Awareness Pages Generator
**Version**: 1.3
**Author**: For use with Claude Code
**Purpose**: For any given GitHub repository, generate four professional GitHub Pages — Engineering, Product, Capability, and Executive Summary — using React (via CDN), Tailwind CSS, and fully responsive UX/UI design optimized for any screen size.

---

## HOW TO USE THIS SKILL

**Step 1** — Open Claude Code and navigate INTO the target repo you want pages for:
```bash
cd /path/to/fakerUI        # ← the repo you want awareness pages for, NOT a container repo
```
**Step 2** — Paste the entire contents of this file as your prompt to Claude Code, replacing the last line with your repo path or URL.

**Step 3** — Answer Claude's 4 enrichment questions when asked.

**Step 4** — Claude will generate all pages inside this repo's `/docs/` folder, commit them to a new branch `awareness-pages`, and open a Pull Request for your review.

**Step 5** — Review the PR. When happy, merge to `main` — your pages go live at:
`https://[username].github.io/[repo-name]/`

**Repeat** for each repo by running the skill from within that repo. The whole process takes ~5 minutes per repo.

---

## MASTER PROMPT (copy everything below this line)

---

You are a world-class technical writer, product strategist, and frontend engineer. Your job is to analyze a GitHub repository and generate four beautifully designed, fully responsive professional awareness pages as GitHub Pages HTML files.

These pages serve a specific mission: **bring visibility to a software solution across four distinct audiences** — engineers, product users, business strategists, and executives.

> **Important**: This skill generates pages INTO the current repository (the one you are running it from). All files are written to `/docs/` in THIS repo, and the PR is opened against THIS repo. Make sure you are running this from inside the target repository.

---

## PHASE 1 — REPO DISCOVERY

Before writing a single line of HTML, perform a thorough analysis of the repository. Read the following in this order:

1. `README.md` — primary source of truth
2. All files in `/docs`, `/wiki`, or `/notes` if they exist
3. Top-level folder and file structure (understand architecture)
4. `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, or equivalent (understand tech stack)
5. Key source files — enough to understand what the solution *actually does*, not just what it claims
6. Any existing tests, examples, or demo files — these reveal real usage patterns
7. GitHub issues, discussions, or changelogs if accessible — reveals pain points and evolution

From this analysis, extract and internally document:
- **Core problem solved** (1 sentence)
- **How it works technically** (architecture, key components, data flow)
- **Who uses it and how** (end user journey)
- **Tech stack** (languages, frameworks, key dependencies)
- **Maturity level** (prototype, MVP, production-ready)
- **Unique differentiator** (what makes this different from alternatives)

---

## PHASE 2 — ENRICHMENT QUESTIONS

After repo analysis, ask the owner these **exactly 4 questions** in a single message. Do not proceed to generation until you have answers.

```
Before I generate your four awareness pages, I need 4 inputs from you:

1. TARGET INDUSTRY / DOMAIN
   What industry or domain is the primary home for this solution?
   (e.g., "Healthcare data pipelines", "E-commerce personalization", "Developer tooling for ML teams")

2. KNOWN REAL-WORLD USE CASES
   List 2–3 specific scenarios where this has been or could be used.
   (e.g., "Used by fintech startup to reduce onboarding time by 40%")

3. BUSINESS IMPACT METRICS
   Any numbers, benchmarks, or outcomes you want highlighted.
   (e.g., "Reduces setup time from 3 days to 2 hours", "Handles 1M events/sec")
   If none yet, write: "None — generate plausible estimates based on the tech"

4. FOUNDER NARRATIVE
   In 2–4 sentences, tell me: Why did you build this? What problem were you personally
   frustrated by? What's the bigger vision?
```

If the owner says "generate everything from the repo", proceed with your best inferences and clearly mark inferred content with a subtle `*` footnote on each page.

---

## PHASE 3 — PAGE ARCHITECTURE

Generate **5 files** inside the `/docs` folder of the current repository:

```
/docs/
  perspectives/
    index.html        ← Perspectives page: routes any visitor to the right page
  engineering.html    ← Page 1: Engineering Perspective
  product.html        ← Page 2: Product Perspective
  capability.html     ← Page 3: Capability Perspective
  executive.html      ← Page 4: Executive Summary
```

Pages are accessible at:
- `https://[username].github.io/[repo-name]/perspectives/` — Perspectives entry point
- `https://[username].github.io/[repo-name]/engineering.html` — and so on for each page

The `perspectives/` subfolder gives a clean URL without a file extension. The four audience pages remain flat in `/docs/` for direct access.

Also generate or update:
```
/_config.yml          ← GitHub Pages config (theme: none, since we use custom HTML)
```

---

## PHASE 4 — DESIGN SYSTEM (apply to ALL pages)

All five files share a **unified design language**. Before writing code, commit to ONE aesthetic direction that fits the solution's personality. Examples:
- A DevOps tool → industrial/precision aesthetic: dark background, monospace accents, terminal-inspired
- A healthcare AI tool → clinical/trustworthy: clean whites, deep navy, authoritative typography
- A creative platform → expressive: bold color, editorial layout, unexpected typography
- A data pipeline tool → architectural/systematic: grid-based, technical elegance

**Technical stack per file (no build step required):**
```html
<!-- React via CDN -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- Tailwind via CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Google Fonts — choose 2 distinctive fonts, NOT Inter, Roboto, Arial -->
<link href="https://fonts.googleapis.com/css2?family=YOUR_CHOICE..." rel="stylesheet">
```

**Design requirements (non-negotiable):**

### Responsive layout (mobile-first — strictly enforced)
- **Mobile-first approach**: write base styles for mobile (`< 640px`), then layer `sm:`, `md:`, `lg:`, `xl:` Tailwind prefixes for progressively larger screens. Never write desktop-only layouts that break on small screens.
- **Viewport meta tag**: every page must include `<meta name="viewport" content="width=device-width, initial-scale=1.0">` in `<head>`.
- **Hamburger navigation on mobile**: the nav bar must collapse to a hamburger icon on screens `< 768px`. Implement a React boolean toggle state (`menuOpen`). On mobile, clicking the icon opens a full-width stacked dropdown. On `md:` and above, show the horizontal inline nav. Never show both simultaneously.
- **Touch-friendly tap targets**: all buttons, links, and interactive elements must have a minimum clickable area of 44×44 px (`min-h-[44px] min-w-[44px] flex items-center justify-center`).
- **Fluid typography**: use responsive text scales, e.g. `text-2xl md:text-4xl lg:text-6xl` for hero headings, `text-base md:text-lg` for body copy. Never use fixed font sizes that become too large or too small on mobile.
- **Fluid spacing**: use responsive padding and margin, e.g. `px-4 md:px-8 lg:px-16`, `py-8 md:py-16 lg:py-24`.
- **No horizontal overflow**: wrap the outermost container in `overflow-x-hidden`. Use `max-w-full` on wide elements. Verify no child element causes horizontal scrollbars.
- **Responsive grids**: feature cards, persona tiles, and stat bars must use CSS grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (or similar). Never use a fixed multi-column grid that does not collapse on mobile.
- **Responsive diagrams**: CSS-only architecture diagrams and capability maps must use `flex-wrap` or CSS grid so components reflow into a single column on narrow screens. Never use fixed pixel widths on diagram boxes.
- **Code blocks**: wrap every `<pre><code>` block in a `<div class="overflow-x-auto">` container so long lines scroll horizontally rather than break the layout.
- **Before/After comparison tables**: collapse two-column comparisons to a single stacked column on mobile using `grid-cols-1 md:grid-cols-2`.
- Test mentally at 320px, 375px, 768px, 1024px, and 1440px breakpoints before finalizing.

### Visual & interaction requirements
- Smooth scroll, subtle entrance animations (CSS keyframes)
- Navigation bar with links to all 4 pages + back to Perspectives
- A distinct hero section per page with the page's thesis statement
- Footer with repo link, GitHub icon, and page name
- Consistent color palette via CSS variables across all files
- No placeholder content — every section must have real, repo-derived content
- Accessibility: semantic HTML, proper heading hierarchy, sufficient color contrast (WCAG AA minimum)

---

## PHASE 5 — PAGE SPECIFICATIONS

### PAGE 1: `engineering.html` — Engineering Perspective
**Audience**: Developers, architects, technical evaluators
**Tone**: Precise, credible, peer-to-peer
**Target length**: 800–1200 words of content

**Required sections** (in this order):
1. **Hero** — Solution name + one-line technical thesis (what it does and how, technically)
2. **Architecture Overview** — Visual diagram using pure CSS/HTML (boxes, arrows, layers) showing system components and data flow. Must reflow to a single-column stack on mobile. No external diagram tools.
3. **Tech Stack** — Badges/chips for languages, frameworks, key dependencies with a one-liner on why each was chosen
4. **How It Works** — Step-by-step technical walkthrough (numbered, with code snippets where relevant, use `<pre><code>` inside `overflow-x-auto` wrappers)
5. **Key Design Decisions** — 3–5 architectural decisions made and the tradeoffs considered
6. **Performance & Scalability** — Benchmarks, scale characteristics, known limits
7. **Getting Started** — Quick setup code block (install → configure → run)
8. **Contributing / Repo Link** — CTA to the GitHub repo

---

### PAGE 2: `product.html` — Product Perspective
**Audience**: Product managers, end users, buyers, operators
**Tone**: Empathetic, outcome-focused, benefit-driven
**Target length**: 600–900 words of content

**Required sections** (in this order):
1. **Hero** — Solution name + user-facing value proposition (what problem it solves for the user, not how)
2. **The Problem** — A narrative paragraph about the pain this solves. Make it visceral and recognizable.
3. **The Solution** — How the product addresses that pain, written from the user's perspective
4. **User Journey** — A visual step-by-step flow (CSS-only flowchart) showing how a user discovers → adopts → gets value from this solution. Must stack vertically on mobile.
5. **Key Features** — 4–6 features as responsive cards with icon (emoji or SVG), feature name, and 2-sentence user benefit description
6. **Who Is This For** — 2–3 user persona tiles (role, pain, how this helps)
7. **Before vs. After** — Two-column comparison (collapses to single column on mobile) showing life without vs. with this solution
8. **CTA** — Try it / Learn more / View on GitHub

---

### PAGE 3: `capability.html` — Capability Perspective
**Audience**: Business strategists, domain experts, innovation teams, potential partners
**Tone**: Expansive, imaginative, domain-aware
**Target length**: 700–1000 words of content

**Required sections** (in this order):
1. **Hero** — Solution name + capability thesis ("This is not just a tool for X — it is a platform for Y")
2. **Core Capability Map** — A CSS-only visual showing the central capability at the hub with 4–6 radiating use case domains. Use `flex-wrap` so it renders correctly on narrow screens.
3. **Cross-Domain Applications** — For each of 4–6 industries/domains: domain name, the specific problem in that domain, how this solution applies, potential impact. Use enrichment input from the owner.
4. **Capability Building Blocks** — What underlying capabilities make this reusable/extensible (APIs, integrations, data model, etc.)
5. **Combination Plays** — 2–3 scenarios showing how this solution combined with other tools/platforms creates compound value
6. **Emerging Opportunity** — One forward-looking paragraph on where this capability is headed as technology evolves
7. **Partnership / Integration CTA** — Invitation for collaborators, integrators, or domain experts to connect

---

### PAGE 4: `executive.html` — Executive Summary (Founder's Perspective)
**Audience**: C-suite, investors, board members, senior leadership
**Tone**: Authoritative, narrative-driven, outcome-focused. No jargon. No fluff.
**Target length**: 400–600 words of content (brevity is the point)

**Required sections** (in this order):
1. **Hero** — Solution name + a single bold founder statement (the "why this exists" sentence)
2. **The Opportunity** — Market or operational problem framed at business scale (use enrichment metrics)
3. **What We Built** — 3 sentences max. What it is, who it's for, what it does.
4. **Traction / Evidence** — Metrics, milestones, usage data, or notable outcomes. Use enrichment input. If unavailable, use capability indicators (e.g., "Production-ready architecture supporting X scale")
5. **Strategic Value** — Why this matters beyond the immediate use case. Defensibility, moat, platform potential.
6. **The Ask / Next Step** — One clear call to action (schedule a demo, review the roadmap, fund the next phase, etc.) — ask the owner to specify or infer from context
7. **Founder Quote Block** — A styled pull-quote using the founder narrative from enrichment input

---

### PERSPECTIVES PAGE: `index.html` — Solution Entry Point
**Purpose**: The entry point for this solution. Orients any visitor and routes them to the right page.

**Required sections**:
1. **Hero** — Solution name, tagline, and a 2-sentence description
2. **Four Perspective Cards** — One card per page with: page title, audience label, 1-sentence description, and a CTA button linking to that page. Because this file lives at `docs/perspectives/index.html`, links to the audience pages must use `../` prefix (e.g. `../engineering.html`, `../product.html`). Cards visually differentiate (distinct accent color or icon per card). Stack to single column on mobile (`grid-cols-1 sm:grid-cols-2`).
3. **Quick Stats Bar** — 3–4 key numbers about the solution (tech stack count, use case domains, etc.). Wraps to single column on mobile.
4. **Repo Link** — Prominent GitHub button

---

## PHASE 6 — README UPDATE

After generating the HTML files, **update the repository's `README.md`** to document the awareness pages. Append (or replace an existing "Awareness Pages" section with) the following:

```markdown
## Awareness Pages

This repository includes professionally designed awareness pages that present the solution
across four distinct audiences. Pages are hosted via GitHub Pages.

| Page | Audience | URL |
|------|----------|-----|
| Perspectives (Index) | All visitors | `https://[username].github.io/[repo-name]/perspectives/` |
| Engineering | Developers & architects | `https://[username].github.io/[repo-name]/engineering.html` |
| Product | Product managers & users | `https://[username].github.io/[repo-name]/product.html` |
| Capability | Business strategists | `https://[username].github.io/[repo-name]/capability.html` |
| Executive | C-suite & leadership | `https://[username].github.io/[repo-name]/executive.html` |

> Pages generated by the [Repo Awareness Pages Skill](https://github.com/arvind3/solution-perspectives).
```

Replace `[username]` and `[repo-name]` with actual values before writing. If the README already has an "Awareness Pages" section, replace it entirely.

---

## PHASE 7 — BRANCH, COMMIT, AND PULL REQUEST

After all files and the updated `README.md` are written to disk, execute the following git workflow **automatically** without asking the user.

### Step 1 — Detect default branch
```bash
git remote show origin | grep 'HEAD branch' | awk '{print $NF}'
```
Store the result as `DEFAULT_BRANCH` (usually `main` or `master`).

### Step 2 — Ensure you are on the default branch and up to date
```bash
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH
```

### Step 3 — Create and switch to a new feature branch
```bash
git checkout -b awareness-pages
```
If `awareness-pages` already exists (re-run), use:
```bash
git checkout -b awareness-pages-$(date +%Y%m%d)
```

### Step 4 — Stage and commit all generated files
```bash
git add docs/ _config.yml README.md
git commit -m "feat: add awareness pages (engineering, product, capability, executive)

Generated by the Repo Awareness Pages skill.
- docs/perspectives/index.html → Perspectives entry page
- docs/engineering.html        → Engineering perspective
- docs/product.html      → Product perspective
- docs/capability.html   → Capability perspective
- docs/executive.html    → Executive summary
- _config.yml            → GitHub Pages configuration
- README.md              → Updated with awareness page links"
```

### Step 5 — Push the branch to remote
```bash
git push -u origin awareness-pages
```

### Step 6 — Open a Pull Request using GitHub CLI
Check if `gh` is available:
```bash
gh --version
```

**If `gh` is available**, run:
```bash
gh pr create \
  --title "feat: Add awareness pages (engineering, product, capability, executive)" \
  --body "## Awareness Pages — Review Checklist

This PR adds four professionally designed GitHub Pages to bring visibility to this solution across four audiences, and updates the README with direct links.

### Pages Added
| File | Audience | URL (after merge) |
|------|----------|-------------------|
| \`docs/perspectives/index.html\` | All visitors | \`/perspectives/\` |
| \`docs/engineering.html\` | Developers & architects | \`/engineering.html\` |
| \`docs/product.html\` | Product managers & users | \`/product.html\` |
| \`docs/capability.html\` | Business strategists | \`/capability.html\` |
| \`docs/executive.html\` | C-suite & leadership | \`/executive.html\` |

### Before Merging — Please Verify
- [ ] Perspectives page cards link correctly to all 4 pages
- [ ] Design/aesthetic matches the solution's personality
- [ ] No inferred content marked with \`*\` needs correction
- [ ] All sections have real content (no placeholders)
- [ ] Pages look correct on mobile (320px), tablet (768px), and desktop (1440px)
- [ ] Hamburger menu opens and closes correctly on mobile
- [ ] No horizontal scrollbar appears at any viewport width
- [ ] README has been updated with correct live URLs

### After Merging
1. Go to **Settings → Pages → Source → Deploy from branch**
2. Set branch: \`main\` | folder: \`/docs\`
3. Click Save — your pages will be live at:
   \`https://[your-username].github.io/[repo-name]/\`

> Generated by the Repo Awareness Pages Skill v1.3" \
  --base $DEFAULT_BRANCH \
  --head awareness-pages
```

**If `gh` is NOT available**, output these exact instructions for the user:
```
## Manual PR Instructions

gh CLI was not found. To open the Pull Request manually:

1. Go to: https://github.com/[your-username]/[repo-name]/compare/awareness-pages
2. Click "Create Pull Request"
3. Title: feat: Add awareness pages (engineering, product, capability, executive)
4. Review the files, then submit the PR.

After merging, enable GitHub Pages:
  Settings → Pages → Source → Deploy from branch
  Branch: main | Folder: /docs → Save

Your pages will be live at:
  https://[your-username].github.io/[repo-name]/
```

### Step 7 — Confirm to the user
After the PR is created (or instructions provided), output this summary:

```
✅ Done! Here's what was created:

Branch:  awareness-pages
Files:   docs/perspectives/index.html (Perspectives)
         docs/engineering.html
         docs/product.html
         docs/capability.html
         docs/executive.html
         _config.yml
         README.md (updated with live page links)

PR:      [PR URL from gh output, or link to compare page]

Next steps:
1. Review the PR — check each page on mobile AND desktop
2. Merge to main when happy
3. Enable GitHub Pages in repo Settings (first time only):
   Settings → Pages → Source: Deploy from branch → main / /docs → Save
4. Your awareness pages will be live at:
   https://[username].github.io/[repo-name]/
```

---

## QUALITY RULES (self-check before delivering)

Before finalizing, verify:
- [ ] All 5 HTML files are complete and self-contained (no broken imports)
- [ ] Navigation between all pages works via simple relative links (`engineering.html`, not `./slug/engineering.html`)
- [ ] No section is left with placeholder text like "Lorem ipsum" or "[INSERT X]"
- [ ] Every inferred piece of content is marked with a subtle footnote asterisk `*`
- [ ] Animations are CSS-only or use only CDN-loaded libraries
- [ ] All pages share the same color palette and font choices
- [ ] Each page has a unique hero section — no copy-paste across pages
- [ ] **Every page includes `<meta name="viewport" content="width=device-width, initial-scale=1.0">`**
- [ ] **Hamburger navigation implemented with React toggle state — works at < 768px**
- [ ] **No horizontal overflow at any viewport width (mentally tested at 320px, 375px, 768px, 1024px, 1440px)**
- [ ] **All tap targets are minimum 44×44px**
- [ ] **Code blocks wrapped in `overflow-x-auto` containers**
- [ ] **CSS diagrams and maps use flex-wrap or CSS grid — no fixed pixel widths**
- [ ] **Multi-column grids collapse to single column on mobile**
- [ ] GitHub repo URL appears in footer of every page
- [ ] README updated with awareness pages section and correct live URLs
- [ ] Perspectives page at `docs/perspectives/index.html`; the four audience pages flat in `/docs/`
- [ ] Links from Perspectives to audience pages use `../` prefix (e.g. `../engineering.html`)
- [ ] Branch `awareness-pages` pushed to remote
- [ ] Pull Request opened (via `gh` CLI or manual instructions provided)
- [ ] PR description contains review checklist and post-merge GitHub Pages setup steps

---

## INPUT — PROVIDE BELOW THIS LINE

> **Run this skill from WITHIN the target repository.** The skill generates pages in THIS repo's `/docs/` folder and opens a PR against THIS repo. Make sure you have run `cd /path/to/your-target-repo` before pasting this prompt.

**Repository**: [paste GitHub URL or local path here for reference — pages will be generated in the current working directory]

---
*End of skill prompt*
