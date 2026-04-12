"use client";

import {
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  LineChart,
} from "recharts";
import { WeekData, ExertionVsPace, WeekRating } from "@/lib/process";

function formatPace(decimalMin: number): string {
  if (!decimalMin || decimalMin === 0) return "0:00";
  const mins = Math.floor(decimalMin);
  const secs = Math.round((decimalMin - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PaceTooltipFormatter = ((value: any) => formatPace(Number(value))) as any;

function linearTrend<T>(data: T[], accessor: (d: T) => number): number[] {
  const n = data.length;
  if (n < 2) return data.map(accessor);
  const ys = data.map(accessor);
  const sumX = (n * (n - 1)) / 2;
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = ys.reduce((a, y, i) => a + i * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return ys.map((_, i) => Math.round((slope * i + intercept) * 100) / 100);
}

const tooltipStyle = {
  contentStyle: { backgroundColor: "oklch(0.25 0.01 260)", border: "none", borderRadius: "8px" },
  labelStyle: { color: "oklch(0.9 0 0)" },
  itemStyle: { color: "oklch(0.9 0 0)" },
};

export function DistanceChart({ data }: { data: WeekData[] }) {
  const trend = linearTrend(data, (d) => d.distance);
  const chartData = data.map((d, i) => ({ ...d, distanceTrend: trend[i] }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.2)" />
        <XAxis dataKey="week" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="distance" fill="oklch(0.65 0.2 250)" radius={[4, 4, 0, 0]} name="Distance (km)" />
        <Line type="monotone" dataKey="distanceTrend" stroke="oklch(0.9 0.1 250)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function DurationChart({ data }: { data: WeekData[] }) {
  const trend = linearTrend(data, (d) => d.duration);
  const chartData = data.map((d, i) => ({ ...d, durationTrend: trend[i] }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.2)" />
        <XAxis dataKey="week" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="duration" fill="oklch(0.65 0.2 150)" radius={[4, 4, 0, 0]} name="Duration (min)" />
        <Line type="monotone" dataKey="durationTrend" stroke="oklch(0.9 0.1 150)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ExertionVsPaceChart({ data }: { data: ExertionVsPace[] }) {
  const paceTrend = linearTrend(data, (d) => d.pace);
  const chartData = data.map((d, i) => ({ ...d, paceTrend: paceTrend[i] }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] opacity-50 text-sm">
        No runs with perceived exertion data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.2)" />
        <XAxis dataKey="date" fontSize={11} angle={-35} textAnchor="end" height={50} />
        <YAxis
          yAxisId="pace"
          fontSize={12}
          tickFormatter={formatPace}
          domain={[0, 6.5]}
          allowDataOverflow
          label={{ value: "Pace (min/km)", angle: -90, position: "insideLeft", fontSize: 11, offset: 10 }}
        />
        <YAxis
          yAxisId="exertion"
          orientation="right"
          fontSize={12}
          domain={[5, 10]}
          ticks={[5, 6, 7, 8, 9, 10]}
          label={{ value: "Exertion", angle: 90, position: "insideRight", fontSize: 11 }}
        />
        <Tooltip
          {...tooltipStyle}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any, name: any) =>
            name === "Pace" || name === "Pace Trend" ? formatPace(Number(value)) : value
          ) as any}
        />
        <Legend />
        <Bar yAxisId="pace" dataKey="pace" fill="oklch(0.65 0.2 250)" radius={[4, 4, 0, 0]} name="Pace" />
        <Line yAxisId="pace" type="monotone" dataKey="paceTrend" stroke="oklch(0.9 0.1 250)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Pace Trend" />
        <Line yAxisId="exertion" type="monotone" dataKey="exertion" stroke="oklch(0.7 0.25 30)" strokeWidth={2} dot={{ r: 4 }} name="Exertion" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AiRunRatingChart({ data }: { data: WeekRating[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] opacity-50 text-sm">
        No AI ratings available
      </div>
    );
  }

  const trend = linearTrend(data, (d) => d.avgScore);
  const chartData = data.map((d, i) => ({ ...d, scoreTrend: trend[i] }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.2)" />
        <XAxis dataKey="week" fontSize={12} />
        <YAxis yAxisId="score" fontSize={12} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} label={{ value: "Score", angle: -90, position: "insideLeft", fontSize: 11, offset: 10 }} />
        <YAxis yAxisId="count" orientation="right" fontSize={12} allowDecimals={false} label={{ value: "Runs", angle: 90, position: "insideRight", fontSize: 11 }} />
        <Tooltip
          {...tooltipStyle}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: any, name: any) => [
            name === "Runs" ? value : Number(value).toFixed(1),
            name,
          ]) as any}
        />
        <Legend />
        <Bar yAxisId="count" dataKey="runCount" fill="oklch(0.65 0.15 200 / 0.3)" radius={[4, 4, 0, 0]} name="Runs" />
        <Line yAxisId="score" type="monotone" dataKey="avgScore" stroke="oklch(0.7 0.25 140)" strokeWidth={2} dot={{ r: 4 }} name="Avg Score" />
        <Line yAxisId="score" type="monotone" dataKey="scoreTrend" stroke="oklch(0.9 0.1 140)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ElevAdjPaceChart({ data }: { data: WeekData[] }) {
  const paceWeeks = data.filter((d) => d.pace > 0);
  const elevTrend = linearTrend(paceWeeks, (d) => d.elevAdjPace);
  const rawTrend = linearTrend(paceWeeks, (d) => d.pace);
  const chartData = paceWeeks.map((d, i) => ({ ...d, elevAdjTrend: elevTrend[i], rawPaceTrend: rawTrend[i] }));

  return (
    <>
      <p className="text-xs opacity-60 mb-2">Dadj = D + (Elevation Gain x 10) | Pace = Time / Dadj</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.7 0 0 / 0.2)" />
          <XAxis dataKey="week" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={formatPace} domain={["auto", "auto"]} reversed />
          <Tooltip
            {...tooltipStyle}
            formatter={PaceTooltipFormatter}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="elevAdjPace"
            stroke="oklch(0.7 0.2 310)"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Elev Adj Pace (min/km)"
          />
          <Line
            type="monotone"
            dataKey="elevAdjTrend"
            stroke="oklch(0.9 0.1 310)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name="Elev Adj Trend"
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="oklch(0.7 0.25 30)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            name="Raw Pace (min/km)"
          />
          <Line
            type="monotone"
            dataKey="rawPaceTrend"
            stroke="oklch(0.9 0.1 30)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name="Raw Pace Trend"
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
