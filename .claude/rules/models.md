# Data Models

## Source of Truth
- Generated TypeScript types live in `src/integrations/supabase/types.ts`.
- Schema history lives in `supabase/migrations/`.

## Primary Tables
- `profiles` - user profile and avatar metadata
- `submissions` - reviewed code submissions
- `review_issues` - concept-tagged issues per submission
- `progress` - FSRS-style mastery tracking per topic
- `topics` - topic catalog and learning metadata
- `practice_problems` - generated practice prompts and starter code
- `subscriptions` - Paddle subscription state per environment
- `usage_counters` - quota counters by user, kind, and period key
- `app_config` - configurable plan quotas and app settings
- `user_roles` - admin role assignment
- `curriculum_mappings` - topic mapping to SPPU and NPTEL curriculum
- `blog_posts` - CMS-like blog storage
- `user_consent` - research consent version and timestamp
- `research_events` - research telemetry payloads
- `webhook_events` - processed webhook event ids and types

## Important Relationships
- `review_issues.submission_id -> submissions.id`
- `progress.topic_slug -> topics.slug`
- `practice_problems.topic_slug -> topics.slug`

## Database Functions
- `consume_quota(p_user_id, p_kind, p_limit, p_period_key)` - atomic quota consumption
- `get_usage(p_user_id, p_kind, p_period_key)` - current quota usage
- `has_active_subscription(user_uuid, check_env)` - subscription check
- `has_role(p_user_id, p_role)` - role check

## Model Notes
- Most user-scoped data is protected by RLS.
- `supabaseAdmin` is used in trusted server-only flows and webhook handling.
- Subscription state is environment-aware, so sandbox and live billing can coexist.
