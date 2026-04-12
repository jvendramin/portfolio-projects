import { NextResponse } from "next/server";
import { fetchAllActivities } from "@/lib/strava";

export async function GET() {
  try {
    // Jan 1, 2026 UTC
    const after = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
    const activities = await fetchAllActivities(after);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Strava API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
