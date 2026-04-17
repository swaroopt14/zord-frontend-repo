# Final Landing Content Reference

This document is the content map for the `final-landing` site family inside `backend/zord-console`.

It answers four questions:

1. Which pages exist.
2. What each page is trying to do.
3. What content blocks appear on each page, in order.
4. Which copy is static and which copy is driven by shared data.

## Route Map

| Route | Page role | Primary source |
| --- | --- | --- |
| `/final-landing` | Product / main landing page | `components/landing-final/LandingPageFinalClient.tsx` |
| `/final-landing/page` | Alias of the product landing page | `app/final-landing/page/page.tsx` |
| `/final-landing/how-it-works` | Product walkthrough page | `components/landing-final/HowItWorksClient.tsx` |
| `/final-landing/solutions` | Solutions hub page | `components/landing-final/SolutionsHubClient.tsx` |
| `/final-landing/solutions/[slug]` | Dynamic solution detail page | `components/landing-final/SolutionDetailClient.tsx` + `components/landing-final/solutions-data.ts` |
| `/final-landing/pricing` | Dedicated pricing page | `components/landing-final/PricingPageClient.tsx` |
| `/final-landing/customers` | Customer proof / adoption page | `components/landing-final/CustomersPageClient.tsx` |
| `/final-landing/resources` | Resource / evaluation page | `components/landing-final/ResourcesPageClient.tsx` |
| `/final-landing/company` | About Arealis page | `components/landing-final/CompanyPageClient.tsx` |

## Shared Site Chrome

### Product landing navigation

The product landing page uses its own richer header from `LandingPageFinalClient.tsx`.

Desktop nav groups:

1. `Product`
2. `Solutions`
3. `Pricing`
4. `Customers`
5. `Resources`
6. `Company`
7. `Sign in`
8. `Console`
9. `Book Demo`

Dropdown behavior:

1. `Solutions` opens the full `SolutionBrowsePanel` in compact mode.
2. `Product`, `Resources`, and `Company` expose smaller link groups.
3. Mobile navigation turns these into stacked expandable sections.

### Subpage navigation

All dedicated pages use `SolutionsSiteNav` or `FinalLandingPageScaffold`.

Shared top-level links:

1. `Product`
2. `Solutions`
3. `Pricing`
4. `Customers`
5. `Resources`
6. `Company`
7. `Sign in`
8. `Console`
9. `Book Demo`

### Shared scaffold pattern for standalone pages

`FinalLandingPageScaffold` creates the same top structure on:

1. Pricing
2. Customers
3. Resources
4. Company

Each scaffold page has:

1. Eyebrow pill
2. Large hero title
3. Hero description
4. Primary CTA
5. Secondary CTA
6. Optional hero visual block
7. Body sections
8. Shared footer

### Shared footer on subpages

The shared footer has three columns:

1. `Solutions`
2. `Platform`
3. `Company`

It also repeats the ZORD brand statement:

`Solution narratives for teams evaluating ZORD across money movement, identity, compliance, finance, and connected data workflows.`

## Page 1: `/final-landing`

### Page role

This is the main product page for ZORD. It is the highest-context page and carries the full product narrative:

1. Decision moment
2. Product understanding
3. Product surface
4. Workflow clarity
5. Capability framing
6. Infrastructure depth
7. Final call to action

### Hero section

The hero is a rotating four-slide ICP carousel.

Common hero elements across slides:

1. Eyebrow pill
2. Two-line headline
3. Supporting paragraph
4. Highlight chips
5. Trust signals row
6. `Book Demo` primary CTA
7. `See how it works` secondary CTA
8. Visual card with image, internal overlay panel, and side cards
9. Tab selector for the four ICP views
10. Left and right arrow controls

#### Slide 1: Control layer

1. Tab: `Control layer`
2. Eyebrow: `Unified payout control`
3. Headline line 1: `Control payouts before`
4. Headline line 2: `failures become finance fire drills`
5. Supporting copy: operations, finance, and engineering get one payout truth for routing, tracking, reconciliation, and proof
6. Highlight chips:
   - `Ops command center`
   - `Finance-ready evidence`
   - `Engineering context`
7. Trust signals:
   - `₹14.8T+ tracked visibility`
   - `14M events / month`
   - `99.95% uptime`
8. Visual panel label: `Cross-functional visibility`
9. Visual panel title: `Shared payout truth`
10. Visual panel copy: routing, confirmation state, and close-ready evidence stay aligned
11. Visual panel stats:
   - `₹1.84T tracked today`
   - `14M events monthly`
   - `99.95% uptime`
   - `142 proofs ready`
12. Side cards:
   - `Recovery layer` / `₹7.52L saved this cycle`
   - `Proof queue` / `142 exports ready for finance`
13. Footer line in visual card: `Routing, confirmation, and proof in one working view`

#### Slide 2: Marketplace

