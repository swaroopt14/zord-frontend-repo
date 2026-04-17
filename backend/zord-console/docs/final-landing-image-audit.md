# Final Landing Image Audit

This is the image plan for the `final-landing` site family.
The goal is to stop reusing the same visual language across pages and give each route one strong visual job.

## Rules

- Do not reuse the current hero images across multiple routes.
- Prefer one strong image per section over many small decorative images.
- Keep UI-heavy sections UI-heavy; only add imagery where it increases narrative clarity.
- Use realistic, premium enterprise photography or refined editorial 3D only when it matches the page.

## 1. Product Page

Route: `/final-landing`
Component: `LandingPageFinalClient.tsx`

### Slot P1
Location: hero carousel image stage on the right side of the main hero.
Need: 4 unique ICP images, one per hero slide.
Why: this is the first impression and it should immediately signal that each ICP has its own buyer story.

#### P1A Marketplace
```text
Marketplace operations lead reviewing seller payouts in a premium commerce control environment
busy but elegant merchant ecosystem backdrop with packages, seller dashboards, and live exception signals
dark fintech palette with silver glass surfaces and restrained mint accents
realistic photography, sharp face visibility, no logos, no embedded UI text
```

#### P1B NBFC
```text
Lending and collections operator reviewing disbursals and borrower payout movements in a credit operations room
serious enterprise setting with paperwork, approval context, and underwriting screens implied in the environment
deep navy, graphite, and soft indigo highlights with premium cinematic lighting
realistic photo, confident human subject, clean negative space around the face and hands
```

#### P1C Payments Service Provider
```text
PSP operations manager monitoring provider health, callback quality, and bank-side confirmation drift
modern command-center desk with multiple screens and a fast-moving payments atmosphere
dark enterprise fintech mood with steel, silver, and muted cyan reflections
realistic photography, premium but restrained, no cluttered control panels baked into the image
```

#### P1D Enterprise Finance Ops
```text
Cross-functional ops and finance lead aligning payout proof, reconciliation, and routing posture in one workspace
executive enterprise environment with calm authority instead of startup energy
charcoal, silver, and soft mint visual language with clean glass reflections
realistic editorial photo, mature enterprise tone, no visible brand marks or UI text
```

### Slot P2
Location: `ProductHeroVisualSection`, directly after the hero.
Need: 1 wide image.
Why: this is the “show the control layer” moment and should feel calmer than the rotating hero.

```text
Single payout operator reviewing a live command surface with confidence and calm focus
minimal enterprise workspace with one device and subtle large-screen reflections in the background
premium dark fintech lighting with silver highlights and a slightly cinematic mood
realistic photography, wide composition, strong negative space for text overlay
```

### Slot P3
Location: `InfrastructureSection`, the enterprise-depth section near the bottom of the product page.
Need: 1 wide image.
Why: this section should signal enterprise validation depth, not another hero or abstract wallpaper.

```text
Finance, operations, and platform leaders reviewing payout evidence and bank movement together
conference-room or war-room setting with one shared operations workspace at the center
dark navy enterprise palette with neutral silver glass reflections and disciplined lighting
realistic group photography, premium and credible, no embedded interface text or logos
```

## 2. How It Works Page

Route: `/final-landing/how-it-works`
Component: `HowItWorksClient.tsx`

### Slot H1
Location: opening hero section, replacing or complementing the current pure-diagram emphasis on the right side.
Need: 1 visual plate.
Why: the page is already strong diagrammatically, so it needs only one contextual image, not many.

```text
Enterprise payout flow visualized as a calm, high-end operations environment rather than a dashboard screenshot
operator and system context together, with money movement implied through light, reflection, and posture
silver-white and deep indigo palette matching the lighter how-it-works page treatment
realistic editorial hybrid image, spacious, premium, no hard UI boxes baked into the art
```

Note: do not add photos inside each stage card. Those should stay diagram-led and motion-led.

## 3. Solutions Hub

