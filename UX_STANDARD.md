# JHALAR UX STANDARD v1

## Purpose
This document is the acceptance standard for UX, responsive behaviour, accessibility, interaction quality and maintainable interface architecture.

A change is not accepted only because it looks good on one screen. It must remain understandable, usable and stable across real content, screen sizes and interaction methods.

---

# 1. Core principle

**Every element must earn its place.**

Before adding or keeping an element, ask:

1. Does the visitor need it?
2. Does it help understanding?
3. Does it support the next decision?
4. Does it belong in this section?
5. Is it competing with something more important?

If not, remove it.

---

# 2. Information architecture

## Canonical user paths

Home
- Collection
  - Product
- Custom requirement
- About / trust
- Enquiry

Every page must have:
- a clear user purpose
- a defined place in the hierarchy
- a canonical URL
- intentional internal links
- a clear next action

## Filters and sorting

Filter state is not automatically a new SEO page.

Define explicitly:
- canonical/indexable collection pages
- temporary filter or sort states
- URL parameter behaviour
- canonical or noindex strategy where required

Internal jargon must not leak into visible navigation, filters, breadcrumbs or customer-facing copy.

---

# 3. Structural architecture

Preferred structure:

PAGE
- HEADER
- MAIN
  - SECTION
    - CONTAINER
      - CONTENT / LAYOUT
- FOOTER

Do not create wrapper pyramids.

Every wrapper must have a real purpose:
- width control
- layout
- semantic grouping
- positioning context
- interaction boundary

Remove wrappers that do not perform a meaningful job.

---

# 4. Eye and mind choreography

Each section must answer one primary question at a time.

Homepage journey:

1. What is this?
2. Is it relevant to me?
3. What is available?
4. Can I find what I need?
5. What if my requirement is different?
6. Who am I dealing with?
7. What should I do next?

Visual priority should normally follow:

PRIMARY
↓
UNDERSTANDING
↓
ACTION
↓
SUPPORTING CONTEXT

One section should normally have one primary action.

DOM order should match meaningful visual and interaction order.

---

# 5. Responsive rules

Responsive design means reflow, not shrinking.

Test at:
- 320px
- 375px
- 768px
- 1024px
- 1440px

Also test portrait and landscape where relevant.

## Required behaviour

- No accidental horizontal scrolling
- No clipped text
- No overlapping controls
- No disappearing actions
- No fixed layout assumptions based only on desktop
- Content must reflow according to available space

Do not use `overflow-x: hidden` to conceal a layout bug. Find and fix the source.

Global sizing should use border-box sizing.

Media must not exceed its container unless intentional.

---

# 6. Text and content stress testing

Text-heavy components must not depend on fixed heights.

Test components with:
- short content
- normal content
- long realistic content
- larger browser font settings
- 200% zoom or text enlargement
- increased line and letter spacing where relevant

If realistic content breaks the component, fix the component architecture.

Avoid:
- fixed heights for text-heavy UI
- unnecessary white-space: nowrap
- rigid widths around dynamic copy

---

# 7. Flex and grid rules

Flex is not automatically responsive.

For text-heavy rows:
- allow wrapping where appropriate
- allow stacking at narrow widths
- avoid rigid min-width assumptions
- do not force long dynamic content into one line

Use Grid when the information has a true two-dimensional structure.

Reusable components should respond to available container space where appropriate, including container-query patterns when beneficial.

Principle:

**Pages respond to viewport space. Components respond to available container space.**

---

# 8. Typography

Every type level must define:
- minimum size
- maximum size
- line-height
- weight
- letter spacing where needed
- responsive behaviour

Display typography may be expressive.

UI typography must prioritize readability.

Body copy must maintain comfortable reading width. Text-heavy content should not stretch across excessively long lines on large screens.

Fluid type must always have sensible minimum and maximum limits.

---

# 9. Spacing system

Use a controlled token scale.

Spacing communicates relationship:

Close = related.
Far = different.

Spacing categories:
- XS: inside compact components
- S: directly related elements
- M: content groups
- L: major groups
- XL: section separation
- XXL: major page rhythm

Avoid arbitrary spacing values unless there is a documented exception.

Responsive behaviour:
- component spacing remains relatively stable
- group spacing compresses moderately
- large section spacing compresses more on narrow screens

Whitespace must clarify structure, not create empty space without purpose.

