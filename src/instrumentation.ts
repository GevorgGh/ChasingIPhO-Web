export async function register() {
  // Only start local background sync when running locally in persistent Node.js, not in serverless Vercel
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { startAutoSyncLoop } = await import("@/lib/syncRunner");
    // Automatically synchronizes with Google Drive every 60 minutes
    startAutoSyncLoop(60);
  }
}
