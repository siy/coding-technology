#!/bin/bash
# Aggregate `jbct shape-census` across all src/main/java roots of a repo.
repo=$1
tmp=$(mktemp)
while IFS= read -r d; do
  jbct shape-census "$d" -f json 2>/dev/null >> "$tmp"
done < <(find "$repo" -type d -path '*/src/main/java')
python3 - "$repo" "$tmp" <<'PY'
import sys, json, re
repo, path = sys.argv[1], sys.argv[2]
txt = open(path).read()
objs = re.findall(r'\{.*?\n\}', txt, re.S)
H = {}; tot = files = errs = 0
for o in objs:
    try: d = json.loads(o)
    except Exception: continue
    tot += d.get("totalMethods", 0); files += d.get("filesParsed", 0); errs += d.get("parseErrors", 0)
    for k, v in d.get("histogram", {}).items(): H[k] = H.get(k, 0) + v
if not tot:
    print(f"{repo}: NO DATA"); sys.exit()
mixed = H.get("MIXED", 0); unc = H.get("UNCLASSIFIED", 0)
print(f"{repo}: methods={tot} files={files} parseErrors={errs}")
for k in ["LEAF","SEQUENCER","FORK_JOIN","CONDITION","ITERATION","ASPECT","MIXED","UNCLASSIFIED"]:
    v = H.get(k, 0); print(f"    {k:13s} {v:6d}  {v/tot:6.2%}")
print(f"    -> MIXED {mixed/tot:.3%} | residual {(mixed+unc)/tot:.2%} | LEAF {H.get('LEAF',0)/tot:.2%}")
PY
rm -f "$tmp"
