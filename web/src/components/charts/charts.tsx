"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const PALETTE = ["var(--brand)", "#6ea0ff", "#3ccf91", "#f5b544", "#b07cff", "#ff8fb1"];

type Series = { key: string; label?: string; color?: string };

const axis = { stroke: "var(--ink-4)", fontSize: 12, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-raised px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-semibold text-ink">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-ink-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          {p.name}: <span className="num font-semibold text-ink">{fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LineSeries({ data, x = "label", series, height = 280, area = true, fmt, legend }: { data: any[]; x?: string; series: Series[]; height?: number; area?: boolean; fmt?: (n: number) => string; legend?: boolean }) {
  const Chart: any = area ? AreaChart : LineChart;
  return (
    <div style={{ height }} role="img" aria-label="Line chart">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || PALETTE[i]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color || PALETTE[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey={x} {...axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...axis} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
          <Tooltip content={<Tip fmt={fmt} />} cursor={{ stroke: "var(--line-strong)" }} />
          {legend && <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-3)" }} />}
          {series.map((s, i) =>
            area ? (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={s.color || PALETTE[i]} strokeWidth={2.2} fill={`url(#g-${s.key})`} dot={false} activeDot={{ r: 4 }} />
            ) : (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={s.color || PALETTE[i]} strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarSeries({ data, x = "label", series, height = 280, stacked, fmt, horizontal, legend }: { data: any[]; x?: string; series: Series[]; height?: number; stacked?: boolean; fmt?: (n: number) => string; horizontal?: boolean; legend?: boolean }) {
  return (
    <div style={{ height }} role="img" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, left: horizontal ? 24 : -14, bottom: 0 }}>
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke="var(--line)" />
          {horizontal ? (
            <>
              <XAxis type="number" {...axis} />
              <YAxis type="category" dataKey={x} {...axis} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={x} {...axis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis {...axis} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
            </>
          )}
          <Tooltip content={<Tip fmt={fmt} />} cursor={{ fill: "var(--line)" }} />
          {legend && <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-3)" }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label || s.key} fill={s.color || PALETTE[i]} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : [5, 5, 0, 0]} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, height = 240, center }: { data: { name: string; value: number; color?: string }[]; height?: number; center?: React.ReactNode }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <div className="@container"><div className="flex flex-col items-center gap-5 @md:flex-row @md:gap-8">
      <div className="relative shrink-0" style={{ width: height, height }} role="img" aria-label="Donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="94%" paddingAngle={2} stroke="none">
              {data.map((d, i) => <Cell key={d.name} fill={d.color || PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
      </div>
      <ul className="w-full space-y-3 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-ink-2"><span className="size-2.5 rounded-full" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />{d.name}</span>
            <span className="num font-semibold">{d.value.toLocaleString()} <span className="font-normal text-ink-3">({total ? Math.round((d.value / total) * 100) : 0}%)</span></span>
          </li>
        ))}
      </ul>
    </div></div>
  );
}
