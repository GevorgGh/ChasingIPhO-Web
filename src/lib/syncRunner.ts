import { exec } from "child_process";
import fs from "fs";
import path from "path";

let autoSyncIntervalTimer: NodeJS.Timeout | null = null;
let lastSyncResult: {
  timestamp: string;
  success: boolean;
  problemsCount?: number;
  materialsCount?: number;
  error?: string;
} | null = null;

export function getLastSyncResult() {
  return lastSyncResult;
}

/**
 * Runs the Python Google Drive sync and updates src/data/ JSON files
 */
export async function runDriveSync(): Promise<{
  success: boolean;
  message: string;
  problemsCount: number;
  materialsCount: number;
  selfMaterialsCount: number;
  output?: string;
}> {
  const cwd = process.cwd();
  const syncScript = path.join(cwd, "sync.py");

  if (!fs.existsSync(syncScript)) {
    throw new Error(`sync.py script not found at ${syncScript}`);
  }

  console.log("[AutoSync] Initiating Google Drive synchronization...");

  const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(
      `python "${syncScript}"`,
      { cwd, timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });

  const dataDir = path.join(cwd, "src", "data");
  const jsonFileNames = ["problems.json", "materials.json", "self_materials.json", "olympiads.json"] as const;

  let problemsCount = 0;
  let materialsCount = 0;
  let selfMaterialsCount = 0;

  for (const fileName of jsonFileNames) {
    const srcFile = path.join(/*turbopackIgnore: true*/ cwd, fileName);
    const destFile = path.join(dataDir, fileName);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);

      try {
        const content = JSON.parse(fs.readFileSync(destFile, "utf-8"));
        if (fileName === "problems.json") {
          problemsCount = Object.keys(content).length;
        } else if (fileName === "materials.json") {
          materialsCount = content.length;
        } else if (fileName === "self_materials.json") {
          selfMaterialsCount = content.length;
        }
      } catch {
        // ignore parsing error
      }
    }
  }

  lastSyncResult = {
    timestamp: new Date().toISOString(),
    success: true,
    problemsCount,
    materialsCount,
  };

  console.log(
    `[AutoSync] Successfully synced with Google Drive: ${problemsCount} problems, ${materialsCount} materials.`
  );

  return {
    success: true,
    message: "Google Drive synchronization completed",
    problemsCount,
    materialsCount,
    selfMaterialsCount,
    output: result.stdout,
  };
}

/**
 * Starts the automatic background sync loop running every intervalMinutes (default: 60)
 */
export function startAutoSyncLoop(intervalMinutes: number = 60) {
  if (autoSyncIntervalTimer) {
    return; // Already running
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`[AutoSync] Background Google Drive sync loop scheduled every ${intervalMinutes} minutes.`);

  // Run on interval
  autoSyncIntervalTimer = setInterval(async () => {
    try {
      await runDriveSync();
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[AutoSync] Scheduled sync failed: ${error.message}`);
      lastSyncResult = {
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      };
    }
  }, intervalMs);
}