1. Tab: `Marketplace`
2. Eyebrow: `Seller payout operations`
3. Headline line 1: `Keep seller payouts`
4. Headline line 2: `predictable through sale spikes`
5. Supporting copy: protect seller experience by spotting provider drift, callback delays, and bank-side confirmation issues
6. Highlight chips:
   - `Seller ticket prevention`
   - `Peak-day payout control`
   - `Provider fallback signals`
7. Trust signals:
   - `2.1L active sellers`
   - `98.7% clean confirms`
   - `41 min faster resolve`
8. Visual panel label: `Marketplace payout pulse`
9. Visual panel title: `Seller-facing control`
10. Visual panel copy: support, ops, and finance work from the same payout truth during sale spikes
11. Visual panel stats:
   - `2.1L sellers active`
   - `98.7% clean confirms`
   - `41 min faster resolve`
   - `3 banks under watch`
12. Side cards:
   - `Seller queue` / `84 high-priority payouts protected`
   - `Provider watch` / `Cashfree degraded, fallback active`
13. Footer line: `Seller support, ops, and finance aligned before tickets stack`

#### Slide 3: NBFC

1. Tab: `NBFC`
2. Eyebrow: `Disbursals + treasury`
3. Headline line 1: `Run disbursals with`
4. Headline line 2: `treasury and close-ready control`
5. Supporting copy: track high-value disbursals across provider handoff, bank movement, pending finality, and proof
6. Highlight chips:
   - `High-value disbursal watch`
   - `Treasury confidence`
   - `Month-end proof`
7. Trust signals:
   - `₹642Cr monthly run`
   - `22 banks visible`
   - `1 click proof export`
8. Visual panel label: `Disbursal confidence`
9. Visual panel title: `High-value run control`
10. Visual panel copy: track bank posture, pending finality, and proof readiness before treasury review and month-end close
11. Visual panel stats:
   - `₹642Cr monthly run`
   - `22 banks visible`
   - `₹7.2L risk watch`
   - `1 click proof export`
12. Side cards:
   - `Pending finality` / `₹7.2L under watch before close`
   - `Finance pack` / `T+0 export ready for treasury`
13. Footer line: `Disbursals, treasury, and finance aligned before close`

#### Slide 4: Payment Service Provider

1. Tab: `Payment Service Provider`
2. Eyebrow: `Provider + proof loop`
3. Headline line 1: `Run fintech and PSP operations`
4. Headline line 2: `with callback and proof clarity`
5. Supporting copy: monitor provider switching, callback trust, bank acknowledgements, and replay-ready evidence
6. Highlight chips:
   - `Callback trust layer`
   - `Provider failover view`
   - `Replay-ready evidence`
7. Trust signals:
   - `14 PSPs surfaces`
   - `99.95% signal uptime`
   - `0 blind spots handoffs`
8. Visual panel label: `Forensic payout layer`
9. Visual panel title: `Callback and proof ops`
10. Visual panel copy: move from provider ack to bank movement to replay-ready evidence without losing the trail
11. Visual panel stats:
   - `14 PSPs surfaces`
   - `99.95% signal uptime`
   - `6 near SLA active watch`
   - `0 blind spots handoffs`
12. Side cards:
   - `Callback SLA` / `99.2% within provider band`
   - `Callback watch` / `Replay and ack path visible live`
13. Footer line: `Provider control, callback trust, and proof in one operating loop`

### Hero utilities below the slider

After the hero card, the page includes two more strips:

1. `Explore the stack` action dock with quick buttons.
2. Brand marquee with the line:
   `Trusted by teams across commerce, mobility, and consumer platforms`

The logo / brand set includes:

1. Amazon India
2. Flipkart
3. AJIO
4. bookmyshow
5. OLA
6. Zomato
7. Blinkit
8. Zepto
9. Swiggy

### Product visual section

This section appears immediately after the hero.

Left image card:

1. Eyebrow chip: `Control surface`
2. Title: `One operating view for routing, escalation, and proof readiness.`
3. Visual asset: product control surface image

Right content card:

1. Eyebrow: `Working surface`
2. Title: `Start from the screen teams actually use when payout quality starts drifting.`
3. Body: explains that operators, finance, and engineering meet on the same screen
4. Three product truths:
   - Provider posture, SLA pressure, and recovery recommendations stay visible in one frame.
   - The same operating record supports action, reconciliation, and audit defense.
   - Teams do not need to stitch dashboards, exports, and callback logs.
5. Stat row:
   - `₹14.8T+ tracked visibility`
   - `14M events / month`
   - `99.95% signal uptime`

### Live metric strip

This strip is the trust / scale layer right after the first product visual.

Primary copy:

1. Eyebrow: `Live payout value tracked today`
2. Main metric: dynamic formatted payout value
3. Supporting copy: real-time value across routing, confirmation, reconciliation, and proof readiness

Supporting stat cards:

1. `14M+ events / month`
2. `99.95% uptime`
3. `6+ provider layers`

### Problem section

