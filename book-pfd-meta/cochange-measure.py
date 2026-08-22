#!/usr/bin/env python3
"""Run 2 -- co-change validation. Metric exactly as pre-registered in
book-pfd-meta/COCHANGE-VALIDATION-PREDICTIONS.md."""
import subprocess, sys, math, random, json
from collections import defaultdict

def git(repo, *a, timeout=1800):
    r = subprocess.run(["git", "-C", repo] + list(a),
                       capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(a)[:80]} -> {r.stderr.strip()[:200]}")
    return r.stdout

def module(path, depth):
    p = path.split("/")
    return "/".join(p[:depth]) if len(p) > depth else "/".join(p[:-1]) or "."

def analyse(name, repo, since, until, depth, prefixes, pre_n=300, seed=17):
    rnd = random.Random(seed)
    pref = tuple(prefixes)
    keep = lambda f: f.startswith(pref) and not f.endswith((".txt", ".rst", ".md"))

    # ---- rename map introduced by the restructure window ----
    ren = {}
    out = git(repo, "log", "-M", "--diff-filter=R", "--name-status",
              f"--since={since}", f"--until={until}", "--format=%H")
    for line in out.splitlines():
        if line.startswith("R"):
            p = line.split("\t")
            if len(p) >= 3 and keep(p[1]):
                ren[p[1]] = p[2]

    # ---- boundary of the pre-window ----
    base = git(repo, "log", "--format=%H", f"--until={since}", "-1").strip()
    if not base:
        return {"repo": name, "status": "no base commit"}
    post_head = git(repo, "log", "--format=%H", f"--until={until}", "-1").strip()
    alive = set(git(repo, "ls-tree", "-r", "--name-only", post_head).splitlines())

    # ---- co-change over the 300 commits before the restructure ----
    log = git(repo, "log", "--name-only", "--format=C|%H", f"{base}", f"-{pre_n}")
    commits, cur = [], None
    for line in log.splitlines():
        if line.startswith("C|"):
            cur = []
            commits.append(cur)
        elif line.strip() and cur is not None:
            if keep(line.strip()):
                cur.append(line.strip())
    commits = [set(c) for c in commits if 0 < len(c) <= 50]

    nfile = defaultdict(int)
    shared = defaultdict(int)
    for c in commits:
        fs = sorted(c)
        for f in fs:
            nfile[f] += 1
        for a, b in ((x, y) for i, x in enumerate(fs) for y in fs[i + 1:]):
            shared[(a, b)] += 1

    # ---- coupling, restricted to pairs that CROSS a pre-restructure boundary ----
    cross = []
    for (a, b), s in shared.items():
        if nfile[a] < 2 or nfile[b] < 2:
            continue
        ma, mb = module(a, depth), module(b, depth)
        if ma == mb:
            continue                      # endogenous -- discarded by design
        cross.append((s / math.sqrt(nfile[a] * nfile[b]), a, b))
    if len(cross) < 30:
        return {"repo": name, "status": "INCONCLUSIVE", "cross_pairs": len(cross)}

    cross.sort(reverse=True)
    qual = cross[:max(1, len(cross) // 10)]          # top decile

    def post_mod(f):
        g = ren.get(f, f)
        return module(g, depth) if g in alive else None

    def rate(pairs):
        hit = tot = 0
        for _, a, b in pairs:
            pa, pb = post_mod(a), post_mod(b)
            if pa is None or pb is None:
                continue
            tot += 1
            hit += (pa == pb)
        return hit, tot

    qhit, qtot = rate(qual)
    if qtot < 30:
        return {"repo": name, "status": "INCONCLUSIVE", "qualifying_resolved": qtot}

    # ---- base rate: random cross-boundary pairs matched on change count ----
    files = [f for f in nfile if nfile[f] >= 2]
    by_pre = defaultdict(list)
    for f in files:
        by_pre[module(f, depth)].append(f)
    mods = [m for m in by_pre if by_pre[m]]
    ctrl = []
    for _, a, b in qual:
        na, nb = nfile[a], nfile[b]
        for _ in range(400):
            m1, m2 = rnd.sample(mods, 2) if len(mods) > 1 else (None, None)
            if m1 is None:
                break
            x = rnd.choice(by_pre[m1]); y = rnd.choice(by_pre[m2])
            if 0.5 * na <= nfile[x] <= 2 * na and 0.5 * nb <= nfile[y] <= 2 * nb:
                ctrl.append((0, x, y)); break
    bhit, btot = rate(ctrl)

    qr = qhit / qtot if qtot else 0
    br = bhit / btot if btot else 0
    ratio = (qr / br) if br > 0 else float("inf")

    # ---- P3/P4: cadence ----
    def cadence_split(pairs):
        div = [p for p in pairs if max(nfile[p[1]], nfile[p[2]]) >=
               10 * min(nfile[p[1]], nfile[p[2]])]
        con = [p for p in pairs if max(nfile[p[1]], nfile[p[2]]) <
               2 * min(nfile[p[1]], nfile[p[2]])]
        return div, con
    div, con = cadence_split(cross)
    dh, dt = rate(div); ch, ct = rate(con)

    return {"repo": name, "status": "OK", "commits_used": len(commits),
            "cross_pairs": len(cross), "qualifying": qtot,
            "qual_same_module": qhit, "qual_rate": round(qr, 4),
            "base_n": btot, "base_same_module": bhit, "base_rate": round(br, 4),
            "P1_ratio": round(ratio, 3) if ratio != float("inf") else "inf",
            "P3_divergent_n": dt, "P3_same_rate": round(dh / dt, 4) if dt else None,
            "P4_convergent_n": ct, "P4_same_rate": round(ch / ct, 4) if ct else None}

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1]))
    res = [analyse(**c) for c in cfg]
    print(json.dumps(res, indent=2))