Route: `/final-landing/solutions`
Component: `SolutionsHubClient.tsx`

### Slot S1
Location: directly under the hero copy, above or beside the `SolutionBrowsePanel`.
Need: 1 panoramic image.
Why: the browse panel is functional; it needs one visual anchor to make the page feel like a destination.

```text
Cross-functional fintech team exploring connected use cases across onboarding, fraud, payments, and finance data
large premium enterprise workspace with one shared display wall and collaborative posture
dark graphite, silver, and mint-accent palette with soft ambient glow
realistic photography, horizontal composition, clear faces, no interface text inside the image
```

## 4. Solution Detail Pages

Route pattern: `/final-landing/solutions/[slug]`
Component: `SolutionDetailClient.tsx`

### Shared slot
Location: right-side hero card area beside the solution title and outcomes.
Need: 1 unique image per solution page.
Why: every solution page should immediately feel specific to that buyer problem.

#### Open finance
```text
Financial data platform team connecting bank, ledger, and statement data into one governed access layer
clean enterprise environment with data infrastructure cues rather than payments-only cues
cool silver and dark teal accents with premium, technical editorial lighting
realistic photography, structured, trustworthy, no visible UI labels or logos
```

#### Fraud & risk prevention
```text
Risk analyst reviewing suspicious movement and user behavior patterns across financial workflows
secure monitoring environment with subtle alert context and serious concentration
deep charcoal, muted red, and steel-blue palette with restrained contrast
realistic photo, premium enterprise tone, no cyberpunk clutter or noisy overlays
```

#### Onboarding & identity verification
```text
Operations and risk professional approving new user onboarding in a regulated fintech environment
identity verification context through documents, devices, and workflow posture rather than obvious badges
dark premium palette with soft white light and controlled indigo accents
realistic photography, calm and precise, no text embedded in the image
```

#### KYC & AML compliance
```text
Compliance lead reviewing watchlist, ownership, and movement context in one enterprise workspace
regulated operations environment with seriousness, trust, and defensible decision-making
graphite, silver, and subdued green accents with premium low-key lighting
realistic editorial photo, mature enterprise energy, no literal compliance labels on screen
```

#### Income verification & underwriting
```text
Underwriting analyst evaluating borrower financial posture with connected banking and payout context
credit operations setting with premium lending atmosphere and clean decision cues
dark navy and silver palette with soft amber or indigo highlights
realistic photography, confident but analytical tone, no document text visible
```

#### Inbound bank payments
```text
Payments team monitoring inbound bank collections and confirmation success across multiple rails
live revenue collection atmosphere with subtle billing or recurring payment context
dark fintech palette with steel surfaces and controlled blue highlights
realistic photo, operational and premium, no busy wall of dashboards
```

#### Outbound bank payments
```text
Payout operations lead managing outbound disbursals, routing posture, and bank confirmation reliability
strong command-layer environment focused on control, motion, and financial responsibility
deep navy, silver, and muted mint treatment with elegant reflections
realistic photography, enterprise premium feel, face and hands clearly visible
```

#### Personal financial management
```text
Consumer-finance product team shaping clearer money insight experiences from connected financial data
more human and user-centered environment, but still premium and enterprise credible
cool silver, dark slate, and restrained cyan palette with softer lighting
realistic editorial image, thoughtful mood, no embedded app UI text
```

#### Business financial management
```text
Finance operator at a modern business platform reviewing treasury, cash flow, and payout movement together
B2B operations setting with serious but polished enterprise energy
charcoal and silver palette with subtle mint accents and clean desk composition
realistic photography, premium, no clutter, no visible logos
```

#### Earned wage access
```text
Payroll and employee-finance team coordinating early wage access with trust and speed
human-centered but still enterprise workspace with supportive, responsible financial mood
dark neutral palette with soft teal and silver highlights
realistic photography, respectful tone, no consumer-ad style treatment
```

