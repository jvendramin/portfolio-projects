import { NextRequest, NextResponse } from "next/server";
import { fetchAllActivities, getAccessToken } from "@/lib/strava";

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const wait = (i + 1) * 5000;
      console.log(`Rate limited on ${url}, waiting ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  return fetch(url, { headers });
}

interface CachedData {
  activities: Record<string, unknown>[];
  details: Record<number, Record<string, unknown>>;
  timestamp: number;
}

let cache: CachedData | null = null;

async function fetchFreshData(): Promise<CachedData> {
  const after = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
  const activities = await fetchAllActivities(after);
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  const runs = activities.filter(
    (a) => (a.sport_type === "Run" || a.sport_type === "TrailRun") && a.distance > 0
  );

  console.log(`Fetching details for ${runs.length} runs...`);

  const detailMap: Record<number, Record<string, unknown>> = {};
  const peMap = new Map<number, number | null>();

  for (let i = 0; i < runs.length; i += 5) {
    const batch = runs.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (run) => {
        try {
          const res = await fetchWithRetry(
            `https://www.strava.com/api/v3/activities/${run.id}`,
            headers
          );
          if (!res.ok) {
            console.log(`Failed to fetch ${run.id}: ${res.status}`);
            return { id: run.id, pe: null, detail: null };
          }
          const data = await res.json();
          return { id: run.id, pe: data.perceived_exertion ?? null, detail: data };
        } catch (err) {
          console.log(`Error fetching ${run.id}:`, err);
          return { id: run.id, pe: null, detail: null };
        }
      })
    );

    for (const r of results) {
      peMap.set(r.id, r.pe);
      if (r.detail) detailMap[r.id] = r.detail;
    }

    if (i + 5 < runs.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`Got details for ${Object.keys(detailMap).length}/${runs.length} runs`);

  const enriched = activities.map((a) => ({
    ...a,
    perceived_exertion: peMap.get(a.id) ?? null,
  }));

  return { activities: enriched, details: detailMap, timestamp: Date.now() };
}

export async function GET(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";

    if (!refresh && cache) {
      console.log(`Serving cached data from ${new Date(cache.timestamp).toLocaleTimeString()}`);
      return NextResponse.json({
        activities: cache.activities,
        details: cache.details,
        cached: true,
        cachedAt: cache.timestamp,
      });
    }

    const data = await fetchFreshData();
    cache = data;

    return NextResponse.json({
      activities: data.activities,
      details: data.details,
      cached: false,
      cachedAt: data.timestamp,
    });
  } catch (error) {
    console.error("Strava API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
