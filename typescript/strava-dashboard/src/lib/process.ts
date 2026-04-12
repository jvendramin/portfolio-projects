import { StravaActivity } from "./strava";

export interface WeekData {
  week: string; // "W1", "W2", etc.
  weekStart: string; // ISO date of Monday
  distance: number; // km
  duration: number; // minutes
  pace: number; // min/km (runs only)
  elevAdjPace: number; // min/km (runs only, elevation adjusted)
  activityCount: number;
  runDistance: number; // km
  runDuration: number; // minutes
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const K_FACTOR = 10; // elevation adjustment factor (meters of climbing = K * meters of flat distance)

export function processActivities(activities: StravaActivity[]): WeekData[] {
  const weekMap = new Map<string, {
    distance: number;
    totalDuration: number;
    elevGain: number;
    count: number;
    runDistance: number;
    runDuration: number;
    runElevGain: number;
    weekStart: Date;
  }>();

  const isRun = (act: StravaActivity) =>
    act.sport_type === "Run" || act.sport_type === "TrailRun" || act.type === "Run";

  for (const act of activities) {
    const date = new Date(act.start_date);
    const monday = getMonday(date);
    const key = monday.toISOString().slice(0, 10);

    const existing = weekMap.get(key) || {
      distance: 0,
      totalDuration: 0,
      elevGain: 0,
      count: 0,
      runDistance: 0,
      runDuration: 0,
      runElevGain: 0,
      weekStart: monday,
    };

    existing.distance += act.distance;
    existing.totalDuration += act.moving_time;
    existing.elevGain += act.total_elevation_gain;
    existing.count += 1;

    if (isRun(act) && act.distance > 0) {
      existing.runDistance += act.distance;
      existing.runDuration += act.moving_time;
      existing.runElevGain += act.total_elevation_gain;
    }

    weekMap.set(key, existing);
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data], i) => {
      const distKm = data.distance / 1000;
      const durationMin = data.totalDuration / 60;

      // Pace always based on runs only
      const runDistKm = data.runDistance / 1000;
      const runDurationMin = data.runDuration / 60;
      const pace = runDistKm > 0 ? runDurationMin / runDistKm : 0;

      // Elevation adjusted pace also runs only
      const dadjKm = runDistKm + (data.runElevGain * K_FACTOR) / 1000;
      const elevAdjPace = dadjKm > 0 ? runDurationMin / dadjKm : 0;

      return {
        week: `W${i + 1}`,
        weekStart: data.weekStart.toISOString().slice(0, 10),
        distance: Math.round(distKm * 100) / 100,
        duration: Math.round(durationMin * 100) / 100,
        pace: Math.round(pace * 100) / 100,
        elevAdjPace: Math.round(elevAdjPace * 100) / 100,
        activityCount: data.count,
        runDistance: Math.round(runDistKm * 100) / 100,
        runDuration: Math.round(runDurationMin * 100) / 100,
      };
    });

  return weeks;
}

export interface ExertionVsPace {
  name: string;
  date: string;
  pace: number; // min/km
  exertion: number; // 1-10
  distance: number; // km
}

export function getExertionVsPace(activities: StravaActivity[]): ExertionVsPace[] {
  return activities
    .filter(
      (a) =>
        (a.sport_type === "Run" || a.sport_type === "TrailRun" || a.type === "Run") &&
        a.distance > 0 &&
        a.perceived_exertion != null &&
        a.perceived_exertion > 0
    )
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .map((a) => {
      const distKm = a.distance / 1000;
      const durMin = a.moving_time / 60;
      const d = new Date(a.start_date);
      return {
        name: a.name,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        pace: Math.round((durMin / distKm) * 100) / 100,
        exertion: a.perceived_exertion!,
        distance: Math.round(distKm * 100) / 100,
      };
    });
}

export interface WeekRating {
  week: string;
  avgScore: number;
  runCount: number;
}

export interface RunForRating {
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

export function prepareRunsForRating(activities: StravaActivity[]): RunForRating[] {
  const isRun = (a: StravaActivity) =>
    a.sport_type === "Run" || a.sport_type === "TrailRun" || a.type === "Run";

  return activities
    .filter((a) => isRun(a) && a.distance > 0)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .map((a) => {
      const date = new Date(a.start_date);
      const monday = getMonday(date);
      const weekNum = getISOWeek(date);
      const distKm = a.distance / 1000;
      const durMin = a.moving_time / 60;
      return {
        id: a.id,
        name: a.name,
        date: a.start_date,
        distance_km: Math.round(distKm * 100) / 100,
        moving_time_min: Math.round(durMin * 100) / 100,
        elapsed_time_min: Math.round((a.elapsed_time / 60) * 100) / 100,
        pace_min_per_km: distKm > 0 ? Math.round((durMin / distKm) * 100) / 100 : 0,
        total_elevation_gain_m: a.total_elevation_gain,
        average_speed_kmh: Math.round(a.average_speed * 3.6 * 100) / 100,
        max_speed_kmh: Math.round(a.max_speed * 3.6 * 100) / 100,
        average_heartrate: a.average_heartrate ?? null,
        max_heartrate: a.max_heartrate ?? null,
        perceived_exertion: a.perceived_exertion ?? null,
        week: `W${weekNum}`,
      };
    });
}

export function aggregateWeeklyRatings(ratings: { id: number; score: number; week: string }[]): WeekRating[] {
  const weekMap = new Map<string, { total: number; count: number }>();

  for (const r of ratings) {
    const existing = weekMap.get(r.week) || { total: 0, count: 0 };
    existing.total += r.score;
    existing.count += 1;
    weekMap.set(r.week, existing);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => {
      const numA = parseInt(a.slice(1));
      const numB = parseInt(b.slice(1));
      return numA - numB;
    })
    .map(([week, data]) => ({
      week,
      avgScore: Math.round((data.total / data.count) * 10) / 10,
      runCount: data.count,
    }));
}

export function getActivityTypes(activities: StravaActivity[]): string[] {
  const types = new Set(activities.map((a) => a.sport_type));
  return Array.from(types).sort();
}
