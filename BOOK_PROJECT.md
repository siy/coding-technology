# JBCT Book Project Tracking

**Working Title:** Java Backend Coding Technology: Unified Code Through Functional Composition

**Goal:** Popularize JBCT methodology by reaching wider audience through book format

**Target Audience:** Mix of Java developers new to functional patterns, teams adopting JBCT, architects evaluating methodology

**Differentiator:** FP is a tool, not the focus. The goal is code unification - making code as unified as possible across teams and AI collaboration.

---

## Book Structure

```
PART I: FOUNDATIONS
  1. Introduction: Code Unification
  2. The Four Return Types
  3. Pragmatica Lite Essentials

PART II: CORE PRINCIPLES
  4. Parse, Don't Validate
  5. Error Handling & Composition
  6. Null Policy & Recovery

PART III: PATTERNS
  7. Basic Patterns (Leaf, Condition, Iteration)
  8. Advanced Patterns (Sequencer, Fork-Join, Aspects)
  9. Thread Safety & Immutability

PART IV: TESTING
  10. Testing Philosophy
  11. Testing in Practice

PART V: PRODUCTION SYSTEMS
  12. Complete Example: RegisterUser
  13. Complete Example: PlaceOrder
  14. Focused Examples: PublishArticle & TransferFunds
  15. Project Structure & Frameworks

PART VI: ADOPTION
  16. Systematic Application (Checkpoints)
  17. Migration Strategies
  18. Comparison with Other Approaches
  19. Troubleshooting & FAQ

APPENDICES
  A. Pragmatica Lite API Reference
  B. Exercise Solutions
  C. Glossary
  D. Quick Reference Cards
```

**19 chapters + 4 appendices**

---

## Content Sources

| Book Chapter | Source | Status |
|--------------|--------|--------|
| Ch 1: Introduction | Part 1 | Adapt |
| Ch 2: Four Return Types | Part 2 | Adapt |
| Ch 3: Pragmatica Lite | CLAUDE.md + new | Write |
| Ch 4: Parse Don't Validate | Part 3 | Adapt |
| Ch 5: Error Handling | Part 4 (first half) | Adapt |
| Ch 6: Null Policy & Recovery | Part 4 (second half) | Adapt |
| Ch 7: Basic Patterns | Part 5 | Adapt |
| Ch 8: Advanced Patterns | Part 6 | Adapt |
| Ch 9: Thread Safety | Part 6 (thread safety) + new | Expand |
| Ch 10: Testing Philosophy | Part 7 | Adapt |
| Ch 11: Testing in Practice | Part 8 | Adapt |
| Ch 12: RegisterUser | Part 9 | Adapt |
| Ch 13: PlaceOrder | New | Write |
| Ch 14: PublishArticle & TransferFunds | New | Write |
| Ch 15: Project Structure | Part 9 (structure) | Adapt |
| Ch 16: Systematic Application | Part 10 | Adapt |
| Ch 17: Migration Strategies | New | Write |
| Ch 18: Comparison | New | Write |
| Ch 19: Troubleshooting | New (from scattered) | Write |
| Appendix A: API Reference | CLAUDE.md | Adapt |
| Appendix B: Solutions | New | Write |
| Appendix C: Glossary | New | Write |
| Appendix D: Quick Reference | Part 1 tables | Adapt |

---

## Task Breakdown

### Phase 1: New Examples (2.5 weeks)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 1.1 PlaceOrder complete example | 1.5 weeks | Done | E-commerce domain |
| 1.2 PublishArticle focused example | 0.5 weeks | Done | Content domain, Condition pattern |
| 1.3 TransferFunds focused example | 0.5 weeks | Done | Financial domain, Aspects |

### Phase 2: New Chapters (3.5 weeks)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 2.1 Ch 3: Pragmatica Lite Essentials | 0.5 weeks | Done | Library philosophy, not full reference |
| 2.2 Ch 17: Migration Strategies | 1 week | Done | Phase-by-phase playbook |
| 2.3 Ch 18: Comparison | 1 week | Done | vs Clean/Hexagonal/ROP/vavr |
| 2.4 Ch 19: Troubleshooting & FAQ | 1 week | Done | Consolidate common mistakes |

### Phase 3: Exercises (2 weeks)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 3.1 Design exercise template | 1 day | Done | Format, difficulty levels |
| 3.2 Part I exercises (Ch 1-3) | 2 days | Done | 5 exercises |
| 3.3 Part II exercises (Ch 4-6) | 2 days | Done | 5 exercises |
| 3.4 Part III exercises (Ch 7-9) | 2 days | Done | 5 exercises |
| 3.5 Part IV exercises (Ch 10-11) | 1 day | Done | 3 exercises |
| 3.6 Part V exercises (Ch 12-15) | 2 days | Done | 3 exercises |
| 3.7 Part VI exercises (Ch 16-19) | 1 day | Done | 3 exercises |
| 3.8 Appendix B: Solutions | 2 days | Done | All solutions included |

