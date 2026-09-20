#!/usr/bin/env python3
from pathlib import Path
import re, sys, hashlib, json
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
errors=[]; warnings=[]
index=root/'index.html'
if not index.exists(): errors.append('missing index.html')
else:
    html=index.read_text(encoding='utf-8')
    ids=re.findall(r'\bid=["\']([^"\']+)["\']',html)
    dups=sorted({x for x in ids if ids.count(x)>1})
    if dups: errors.append('duplicate HTML ids: '+', '.join(dups[:20]))
    for rel in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',html):
        if rel.startswith(('http://','https://','data:','#','mailto:','javascript:')): continue
        path=(root/rel.split('?',1)[0].lstrip('./'))
        if not path.exists(): errors.append('missing asset: '+rel)
required=['sw.js','manifest.webmanifest','assets/js/security-core-v40.26.0.js','assets/js/sync-delta-v40.27.0.js','assets/js/performance-v40.28.0.js','assets/js/ux-pro-v40.29.0.js','assets/js/quality-gate-v40.30.0.js']
for rel in required:
    if not (root/rel).exists(): errors.append('missing required file: '+rel)
js=list((root/'assets/js').glob('*.js'))
if not js: errors.append('no javascript files')
manifest=[]
for p in sorted(root.rglob('*')):
    if p.is_file() and '.git' not in p.parts and p.name!='release-manifest.json':
        manifest.append({'path':str(p.relative_to(root)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
print('Math12 Hub v40.30 static verification')
print('files:',len(manifest),'size:',sum(x['bytes'] for x in manifest))
if warnings:
    for x in warnings: print('WARN:',x)
if errors:
    for x in errors: print('FAIL:',x)
    sys.exit(1)
print('PASS')
