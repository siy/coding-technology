# IVP Claims Map (Yannick Loth, Zenodo) — read-for-citation audit, 2026-07-09/10

Purpose: decide whether the architecture book's References chapter can cite these papers as
corroboration of change-driver cohesion. Method: three parallel full-read audits (papers read
cover to cover, 26 + 88 + 26 pp), graded for what is proved vs asserted. All three are
self-published Zenodo preprints, not peer-reviewed.

## Paper 1: "The Independent Variation Principle" (2026, v1, doi 10.5281/zenodo.20794332, ~28 pp)

- **Claims:** Theorem 4.6.1 (p.16): the Γ-equality partition (group by identical change-driver
  set) is the *unique cost-optimal* partition, by "a counting argument on the incidence graph —
  entirely graph-theoretic, requiring no economics or calibration" (p.1).
- **Actually proves:** the narrow combinatorial lemmas are real and correctly executed (Lemma
  4.3.1 p.14: splitting a Γ-class strictly increases span; Lemma 4.4.1 p.15: co-locating
  different Γ-classes adds contamination cost) — *given* the cost function. The cost function is
  the problem: §3.4 (pp.9–11) "reduces" a five-term cost model to bare module-touch count by
  defining the dropped terms (non-conformance R, governance D, overhead Ω) as vanishing exactly
  at the Γ-equality partition. Circularity dressed as a reduction — the target partition is
  encoded in the definitions that select it.
