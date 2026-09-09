# Visual Layout System

Automated render matrix for the JHALAR website.

It renders the site at normal device sizes and deliberately awkward aspect ratios, then fails when it finds:

- horizontal page overflow
- collapsed sections
- overlap between consecutive sections
- visible elements escaping the viewport
- popup geometry outside the viewport

Every run also saves full-page screenshots for visual review.

## Local run

```bash
npm install
npx playwright install chromium
python3 -m http.server 4173 --directory .
npm run visual:audit
```

This is a measurable layout safety system. Screenshots remain the human-review layer for subjective balance, hierarchy and composition.
