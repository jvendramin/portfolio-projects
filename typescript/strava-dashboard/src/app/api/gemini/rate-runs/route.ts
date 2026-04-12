import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface RunForRating {
  id: number;
  name: string;
  date: string;
  distance_km: number;
  moving_time_min: number;
  elapsed_time_min: number;
  pace_min_per_km: number;
  total_elevation_gain_m: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  average_heartrate: number | null;
  max_heartrate: number | null;
  perceived_exertion: number | null;
  week: string;
}

interface RunRating {
  id: number;
  score: number;
  week: string;
}

interface CachedRatings {
  ratings: RunRating[];
  timestamp: number;
}

let cache: CachedRatings | null = null;

export async function POST(request: NextRequest) {
  try {
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";

    if (!refresh && cache) {
      return NextResponse.json({ ratings: cache.ratings, cached: true, cachedAt: cache.timestamp });
    }

    const { runs } = (await request.json()) as { runs: RunForRating[] };

    if (!runs || runs.length === 0) {
      return NextResponse.json({ ratings: [], cached: false, cachedAt: Date.now() });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert running coach and performance analyst. Rate each of the following runs on a scale from 0 to 10 (integers only, where 0 is terrible and 10 is exceptional).

Consider these factors when rating:
- **Pace**: Faster paces relative to distance are better. For reference, sub-5:00/km is strong, sub-4:30/km is excellent for training runs.
- **Distance**: Longer runs show more endurance commitment. 5km+ is solid, 10km+ is good, 15km+ is great, 21km+ is excellent.
- **Duration**: Sustained effort over longer periods is more impressive.
- **Elevation Gain**: More elevation gain makes a run harder and more impressive. 100m+ is notable, 200m+ is significant.
- **Consistency**: Moving time close to elapsed time shows fewer stops and better pacing discipline.
- **Heart Rate Efficiency**: Lower average HR at faster paces indicates better fitness (if HR data available).
- **Perceived Exertion**: Lower perceived exertion at higher intensities shows fitness (if available).
- **Overall Quality**: A well-rounded run that balances pace, distance, and effort scores higher.

Here are the runs to rate (JSON array):
${JSON.stringify(runs, null, 2)}

Respond with ONLY a valid JSON array of objects, each with "id" (the run id) and "score" (integer 0-10). No explanation, no markdown, just the JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    if (!text) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 500 });
    }

    const parsed: { id: number; score: number }[] = JSON.parse(text);

    const runMap = new Map(runs.map((r) => [r.id, r]));
    const ratings: RunRating[] = parsed
      .filter((r) => runMap.has(r.id))
      .map((r) => ({
        id: r.id,
        score: Math.max(0, Math.min(10, Math.round(r.score))),
        week: runMap.get(r.id)!.week,
      }));

    cache = { ratings, timestamp: Date.now() };

    return NextResponse.json({ ratings, cached: false, cachedAt: cache.timestamp });
  } catch (error) {
    console.error("Gemini rating error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rate runs" },
      { status: 500 }
    );
  }
}