- **Asserts without proof:** the contamination premise α>0, which the paper itself flags as "an
  empirical claim… the only contingent premise in the entire derivation" (Prop 3.4.1, p.11) —
  directly contradicting the abstract's "no economics" claim; "no cost model that faithfully
  represents change cost assigns zero cost to irrelevant-element verification" (p.11); DDD's
  alignment with Γ-equality being "coincidental, not principled" (p.21); SRP "false as stated"
  (pp.21–22, outsourced to the author's own other Zenodo papers).
- **Key definitions:** incidence graph Def 2.2.1 (p.5); contamination Def 3.2.1 (p.7); scatter
  Def 3.3.1 (p.8); IVP Principle 4.1.1 (p.13): Admissibility, Element Form, Separation,
  Unification.
- **Honest concessions:** uniqueness fails under shared change-drivers / composite elements
  (pp.16–17) — a condition its own worked example exhibits (p.18–19) and real systems (adapters,
  facades) hit constantly. §5.8 admits it never defends *why* change-cost minimization is the
  objective and takes Γ-assignment as given.
- **Rigor grade:** semi-formal, shading into conceptual essay at the load-bearing step. "Proof"
  is earned only for the inner combinatorics, which sit inside a constructed-not-derived cost model.

## Paper 2: "On the Nature of Cohesion" (2026, v2, zenodo 20785752, 88 pp)

- **Claims:** cohesion = "correctness relative to a partitioning rule," reported as
  (purity, completeness) per rule; the Knowledge-Embodiment Theorem "proves they coincide at the
  maximum"; Γ-equivalence is the coarsest partition containing every change in one module; six
  necessary conditions govern admissible cohesion metrics; a 24-metric survey shows existing
  metrics measure coupling, not cohesion.
- **Actually proves:** purity/completeness genuinely formalized (Def 1.3.1 p.15, eqs. 3–4).
  Knowledge-Embodiment Theorem 4.3.1 (pp.37–39): forward direction definitionally trivial
  (substitution once (1,1) ⟺ M=Ci is established); reverse direction requires "no redundant
  embodiment" + "non-empty embodiment" — assumptions §4.6 (pp.44–45) admits exclude caching,
  redundancy, defense-in-depth, dead code, i.e. large swaths of real systems. The primitive
  Emb(e) is explicitly non-computable — "a modeling choice, not an empirical discovery" (Def
  4.1.5, p.33) — which collides with the paper's own Condition 2 (Computability, p.62: "a metric
  that requires human judgment… is not a metric").
- **Cohesion↔coupling "equivalence":** what's proven is a near-tautological arithmetic identity
  for a fixed dependency graph (Prop 2.1.1, p.18: Coupling(M) = |R| − InternalDeps(M)), scoped
  by the paper itself to the internal-dependency-density metric family (pp.19–20). The universal
  equivalence in Loth's public gloss is NOT established here.
- **The 24-metric survey:** not in this paper — deferred to another self-published Loth preprint
  ([3]). Metric names cited in passing are real (LCOM family, TCC/LCC…), but the survey claim is
  unverifiable from this text. The SRP dismissal likewise rests on the author's own preprint [7].
- **Asserts without proof:** paradigm generality (Appendix B, pp.77–82 — conceded sketches);
  engineering benefits ("an empirical question the theorem does not settle," p.41); the
  Γ-coarsest claim is prose-only (p.52) and relative to an admittedly arbitrary change-driver
  individuation granularity (p.32).
- **Rigor grade:** semi-formal; valid derivations from stipulated axioms; zero empirical content
  (no code, no case study, no measurement).

## Paper 3: "Causal Cohesion" (2026, zenodo 20785881, 26 pp)

- **Claims:** instantiates paper 2's schema under change-driver identity; the metric satisfies
  all six conditions; operational computation procedure.
- **Actually proves:** purity(M)=1/|A(M)| (eq.7, p.8), completeness = min |M∩[A]|/|[A]| (eq.8,
  p.8) — computable *given* Γ(e); how to obtain Γ(e) is explicitly punted ("beyond the scope,"
  p.20 — the empirically hard part of the whole theory). The formula was chosen to satisfy the
  six conditions, then verified against them (p.6): built-to-spec, checked-against-spec.
- **Red flags:** Def 2.1.1 (pp.4–5) asserts a principle's partition "provably minimizes
  change-propagation cost" — the "provably" is never proven or referenced anywhere in the paper.
  The reference list contains exactly ONE item: the author's own paper 2. The apparatus is
  structurally the purity/homogeneity metrics of clustering evaluation, relabeled, with no
  citation of that literature.
- **Important negative finding:** the "gaps must be filled at knowledge level, not software
  level" claim (Loth's DM, 2026-07-09) appears NOWHERE in this paper (read twice for it) — nor
  in the other two. It is his conversational synthesis, not citable to these texts.
- **Rigor grade:** semi-formal, self-referential; a small, correct, unsurprising algebra
  exercise wholly dependent on paper 2.

## Convergence / conflict with PFD

- **Genuine convergence, at the level of the idea:** change drivers as the partition key;
  cohesion tested by purity + completeness (the same two words PFD's cohesion test uses);
  Parnas cited as the shared ancestor (paper 1 fairly positions itself as sharpening Parnas's
  undefined "likely to change" for *known* drivers; paper 2 ties its four properties to Parnas's
  claimed benefits, p.41). Loth's gloss "IVP modules = partition derived from change-driver
  structure" accurately describes what the papers formalize.
- **Not independent corroboration in the scholarly sense:** the three papers are a closed,
  self-citing cluster; **Löwy and volatility-based decomposition are cited nowhere** in any of
  the three reference lists; every load-bearing external support is another Loth preprint. No
  empirical content anywhere.
- **Double edge of the missing Löwy citation:** it weakens the papers as scholarship but
  *strengthens* the convergence story — Loth arrived at change-driver partitioning without the
  volatility-decomposition lineage. Independent arrival is real; independent *validation* is not.
- **The equivalences from his DM** (cohesion↔coupling, cohesion↔knowledge-embodiment): the first
  is a scoped arithmetic identity, the second a theorem whose reverse direction excludes
  redundancy-bearing real systems and whose primitive is hand-assigned. Neither supports the
  universal phrasing.

## Citation verdicts

- **Paper 1 (IVP):** CITE-WITH-CAVEAT — as an *independent formalization attempt* of the same
  principle, explicitly not as proof. If cited, the honest sentence is: "Loth reaches the same
  partition rule from a cost-counting argument (self-published; the cost model presupposes its
  conclusion, as the paper's own contingent-premise admission shows)." Never cite Theorem 4.6.1
  as establishing optimality.
- **Paper 2 (Nature of Cohesion):** CITE-WITH-CAVEAT — as compatible formal vocabulary
  (purity/completeness, change-driver partitioning). Do not cite the Knowledge-Embodiment
  Theorem or the 24-metric survey (the latter isn't in this paper).
- **Paper 3 (Causal Cohesion):** DON'T-CITE — adds nothing citable beyond paper 2, on which it
  wholly depends; one-item self-reference list would embarrass the References chapter.
- **Aggregate recommendation:** one citation at most, framed as *convergent independent
  formulation* (the Quiet Consensus pattern — he got there without Löwy), never as mathematical
  validation of change-driver cohesion. The book's evidence remains its own derivations. His DM
  insights ("gaps filled at knowledge level"; "design patterns are institutionalized
  gap-filling") are conversation, not citable to these papers.
- **DECIDED (user, 2026-07-10): no formal citations at all.** Mention Loth/IVP in prose as an
  independent formulation of the same partitioning idea; nothing in the References chapter
  points at the Zenodo papers. Closes the "cited-not-read blocks References" prep item.

## Quotables (verbatim)

1. "elements with the same change-drivers belong together; elements with different
   change-drivers belong apart" — paper 1, p.1.
2. "the only contingent premise in the entire derivation" — paper 1, Prop 3.4.1, p.11 (the
   admission that undercuts "no economics").
3. Cohesion is "correctness relative to a partitioning rule" — paper 2, p.1.
4. Embodiment is "a modeling choice, not an empirical discovery" — paper 2, Def 4.1.5, p.33.
5. "Whether the engineering benefits themselves follow is an empirical question the theorem
   does not settle" — paper 2, p.41.
