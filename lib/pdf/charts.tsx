import React from "react"
import {
  Svg,
  Rect,
  Line,
  Path,
  Polyline,
  Circle,
  G,
  Text,
} from "@react-pdf/renderer"

// @react-pdf/renderer SVG Text type definitions are incomplete — they don't
// expose fontSize/fontFamily/fill as direct props even though they work at
// runtime. This typed alias avoids TS errors without losing type safety.
const Label = Text as unknown as React.FC<{
  x?: number
  y?: number
  fontSize?: number
  fill?: string
  textAnchor?: "start" | "middle" | "end"
  fontFamily?: string
  children: string
}>

function fmtNum(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(Math.round(v))
}

const Y_TICKS = [0, 0.25, 0.5, 0.75, 1]

interface ChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: ChartData[]
  width?: number
  height?: number
  color?: string
  title?: string
  formatValue?: (v: number) => string
}

interface LineChartProps {
  data: ChartData[]
  width?: number
  height?: number
  color?: string
  title?: string
  formatValue?: (v: number) => string
}

export function BarChart({
  data,
  width = 257,
  height = 130,
  color = "#16a34a",
  title,
  formatValue = fmtNum,
}: BarChartProps) {
  if (!data.length) return null

  const padL = 38
  const padR = 8
  const padT = title ? 18 : 8
  const padB = 26
  const cW = width - padL - padR
  const cH = height - padT - padB
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const n = data.length
  const gapFraction = 0.25
  const totalGap = cW * gapFraction
  const barW = (cW - totalGap) / n
  const gap = totalGap / (n + 1)

  return (
    <Svg width={width} height={height}>
      {title && (
        <Label
          x={width / 2}
          y={11}
          fontSize={7}
          fill="#374151"
          textAnchor="middle"
          fontFamily="Times-Bold"
        >
          {title}
        </Label>
      )}

      {Y_TICKS.map((pct) => {
        const y = padT + cH - pct * cH
        return (
          <G key={pct}>
            <Line
              x1={padL}
              y1={y}
              x2={padL + cW}
              y2={y}
              stroke={pct === 0 ? "#d1d5db" : "#f3f4f6"}
              strokeWidth={pct === 0 ? 1 : 0.5}
            />
            {pct > 0 && (
              <Label
                x={padL - 3}
                y={y + 2.5}
                fontSize={5.5}
                fill="#9ca3af"
                textAnchor="end"
              >
                {formatValue(pct * maxVal)}
              </Label>
            )}
          </G>
        )
      })}

      <Line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + cH}
        stroke="#d1d5db"
        strokeWidth={1}
      />

      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * cH, 1)
        const x = padL + gap + i * (barW + gap)
        const y = padT + cH - barH
        const shortLabel =
          d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} fill={color} rx={1.5} />
            <Label
              x={x + barW / 2}
              y={Math.max(y - 2, padT + 6)}
              fontSize={5}
              fill={color}
              textAnchor="middle"
              fontFamily="Times-Bold"
            >
              {formatValue(d.value)}
            </Label>
            <Label
              x={x + barW / 2}
              y={padT + cH + 10}
              fontSize={5.5}
              fill="#6b7280"
              textAnchor="middle"
            >
              {shortLabel}
            </Label>
          </G>
        )
      })}
    </Svg>
  )
}

export function LineChart({
  data,
  width = 257,
  height = 130,
  color = "#16a34a",
  title,
  formatValue = fmtNum,
}: LineChartProps) {
  if (data.length < 2) return null

  const padL = 38
  const padR = 8
  const padT = title ? 18 : 8
  const padB = 26
  const cW = width - padL - padR
  const cH = height - padT - padB
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * cW,
    y: padT + cH - (d.value / maxVal) * cH,
    label: d.label,
    value: d.value,
  }))

  const linePts = pts.map((p) => `${p.x},${p.y}`).join(" ")
  const areaD = [
    `M ${pts[0].x},${padT + cH}`,
    ...pts.map((p) => `L ${p.x},${p.y}`),
    `L ${pts[pts.length - 1].x},${padT + cH}`,
    "Z",
  ].join(" ")

  return (
    <Svg width={width} height={height}>
      {title && (
        <Label
          x={width / 2}
          y={11}
          fontSize={7}
          fill="#374151"
          textAnchor="middle"
          fontFamily="Times-Bold"
        >
          {title}
        </Label>
      )}

      {Y_TICKS.map((pct) => {
        const y = padT + cH - pct * cH
        return (
          <G key={pct}>
            <Line
              x1={padL}
              y1={y}
              x2={padL + cW}
              y2={y}
              stroke={pct === 0 ? "#d1d5db" : "#f3f4f6"}
              strokeWidth={pct === 0 ? 1 : 0.5}
            />
            {pct > 0 && (
              <Label
                x={padL - 3}
                y={y + 2.5}
                fontSize={5.5}
                fill="#9ca3af"
                textAnchor="end"
              >
                {formatValue(pct * maxVal)}
              </Label>
            )}
          </G>
        )
      })}

      <Line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + cH}
        stroke="#d1d5db"
        strokeWidth={1}
      />

      <Path d={areaD} fill={`${color}22`} stroke="none" />
      <Polyline points={linePts} stroke={color} strokeWidth={1.5} fill="none" />

      {pts.map((p, i) => {
        const shortLabel =
          p.label.length > 6 ? `${p.label.slice(0, 5)}…` : p.label
        return (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={2.5} fill={color} />
            <Label
              x={p.x}
              y={padT + cH + 10}
              fontSize={5.5}
              fill="#6b7280"
              textAnchor="middle"
            >
              {shortLabel}
            </Label>
          </G>
        )
      })}
    </Svg>
  )
}
