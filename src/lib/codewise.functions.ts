// Barrel, re-exports from domain files so no route import breaks

export { extractJson, computeFSRSGrade, updateFSRS } from "./codewise.utils";

export { reviewCode, getSubmission, getPublicSubmission } from "./review.functions";

export { generatePractice, listPractice } from "./practice.functions";

export { submitPracticeAttempt } from "./practice-attempt.functions";

export {
  getDashboard,
  getDueReviews,
  getEntitlements,
  exportUserData,
  getTopicBySlug,
} from "./dashboard.functions";

export {
  getAdminDashboard,
  getAdminSeats,
  grantAdminRole,
  revokeAdminRole,
  exportAllUserData,
  getCurriculumMappings,
  upsertCurriculumMapping,
  getAppConfig,
  setAppConfig,
} from "./admin.functions";

export type { CurriculumMapping, AppConfig } from "./admin.functions";

export {
  getAllBlogPosts,
  getBlogPostBySlug,
  listAllBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "./blog.functions";

export type { BlogPostRow } from "./blog.functions";

export {
  getUserConsent,
  setUserConsent,
  recordResearchEvent,
  exportResearchData,
  updateProfileAvatar,
} from "./consent.functions";
