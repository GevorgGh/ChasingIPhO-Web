export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoSyncLoop } = await import("@/lib/syncRunner");
    // Automatically synchronizes with Google Drive every 60 minutes
    startAutoSyncLoop(60);
  }
}