### Phase 4: Diagrams (1 week)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 4.1 Pattern flow diagrams | 2 days | Done | Sequencer, Fork-Join, Aspects, Condition, Iteration, Leaf |
| 4.2 Architecture diagrams | 1 day | Done | Zones, package structure, use case structure |
| 4.3 Type transformation diagrams | 1 day | Done | Option → Result → Promise |
| 4.4 Decision trees | 1 day | Done | Return type, pattern selection |

### Phase 5: Supporting Content (1 week)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 5.1 Appendix C: Glossary | 2 days | Done | 50+ terms defined |
| 5.2 Appendix D: Quick Reference | 1 day | Done | 12 reference cards |
| 5.3 Chapter summaries | 2 days | Done | Key takeaways for all 19 chapters |

### Phase 6: Restructuring (1 week)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 6.1 Split/merge existing content | 3 days | Done | Created restructuring-map.md, all chapters adapted |
| 6.2 Consistent voice/style | 2 days | Done | Book-style chapter structure |
| 6.3 Cross-references | 1 day | Done | All internal links updated |

### Phase 7: Editorial (2 weeks)

| Task | Effort | Status | Notes |
|------|--------|--------|-------|
| 7.1 Technical review | 1 week | Done | All chapters verified |
| 7.2 Copy editing | 1 week | Done | Grammar, clarity, flow |

---

## Effort Summary

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1: New Examples | 2.5 weeks | Done |
| Phase 2: New Chapters | 3.5 weeks | Done |
| Phase 3: Exercises | 2 weeks | Done |
| Phase 4: Diagrams | 1 week | Done |
| Phase 5: Supporting Content | 1 week | Done |
| Phase 6: Restructuring | 1 week | Done |
| Phase 7: Editorial | 2 weeks | Done |
| **Total** | **13 weeks** | |

---

## Publishing Strategy

**Parallel tracks:**

1. **Free online** - Keep pragmatica.dev updated with book content
2. **Leanpub** - Early access, iterate based on feedback
3. **Traditional publisher** - Submit proposal to Manning (best fit for deep technical content)

---

## Progress Log

| Date | Task | Notes |
|------|------|-------|
| 2025-12-07 | Project created | Initial tracking document |
| 2025-12-07 | Ch 13: PlaceOrder | Complete example with compensation pattern |
| 2025-12-07 | Ch 14a: PublishArticle | Focused example - Condition pattern |
| 2025-12-07 | Ch 14b: TransferFunds | Focused example - Aspects pattern |
| 2025-12-07 | Ch 3: Pragmatica Lite Essentials | Library philosophy, four types, operations |
| 2025-12-07 | Ch 17: Migration Strategies | 4-phase playbook, team adoption strategies |
| 2025-12-07 | Ch 18: Comparison | Layered, Hexagonal, Clean, ROP, vavr, Arrow-kt |
| 2025-12-07 | Ch 19: Troubleshooting & FAQ | Debugging, common mistakes, IDE setup |
| 2025-12-07 | Appendix B: Exercises | 24 exercises with solutions, 3 difficulty levels |
| 2025-12-07 | Diagrams | 12 Mermaid diagrams - patterns, architecture, types |
| 2025-12-07 | Appendix C: Glossary | 50+ terms defined |
| 2025-12-07 | Appendix D: Quick Reference | 12 reference cards |
| 2025-12-07 | Chapter summaries | Key takeaways for all 19 chapters |
| 2025-12-07 | Phase 6 restructuring | All 19 chapters + 4 appendices adapted to book format |
| 2025-12-07 | restructuring-map.md | Document mapping series parts to book chapters |
| 2025-12-07 | Appendix A: API Reference | Extracted from CLAUDE.md |
| 2025-12-08 | Phase 7.1 Technical review | All 19 chapters + 4 appendices verified |
| 2025-12-08 | TABLE_OF_CONTENTS.md | Master index with reading paths |
| 2025-12-08 | Code examples repo | https://github.com/siy/jbct-book-examples |
| 2025-12-09 | Phase 7.2 Copy editing | All chapters reviewed for grammar/clarity |
| | | |

---

## Decisions

1. **Cover design:** B/W graphics, chaos → harmony theme
2. **Code repository:** https://github.com/siy/jbct-book-examples
3. **Print format:** 7x10 (standard for technical books with code)

---

## Notes

- Mermaid for all diagrams
- Simple verification exercises (not mini-projects)
- Three example domains: E-commerce, Content, Financial
- FP is tool, unification is goal