Purpose: explain why payout failures are cross-functional, not just technical.

Hero copy:

1. Eyebrow: `Problem`
2. Heading: `Payouts break across systems, not logic`
3. Supporting line: ops sees one dashboard, finance sees another, engineering sees logs

Role cards:

1. `Ops` -> sees provider status but not the bank-side truth
2. `Finance` -> sees settlement and exceptions after the fact
3. `Engineering` -> sees logs, retries, and webhooks without close context

Impact card:

1. Eyebrow: `What it causes`
2. Subheading: `The same payout issue creates three kinds of damage.`
3. Impact items:
   - `Delayed confirmations`
   - `SLA breaches`
   - `Audit chaos`

### Solution section

Purpose: summarize ZORD as the control layer.

Hero copy:

1. Eyebrow: `Solution`
2. Heading: `One payout truth instead of three dashboards`
3. Supporting line: `ZORD becomes the command layer between request, provider, bank, and finance close.`

Three solution cards:

1. `Provider + bank visibility`
2. `Catch confirmation drift early`
3. `Export proof packs fast`

### Product experience section

Anchor: `#product`

Hero copy:

1. Eyebrow: `Operations Switchboard`
2. Heading: `A premium control surface for payout posture`
3. Supporting line: scan provider health, rail posture, bank hotspots, and the recommended next move

Dashboard shell:

1. Product shell opens into a browser-style dashboard workspace instead of a dark split-screen panel
2. Main dashboard title: `Payout command view`
3. Supporting line: ops, finance, and engineering use one working surface for posture, exceptions, and proof

Browser-style command workspace:

1. Black browser bar with traffic lights and a fake ZORD route URL
2. Light canvas follows a near-monochrome system:
   - page background: `#EBEBEB`
   - card background: `#FFFFFF`
   - primary ink: `#111111`
   - accent: `#4ADE80`
3. Dashboard typography uses a DM Sans style with a thin oversized hero metric
4. White content surface with:
   - seven icon-only top navigation buttons in a row
   - home, workspace, recoveries, proof, grid, bank, refresh
   - second button is active by default with a dark filled square treatment
   - clicking the dock buttons changes the dashboard context like a guided product tour
   - search field
   - utility actions and profile cluster
   - breadcrumb: `Workspaces / Overview`
   - heading: `Payout command view`
5. Operating lens tabs:
   - `PSP Status`
   - `Rail Status`
   - `Provider Health`
   - `Bank Exposure`

Operating lens tabs inside the overview workspace:

1. `PSP Status`
2. `Rail Status`
3. `Provider Health`
4. `Bank Exposure`

Overview canvas:

1. Large hero metric with:
   - lens-specific metric rendered as a large dollar-denominated amount
   - font weight near `300`
   - oversized type treatment as the primary visual anchor
   - compact time-range chips
2. Full-width chart board with:
   - around 90 flat rectangular bars across Jan to Sep
   - selected-range bars in near-black
   - out-of-range bars in medium charcoal gray
   - one smooth gray context line with a black focus segment across the selected window
   - a fixed floating white tooltip callout near April
   - right-side grayscale scale
   - a bottom range scrubber
3. Lower dashboard uses a 4-column card grid for:
   - routed value forecast
   - monthly exception load
   - bank exposure forecast
   - insight
4. A dedicated prompt layer sits below the analytics:
   - dark container with rounded corners
   - top category tabs
   - starter assistant bubble with timestamp
   - 2x2 grid of dark helper cards
   - footer composer bar
5. The prompt layer keeps the same CSS system across pages, but its tabs, prompt copy, and helper cards change by active dashboard icon

#### PSP Status lens

1. Main metric: `+24.7%`
2. Title: `Confirmation recovery`
3. Legend:
   - `Without reroute`
   - `Recovered after reroute`
4. List card: provider queue watch
5. KPI card: `+139 clean payouts`
6. Split card:
   - `32% provider-side`
   - `68% bank-side`

#### Rail Status lens

1. Main metric: `-18 min`
2. Title: `Settlement lag reduction`
3. Legend:
   - `Scheduled batch`
   - `Protected live lane`
4. List card: rail posture
5. KPI card: `94.2% high-value on-time`
6. Split card:
   - `61% IMPS`
   - `39% NEFT + RTGS`

#### Provider Health lens

1. Main metric: `99.1%`
2. Title: `Clean route success`
3. Legend:
   - `At risk before failover`
   - `Clean after route shift`
4. List card: provider health table
5. KPI card: `99.6% Razorpay callback reliability`
6. Split card:
   - `46% Razorpay`
   - `54% other lanes`

#### Bank Exposure lens

1. Main metric: `84`
2. Title: `Bank hotspot watch`
3. Legend:
   - `Statement lag`
   - `Recovered callbacks`
4. List card: bank exposure
5. KPI card: `2.7% ICICI failure share`
6. Split card:
   - `68% bank-side delay`
   - `32% provider retry`

### How it works section

