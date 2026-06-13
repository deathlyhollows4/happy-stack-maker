**Observed signal**
- I opened the preview at `/`, and the homepage rendered with visible CodeWise content.
- Dev-server logs are clean, with Vite connected.
- Browser console has no app errors, only Lovable preview postMessage warnings.
- Network requests show no `500` failures.

**Plan**
1. Re-check the app shell and route setup for blank-page failure points: root layout, router bootstrap, `Outlet`, global CSS loading, and any route-level auth redirects.
2. Inspect the recent SEO and CSS changes for anything that could intermittently blank the preview, especially head links, font loading, and `styles.css` ordering.
3. If an app-side issue is found, patch only the affected file and verify the preview again with browser, console, network, and dev-server logs.
4. If the app still renders correctly after verification, treat this as a preview-frame/session issue rather than an app bug, then restart the preview dev server and provide exact recovery steps.
5. Before any symbol-level edits, run the required GitNexus impact analysis where tooling is available, and report the blast radius before changing code.

**Expected outcome**
- Either a concrete code fix for a reproducible blank-page cause, or a verified healthy app plus preview recovery steps.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>