# Book Restructuring Map

This document maps existing series content to book chapters.

---

## Source → Target Mapping

| Book Chapter | Primary Source | Secondary Sources | Action |
|--------------|----------------|-------------------|--------|
| **PART I: FOUNDATIONS** |
| Ch 1: Introduction | series/part-01-foundations.md (lines 1-130) | - | Extract intro sections |
| Ch 2: Four Return Types | series/part-02-four-return-types.md | - | Adapt directly |
| Ch 3: Pragmatica Core | book/ch03-pragmatica-lite-essentials.md | CLAUDE.md API ref | NEW - Done |
| **PART II: CORE PRINCIPLES** |
| Ch 4: Parse Don't Validate | series/part-03-parse-dont-validate.md | - | Adapt directly |
| Ch 5: Error Handling | series/part-04-error-handling.md (first half) | - | Split - error types |
| Ch 6: Null Policy & Recovery | series/part-04-error-handling.md (second half) | - | Split - recovery |
| **PART III: PATTERNS** |
| Ch 7: Basic Patterns | series/part-05-basic-patterns.md | - | Adapt directly |
| Ch 8: Advanced Patterns | series/part-06-advanced-patterns.md (patterns) | - | Extract patterns |
| Ch 9: Thread Safety | series/part-06-advanced-patterns.md (thread safety) | part-01 | Expand |
| **PART IV: TESTING** |
| Ch 10: Testing Philosophy | series/part-07-testing-philosophy.md | - | Adapt directly |
| Ch 11: Testing in Practice | series/part-08-testing-practice.md | - | Adapt directly |
| **PART V: PRODUCTION SYSTEMS** |
| Ch 12: RegisterUser | series/part-09-production-systems.md (RegisterUser) | - | Extract example |
| Ch 13: PlaceOrder | book/ch13-placeorder-example.md | - | NEW - Done |
| Ch 14: PublishArticle & TransferFunds | book/ch14a-publisharticle-example.md, ch14b-transferfunds-example.md | - | NEW - Done |
| Ch 15: Project Structure | series/part-09-production-systems.md (structure) | - | Extract structure |
| **PART VI: ADOPTION** |
| Ch 16: Systematic Application | series/part-10-systematic-application.md | - | Adapt directly |
| Ch 17: Migration Strategies | book/ch17-migration-strategies.md | - | NEW - Done |
| Ch 18: Comparison | book/ch18-comparison.md | - | NEW - Done |
| Ch 19: Troubleshooting | book/ch19-troubleshooting-faq.md | - | NEW - Done |
| **APPENDICES** |
| App A: API Reference | CLAUDE.md | - | Extract API section |
| App B: Exercises | book/appendix-b-exercises.md | - | NEW - Done |
| App C: Glossary | book/appendix-c-glossary.md | - | NEW - Done |
| App D: Quick Reference | book/appendix-d-quick-reference.md | part-01 tables | NEW - Done |

---

## Content Transformation Rules

### Voice/Style Changes

1. **Remove series references:**
   - "In this series" → "In this book"
   - "Part X" → "Chapter X"
   - "Next part" → "Next chapter"
   - Series navigation blocks → Chapter navigation

2. **Update cross-references:**
   - `[Part 3](part-03-xxx.md)` → `[Chapter 4](ch04-parse-dont-validate.md)`
   - Internal links must use book chapter numbers

3. **Consistent terminology:**
   - "JBCT" used consistently (not "this technology")
   - "Pragmatica Core" for library references
   - "Cause" (not "error") for failure types

4. **Add chapter introductions:**
   - Brief "What you'll learn" section
   - Prerequisites from previous chapters
   - Learning objectives (3-5 bullet points)

5. **Add chapter conclusions:**
   - "Key Takeaways" (3-5 points)
   - "Exercises" reference
   - "What's Next" preview

---

## Files to Create

### From part-01-foundations.md:
- `ch01-introduction.md` - Extract intro, "Code in New Era", evaluation framework

### From part-02-four-return-types.md:
- `ch02-four-return-types.md` - Adapt with chapter structure

### From part-03-parse-dont-validate.md:
- `ch04-parse-dont-validate.md` - Adapt with chapter structure

### From part-04-error-handling.md:
- `ch05-error-handling.md` - First half (error types, composition)
- `ch06-null-policy-recovery.md` - Second half (null policy, recovery)

### From part-05-basic-patterns.md:
- `ch07-basic-patterns.md` - Adapt directly

### From part-06-advanced-patterns.md:
- `ch08-advanced-patterns.md` - Extract Sequencer, Fork-Join, Aspects
- `ch09-thread-safety.md` - Extract thread safety, expand

### From part-07-testing-philosophy.md:
- `ch10-testing-philosophy.md` - Adapt directly

### From part-08-testing-practice.md:
- `ch11-testing-practice.md` - Adapt directly

### From part-09-production-systems.md:
- `ch12-registeruser-example.md` - Extract RegisterUser
- `ch15-project-structure.md` - Extract structure sections

### From part-10-systematic-application.md:
- `ch16-systematic-application.md` - Adapt directly

### From CLAUDE.md:
- `appendix-a-api-reference.md` - Extract Pragmatica Core API section

---

## Priority Order for Restructuring

### Phase 6.1: Core Adaptations (High Priority)
1. ch01-introduction.md
2. ch02-four-return-types.md
3. ch04-parse-dont-validate.md
4. ch05-error-handling.md
5. ch06-null-policy-recovery.md

### Phase 6.2: Pattern Chapters (Medium Priority)
6. ch07-basic-patterns.md
7. ch08-advanced-patterns.md
8. ch09-thread-safety.md

### Phase 6.3: Testing & Production (Medium Priority)
9. ch10-testing-philosophy.md
10. ch11-testing-practice.md
11. ch12-registeruser-example.md
12. ch15-project-structure.md

### Phase 6.4: Adoption (Low Priority - already done)
13. ch16-systematic-application.md
14. appendix-a-api-reference.md

---

## Already Complete (NEW content)

- ch03-pragmatica-lite-essentials.md
- ch13-placeorder-example.md
- ch14a-publisharticle-example.md
- ch14b-transferfunds-example.md
- ch17-migration-strategies.md
- ch18-comparison.md
- ch19-troubleshooting-faq.md
- appendix-b-exercises.md
- appendix-c-glossary.md
- appendix-d-quick-reference.md
- chapter-summaries.md
- diagrams.md

---

## Notes

1. Series parts are well-written - minimal content changes needed
2. Main work is restructuring, not rewriting
3. Keep code examples identical - they're correct
4. Add book-style elements (learning objectives, exercises refs)
5. Update all navigation to chapter-based
