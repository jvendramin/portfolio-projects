const STRAVA_API = "https://www.strava.com/api/v3";
const TOKEN_URL = "https://www.strava.com/oauth/token";

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

let tokenCache: TokenData | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expires_at > Date.now() / 1000 + 60) {
    return tokenCache.access_token;
  }

  const refreshToken = tokenCache?.refresh_token || process.env.STRAVA_REFRESH_TOKEN!;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data: TokenData = await res.json();
  tokenCache = data;
  return data.access_token;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  perceived_exertion?: number | null;
}

export async function fetchActivities(after: number, page = 1, perPage = 200): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?after=${after}&page=${page}&per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchAllActivities(after: number): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;
  while (true) {
    const batch = await fetchActivities(after, page, 200);
    all.push(...batch);
    if (batch.length < 200) break;
    page++;
  }
  return all;
}
