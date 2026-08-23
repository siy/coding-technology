#!/usr/bin/env python3
"""Run 1 convergence metric.

WRITTEN BEFORE ANY IMPLEMENTATION WAS INSPECTED. Metric exactly as pre-registered in
book-pfd-meta/CONVERGENCE-PREDICTIONS.md:

  - shape histogram per implementation, as PROPORTIONS
  - within-arm convergence = mean pairwise similarity over the 6 pairs in an arm of 4,
    where distance = summed absolute difference over the eight shape proportions and
    similarity = 100 - distance
  - method-name overlap = mean pairwise Jaccard over declared method names
"""
import json, re, subprocess, sys, itertools, os

SHAPES = ["LEAF", "SEQUENCER", "FORK_JOIN", "CONDITION",
          "ITERATION", "ASPECT", "MIXED", "UNCLASSIFIED"]

NOT_METHODS = {"if", "for", "while", "switch", "catch", "return", "new", "synchronized",
               "do", "else", "try", "record", "class", "interface", "enum", "super",
               "this", "throw", "assert", "yield", "instanceof"}

DECL = re.compile(
    r'^\s*(?:@\w+\s+)*(?:public|private|protected|static|final|default|abstract|native|synchronized|\s)*'
    r'[\w.$<>\[\],?\s]+?\s+(\w+)\s*\([^;{]*\)\s*(?:throws [\w.,\s]+)?\s*[{;]',
    re.M)

def census(path):
    out = subprocess.run(["jbct", "shape-census", path, "-f", "json"],
                         capture_output=True, text=True, timeout=900).stdout
    m = re.search(r'\{.*\}', out, re.S)
    if not m:
        return None
    d = json.loads(m.group(0))
    tot = d.get("totalMethods", 0)
    if not tot:
        return None
    h = d.get("histogram", {})
    return {"total": tot, "files": d.get("filesParsed", 0),
            "prop": {k: 100.0 * h.get(k, 0) / tot for k in SHAPES},
            "raw": {k: h.get(k, 0) for k in SHAPES}}

def method_names(root):
    names = set()
    for dirpath, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(".java"):
                continue
            src = open(os.path.join(dirpath, fn), encoding="utf-8", errors="ignore").read()
            for m in DECL.finditer(src):
                n = m.group(1)
                if n not in NOT_METHODS and not n[0].isupper():
                    names.add(n)
    return names

def hist_similarity(a, b):
    return 100.0 - sum(abs(a["prop"][k] - b["prop"][k]) for k in SHAPES)

def jaccard(a, b):
    return 100.0 * len(a & b) / len(a | b) if (a | b) else 0.0

def arm(base, ids):
    rows = {}
    for i in ids:
        p = os.path.join(base, i)
        c = census(p)
        if c is None:
            print(f"  !! {i}: no data (agent produced nothing parseable)")
            continue
        rows[i] = {"census": c, "names": method_names(p)}
    return rows

def report(label, rows):
    print(f"\n=== {label}  (n={len(rows)}) ===")
    for i, r in sorted(rows.items()):
        c = r["census"]
        top = "  ".join(f"{k[:4]} {c['prop'][k]:5.1f}%" for k in
                        ["LEAF", "SEQUENCER", "CONDITION", "MIXED", "UNCLASSIFIED"])
        print(f"  {i}: {c['total']:4d} methods, {c['files']:2d} files, {len(r['names']):3d} names | {top}")
    ids = sorted(rows)
    hs = [hist_similarity(rows[a]["census"], rows[b]["census"]) for a, b in itertools.combinations(ids, 2)]
    js = [jaccard(rows[a]["names"], rows[b]["names"]) for a, b in itertools.combinations(ids, 2)]
    if hs:
        print(f"  -> shape convergence : {sum(hs)/len(hs):6.2f}  (pairs: {', '.join(f'{x:.1f}' for x in hs)})")
        print(f"  -> name overlap      : {sum(js)/len(js):6.2f}%  (pairs: {', '.join(f'{x:.1f}' for x in js)})")
    return (sum(hs)/len(hs) if hs else None), (sum(js)/len(js) if js else None)

if __name__ == "__main__":
    base = sys.argv[1]
    t = arm(base, ["t1", "t2", "t3", "t4"])
    c = arm(base, ["c1", "c2", "c3", "c4"])
    th, tj = report("TREATMENT (JBCT)", t)
    ch, cj = report("CONTROL (idiomatic Java)", c)
    print("\n=== VERDICT ===")
    if th is not None and ch is not None:
        print(f"  P1 shape convergence: treatment {th:.2f} vs control {ch:.2f}"
              f"  -> {'HIT' if th > ch else 'MISS'} (margin {th-ch:+.2f})")
        print(f"  P2 name overlap     : treatment {tj:.2f}% vs control {cj:.2f}%"
              f"  -> {'HIT' if tj > cj else 'MISS'} (margin {tj-cj:+.2f})")
    seq_t = [rows["census"]["prop"]["SEQUENCER"] for rows in t.values()]
    seq_c = [rows["census"]["prop"]["SEQUENCER"] for rows in c.values()]
    print(f"  P3 SEQUENCER treatment: {['%.1f%%' % s for s in seq_t]}")
    print(f"  P3 SEQUENCER control  : {['%.1f%%' % s for s in seq_c]}")