Anchor: `#how-it-works`

Hero copy:

1. Eyebrow: `How it works`
2. Heading: `The operating model behind control`
3. Supporting line: every payout moves through four simple stages

Four stage cards:

1. `01 Intent capture`
2. `02 Provider decision`
3. `03 Bank confirmation`
4. `04 Proof export`

Each card carries:

1. Step number
2. Label
3. Supporting detail
4. Right-aligned percentage or action label

### Metrics section

Purpose: scale proof after the operating model is explained.

Heading:

1. `Scale that earns trust.`

Supporting line:

1. Once the operating model is clear, the numbers explain why teams trust the layer.

The section uses `impactStats`, which are rendered as four centered stat cards.

### Capabilities section

Anchor: `#use-cases`

Hero copy:

1. Eyebrow: `Capabilities`
2. Heading: `What it actually does`

Three capability buckets:

1. `Routing Intelligence`
   - description: choose the healthiest provider path before payout quality drops
   - bullets:
     - Route through the best provider
     - Failover handling by live posture
2. `Visibility & Risk`
   - description: watch confirmation, SLA drift, and finality risk on one timeline
   - bullets:
     - Confirmation tracking
     - SLA drift and delay detection
3. `Proof & Finance`
   - description: close with evidence, not screenshots and scattered exports
   - bullets:
     - Audit-ready proof packs
     - Reconciliation clarity for finance

### Infrastructure depth section

Anchor: `#security`

Hero copy:

1. Eyebrow: `Infrastructure depth`
2. Heading: `The infrastructure layer buyers validate before rollout`
3. Supporting line: provider coverage, bank signal quality, and proof readiness move a strong demo into an enterprise decision

Unified surface:

1. Eyebrow chip: `Enterprise depth`
2. Main title:
   `Provider posture, bank response, and proof readiness in one layer.`
3. Body:
   `ZORD connects payout intent, provider outcomes, bank-side movement, and finance-ready evidence so teams operate from one trusted payout record.`
4. Large collaboration image with overlay card:
   - label: `Shared payout truth`
   - body: same control layer for routing action, confirmation confidence, reconciliation, and proof export

Four supporting cards:

1. `Provider mesh`
   - value: `14 PSPs`
   - label: `Provider posture`
   - detail: primary, fallback, and failover posture across live payout paths
2. `Bank intelligence`
   - value: `22 banks`
   - label: `Bank response visibility`
   - detail: callback trust, confirmation drift, and hotspot monitoring from the same control layer
3. `Shared workspace`
   - value: `Ops + Finance`
   - label: `Shared payout context`
   - detail: operations and finance work from one payout record for action, close, and reconciliation
4. `Evidence layer`
   - value: `1-click`
   - label: `Proof readiness`
   - detail: export finance-ready proof packs without stitching screenshots, logs, and callbacks across tools

### Final CTA section

Anchor: `#book`

Heading:

1. `Move payouts with control, not guesswork`

Supporting line:

1. `Book a ZORD walkthrough and see how routing, visibility, reconciliation, and proof can sit in one enterprise operating layer.`

CTAs:

1. `Book Demo`
2. `See how it works`

### Footer section

Anchor id: `#developers`

Footer columns:

1. Product
2. Solutions
3. Resources
4. Company
5. Legal

Product footer links:

1. `ZORD Platform`
2. `Operations Switchboard`
3. `Payout Intelligence`
4. `Proof Packs`

Solutions footer links:

1. `Marketplaces`
2. `NBFCs`
3. `Fintech & PSPs`
4. `Finance Ops`

Resources footer links:

1. `How it Works`
2. `Security`
3. `Pricing`
4. `Support`

Company footer links:

1. `About Arealis`
2. `Careers`
3. `Contact`
4. `Recognitions`

Legal footer links:

1. `Privacy`
2. `Terms`
3. `Cookies`
4. `Compliance`

## Page 2: `/final-landing/how-it-works`

### Page role

This page is a dedicated product walkthrough. It is more editorial and visual than the product landing page and is designed to explain the operating model step by step.

### Shared top bar

The top bar includes:

1. ZORD logo
2. Product
3. How it works
4. Solutions
5. Pricing
6. Customers
7. Resources
8. Company
9. Sign in
10. Book Demo

### Hero card

This page opens with a bright, high-contrast editorial hero rather than the dark landing-page style.

Hero header:

1. Pill: `How payouts move through Zord`
2. Main headline: `One payout flow. Full visibility from intent to proof.`
3. System status card:
   - `System status`
   - `Nominal payout flow`

Dock navigation:

1. `Intent intake`
2. `Dynamic routing`
3. `Live tracking`
4. `Proof export`

Left-side product story:

1. Kicker: `Payout infrastructure`
2. Main display title:
   - `Route.`
   - `Track.`
   - `Confirm. Prove.`
3. Body: explains that Zord receives intent, chooses a provider path, watches state changes, and confirms whether money actually reached
4. CTAs:
   - `Book Demo`
   - `Back to landing`

