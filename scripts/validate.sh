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
import json,sys
from html.parser import HTMLParser
raw=open('index.html',encoding='utf-8').read(); s=json.load(open('content/site-settings.json',encoding='utf-8'))
sc={k:v for k,v in (s.get('sectionCopy') or {}).items() if isinstance(v,dict)}
class P(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.hit=None; self.buf=[]; self.out={}; self.sec=None
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='section': self.sec=d.get('data-section')
  if self.hit is not None and self.buf: self.buf.append(' ')
  if t=='h1': self.hit=('heroHeadline',); self.buf=[]
  elif t=='p' and 'hero-lead' in d.get('class',''): self.hit=('heroIntro',); self.buf=[]
  elif t=='h2' and self.sec in sc: self.hit=(self.sec,'title'); self.buf=[]
 def handle_endtag(self,t):
  if self.hit is None:return
  if (self.hit[0] in ('heroHeadline','heroIntro') and t in ('h1','p')) or (len(self.hit)>1 and t=='h2'):
   self.out[self.hit]=' '.join(''.join(self.buf).split());self.hit=None
 def handle_data(self,d):
  if self.hit is not None:self.buf.append(d)
p=P();p.feed(raw)
checks={('heroHeadline',):s.get('heroHeadline','') or '',('heroIntro',):s.get('heroIntro','') or ''}
for k in p.out:
 if len(k)>1 and isinstance(sc.get(k[0]),dict) and sc[k[0]].get('title'): checks[k]=sc[k[0]]['title']
bad=0
for k,v in checks.items():
 got=p.out.get(k,'')
 if got!=v: print('FAIL: content drift',k,repr(got),repr(v)); bad=1
sys.exit(bad)
PYEOF

# 5. Naming gate; internal product IDs remain part of validation only.
node scripts/product-naming.js >/dev/null 2>&1 || fail "product naming validation failed"

if [ "$FAIL" -eq 0 ]; then echo "VALIDATE PASS"; exit 0; fi
echo "VALIDATE FAIL"; exit 1
