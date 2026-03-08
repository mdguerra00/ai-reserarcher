

# Auto-Alias + Provisional Auto-Pass: Implementation Plan

## Overview

Create a dynamic alias system with 3 new tables (`entity_aliases`, `alias_cache`, `migration_logs`), integration into `quickEvidenceCheck`, KV cache with pg_cron cleanup, and Admin UI with "Aliases" tab including status filters and soft-delete.

---

## Step 1: SQL Migration

Create migration with:

### Tables

**entity_aliases** - Main alias store with pgvector embedding, pg_trgm GIN index, HNSW vector index, unique constraint on (entity_type, alias_norm) where not deleted. Fields include id, entity_type, canonical_name, alias, alias_norm, confidence, approved, source, needs_review, rejection_reason, created_at, approved_by, approved_at, deleted_at, embedding vector(1536).

RLS:
- SELECT for authenticated users
- ALL for admin via has_role
- ALL for service_role (explicit bypass)

**alias_cache** - KV cache with (term_norm, entity_type) composite PK, result jsonb, cached_at, hit_count. RLS: service_role only. pg_cron job every 10min to clean entries older than 30min.

**migration_logs** - Simple log table (id, message, created_at). RLS: service_role only.

### Seed

Populate ~100+ aliases from:
- metrics_catalog (65 entries with aliases arrays)
- Hardcoded additive aliases (silver_nanoparticles, silica_nanoparticle, bomar, tegdma, udma, bisgma, hals, uv_absorber, antioxidant)
- Hardcoded material aliases (vitality, filtek, charisma, tetric, grandio, z350, z250, brilliant, herculite, clearfil, estelite, ips, ceram, nextdent, keysplint, luxaprint)

All with approved=true, source='legacy_hardcoded', confidence=1.0. Use ON CONFLICT DO NOTHING, log collisions to migration_logs.

---

## Step 2: Edge Function Changes (rag-answer/index.ts)

### 2a. Configurable Constants (top of file)

```
const STRUCTURAL_WEIGHT = 1.0;
const CHUNK_WEIGHT = 0.5;
const CHUNK_EVIDENCE_THRESHOLD = 0.75;
const ALIAS_AUTOPASS_THRESHOLD = 0.80;
const ALIAS_SUGGEST_THRESHOLD = 0.70;
const ALIAS_AMBIGUITY_DELTA = 0.05;
const MAX_UNKNOWN_TERMS_PER_QUERY = 5;
```

### 2b. normalizeTermWithUnits helper

Converts:
- X microns/um -> X*1000 nm
- X Pa.s -> X*1000 mPa.s
- Lowercase + unaccent

Returns { original, normalized, ruleApplied }.

### 2c. suggestAlias function

1. Normalize term
2. Check alias_cache (TTL 30min) - if hit, increment hit_count and return
3. Exact match in entity_aliases (alias_norm = term_norm AND approved AND NOT deleted)
4. If not found, generate embedding via text-embedding-3-small (LOVABLE_API_KEY)
5. Vector search top-3 in entity_aliases
6. Conflict detection: delta top1-top2 < 0.05 -> ambiguous=true
7. Save result to alias_cache (upsert)
8. Limit: max 5 unknown terms per query

### 2d. Gating update in quickEvidenceCheck

For each constraint not found by hardcoded maps:
1. Query entity_aliases for approved exact match
2. If approved match -> strong match
3. If not -> suggestAlias:
   - Provisional auto-pass: score >= 0.80 AND !ambiguous AND textualEvidence=true
   - textualEvidence with explicit weight: title/conditions/metrics = 1.0, chunks = 0.5 (only if score > 0.75)
   - Conflict -> fail-closed reason='ambiguous_alias'
   - Score < 0.80 or no evidence -> fail-closed reason='suggested_alias_pending'
4. Persistence: score >= 0.70 and alias doesn't exist -> upsert entity_aliases with approved=false, source='user_query_suggest'

### 2e. Diagnostics expansion

Add to DiagnosticsInput and buildDiagnostics:
- suggested_aliases array with full details per term
- alias_lookup_latency_ms
- textual_evidence_weight_calculated
- If alias_lookup_latency_ms > 500, add 'alias_lookup_slow' to verification.issue_types

---

## Step 3: Admin UI

### 3a. New AliasApprovalTab component

`src/components/admin/AliasApprovalTab.tsx`:
- Table listing entity_aliases
- Search input by alias_norm or canonical_name (ILIKE)
- Status filter: All / Pending / Approved / Rejected
- Status column with colored badges (green=approved, yellow=pending, red=rejected)
- Actions: Approve, Reject (soft-delete with required rejection_reason), Restore, Edit canonical_name
- Rejection reason column

### 3b. Admin.tsx integration

Add "Aliases" tab with BookText icon to existing tabs.

---

## Files Modified

| File | Change |
|------|--------|
| New SQL migration | 3 tables + indexes + RLS + pg_cron + seed |
| `supabase/functions/rag-answer/index.ts` | normalizeTermWithUnits, suggestAlias, KV cache, gating with entity_aliases, configurable constants, expanded diagnostics |
| `src/pages/Admin.tsx` | New "Aliases" tab |
| `src/components/admin/AliasApprovalTab.tsx` | New component |

## Safety Constraints

1. Auto-pass only with structural evidence (weight 1.0 for title/conditions/metrics; 0.5 for chunks with threshold 0.75)
2. Unit normalization lossless (ruleApplied recorded; no nano/micro reclassification)
3. Canonical conflict blocks auto-pass (delta < 0.05 -> ambiguous_alias)
4. Max 5 unknown terms per query
5. All suggestions enter as approved=false
6. KV cache TTL 30min with pg_cron cleanup + hit_count increment
7. Explicit service role bypass in RLS