Metric cards:

1. `Routing 12 ms`
2. `Visibility 99.9 %`
3. `Signals 4 sources`
4. `State Stable`

Right-side visual:

1. Large product-ecosystem diagram
2. Proof status badge:
   - `proof status`
   - `97.8%`
   - `evidence pack ready`

### Operational flow section

This is the long-form stage walkthrough.

Intro copy:

1. Kicker: `Operational flow`
2. Heading: `Every stage is visible, attributable, and designed for action`
3. Supporting text: scroll through the journey to see how Zord converts a raw payout request into a tracked, confirmed, and defensible outcome

Sticky left timeline:

1. Stage `01 · Intent`
2. Stage `02 · Routing`
3. Stage `03 · Tracking`
4. Stage `04 · Proof`

Stage article 1:

1. Title: `Create the payout intent`
2. Body: payout request enters Zord with beneficiary, amount, business rules, routing constraints
3. Bullets:
   - validate amount, tenant, beneficiary, compliance constraints
   - attach business context
   - normalize the request into one contract
4. Metrics:
   - `Contract checks 36`
   - `Risk rules 9`
   - `Prep latency 12ms`
5. Live surface:
   - `Intent payload`
   - `beneficiary_id: seller_4821`
   - `amount: ₹50,000`
   - `mode: best_available`
   - `proof: required`
6. Status chips:
   - `AML cleared`
   - `Policy matched`
   - `Proof required`

Stage article 2:

1. Title: `Choose the best provider path`
2. Body: routing engine compares provider health, rail availability, latency, and cost rules
3. Bullets:
   - evaluate primary and failover providers
   - shift by amount bucket, rail, or priority
   - record the routing decision
4. Metrics:
   - `Providers scored 6`
   - `Auto-routed 92%`
   - `Fee delta -14%`
5. Live surface:
   - routing score graphic
   - lane cards:
     - `Cashfree 99.9% ₹3.10`
     - `Razorpay 99.2% ₹3.35`
     - `Yes Bank UPI 91.4% ₹2.95`

Stage article 3:

1. Title: `Track every payout state`
2. Body: provider acknowledgement, bank confirmation, settlement progress, and exception signals live in one timeline
3. Bullets:
   - merge provider and bank events
   - surface lagging stages
   - highlight provider-side, bank-side, or data-side failures
4. Metrics:
   - `States captured 11`
   - `Sync interval 18s`
   - `Exception SLA Live`
5. Live surface timeline:
   - `Dispatched 09:42:12`
   - `Provider acknowledged 09:42:18`
   - `Bank confirmation 09:42:31`
   - `Settlement update 09:43:02`

Stage article 4:

1. Title: `Confirm delivery and export proof`
2. Body: confirms whether money actually reached and assembles the evidence pack
3. Bullets:
   - match webhook, provider timeline, and statement evidence
   - keep proof packs ready for disputes, audits, and merchant questions
   - export a single artifact
4. Metrics:
   - `Proof sources 4`
   - `Ready packs 14.7k`
   - `Export time 1 click`
5. Live surface:
   - proof completeness graphic
   - included sources:
     - `Provider timeline`
     - `Bank statement match`
     - `Webhook receipt`
     - `Operator action log`
   - final callout: `Export pack in one click for audit, dispute, or merchant communication.`

### Shared visibility section

Purpose: explain how different teams use the same payout truth.

Heading block:

1. Kicker: `Shared visibility`
2. Heading: `Different teams, one payout truth`
3. Supporting text: ops, finance, and engineering stay aligned without each building its own payout-state model

Team cards:

1. `Operations`
   - body: see where payouts are stuck, why routing changed, and which queue needs attention
   - tags:
     - `Live queue`
     - `Provider lag`
     - `Exception SLA`
2. `Finance`
   - body: understand whether money moved, reconcile final state, and keep defensible proof
   - tags:
     - `Finality`
     - `Proof packs`
     - `Audit trail`
3. `Engineering`
   - body: connect through APIs and webhooks while keeping one normalized model for payout state
   - tags:
     - `API`
     - `Webhooks`
     - `Contracts`

### Closing CTA section

1. Kicker: `From request to proof`
2. Heading: `This is what a payout operating system should feel like`
3. Supporting line: one operating layer for routing, visibility, confirmation, and proof export
4. CTA buttons:
   - `Back to landing`
   - `Book Demo`

## Page 3: `/final-landing/solutions`

### Page role

This is the browse hub for the solutions narrative. It is the place where buyers start by problem or workflow instead of by product.

### Hero section

1. Eyebrow: `Solutions`
2. Heading: `Explore ZORD by the problem your team needs to solve next.`
3. Supporting line: the Plaid-style solutions layer translated into the ZORD system
4. CTAs:
   - `Talk to sales`
   - `Back to landing page`

### Hero visual section

