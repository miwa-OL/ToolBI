import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend, Line, LineChart, Pie, PieChart as RPieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import Plot from 'react-plotly.js'
import type { ChartType } from '@/types'

interface ChartRendererProps {
  chartType: ChartType
  xField: string
  colorPalette: string[]
  rows: Record<string, unknown>[]
  onPointClick?: (xField: string, value: unknown) => void
  crossFilterValue?: unknown
}

interface GradientDef {
  id: string
  from: string
  to: string
}

function resolveGradients(palette: string[]): { fills: string[]; defs: GradientDef[] } {
  const defs: GradientDef[] = []
  const fills = palette.map((c, i) => {
    if (c.includes('|')) {
      const [from, to] = c.split('|')
      const id = `rcg-${i}`
      defs.push({ id, from, to })
      return `url(#${id})`
    }
    return c
  })
  return { fills, defs }
}

function GradientDefs({ defs }: { defs: GradientDef[] }) {
  if (!defs.length) return null
  return (
    <defs>
      {defs.map((d) => (
        <linearGradient key={d.id} id={d.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={d.from} stopOpacity={1} />
          <stop offset="100%" stopColor={d.to} stopOpacity={1} />
        </linearGradient>
      ))}
    </defs>
  )
}

export function ChartRenderer({
  chartType, xField, colorPalette, rows, onPointClick, crossFilterValue,
}: ChartRendererProps) {
  if (!rows.length) return null

  const { fills, defs } = resolveGradients(colorPalette)
  const primaryFill = fills[0] ?? '#6366f1'
  const primaryColor = colorPalette[0]?.split('|')[0] ?? '#6366f1'
  const hasCross = crossFilterValue !== undefined

  function cellOpacity(rowXValue: unknown): number {
    return hasCross && rowXValue !== crossFilterValue ? 0.3 : 1
  }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <GradientDefs defs={defs} />
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar
            dataKey="value"
            fill={primaryFill}
            radius={[3, 3, 0, 0] as [number, number, number, number]}
            onClick={(data) => onPointClick?.(xField, (data as unknown as Record<string, unknown>)[xField])}
            cursor={onPointClick ? 'pointer' : 'default'}
          >
            {hasCross && rows.map((row, i) => (
              <Cell key={i} fill={primaryFill} opacity={cellOpacity(row[xField])} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows}>
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={primaryColor} fill="url(#area-fill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RPieChart>
          <GradientDefs defs={defs} />
          <Pie
            data={rows}
            dataKey="value"
            nameKey={xField}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            onClick={(data) => onPointClick?.(xField, (data as unknown as Record<string, unknown>)[xField])}
            cursor={onPointClick ? 'pointer' : 'default'}
          >
            {rows.map((row, i) => (
              <Cell
                key={i}
                fill={fills[i % fills.length]}
                opacity={cellOpacity(row[xField])}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RPieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'scatter') {
    const x = rows.map((r) => r[xField])
    const y = rows.map((r) => r['value'])
    const markerColors = hasCross
      ? rows.map((r) => (r[xField] === crossFilterValue ? primaryColor : 'rgba(148,163,184,0.35)'))
      : primaryColor
    return (
      <Plot
        data={[{ type: 'scatter', mode: 'markers', x, y, marker: { color: markerColors } }] as never}
        layout={{
          margin: { t: 20, r: 20, b: 50, l: 50 },
          autosize: true,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'rgba(0,0,0,0.02)',
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
        config={{ displayModeBar: false }}
        onClick={(event) => {
          if (!onPointClick) return
          const pt = (event as unknown as { points: Array<{ pointIndex: number }> }).points?.[0]
          if (pt !== undefined) {
            onPointClick(xField, rows[pt.pointIndex]?.[xField])
          }
        }}
      />
    )
  }

  if (chartType === 'heatmap') {
    const xVals = rows.map((r) => r[xField])
    const zVals = [rows.map((r) => Number(r['value'] ?? 0))]
    return (
      <Plot
        data={[{ type: 'heatmap', x: xVals, y: ['value'], z: zVals, colorscale: 'Blues' }] as never}
        layout={{
          margin: { t: 20, r: 20, b: 80, l: 60 },
          autosize: true,
          paper_bgcolor: 'transparent',
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
        config={{ displayModeBar: false }}
      />
    )
  }

  return null
}
