Set-Location "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"

# Stage all Phase 1-3 source changes
git add src/components/site-header.tsx
git add src/components/site-footer.tsx
git add src/routes/blog.tsx
git add src/routes/blog.$slug.tsx
git add src/routes/learn.tsx
git add src/routes/explore.tsx
git add src/routes/explore.$slug.tsx
git add src/routes/index.tsx
git add src/routes/learn.$slug.tsx
git add src/routes/pricing.tsx
git add src/routes/privacy.tsx
git add src/routes/terms.tsx
git add src/routes/refunds.tsx
git add src/routes/login.tsx
git add src/routes/sitemap[.]xml.ts
git add src/routes/_authenticated/route.tsx
git add src/routes/_authenticated/dashboard.tsx
git add src/routes/_authenticated/practice.tsx
git add src/routes/_authenticated/submission.$submissionId.tsx
git add src/routes/_authenticated/admin.dashboard.tsx
git add src/routeTree.gen.ts
git add tests/e2e/critical-path.spec.ts

# Build the commit message
$msg = @"
feat: implement low cognitive load IA (phases 1-3)

Phase 1 - Navigation clarity:
- Create shared site-header.tsx with Learn/Blog/Pricing/Sign in/Start free review
- Group footer into Product/Learn/Legal categories
- Rename 'Get started' -> 'Start free review', 'Review' -> 'Review Code'
- Fix corrupted characters (A, dYZ%, emoji)
- Add Admin Research quick link

Phase 2 - Content hubs:
- Add /learn topic index page with DSA category cards
- Add /blog canonical blog index
- Add /blog/$slug canonical blog post route
- /explore and /explore/$slug redirect to /blog (307)
- Update sitemap with new routes
- Add cross-links: home featured topics, blog->learn, learn breadcrumb

Phase 3 - Student workflow:
- Dashboard: 'Next best action' card (submit review/weakest topic/review feedback)
- Dashboard: Knowledge graph collapsed by default, topic mastery full-width
- Practice: 3-step stepper flow (topic -> language -> solve) with power-user escape
- Submission detail: 'What's next?' card with Learn/Practice/Review CTAs
- Fix banned transition-all -> transition-[width]
"@

git commit -m $msg

# Push to origin main
git push origin main

Write-Output "COMMIT_DONE"