1. Eyebrow: `Browse model`
2. Title: `Start with the buyer problem, then map it to the workflow and product depth underneath.`
3. Body: solution navigation from use case to operating model to rollout, proof, and system design
4. Stat cards:
   - `2 browse modes`
   - `11 solution stories`
   - `1 design system`

### Browse panel

This is the same content model used in the nav dropdown, but expanded for the hub page.

Left rail browse modes:

1. `By use case`
   - description: `Explore ZORD by the operator problem you need to solve first.`
2. `By workflow`
   - description: `Browse the payment, onboarding, and data flows teams modernize next.`

Selected card:

1. Eyebrow: `Selected`
2. Active solution title
3. Active solution short description
4. CTA: `View solution`

Right grid:

1. Renders all solutions in the selected browse mode
2. Each card includes:
   - icon
   - title
   - short description
3. Bottom CTA row:
   - explanatory note
   - `See all solutions`

### Benefit cards

These explain why the browse system works.

1. `Use-case-first buyer story`
2. `Product depth behind each solution`
3. `One design system across pages`

## Page 4: `/final-landing/solutions/[slug]`

### Page role

This is the dynamic solution-detail template. All solution detail pages share the same layout and draw their specific copy from `solutions-data.ts`.

### Shared page structure

Every solution page contains:

1. Back link: `Back to solutions`
2. Eyebrow from the solution entry
3. Hero title from the solution entry
4. Hero body from the solution entry
5. Audience line from the solution entry
6. CTA buttons:
   - `Contact sales`
   - `Sign in`
7. Outcome signals panel
8. Three capability cards
9. Three-step workflow section
10. Related products section
11. Related solutions grid

### Dynamic content source

Each solution entry defines:

1. `slug`
2. `title`
3. `description`
4. `shortDescription`
5. `icon`
6. `views`
7. `eyebrow`
8. `heroTitle`
9. `heroBody`
10. `audience`
11. `outcomes`
12. `pillars`
13. `workflow`
14. `relatedProducts`

### Solution page catalog

| Slug | Title | Browse mode | Description |
| --- | --- | --- | --- |
| `open-finance` | Open finance | use case | Connect to financial data through a single API |
| `fraud-risk-prevention` | Fraud & risk prevention | use case | Detect & prevent fraud across your user base |
| `onboarding-identity-verification` | Onboarding & identity verification | use case + workflow | Instantly onboard new users & verify identities |
| `kyc-aml-compliance` | KYC & AML compliance | use case + workflow | Manage compliance & mitigate risk |
| `income-verification-underwriting` | Income verification & underwriting | use case | Verify borrower assets in seconds |
| `inbound-bank-payments` | Inbound bank payments | workflow | Accept more successful bank payments |
| `outbound-bank-payments` | Outbound bank payments | workflow | Send faster, more reliable bank payouts |
| `personal-financial-management` | Personal financial management | use case | Deliver tailored insights to improve finances |
| `business-financial-management` | Business financial management | workflow | Power tools for modern business finance |
| `earned-wage-access` | Earned wage access | workflow | Offer early access to wages |
| `billing-recurring-payments` | Billing & recurring payments | workflow | Boost successful payments for more revenue |

### Example of what changes per solution

For every slug, the following change:

1. Eyebrow
2. Hero title
3. Hero body
4. Audience
5. Outcome values
6. Capability card titles and descriptions
7. Workflow step titles and bodies
8. Related products

## Page 5: `/final-landing/pricing`

### Page role

This is the dedicated pricing page. It separates pricing from the product page so buyers can focus on commercial fit without the rest of the product narrative crowding the screen.

### Scaffold hero

1. Eyebrow: `Pricing`
2. Heading: `Commercial clarity for payments, banking, payroll, and credit.`
3. Description: explains that the page is structured by product family, commitment model, and rollout depth
4. Primary CTA: `Contact sales`
5. Secondary CTA: `Back to product`

### Hero visual

1. Eyebrow: `Commercial context`
2. Title: `Price the operating layer against the cost of slower close, fragmented proof, and manual recovery.`
3. Body: the right model depends on payout complexity, investigation effort, and finance coordination
4. Stat cards:
   - `4 product families`
   - `12 mo growth plans`
   - `Custom enterprise motion`

### Product-family pricing panel

Family tabs:

1. `Payments`
2. `Business Banking`
3. `Payroll`
4. `Credit Solutions`

#### Payments family

1. Eyebrow: `Payments`
2. Kicker: `Start accepting payments at just`
3. Metric: `2%`
4. Detail: standard online transactions with reporting included
5. Subdetail: custom commercials above ₹5 lakh monthly revenue
6. Highlights:
   - cards, UPI, netbanking, wallets, links, subscriptions
   - custom and standard reports included
   - faster buying motion for launch-focused teams

#### Business Banking family

