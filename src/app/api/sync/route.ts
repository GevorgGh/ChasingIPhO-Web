import { NextResponse } from "next/server";
import { runDriveSync, getLastSyncResult } from "@/lib/syncRunner";

export async function POST() {
  try {
    const result = await runDriveSync();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute sync script",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET returns current sync status or runs a sync if query param ?run=1
  const last = getLastSyncResult();
  return NextResponse.json({
    status: "ok",
    lastSync: last,
  });
}
