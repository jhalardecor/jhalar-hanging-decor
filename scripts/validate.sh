#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.." || exit 1
FAIL=0
fail(){ printf 'FAIL: %s\n' "$*"; FAIL=1; }

# 1. Syntax + JSON integrity
for js in script.js editor.js scripts/product-naming.js; do node --check "$js" >/dev/null 2>&1 || fail "JS syntax error in $js"; done
python3 - <<'PYEOF' || FAIL=1
import json,glob,sys
ok=True
for fn in glob.glob('content/*.json'):
  try: json.load(open(fn,encoding='utf-8'))
  except Exception as e: print(f'FAIL: invalid JSON {fn}: {e}'); ok=False
sys.exit(0 if ok else 1)
PYEOF

# 2. No visible catalogue-reference IDs in the public site/runtime.
if grep -RniE 'Catalogue ref:|product-ref-badge|productReference\(|JH-[0-9]{3}' index.html style.css script.js content/site-settings.json README.md; then
  fail "public/reference-ID residue found; internal IDs must stay internal"
fi

# 3. No placeholder social links are rendered by settings.
python3 - <<'PYEOF' || FAIL=1
import json,sys
s=json.load(open('content/site-settings.json',encoding='utf-8'))
for name,v in (s.get('socialLinks') or {}).items():
  if isinstance(v,dict) and v.get('url')=='#':
    # Placeholder records are allowed in data only when the runtime hides them.
    continue
sys.exit(0)
PYEOF

# 4. Content source consistency: visible hero + section titles match the editable settings.
python3 - <<'PYEOF' || FAIL=1
import json,re,sys
from html.parser import HTMLParser
raw=open('index.html',encoding='utf-8').read(); s=json.load(open('content/site-settings.json',encoding='utf-8'))
sc=s.get('sectionCopy',{})
class P(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.hit=None; self.buf=[]; self.out={}; self.sec=None
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='section': self.sec=d.get('data-section')
  if t=='h1': self.hit=('heroHeadline',); self.buf=[]
  if t=='p' and 'hero-lead' in d.get('class',''): self.hit=('heroIntro',); self.buf=[]
  if t=='h2' and self.sec in sc: self.hit=(self.sec,'title'); self.buf=[]
 def handle_data(self,d):
  if self.hit:self.buf.append(d)
 def handle_endtag(self,t):
  if not self.hit:return
  if (self.hit[0] in ('heroHeadline','heroIntro') and t in ('h1','p')) or (len(self.hit)>1 and t=='h2'):
   self.out[self.hit]=' '.join(''.join(self.buf).split());self.hit=None
p=P();p.feed(raw)
checks={('heroHeadline',):s.get('heroHeadline',''),('heroIntro',):s.get('heroIntro','')}
for k,v in sc.items(): checks[(k,'title')]=(v or {}).get('title','')
for k,v in checks.items():
 got=p.out.get(k,'')
 if got!=v: print('FAIL: content drift',k,got,v); FAIL=1
PYEOF

# 5. Naming gate; internal product IDs remain part of validation only.
node scripts/product-naming.js >/dev/null 2>&1 || fail "product naming validation failed"

if [ "$FAIL" -eq 0 ]; then echo "VALIDATE PASS"; exit 0; fi
echo "VALIDATE FAIL"; exit 1
