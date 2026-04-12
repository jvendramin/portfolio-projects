"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { StravaActivity } from "@/lib/strava";
import { processActivities, getActivityTypes, getExertionVsPace, prepareRunsForRating, aggregateWeeklyRatings, WeekData, WeekRating } from "@/lib/process";
import { DistanceChart, DurationChart, ExertionVsPaceChart, ElevAdjPaceChart, AiRunRatingChart } from "./Charts";

function formatPace(val: number): string {
  if (!val) return "0:00";
  const mins = Math.floor(val);
  const secs = Math.round((val - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TabContent({ activities, details, sportType }: { activities: StravaActivity[]; details: Record<number, Record<string, unknown>>; sportType: string }) {
  const [activityDetail, setActivityDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [weeklyRatings, setWeeklyRatings] = useState<WeekRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const ratingsLoaded = useRef(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  const viewActivity = useCallback((act: StravaActivity) => {
    const cached = details[act.id];
    if (cached) {
      setActivityDetail(cached);
      modalRef.current?.showModal();
    } else {
      setDetailLoading(true);
      setActivityDetail(null);
      modalRef.current?.showModal();
      fetch(`/api/strava/activities/${act.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("API error");
          return res.json();
        })
        .then((data) => setActivityDetail(data))
        .catch(() => setActivityDetail(act as unknown as Record<string, unknown>))
        .finally(() => setDetailLoading(false));
    }
  }, [details]);
  const isRunTab = sportType === "Run" || sportType === "TrailRun";

  useEffect(() => {
    if (!isRunTab || ratingsLoaded.current || activities.length === 0) return;
    ratingsLoaded.current = true;
    setRatingsLoading(true);

    const runs = prepareRunsForRating(activities);
    if (runs.length === 0) { setRatingsLoading(false); return; }

    fetch("/api/gemini/rate-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runs }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ratings) {
          setWeeklyRatings(aggregateWeeklyRatings(data.ratings));
        }
      })
      .catch((err) => console.error("Failed to fetch AI ratings:", err))
      .finally(() => setRatingsLoading(false));
  }, [activities, isRunTab]);

  const weekData: WeekData[] = useMemo(() => processActivities(activities), [activities]);
  const exertionData = useMemo(() => getExertionVsPace(activities), [activities]);

  const totalDistance = weekData.reduce((s, w) => s + w.distance, 0);
  const totalDuration = weekData.reduce((s, w) => s + w.duration, 0);
  const totalActivities = weekData.reduce((s, w) => s + w.activityCount, 0);
  const totalRunDist = weekData.reduce((s, w) => s + w.runDistance, 0);
  const totalRunDur = weekData.reduce((s, w) => s + w.runDuration, 0);
  const avgPace = totalRunDist > 0 ? totalRunDur / totalRunDist : 0;

  return (
    <>
      {/* Stats */}
      <div className="collapse collapse-arrow bg-base-100 border-base-300 border mb-4">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title font-semibold">Summary</div>
        <div className="collapse-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-title text-xs">Total Distance</div>
              <div className="stat-value text-lg">{totalDistance.toFixed(1)} km</div>
            </div>
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-title text-xs">Total Duration</div>
              <div className="stat-value text-lg">{(totalDuration / 60).toFixed(1)} hrs</div>
            </div>
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-title text-xs">Activities</div>
              <div className="stat-value text-lg">{totalActivities}</div>
            </div>
            <div className="stat bg-base-200 rounded-box shadow-sm">
              <div className="stat-title text-xs">Avg Pace (runs)</div>
              <div className="stat-value text-lg">{formatPace(avgPace)} /km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-semibold">Distance per Week</div>
          <div className="collapse-content"><DistanceChart data={weekData} /></div>
        </div>
        <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-semibold">Duration per Week</div>
          <div className="collapse-content"><DurationChart data={weekData} /></div>
        </div>
        <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-semibold">Exertion vs Pace</div>
          <div className="collapse-content"><ExertionVsPaceChart data={exertionData} /></div>
        </div>
        <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title font-semibold">Elevation Adjusted Pace</div>
          <div className="collapse-content"><ElevAdjPaceChart data={weekData} /></div>
        </div>
        {isRunTab && (
          <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title font-semibold flex items-center gap-2">
              AI Run Score
              <span className="badge badge-sm badge-ghost">Gemini</span>
            </div>
            <div className="collapse-content">
              {ratingsLoading ? (
                <div className="flex items-center justify-center h-[300px] gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="text-sm opacity-60">Rating your runs...</span>
                </div>
              ) : (
                <AiRunRatingChart data={weeklyRatings} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-3xl">
          <h3 className="font-bold text-lg mb-4">Activity Detail</h3>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : activityDetail ? (
            <div className="mockup-code w-full max-h-[60vh] overflow-y-auto">
              {Object.entries(activityDetail).map(([key, value]) => (
                <pre key={key} data-prefix=">" className="text-xs">
                  <code>
                    <span className="text-info">{key}</span>:{" "}
                    <span className="text-success">
                      {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </code>
                </pre>
              ))}
            </div>
          ) : null}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Activities Table */}
      <div className="collapse collapse-arrow bg-base-100 border-base-300 border">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title font-semibold">Recent Activities</div>
        <div className="collapse-content">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Pace</th>
                  <th>Elevation</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activities
                  .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                  .slice(0, 20)
                  .map((act) => {
                    const distKm = act.distance / 1000;
                    const durMin = act.moving_time / 60;
                    const pace = distKm > 0 ? durMin / distKm : 0;
                    return (
                      <tr key={act.id}>
                        <td className="text-xs">{new Date(act.start_date).toLocaleDateString()}</td>
                        <td className="text-xs max-w-[200px] truncate">{act.name}</td>
                        <td>
                          <span className="badge badge-sm badge-ghost">{act.sport_type}</span>
                        </td>
                        <td className="text-xs">{distKm.toFixed(2)} km</td>
                        <td className="text-xs">{durMin.toFixed(0)} min</td>
                        <td className="text-xs">{formatPace(pace)}</td>
                        <td className="text-xs">{act.total_elevation_gain.toFixed(0)} m</td>
                        <td>
                          <button
                            className="btn btn-active btn-info btn-xs"
                            onClick={() => viewActivity(act)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const SPORT_ICONS: Record<string, React.ReactNode> = {
  All: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  ),
  Run: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    </svg>
  ),
  TrailRun: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  ),
  Soccer: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Z" />
    </svg>
  ),
  Ride: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
};

function getIcon(type: string) {
  return SPORT_ICONS[type] || (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  );
}

export default function Dashboard() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [activityDetails, setActivityDetails] = useState<Record<number, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const fetchData = useCallback((refresh = false) => {
    const url = refresh
      ? "/api/strava/activities-detailed?refresh=true"
      : "/api/strava/activities-detailed";
    const setLoad = refresh ? setRefreshing : setLoading;
    setLoad(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activities");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setActivities(data.activities);
        setActivityDetails(data.details || {});
        setCachedAt(data.cachedAt || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activityTypes = useMemo(() => [...getActivityTypes(activities), "All"], [activities]);

  const filteredByType = useMemo(() => {
    const map: Record<string, StravaActivity[]> = {};
    map["All"] = activities;
    for (const type of getActivityTypes(activities)) {
      map[type] = activities.filter((a) => a.sport_type === type);
    }
    return map;
  }, [activities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
          <div>
            <a href="/api/strava/auth" className="btn btn-sm btn-ghost">
              Re-authorize Strava
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-200 shadow-sm px-4">
        <div className="flex-1 flex items-center">
          <img src="/strava-logo.png" alt="Strava" className="h-8 w-auto mr-3" />
          <span className="text-xl font-bold">Strava Dashboard</span>
          <span className="text-xs opacity-50 ml-2">2026</span>
          {cachedAt && (
            <span className="text-xs opacity-40 ml-4 hidden sm:inline">
              Last updated: {new Date(cachedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          className="btn btn-neutral btn-sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Activity Type Tabs */}
      <div className="p-4">
        <div className="tabs tabs-lift">
          {activityTypes.map((type, i) => (
            <React.Fragment key={type}>
              <label className="tab">
                <input type="radio" name="activity_tabs" defaultChecked={type === "Run"} />
                {getIcon(type)}
                {type}
              </label>
              <div className="tab-content bg-base-100 border-base-300 px-2 py-4 md:p-6">
                <TabContent activities={filteredByType[type] || []} details={activityDetails} sportType={type} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