---

# 10. Product cards and dynamic information

Product cards must survive:
- long product names
- different image proportions
- longer labels
- quantity or MOQ information
- future price information

Do not design around a single short example.

Dynamic numeric values should be tested with small and large values.

Price, quantity and discount information must wrap or stack gracefully.

---

# 11. Product modal and image zoom

The modal is a dedicated interaction system.

Structure:

MODAL
- fixed controls
- image viewport
  - zoomable / pannable image

The image viewport is the movement boundary.

Requirements:
- zoom bounds are calculated from the current viewport
- pan bounds prevent uncontrolled empty space
- image does not visually escape its intended viewport
- controls remain stable while the image moves
- close action is always available
- desktop pointer behaviour is smooth
- mobile touch behaviour is natural
- controls respect safe tap areas and screen edges

Do not reuse desktop dimensions as mobile pan/zoom assumptions.

---

# 12. Accessibility

Use semantic HTML first.

- Actions use button elements
- Navigation uses links
- Inputs use real input elements
- Inputs have visible labels
- Focus states remain visible
- Keyboard navigation works
- Screen-reader names are available where needed
- Color is not the only meaning signal
- Touch targets should be comfortably tappable

Do not replace semantic controls with clickable divs or spans.

Forms must provide:
- visible labels
- understandable validation
- associated error information
- accessible status or feedback where appropriate

---

# 13. SEO architecture

SEO must support the user journey.

Homepage:
- brand understanding
- relevance
- product discovery

Collection pages:
- category and commercial intent

Product pages:
- specific product intent

Guides / articles:
- deeper informational and long-tail discovery

Internal links must reflect:
- user intent
- logical hierarchy
- commercial priority

Avoid both keyword stuffing and vague generic copy.

Use concrete language that customers actually understand and search for.

Where applicable, maintain:
- clear heading hierarchy
- unique page titles and descriptions
- canonical strategy
- meaningful image metadata
- appropriate structured data
- breadcrumb hierarchy where useful

---

# 14. Canonical component system

Maintain canonical patterns for:

- Header
- Hero
- Section header
- Product filters
- Product grid
- Product card
- Product modal
- Image zoom
- CTA
- Enquiry form
- Footer

New UI should reuse the established system whenever possible.

Do not create duplicate versions of the same component without a clear reason.

Fix systemic problems at the component level, then reuse the fix.

---

# 15. Acceptance gate

## Responsive
- [ ] No accidental horizontal scroll at 320px
- [ ] Layout remains balanced at 375px
- [ ] Tablet transition works at 768px
- [ ] No awkward intermediate layout at 1024px
- [ ] Large screens do not create excessive line lengths or empty structure

## Text
- [ ] Long text wraps naturally
- [ ] No text is clipped
- [ ] No text-heavy component depends on a rigid fixed height
- [ ] UI text remains readable
- [ ] Enlarged text does not destroy the layout

## Flex and Grid
- [ ] Dynamic rows wrap or stack safely
- [ ] No unnecessary nowrap rules
- [ ] No rigid width causes accidental overflow
- [ ] Grid responds to available space

## Interaction
- [ ] Controls behave predictably
- [ ] Feedback is clear
- [ ] Modal close is obvious
- [ ] Zoom remains bounded
- [ ] Drag and touch behaviour feel natural

## Accessibility
- [ ] Keyboard navigation works
- [ ] Focus is visible
- [ ] Semantic controls are used
- [ ] Images have appropriate alt text
- [ ] Form fields have visible labels

## SEO
- [ ] Page purpose is clear
- [ ] Heading hierarchy is logical
- [ ] Internal links support the journey
- [ ] Duplicate/thin page architecture is avoided
- [ ] Canonical behaviour is defined where required
- [ ] Relevant structured data is valid where implemented

---

# 16. Final deployment rule

Every meaningful change must pass:

CHANGE
↓
UX standard
↓
Responsive test
↓
Content stress test
↓
Interaction test
↓
Accessibility check
↓
SEO architecture check
↓
DEPLOY

A visual fix that breaks another viewport, interaction, accessibility requirement or architectural rule is not a completed fix.

## Final standard

**Clarity before decoration.  
Structure before styling.  
Reflow before shrinking.  
Real content before ideal placeholder content.  
System fixes before one-off patches.**
