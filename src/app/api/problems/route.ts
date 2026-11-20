import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import problemsStatic from "@/data/problems.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "problems.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json(JSON.parse(content), {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
  } catch (e) {
    console.error("Error reading problems.json:", e);
  }
  return NextResponse.json(problemsStatic);
}
