# API Surface

## Route Handlers

### Public pages
- `/`
- `/pricing`
- `/blog`
- `/blog/$slug`
- `/explore`
- `/explore/$slug`
- `/learn`
- `/learn/`
- `/learn/$slug`
- `/privacy`
- `/terms`
- `/refunds`

### Auth and account pages
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`

### Authenticated product pages
- `/_authenticated/dashboard`
- `/_authenticated/review`
- `/_authenticated/practice`
- `/_authenticated/billing`
- `/_authenticated/settings`
- `/_authenticated/settings/export`
- `/_authenticated/submission/$submissionId`

### Admin pages
- `/_authenticated/admin/dashboard`
- `/_authenticated/admin/blog`
- `/_authenticated/admin/curriculum`
- `/_authenticated/admin/export`
- `/_authenticated/admin/research`
- `/_authenticated/admin/seats`
- `/_authenticated/admin/settings`
- `/_authenticated/admin/update-price`

### Utility and API-like routes
- `/health`
- `/s/$submissionId`
- `/sitemap.xml`
- `/api/public/og/$submissionId`
- `/api/public/payments/webhook`

## Server Function Modules

### Review and learning
- `reviewCode`
- `getSubmission`
- `getPublicSubmission`
- `generatePractice`
- `listPractice`
- `getDueReviews`
- `getDashboard`
- `getTopicBySlug`

### Billing and entitlements
- `resolvePaddlePrice`
- `cancelSubscription`
- `getCustomerPortalUrl`
- `updateProYearlyPrice`
- `getEntitlements`

### Account and consent
- `updateDisplayName`
- `getProfile`
- `deleteAccount`
- `updateProfileAvatar`
- `getUserConsent`
- `setUserConsent`
- `recordResearchEvent`
- `exportResearchData`

### Admin and content
- `getAdminDashboard`
- `getAdminSeats`
- `grantAdminRole`
- `revokeAdminRole`
- `exportAllUserData`
- `getCurriculumMappings`
- `upsertCurriculumMapping`
- `getAppConfig`
- `setAppConfig`
- `getAllBlogPosts`
- `getBlogPostBySlug`
- `listAllBlogPostsAdmin`
- `createBlogPost`
- `updateBlogPost`
- `deleteBlogPost`

## Auth Pattern
- Route shell auth happens in `src/routes/_authenticated/route.tsx`.
- Server function auth happens through `requireSupabaseAuth` middleware.
- Public share and webhook paths bypass user auth intentionally.
