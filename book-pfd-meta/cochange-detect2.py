#!/usr/bin/env python3
"""Restructure detector v2 -- directory-membership change, not git rename heuristics.

A file is 'moved' between two tree snapshots if its basename is unique in both
snapshots and its parent directory differs. This catches restructures that git
rename detection misses entirely: files rewritten as they moved, or removed and
re-added. Non-domain paths (tests, docs, CI, tooling) are filtered before
detection, because the study criteria exclude those restructures anyway.
"""
import subprocess, sys, datetime
from collections import defaultdict, Counter

EXCL = ("test", "tests", "testing", "doc", "docs", "documentation", ".github",
        "ci", "examples", "example", "benchmarks", "benchmark", "tools", "tool",
        "scripts", "script", "maint", "hacking", "build_tools", "dev", "devel",
        "spec", "specs", "features", "demos", "demo", "sandbox", "bin")
SRC_EXT = (".py", ".java", ".rb", ".php", ".js", ".ts", ".go", ".rs", ".c",
           ".cpp", ".h", ".hpp", ".cs", ".scala", ".kt")

def git(repo, *a, timeout=1800):
    r = subprocess.run(["git", "-C", repo] + list(a), capture_output=True,
                       text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(a)[:60]} -> {r.stderr.strip()[:150]}")
    return r.stdout

def is_domain(path):
    parts = path.split("/")
    if not path.endswith(SRC_EXT):
        return False
    for seg in parts[:-1]:
        if seg.lower() in EXCL:
            return False
    if parts[-1].lower().startswith(("test_", "conftest")):
        return False
    return True

def snapshot(repo, rev, depth):
    """basename -> dir(depth) for basenames unique in this tree."""
    files = [f for f in git(repo, "ls-tree", "-r", "--name-only", rev).splitlines()
             if is_domain(f)]
    seen = Counter(f.split("/")[-1] for f in files)
    out = {}
    for f in files:
        b = f.split("/")[-1]
        if seen[b] != 1:
            continue
        p = f.split("/")
        out[b] = "/".join(p[:depth]) if len(p) > depth else "/".join(p[:-1]) or "."
    return out, len(files)

def scan(repo, depth=2, every_days=120):
    log = [l.split() for l in git(repo, "log", "--format=%H %ct", "--reverse").splitlines()]
    if len(log) < 400:
        return []
    picks, last = [], 0
    for h, ct in log:
        ct = int(ct)
        if ct - last >= every_days * 86400:
            picks.append((h, ct)); last = ct
    picks.append((log[-1][0], int(log[-1][1])))
    events = []
    prev = None
    for h, ct in picks:
        try:
            snap, nfiles = snapshot(repo, h, depth)
        except Exception:
            continue
        if prev:
            (ph, pct, psnap) = prev
            moves = defaultdict(int)
            for b, d in snap.items():
                pd = psnap.get(b)
                if pd is not None and pd != d:
                    moves[(pd, d)] += 1
            total = sum(moves.values())
            if total >= 20:
                top = sorted(moves.items(), key=lambda kv: -kv[1])[:3]
                events.append({
                    "from": datetime.datetime.utcfromtimestamp(pct).strftime("%Y-%m-%d"),
                    "to": datetime.datetime.utcfromtimestamp(ct).strftime("%Y-%m-%d"),
                    "moved": total, "files": nfiles,
                    "top": [(f"{a} -> {b}", n) for (a, b), n in top]})
        prev = (h, ct, snap)
    return sorted(events, key=lambda e: -e["moved"])

if __name__ == "__main__":
    for repo in sys.argv[1:]:
        try:
            ev = scan(repo)
        except Exception as e:
            print(f"### {repo}  ERROR {e}"); continue
        print(f"### {repo}")
        if not ev:
            print("    no window with >=20 domain-file moves")
        for e in ev[:3]:
            print(f"    {e['moved']:5d} moves  {e['from']} .. {e['to']}  "
                  f"(tree {e['files']} src files)")
            for label, n in e["top"]:
                print(f"          {n:4d}  {label}")