1. Eyebrow: `Banking+`
2. Kicker: `Banking that helps save time and money`
3. Metric: `Custom`
4. Detail: shaped around current accounts, vendor payments, tax runs, scheduled payouts, approvals
5. Subdetail: best for teams that want banking ops, payout visibility, and finance controls in one workspace
6. Highlights:
   - current accounts, vendor payments, tax payments, scheduled payouts
   - priority support and guided account opening
   - commercials shaped around real banking usage

#### Payroll family

1. Eyebrow: `Payroll`
2. Kicker: `3 clicks. Payroll fixed.`
3. Metric: `₹2,499`
4. Detail: subscriptions start at ₹2,499
5. Subdetail: bundle with Banking+ for one month free and 20% off
6. Highlights:
   - salary transfers, TDS, PF, ESI, PT, compliance filing
   - employee benefits, insurance, salary accounts
   - monthly subscription for finance and people-ops teams

#### Credit Solutions family

1. Eyebrow: `Credit Solutions`
2. Kicker: `Custom programs for lending, underwriting, and disbursal rails`
3. Metric: `Custom`
4. Detail: talk to sales for commercial design across disbursals, underwriting, settlement-linked lending, regulated rollouts
5. Subdetail: built for teams needing implementation support, bank coordination, and custom economics
6. Highlights:
   - program pricing aligned to underwriting and disbursal realities
   - support for regulated flows and enterprise review
   - better fit for high-touch rollout discussions

### Plan cards

Visual direction:

1. Dark three-card comparison grid
2. Center `Growth` card featured with a `Most popular` badge
3. Strong CTA button inside each card
4. Divider before the feature checklist

1. `Pay as You Go`
   - subtitle: `Best for individuals and developers`
   - metric: `Month-to-month`
   - CTA: `Start self-serve`
   - points:
     - Access to GA products
     - Unlimited live API calls
     - Sandbox to production path
     - Standard onboarding
2. `Growth`
   - subtitle: `Best for small teams and startups`
   - metric: `12-month commitment`
   - badge: `Most popular`
   - CTA: `Talk to sales`
   - points:
     - Everything in Pay as You Go
     - Discounted product rates
     - Platform support package
     - Commercial review cadence
3. `Custom`
   - subtitle: `Best for businesses that need to scale`
   - metric: `Volume-led`
   - CTA: `Contact sales`
   - points:
     - Everything in Growth
     - Volume discounts
     - Implementation assistance
     - Premium support and account coverage

### Pricing FAQ section

Heading:

1. Eyebrow: `Pricing FAQs`
2. Title: `Answers before procurement turns into a thread.`

Questions:

1. `How does Payments pricing work?`
2. `When should I contact sales?`
3. `Can I start in sandbox first?`
4. `Can Payroll and Banking+ be bundled?`

## Page 6: `/final-landing/customers`

### Page role

This is the customer proof page. It converts product promise into operator credibility.

### Scaffold hero

1. Eyebrow: `Customers`
2. Heading: `Proof that ZORD lands with payout teams carrying real accountability.`
3. Description: operations, finance, engineering, and risk need one payout truth instead of fragmented dashboards
4. Primary CTA: `Book demo`
5. Secondary CTA: `Back to product`

### Hero content section

Large left image card:

1. Chip: `Customer context`
2. Title: `One working view for ops, finance, engineering, and risk.`
3. Supporting line: payout incidents become customer, finance, and compliance problems at the same time

Right stat / trust stack:

1. `41 min faster exception resolution`
2. `99.95% signal uptime across live workflows`
3. `1 click proof export for finance and audit`
4. Trusted-by chip set:
   - Amazon India
   - Flipkart
   - AJIO
   - bookmyshow
   - OLA
   - Zomato
   - Blinkit
   - Zepto
   - Swiggy

### Customer story grid

Cards:

1. Priya Menon
   - role: `Head of Payout Ops, Marketplace`
   - story: one payout truth across ops, finance, and engineering
2. Raghav Shah
   - role: `Finance Controller, Lending Platform`
   - story: proof layer changed month-end close
3. Aditi Rao
   - role: `Payments Engineering Manager`
   - story: Zord replaced spreadsheet visibility and internal dashboards
4. Manoj Khanna
   - role: `Risk and Reconciliation Lead`
   - story: routing, bank failures, statement lag, and proof readiness show up in one place

## Page 7: `/final-landing/resources`

### Page role

This is the evaluation and education page. It organizes how different buyer roles learn the system.

### Scaffold hero

1. Eyebrow: `Resources`
2. Heading: `Everything teams need to evaluate, learn, and roll out ZORD.`
3. Description: understand the operating model, security posture, commercial fit, and the path to working with Arealis
4. Primary CTA: `Talk to the team`
5. Secondary CTA: `Back to product`

### Hero visual

1. Eyebrow: `Resource map`
2. Title: `Move from high-level understanding to rollout confidence without bouncing between scattered documents.`
3. Body: operators, finance teams, and engineers can learn the model quickly, then go deeper
4. Stats:
   - `3 buyer paths`
   - `1 operating model`
   - `T+0 support path`