#### Billing & recurring payments
```text
Revenue operations and finance team monitoring subscription billing health and recurring payment performance
structured recurring-revenue environment with retention and payment continuity implied
dark graphite palette with subtle indigo and cool silver glow
realistic photography, premium SaaS-fintech feel, no embedded charts or logos
```

## 5. Pricing Page

Route: `/final-landing/pricing`
Component: `PricingPageClient.tsx`

### Slot PR1
Location: directly below the hero and above the pricing family selector.
Need: 1 wide image.
Why: pricing is currently clean but abstract; one commercial-context image will make it feel more premium and trustworthy.

```text
Finance and procurement leaders comparing fintech commercial plans and rollout models in one meeting
premium enterprise setting with agreement, evaluation, and buying confidence rather than sales hype
dark navy, silver, and mint-accent palette with clean architectural lighting
realistic editorial photography, wide composition, no visible price numbers or brand marks
```

## 6. Customers Page

Route: `/final-landing/customers`
Component: `CustomersPageClient.tsx`

### Slot C1
Location: existing large image card at the top-left of the page.
Need: 1 new image.
Why: this should show cross-functional adoption, not generic fintech teamwork.

```text
Operations, finance, engineering, and risk leaders aligned around one payout control surface
collaborative enterprise setting where the shared workspace feels like the hero of the room
dark premium fintech palette with silver reflections and subtle mint trust accents
realistic group photography, decisive and calm, no screen text or company logos
```

## 7. Resources Page

Route: `/final-landing/resources`
Component: `ResourcesPageClient.tsx`

### Slot R1
Location: between the hero and the first row of resource cards.
Need: 1 image.
Why: resources pages feel thin without a visual anchor; one knowledge-rich image is enough.

```text
Product specialist guiding a team through documentation, workflow models, and rollout material
knowledge-focused enterprise setting with screens, notes, and structured learning energy
dark slate and silver palette with soft mint accent light and premium editorial composition
realistic photography, helpful and intelligent tone, no literal docs text visible
```

## 8. Company Page

Route: `/final-landing/company`
Component: `CompanyPageClient.tsx`

### Slot CO1
Location: hero band or directly beneath the hero copy.
Need: 1 wide image.
Why: the company story needs a foundational brand image before the copy blocks begin.

```text
Arealis leadership and product vision represented through a deep-tech enterprise intelligence environment
modern studio or office setting with systems thinking, research, and product ambition implied
dark neutral palette with silver, indigo, and soft mint highlights
realistic editorial photography, premium and founder-led, no cliché startup props
```

### Slot CO2
Location: beside or above the founder note.
Need: 1 portrait image.
Why: the founder quote will land much better with a strong, intentional portrait.

```text
Founder portrait of an enterprise AI company CEO with calm authority and technical depth
studio-quality but not overproduced, with subtle environment cues tied to product and systems
charcoal, silver, and soft cool lighting with premium editorial finish
realistic portrait, eye contact strong, clean background, no text or logos
```

### Slot CO3
Location: above the team grid.
Need: 1 team image.
Why: the team section currently reads as cards only and needs a human anchor.

```text
Core Arealis team standing or collaborating in a modern product and research workspace
serious deep-tech energy with warmth, ambition, and enterprise credibility
dark palette with clean silver highlights and balanced natural expressions
realistic group photography, wide crop, no cheesy startup poses or props
```

## 9. Pages That Should Stay Mostly Non-Photographic

### Product page sections that should remain UI-led
- `Operations Switchboard`
- `How it works`
- `Capabilities`

These sections are stronger as product surfaces and structured UI, not photos.

### How-it-works stage panels
- Keep these as animated diagrams and UI panels.
- Do not add a separate image to each stage.

## 10. Priority Order

Generate in this order first:

1. Product hero carousel set
2. Product page image after hero
3. Product infrastructure depth image
4. Customers page hero image
5. Pricing page hero image
6. Company hero + founder portrait
7. Solutions hub hero image
8. Solution detail page images
9. Resources page image
10. Company team image
