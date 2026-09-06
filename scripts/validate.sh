#!/usr/bin/env bash
# ============================================================================
# JHALAR site validation guards
# Run on every push to main and every PR targeting main so GitHub Pages only
# ever deploys clean, in-sync copy. Exit non-zero on the first failing check
# group (all failing files are reported per group).
#
# Checks:
#   1. No double-encoded ampersands ("amp;amp") anywhere in html/js/json.
#   2. No "&amp;" / "&#38;" entities in index.html visible text (site rule:
#      write the word "and"). Raw "&" is also rejected in text nodes.
#   3. No banned consumer-retail words in index.html or content/*.json.
#   4. Repetition budget in index.html visible text:
#      "Direct Manufacturer", "Factory", "Bulk", "B2B" each <= 2 occurrences
#      (B2B is allowed in meta/OG/WhatsApp URLs, which are attributes, not
#      visible text, so they never count here).
#   5. JS syntax check (node --check) + JSON validity for content/*.json.
#   6. Drift check: key copy in index.html must equal content/site-settings.json
#      (heroHeadline, heroIntro and all section titles).
#   7. Naming registry and canonical title checks (unclassified legacy records
#      remain pending; use npm run naming:review for the strict approval gate).
# ============================================================================
set -u

cd "$(dirname "$0")/.." || exit 1      # repo root (scripts/)
FAIL=0
note() { printf '%s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*"; FAIL=1; }

# --- helpers shared by several checks ---------------------------------------
visible_text() {  # visible text of index.html: no <head>, <script>, <style>, comments
python3 - "$@" <<'PYEOF'
import html, re, sys
from html.parser import HTMLParser

class V(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out=[]; self.skip=0; self.in_head=False
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'): self.skip+=1
        if tag=='head': self.in_head=True
    def handle_endtag(self,tag):
        if tag in ('script','style') and self.skip: self.skip-=1
        if tag=='head': self.in_head=False
    def handle_data(self,d):
        if self.skip or self.in_head: return
        self.out.append(d)

p=V()
p.feed(open('index.html',encoding='utf-8').read())
text=' '.join(' '.join(p.out).split())
sys.stdout.write(text+'\n')
PYEOF
}

# --- 1. double-encoded ampersand --------------------------------------------
HITS=$(grep -rn "amp;amp" --include='*.html' --include='*.js' --include='*.json' . 2>/dev/null | grep -v '^./.git/' || true)
if [ -n "$HITS" ]; then
  fail "double-encoded 'amp;amp' found (use plain 'and' in copy):"
  printf '%s\n' "$HITS" | sed 's/^/    /'
fi

# --- 2 + 4. visible-text entity rule and repetition budget ------------------
VT=$(visible_text)
if printf '%s' "$VT" | grep -q '&amp;\|&#38;\|&#x26;\|&'; then
  bad=$(printf '%s' "$VT" | grep -o '.\{0,40\}[&].\{0,40\}' | head -5)
  fail "'&amp;'/raw '&' present in index.html visible text (write 'and'):"
  printf '%s\n' "$bad" | sed 's/^/    .../'
fi
for WORD in "Direct Manufacturer" "Factory" "Bulk" "B2B"; do
  COUNT=$(printf '%s' "$VT" | grep -oiw -- "$WORD" | wc -l | tr -d ' ')
  if [ "$COUNT" -gt 2 ]; then
    fail "repetition budget: '$WORD' appears $COUNT times (>2) in index.html visible text"
  fi
done

# --- 3. banned consumer-retail words ----------------------------------------
banned_words() {
python3 - "$@" <<'PYEOF'
import re, sys
words = ["bestseller","trending","shop","buy now","order now","add to cart",
         "deal","discount","limited"]
pat = re.compile(r'(?<![A-Za-z0-9])(?:' + '|'.join(re.escape(w) for w in words) + r')(?![A-Za-z0-9])', re.I)
bad=0
for fn in ["index.html"] + sorted(__import__('glob').glob('content/*.json')):
    try:
        text=open(fn,encoding='utf-8').read()
    except OSError as e:
        print("FAIL: cannot read %s: %s" % (fn,e)); bad=1; continue
    for m in pat.finditer(text):
        line = text.count('\n',0,m.start())+1
        snippet = ' '.join(text[m.start()-30:m.end()+30].split())
        print("FAIL: banned word '%s' in %s:%d ...%s..." % (m.group(0), fn, line, snippet))
        bad=1
sys.exit(bad)
PYEOF
}
if banned_words; then :; else FAIL=1; fi

# --- 5. syntax checks --------------------------------------------------------
for js in script.js editor.js; do
  if ! node --check "$js" 2>&1; then fail "JS syntax error in $js"; fi
done
if ! python3 - <<'PYEOF'
import json, glob, sys
ok=True
for fn in sorted(glob.glob('content/*.json')):
    try:
        json.load(open(fn, encoding='utf-8'))
    except Exception as e:
        print('FAIL: invalid JSON %s: %s' % (fn, e)); ok=False
sys.exit(0 if ok else 1)
PYEOF
then FAIL=1; fi

# --- 6. index.html <-> site-settings.json drift -----------------------------
drift_check() {
python3 - <<'PYEOF'
import html, json, re, sys
from html.parser import HTMLParser

raw = open('index.html', encoding='utf-8').read()
settings = json.load(open('content/site-settings.json', encoding='utf-8'))

# Collect h1/.hero-desc plus the first h2 per section[data-section]
# data-section attribute -> site-settings.json key
SECTION_KEY = {'whyJhalar':'why','collection':'collection','customOrders':'customOrders',
               'about':'about','faq':'faq','contact':'contact'}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.section=None; self.capture=None; self.buf=[]
        self.found={}; self.hero_done=False
        self.hero_desc_done=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='section': self.section=a.get('data-section')
        if tag=='h1' and self.section=='hero' and not self.hero_done:
            self.capture=('h1',); self.buf=[]; self.hero_done=True
        if tag=='p' and 'hero-desc' in a.get('class','').split() and not self.hero_desc_done:
            self.capture=('p',); self.buf=[]; self.hero_desc_done=True
        if tag=='h2' and self.section in SECTION_KEY:
            key=SECTION_KEY[self.section]
            if key not in self.found:
                self.capture=('h2',key); self.buf=[]
    def handle_data(self,d):
        if self.capture: self.buf.append(d)
    def handle_endtag(self, tag):
        if self.capture:
            cap=self.capture
            if (cap[0]=='h1' and tag=='h1') or (cap[0]=='p' and tag=='p') or (cap[0]=='h2' and tag=='h2'):
                txt=' '.join(''.join(self.buf).split())
                if cap[0]=='h1': self.found['heroHeadline']=txt
                elif cap[0]=='p': self.found['heroIntro']=txt
                else: self.found[cap[1]+'.title']=txt
                self.capture=None; self.buf=[]

p=P(); p.feed(raw)
sc=settings.get('sectionCopy',{})
expect={'heroHeadline': settings.get('heroHeadline',''),
        'heroIntro': settings.get('heroIntro','')}
for key in ('why','collection','customOrders','about','faq','contact'):
    expect[key+'.title']=(sc.get(key) or {}).get('title','')

bad=0
for k,v in expect.items():
    got=p.found.get(k,'')
    if got!=v:
        print('FAIL: drift on %s\n    index.html  : %r\n    site-settings: %r' % (k,got,v))
        bad=1
sys.exit(bad)
PYEOF
}
if drift_check; then :; else FAIL=1; fi

# --- 7. controlled product naming --------------------------------------------
if ! node scripts/product-naming.js; then fail "product naming checks failed"; fi

# --- summary -----------------------------------------------------------------
if [ "$FAIL" -eq 0 ]; then
  note "VALIDATE PASS — copy, tokens, theme files and naming structure checks passed (pending reviews are not approvals)."
  exit 0
fi
note "VALIDATE FAIL — fix the issues above before merging to main."
exit 1