### Resource cards

1. `Product walkthrough`
   - title: `See how ZORD operates across routing, confirmation, and proof`
   - body: start here for the fastest explanation of how ZORD works
   - CTA: `Open how it works`
2. `Security and trust`
   - title: `Review controls, bank-side visibility, and finance-ready evidence`
   - body: path for security, proof, auditability, and operational trust
   - CTA: `Review security`
3. `Pricing and rollout`
   - title: `Understand plan structure, buying motion, and implementation fit`
   - body: pricing logic, rollout paths, and when teams move from pilot to deeper adoption
   - CTA: `View pricing`
4. `Talk to the team`
   - title: `Get product access, technical answers, or onboarding support`
   - body: reach Arealis directly for demos, integration questions, enterprise rollout discussions, or support
   - CTA: `Contact Arealis`

### Learning paths section

Heading:

1. Eyebrow: `Learning paths`
2. Title: `Start from the buyer lens your team actually has.`

Cards:

1. `For operators`
2. `For finance`
3. `For engineering`

## Page 8: `/final-landing/company`

### Page role

This page explains the company story behind the product. It clarifies that Arealis is the company and ZORD is one product within a broader enterprise-intelligence system.

### Scaffold hero

1. Eyebrow: `About Arealis`
2. Heading: `Building intelligence that acts, with ZORD as one product in that fabric.`
3. Description: Arealis is building distributed enterprise intelligence and ZORD is the payout / financial operations layer inside it
4. Primary CTA: `Contact Arealis`
5. Secondary CTA: `Back to product`

### Hero visual

1. Eyebrow: `Company vision`
2. Title: `Arealis is building the operating fabric underneath enterprise intelligence, not just another AI dashboard.`
3. Body: ZORD is one product in that larger system, focused on payout control, proof, and explainable action
4. Stats:
   - `2 product tracks`
   - `53k+ hackathon teams`
   - `AI-first enterprise fabric`

### Story and vision section

1. Eyebrow: `Our story and vision`
2. Heading: `From AI research to enterprise operating fabric`
3. Paragraph 1: intelligence should live inside the system itself across fragmented data zones, agents, and real workflows
4. Paragraph 2: Arealis evolved from research into an enterprise intelligence platform, with ZORD as the payout / financial control example of that thesis

Supporting cards:

1. `Products`
   - `ZORD + Gateway`
   - explains that ZORD handles payout and compliance orchestration while Arealis builds broader infrastructure
2. `Supported by`
   - `AWS + Microsoft`
   - explains AWS Founders Hub and Microsoft for Startups support

### Recognitions and milestones section

1. `Google Agentic AI Hackathon 2025`
2. `IIT Bombay National Showcase`
3. `Wadhwani Foundation Liftoff Program`

### Founder note

1. Eyebrow: `Founder note`
2. Quote about building intelligence that acts on data rather than only analyzing it
3. Attribution: `Abhishek J. Shirsath, Founder & CEO`

### Team section

Heading:

1. Eyebrow: `The minds behind Arealis`

Member cards:

1. Abhishek J. Shirsath — Founder & CEO
2. Sahil Kirad — Fullstack and Backend Developer
3. Yashwanth Reddy — Cloud DevOps Engineer
4. Swaroop Thakare — AI & Development Engineer
5. Prathamesh Bhamare — Machine Learning Engineer

## Content Data Dependencies

### Static content pages

These pages are mostly hard-coded at the component level:

1. `/final-landing`
2. `/final-landing/how-it-works`
3. `/final-landing/pricing`
4. `/final-landing/customers`
5. `/final-landing/resources`
6. `/final-landing/company`

### Shared content models

These parts are driven by shared arrays and should be edited carefully because they feed multiple sections or routes:

1. `heroSlides`
2. `switchboardOverviewCards`
3. `switchboardViews`
4. `switchboardPspStatus`
5. `switchboardRailStatus`
6. `switchboardProviderRows`
7. `switchboardBankRows`
8. `pricingFamilies`
9. `pricingPlans`
10. `pricingFaqs`
11. `resourceCards`
12. `arealisMilestones`
13. `arealisTeam`
14. `solutionMenuViews`
15. `solutionEntries`

## Practical Editing Notes

If the team wants to adjust copy, use this rule of thumb:

1. Edit `LandingPageFinalClient.tsx` for the main product narrative.
2. Edit `HowItWorksClient.tsx` for the product walkthrough story.
3. Edit `solutions-data.ts` for anything inside the solutions hub or solution detail pages.
4. Edit `PricingPageClient.tsx`, `CustomersPageClient.tsx`, `ResourcesPageClient.tsx`, or `CompanyPageClient.tsx` for the dedicated standalone pages.
5. Edit `FinalLandingPageScaffold.tsx` only when the shared hero pattern itself needs to change.
6. Edit `SolutionsSiteChrome.tsx` only when nav or footer behavior should change across the standalone pages.
