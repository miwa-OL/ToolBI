import { BookOpen, BarChart2, Database, LayoutDashboard, TrendingUp, Users, Headphones, Package } from 'lucide-react'

function TocLink({ href, indent = false, children }: { href: string; indent?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`block py-1 text-xs leading-snug transition-colors hover:text-[#007AFF] text-[#636366] ${indent ? 'pl-3' : 'font-medium text-[#3A3A3C]'}`}
    >
      {children}
    </a>
  )
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-lg font-bold text-[#1C1C1E] mb-4 pb-3 border-b border-black/[0.07] scroll-mt-8 flex items-center gap-2.5"
    >
      {children}
    </h2>
  )
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-sm font-semibold text-[#1C1C1E] mt-7 mb-2.5 scroll-mt-8">
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#3A3A3C] leading-relaxed mb-3">{children}</p>
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-[#3A3A3C] leading-relaxed flex gap-2">
      <span className="text-[#AEAEB2] shrink-0 mt-0.5">•</span>
      <span>{children}</span>
    </li>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#F2F2F7] text-[#007AFF] px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#007AFF]/5 border border-[#007AFF]/15 rounded-xl p-4 mb-4 text-sm text-[#3A3A3C] leading-relaxed">
      {children}
    </div>
  )
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#34C759]/5 border border-[#34C759]/20 rounded-xl p-4 mb-4 text-sm text-[#3A3A3C] leading-relaxed">
      <span className="font-semibold text-[#1C1C1E]">Pro tip — </span>
      {children}
    </div>
  )
}

interface ColDef { name: string; type: string; description: string }

function ColumnsTable({ cols }: { cols: ColDef[] }) {
  return (
    <div className="rounded-xl border border-black/[0.09] overflow-hidden mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#F5F5F7] border-b border-black/[0.07]">
            <th className="text-left px-3 py-2 font-semibold text-[#636366]">Column</th>
            <th className="text-left px-3 py-2 font-semibold text-[#636366]">Type</th>
            <th className="text-left px-3 py-2 font-semibold text-[#636366]">Description</th>
          </tr>
        </thead>
        <tbody>
          {cols.map((c, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9F9FB]'}>
              <td className="px-3 py-2 font-mono text-[#007AFF]">{c.name}</td>
              <td className="px-3 py-2">
                <span className="bg-[#F2F2F7] text-[#636366] px-1.5 py-0.5 rounded font-medium">{c.type}</span>
              </td>
              <td className="px-3 py-2 text-[#636366]">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Step { step: string; detail: string }

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2.5 mb-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="w-5 h-5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="text-[#3A3A3C] leading-relaxed">
            <span className="font-medium text-[#1C1C1E]">{s.step}</span>
            {s.detail && <span className="text-[#636366]"> — {s.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

interface ExampleReportProps {
  id: string
  number: number
  title: string
  role: string
  icon: React.ElementType
  overview: string
  columns: ColDef[]
  steps: Step[]
  insights: string[]
  tip: string
}

function ExampleReport({ id, number, title, role, icon: Icon, overview, columns, steps, insights, tip }: ExampleReportProps) {
  return (
    <div id={id} className="rounded-2xl border border-black/[0.09] bg-white overflow-hidden mb-8 scroll-mt-8">
      <div className="px-5 py-4 border-b border-black/[0.06] flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#007AFF]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold text-[#AEAEB2] uppercase tracking-widest">
              Example {number}
            </span>
            <span className="text-[10px] bg-[#F2F2F7] text-[#636366] px-1.5 py-0.5 rounded-full font-medium">
              {role}
            </span>
          </div>
          <h4 className="text-sm font-bold text-[#1C1C1E]">{title}</h4>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <P>{overview}</P>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest mb-2">Required CSV Columns</p>
          <ColumnsTable cols={columns} />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest mb-2">Setup Steps</p>
          <StepList steps={steps} />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-widest mb-2">Insights You'll Gain</p>
          <ul className="space-y-1.5 mb-3">
            {insights.map((ins, i) => <Li key={i}>{ins}</Li>)}
          </ul>
        </div>

        <TipBox>{tip}</TipBox>
      </div>
    </div>
  )
}

export default function Help() {
  return (
    <div className="flex items-start min-h-full">
      <aside className="sticky top-0 self-start h-screen overflow-y-auto w-52 shrink-0 bg-white/80 backdrop-blur-xl border-r border-black/[0.07] px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={14} className="text-[#007AFF]" />
          <span className="text-xs font-semibold text-[#1C1C1E]">Documentation</span>
        </div>
        <nav className="space-y-px">
          <TocLink href="#getting-started">Getting Started</TocLink>
          <TocLink href="#data-sources">Data Sources</TocLink>
          <TocLink href="#uploading-csv" indent>Uploading CSV Files</TocLink>
          <TocLink href="#column-types" indent>Column Types</TocLink>
          <TocLink href="#computed-columns" indent>Computed Columns</TocLink>
          <TocLink href="#joining-datasets" indent>Joining Datasets</TocLink>
          <TocLink href="#report-builder">Report Builder</TocLink>
          <TocLink href="#chart-types" indent>Chart Types</TocLink>
          <TocLink href="#axes-aggregation" indent>Axes & Aggregation</TocLink>
          <TocLink href="#filters" indent>Filters</TocLink>
          <TocLink href="#appearance" indent>Appearance</TocLink>
          <TocLink href="#saving-charts" indent>Saving Charts</TocLink>
          <TocLink href="#dashboard">Dashboard</TocLink>
          <TocLink href="#cross-filtering" indent>Cross-Filtering</TocLink>
          <TocLink href="#global-filters" indent>Global Filters</TocLink>
          <TocLink href="#examples">Example Reports</TocLink>
          <TocLink href="#example-1" indent>Monthly Sales</TocLink>
          <TocLink href="#example-2" indent>Website Traffic</TocLink>
          <TocLink href="#example-3" indent>HR Headcount</TocLink>
          <TocLink href="#example-4" indent>Support Tickets</TocLink>
          <TocLink href="#example-5" indent>Inventory Analysis</TocLink>
        </nav>
      </aside>

      <div className="flex-1 px-10 py-8 max-w-3xl">

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight mb-2">ToolBI Documentation</h1>
          <p className="text-sm text-[#636366] leading-relaxed">
            A complete reference for building reports, connecting datasets, and analysing data — entirely on your local machine.
          </p>
        </div>

        <section className="mb-12">
          <SectionHeading id="getting-started">
            <BookOpen size={18} className="text-[#007AFF]" />
            Getting Started
          </SectionHeading>
          <P>
            ToolBI is a local-only business intelligence tool. All your data stays on your computer — nothing is ever sent to a server or cloud service. You work entirely within your browser, and all datasets are stored as compressed Parquet files on your disk.
          </P>
          <P>
            The app has three main areas, each accessible from the left sidebar:
          </P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium text-[#1C1C1E]">Data Sources</span> — upload CSV files, define computed columns, and join datasets together.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Reports</span> — build individual charts by selecting a dataset, choosing a chart type, and configuring axes, filters and styling.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Dashboards</span> — arrange multiple charts from the same report onto a canvas, resize and reposition them freely, and use cross-filtering to drill into your data.</Li>
          </ul>
          <InfoBox>
            The typical workflow is: <span className="font-medium">upload a CSV → create a report → add charts → open the dashboard</span>. You can create as many reports as you need, each pointing to any dataset or joined dataset you have uploaded.
          </InfoBox>
        </section>

        <section className="mb-12">
          <SectionHeading id="data-sources">
            <Database size={18} className="text-[#007AFF]" />
            Data Sources
          </SectionHeading>

          <SubHeading id="uploading-csv">Uploading CSV Files</SubHeading>
          <P>
            Navigate to <span className="font-medium">Data Sources</span> using the sidebar. Click <span className="font-medium">Upload Dataset</span> and select a CSV file from your computer. ToolBI will automatically parse the file, detect column types, and store it as a Parquet file for fast querying.
          </P>
          <P>
            After uploading, your dataset appears in the list with its name, number of rows, and a column breakdown. Click on any dataset row to expand it and see all columns with their detected types. You can delete a dataset by clicking the trash icon — this permanently removes the file from disk.
          </P>
          <TipBox>
            Make sure your CSV has a header row as the first line. ToolBI uses header names as column identifiers throughout the app. Avoid spaces in column names — use underscores instead (e.g. <Code>sale_date</Code> rather than <Code>sale date</Code>).
          </TipBox>

          <SubHeading id="column-types">Column Types</SubHeading>
          <P>ToolBI automatically detects and assigns one of four types to each column:</P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium text-[#1C1C1E]">text</span> — any string or categorical value (names, statuses, categories, IDs).</Li>
            <Li><span className="font-medium text-[#1C1C1E]">number</span> — integer or decimal numeric values (revenue, quantity, age, score).</Li>
            <Li><span className="font-medium text-[#1C1C1E]">date</span> — date or datetime values. Supported formats include <Code>YYYY-MM-DD</Code>, <Code>DD/MM/YYYY</Code>, and ISO 8601 timestamps.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">boolean</span> — true/false or 1/0 values.</Li>
          </ul>
          <P>
            Column types affect which aggregations and filter operators are available. A <Code>number</Code> column supports SUM, AVG, MIN, MAX; a <Code>text</Code> column only supports COUNT and COUNT DISTINCT. Date columns unlock date-range filters in the global filter panel.
          </P>

          <SubHeading id="computed-columns">Computed Columns</SubHeading>
          <P>
            Computed columns let you derive new values from existing columns using SQL expressions, without modifying your original data. They are evaluated at query time by DuckDB and appear alongside regular columns in the Report Builder.
          </P>
          <P>
            To add a computed column, expand a dataset and click <span className="font-medium">Add Computed Column</span>. Give it a name, enter a SQL expression, select the result type, and click <span className="font-medium">Validate</span> before saving. The validation runs a dry-run query against your data and reports any errors immediately.
          </P>
          <P>Common expression patterns:</P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium">Arithmetic:</span> <Code>price * quantity</Code>, <Code>revenue - cost</Code>, <Code>profit / revenue * 100</Code></Li>
            <Li><span className="font-medium">String operations:</span> <Code>UPPER(name)</Code>, <Code>CONCAT(first_name, ' ', last_name)</Code>, <Code>LENGTH(description)</Code></Li>
            <Li><span className="font-medium">Date parts:</span> <Code>DATE_PART('year', order_date)</Code>, <Code>DATE_PART('month', created_at)</Code>, <Code>STRFTIME(order_date, '%Y-%m')</Code></Li>
            <Li><span className="font-medium">Conditional logic:</span> <Code>CASE WHEN status = 'paid' THEN 1 ELSE 0 END</Code>, <Code>CASE WHEN score &gt;= 90 THEN 'A' WHEN score &gt;= 80 THEN 'B' ELSE 'C' END</Code></Li>
            <Li><span className="font-medium">Null handling:</span> <Code>COALESCE(discount, 0)</Code>, <Code>IFNULL(notes, 'N/A')</Code></Li>
          </ul>
          <InfoBox>
            Expressions use DuckDB SQL syntax. Any valid DuckDB scalar expression that references column names is supported. Column names that contain spaces or special characters must be wrapped in double quotes: <Code>"sale date"</Code>.
          </InfoBox>

          <SubHeading id="joining-datasets">Joining Datasets</SubHeading>
          <P>
            Joins combine two datasets into one based on a shared key column. This allows you to analyse data that lives in separate CSV files — for example, combining an orders table with a customers table to see revenue broken down by customer segment.
          </P>
          <P>
            To create a join, scroll to the <span className="font-medium">Joined Datasets</span> section and click <span className="font-medium">Create Join</span>. Select a left dataset, a right dataset, the key columns to join on, and the join type. A live preview of 20 rows is shown before you confirm.
          </P>
          <P>The four join types:</P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium text-[#1C1C1E]">INNER JOIN</span> — returns only rows where the key exists in both datasets. Use when you only want records that have a match on both sides.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">LEFT JOIN</span> — returns all rows from the left dataset, plus matched rows from the right. Rows in the left dataset with no match in the right will have <Code>null</Code> for the right-side columns. Use when the left dataset is your primary source.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">RIGHT JOIN</span> — the mirror of a left join. All rows from the right dataset are preserved.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">FULL OUTER JOIN</span> — returns all rows from both datasets, with <Code>null</Code> where no match is found. Use when you want to see all records regardless of whether they have a counterpart in the other dataset.</Li>
          </ul>
          <TipBox>
            If your two key columns have different names (e.g. <Code>order_id</Code> in the left and <Code>id</Code> in the right), ToolBI handles the mapping automatically. You just select which column from each side to match on.
          </TipBox>
        </section>

        <section className="mb-12">
          <SectionHeading id="report-builder">
            <BarChart2 size={18} className="text-[#007AFF]" />
            Report Builder
          </SectionHeading>
          <P>
            A Report is a named collection of charts. Each chart is configured independently with its own dataset, chart type, axes, filters, and styling. Charts within the same report can later be arranged on a Dashboard canvas.
          </P>
          <P>
            Create a new report by clicking the <span className="font-medium">+</span> button next to "Reports" in the sidebar. You will be taken to the Report Builder where the left panel shows your dataset columns and the right panel contains all configuration options.
          </P>

          <SubHeading id="chart-types">Chart Types</SubHeading>
          <P>ToolBI supports six chart types, each suited to different kinds of data:</P>

          <div className="space-y-3 mb-4">
            {[
              { name: 'Bar', use: 'Comparing values across distinct categories.', example: 'Total revenue by product category, number of orders by country, average score by team.' },
              { name: 'Line', use: 'Showing trends and changes over time or ordered sequences.', example: 'Monthly revenue over a year, daily active users over a quarter, weekly sales volume.' },
              { name: 'Area', use: 'Like a line chart but emphasises volume and cumulative magnitude.', example: 'Cumulative revenue, traffic growth, stacked usage over time.' },
              { name: 'Pie', use: 'Showing proportional composition of a whole.', example: 'Market share by brand, distribution of ticket categories, revenue split by region. Works best with 3–7 categories.' },
              { name: 'Scatter', use: 'Revealing correlations and distributions between two numeric variables.', example: 'Ad spend vs conversions, employee tenure vs salary, order size vs shipping time.' },
              { name: 'Heatmap', use: 'Visualising intensity and density across a categorical dimension.', example: 'Sales volume by day of week, ticket volume by hour, page views by section.' },
            ].map((ct) => (
              <div key={ct.name} className="bg-[#F9F9FB] rounded-xl p-3.5 border border-black/[0.05]">
                <p className="text-sm font-semibold text-[#1C1C1E] mb-1">{ct.name}</p>
                <p className="text-xs text-[#636366] mb-1">{ct.use}</p>
                <p className="text-xs text-[#8E8E93] italic">{ct.example}</p>
              </div>
            ))}
          </div>

          <SubHeading id="axes-aggregation">Axes & Aggregation</SubHeading>
          <P>
            The <span className="font-medium">Axes</span> section in the right panel controls what data is displayed on each axis and how values are aggregated.
          </P>

          <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-widest mb-2 mt-4">X Axis</p>
          <P>
            Select the column whose distinct values will form the categories on the horizontal axis (or the slices in a pie chart). This is typically a categorical or date column — a product name, a department, a month, a country.
          </P>

          <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-widest mb-2 mt-4">Y Axis</p>
          <P>
            Select the numeric column to measure. If you leave this blank, the chart defaults to counting rows (equivalent to COUNT). For a bar chart showing "revenue per category", the Y axis would be your <Code>revenue</Code> column combined with the SUM aggregation.
          </P>

          <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-widest mb-2 mt-4">Aggregation</p>
          <P>Since multiple rows often share the same X-axis value, ToolBI aggregates them into a single data point per category. The aggregation function controls how:</P>
          <ul className="space-y-2 mb-4">
            <Li><Code>COUNT</Code> — counts the number of rows in each category. Use for frequency analysis (how many orders per day, how many tickets per team).</Li>
            <Li><Code>SUM</Code> — adds up the Y-axis values within each category. Use for totals (total revenue by product, total hours logged by department).</Li>
            <Li><Code>AVG</Code> — calculates the arithmetic mean. Use for performance averages (average order value, average response time).</Li>
            <Li><Code>MIN</Code> / <Code>MAX</Code> — finds the smallest or largest value per category. Use for identifying outliers (cheapest product per supplier, longest resolution time per agent).</Li>
            <Li><Code>COUNT DISTINCT</Code> — counts unique values of the Y-axis column per category. Use for cardinality (unique customers per region, distinct products sold per month).</Li>
          </ul>

          <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-widest mb-2 mt-4">Group By</p>
          <P>
            Group By adds a second categorical dimension, splitting each X-axis bar into colour-coded segments. For example, if X is <Code>month</Code>, Y is <Code>revenue</Code> (SUM), and Group By is <Code>region</Code>, each monthly bar will be broken into regions. Currently Group By is most effective with bar and pie chart types.
          </P>

          <SubHeading id="filters">Filters</SubHeading>
          <P>
            Filters narrow down the rows included in a chart's query. They are applied before aggregation, so only the matching rows are counted or summed. Each filter targets one column and applies one operator.
          </P>
          <P>
            Click <span className="font-medium">Add</span> in the Filters section to add a filter row. Select the column to filter on, choose an operator, and enter a value. You can add multiple filters — all of them are applied simultaneously (AND logic).
          </P>
          <P>The available operators depend on the column type:</P>
          <ul className="space-y-2 mb-4">
            <Li><Code>=</Code> <span className="text-[#636366]">(equals)</span> — exact match. Works on all types. For text: case-sensitive.</Li>
            <Li><Code>≠</Code> <span className="text-[#636366]">(not equals)</span> — excludes rows with this exact value.</Li>
            <Li><Code>contains</Code> — partial text match. Useful for filtering descriptions, notes, or product names that include a word.</Li>
            <Li><Code>&gt;</Code> / <Code>&lt;</Code> <span className="text-[#636366]">(greater / less than)</span> — numeric and date comparisons.</Li>
            <Li><Code>≥</Code> / <Code>≤</Code> <span className="text-[#636366]">(greater or equal / less or equal)</span> — inclusive range boundaries.</Li>
            <Li><Code>in</Code> — matches any value from a comma-separated list. Enter values like <Code>London, Paris, Berlin</Code>. Useful for filtering to a fixed set of categories.</Li>
          </ul>
          <TipBox>
            When you select a column in a filter row, the value input shows an autocomplete dropdown of up to 50 distinct values from that column. You can pick a suggestion or type any custom value — both are valid.
          </TipBox>

          <SubHeading id="appearance">Appearance</SubHeading>
          <P>
            The <span className="font-medium">Appearance</span> section controls the visual presentation of the chart.
          </P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium text-[#1C1C1E]">Title</span> — a human-readable label displayed above the chart on the Dashboard. Leave it blank to show no title.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Color Palette</span> — choose from solid or gradient colour presets. Solid palettes apply flat colours; gradient palettes apply smooth colour transitions (top to bottom on bars, per-slice on pie charts). Click the palette preview to open the picker.</Li>
          </ul>

          <SubHeading id="saving-charts">Saving Charts</SubHeading>
          <P>
            Click <span className="font-medium">Save Chart</span> at the bottom of the right panel to add the chart to the current report. If you click on an existing chart to edit it, the button changes to <span className="font-medium">Update Chart</span>. After saving, the chart appears in the canvas area where you can resize and drag it.
          </P>
          <InfoBox>
            Charts are saved to the local SQLite database immediately. No manual export step is needed. The report and all its charts persist between app restarts.
          </InfoBox>
        </section>

        <section className="mb-12">
          <SectionHeading id="dashboard">
            <LayoutDashboard size={18} className="text-[#007AFF]" />
            Dashboard
          </SectionHeading>
          <P>
            Each report has a corresponding Dashboard view, accessible via the <span className="font-medium">Dashboards</span> section in the sidebar. The Dashboard displays all charts from the report on a free-form canvas where you can arrange and resize them interactively.
          </P>

          <SubHeading id="cross-filtering">Cross-Filtering</SubHeading>
          <P>
            Cross-filtering is a powerful way to drill into your data interactively. When you click on a data point in any chart — a bar, a pie slice, a scatter point — all other charts on the Dashboard dim all categories except the one you clicked, effectively filtering the entire Dashboard to that value.
          </P>
          <P>
            For example: if you click "North" in a revenue-by-region bar chart, all other charts will highlight only data from the North region and fade out the rest. Click the same point again, or click anywhere outside a data point, to clear the cross-filter.
          </P>
          <TipBox>
            Cross-filtering works best when multiple charts are based on the same dataset and share a common dimension (like region, date, or category). Mix a pie chart for composition, a line chart for trends, and a bar chart for totals to get the most from a single click.
          </TipBox>

          <SubHeading id="global-filters">Global Filters Panel</SubHeading>
          <P>
            The Global Filters panel (accessible via the filter icon in the Dashboard toolbar) applies filters that affect all charts simultaneously. Unlike chart-level filters (which are baked into a single chart's config), global filters are applied interactively at view time.
          </P>
          <P>
            Each column from the charts in the current report is listed as a filterable field. The UI adapts to the column type:
          </P>
          <ul className="space-y-2 mb-4">
            <Li><span className="font-medium text-[#1C1C1E]">Text columns</span> — shows a multi-select checklist if there are fewer than 50 distinct values, or a free-text contains input for larger datasets.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Number columns</span> — shows min and max range inputs.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Date columns</span> — shows from/to date pickers.</Li>
            <Li><span className="font-medium text-[#1C1C1E]">Boolean columns</span> — shows a True / False / Any selector.</Li>
          </ul>
          <P>
            Click <span className="font-medium">Apply Filters</span> to push the current selections to all charts. Click <span className="font-medium">Clear All</span> to reset. Global filters are session-only — they do not persist when you reload the app.
          </P>
        </section>

        <section className="mb-8">
          <SectionHeading id="examples">
            <TrendingUp size={18} className="text-[#007AFF]" />
            Example Reports
          </SectionHeading>
          <P>
            The five examples below are ready-to-build reports covering common real-world use cases. Each example lists the exact CSV structure you need, a step-by-step configuration guide, and the insights each chart will surface.
          </P>

          <ExampleReport
            id="example-1"
            number={1}
            title="Monthly Sales Performance by Category"
            role="Retail / E-commerce"
            icon={BarChart2}
            overview="Track how revenue and order volume evolve month-by-month across product categories. This report helps a sales or operations manager identify which categories drive the most revenue, spot seasonal patterns, and compare performance across periods."
            columns={[
              { name: 'order_date', type: 'date', description: 'Date the order was placed (YYYY-MM-DD)' },
              { name: 'category', type: 'text', description: 'Product category (e.g. Electronics, Clothing)' },
              { name: 'product_name', type: 'text', description: 'Individual product name' },
              { name: 'quantity', type: 'number', description: 'Number of units sold' },
              { name: 'unit_price', type: 'number', description: 'Price per unit at time of sale' },
              { name: 'revenue', type: 'number', description: 'Total line revenue (quantity × unit_price)' },
              { name: 'region', type: 'text', description: 'Sales region (e.g. North, South, East, West)' },
            ]}
            steps={[
              { step: 'Upload your CSV', detail: 'Go to Data Sources and upload the orders file.' },
              { step: 'Add a computed column', detail: 'Name it month, expression STRFTIME(order_date, \'%Y-%m\'), type text. This groups orders by year-month.' },
              { step: 'Create a new report', detail: 'Click + next to Reports in the sidebar.' },
              { step: 'Chart 1 — Revenue over time', detail: 'Bar chart. X Axis: month, Y Axis: revenue, Aggregation: SUM. Title: "Monthly Revenue".' },
              { step: 'Chart 2 — Revenue by category', detail: 'Pie chart. X Axis: category, Y Axis: revenue, Aggregation: SUM. Title: "Revenue Mix by Category".' },
              { step: 'Chart 3 — Order volume trend', detail: 'Line chart. X Axis: month, Y Axis: quantity, Aggregation: SUM. Title: "Units Sold per Month".' },
              { step: 'Open the Dashboard', detail: 'Arrange the three charts side by side. Click a pie slice to cross-filter the line and bar charts to that category.' },
            ]}
            insights={[
              'Which month generated the highest total revenue and whether the pattern repeats year-over-year.',
              'Which product category contributes the largest share of revenue.',
              'Whether unit volume and revenue move in sync, or whether price changes are masking volume shifts.',
              'Clicking a region in the pie chart will filter all other charts to show only that region\'s performance.',
            ]}
            tip="Add a filter on region to this report to create a region-specific version. Use the Global Filters panel on the Dashboard to switch between regions interactively without editing the charts."
          />

          <ExampleReport
            id="example-2"
            number={2}
            title="Website Traffic Source Analysis"
            role="Marketing / Growth"
            icon={TrendingUp}
            overview="Understand which channels drive traffic, conversions, and engagement to your website. This report is essential for marketing teams deciding where to allocate budget — it surfaces which sources bring the most sessions, which convert best, and how traffic trends over time."
            columns={[
              { name: 'date', type: 'date', description: 'Date of the analytics snapshot (YYYY-MM-DD)' },
              { name: 'source', type: 'text', description: 'Traffic source (organic, paid, email, referral, direct)' },
              { name: 'medium', type: 'text', description: 'Marketing medium (cpc, email, social, none)' },
              { name: 'sessions', type: 'number', description: 'Number of sessions from this source on this date' },
              { name: 'conversions', type: 'number', description: 'Number of goal completions (purchases, sign-ups)' },
              { name: 'bounce_rate', type: 'number', description: 'Percentage of single-page sessions (0–100)' },
              { name: 'avg_session_duration', type: 'number', description: 'Average session duration in seconds' },
            ]}
            steps={[
              { step: 'Upload the analytics CSV', detail: 'Data Sources → Upload Dataset.' },
              { step: 'Add a computed column for conversion rate', detail: 'Name it conv_rate, expression ROUND(conversions * 100.0 / NULLIF(sessions, 0), 2), type number.' },
              { step: 'Chart 1 — Sessions over time', detail: 'Line chart. X Axis: date, Y Axis: sessions, Aggregation: SUM. Title: "Daily Sessions".' },
              { step: 'Chart 2 — Sessions by source', detail: 'Pie chart. X Axis: source, Y Axis: sessions, Aggregation: SUM. Title: "Traffic Mix".' },
              { step: 'Chart 3 — Conversions by source', detail: 'Bar chart. X Axis: source, Y Axis: conversions, Aggregation: SUM. Title: "Conversions by Channel".' },
              { step: 'Chart 4 — Avg conversion rate by source', detail: 'Bar chart. X Axis: source, Y Axis: conv_rate, Aggregation: AVG. Title: "Conversion Rate % by Channel".' },
              { step: 'Apply a date filter', detail: 'In Chart 1 add a filter: date ≥ your start date. This focuses the view on a specific period.' },
            ]}
            insights={[
              'Which channel drives the most raw traffic vs which drives the best conversion rate — these are often different channels.',
              'How total session volume trends week-over-week or month-over-month.',
              'Whether paid traffic is outperforming organic on conversion rate, justifying budget allocation.',
              'Clicking a source in the traffic mix pie will cross-filter all charts to show only that channel\'s trends.',
            ]}
            tip="Export your analytics platform's data as CSV (Google Analytics, Plausible, Fathom all support this). For weekly trend analysis, add a computed column week using STRFTIME(date, '%Y-W%W') and use it as the X axis in a line chart."
          />

          <ExampleReport
            id="example-3"
            number={3}
            title="HR Headcount & Salary Analysis"
            role="Human Resources"
            icon={Users}
            overview="Give HR leaders and people managers a clear view of how the workforce is distributed across departments, roles, and seniority levels, and how salary spend is allocated. This report helps with headcount planning, pay equity reviews, and identifying where growth is concentrated."
            columns={[
              { name: 'employee_id', type: 'number', description: 'Unique identifier for each employee' },
              { name: 'department', type: 'text', description: 'Department name (Engineering, Sales, Support, etc.)' },
              { name: 'role', type: 'text', description: 'Job title or role (Engineer, Manager, Analyst, etc.)' },
              { name: 'level', type: 'text', description: 'Seniority level (Junior, Mid, Senior, Lead, Director)' },
              { name: 'hire_date', type: 'date', description: 'Date the employee joined (YYYY-MM-DD)' },
              { name: 'salary', type: 'number', description: 'Annual gross salary in local currency' },
              { name: 'status', type: 'text', description: 'Employment status (active, on-leave, terminated)' },
            ]}
            steps={[
              { step: 'Upload the employee CSV', detail: 'Data Sources → Upload Dataset.' },
              { step: 'Add a computed column for hire year', detail: 'Name it hire_year, expression DATE_PART(\'year\', hire_date), type number. Useful for cohort analysis.' },
              { step: 'Add a filter on status', detail: 'In all charts, add a filter status = active to focus on current employees only.' },
              { step: 'Chart 1 — Headcount by department', detail: 'Bar chart. X Axis: department, Y Axis: employee_id, Aggregation: COUNT. Title: "Headcount by Department".' },
              { step: 'Chart 2 — Salary spend by department', detail: 'Bar chart. X Axis: department, Y Axis: salary, Aggregation: SUM. Title: "Total Salary Spend".' },
              { step: 'Chart 3 — Average salary by level', detail: 'Bar chart. X Axis: level, Y Axis: salary, Aggregation: AVG. Title: "Average Salary by Seniority".' },
              { step: 'Chart 4 — Hiring trend by year', detail: 'Bar chart. X Axis: hire_year, Y Axis: employee_id, Aggregation: COUNT. Title: "Hires per Year".' },
            ]}
            insights={[
              'Which departments have the largest headcount and whether headcount is proportional to salary spend.',
              'Whether salary scales consistently with seniority level or if there are anomalies to investigate.',
              'In which years the company hired most aggressively — useful for understanding growth history.',
              'Clicking a department on the headcount chart will cross-filter salary and level charts to show that department\'s specific compensation profile.',
            ]}
            tip="Join this dataset with a performance-review CSV (keyed on employee_id) to correlate salary level with performance rating — a powerful input for salary review cycles. Use INNER JOIN so only employees with both records are included."
          />

          <ExampleReport
            id="example-4"
            number={4}
            title="Customer Support Ticket Analysis"
            role="Customer Support / Operations"
            icon={Headphones}
            overview="Help support managers understand ticket volume, category distribution, resolution time, and agent workload. This report identifies where the most support effort is concentrated, which issue types take longest to resolve, and how the team's throughput trends over time."
            columns={[
              { name: 'ticket_id', type: 'number', description: 'Unique ticket identifier' },
              { name: 'created_date', type: 'date', description: 'Date ticket was opened (YYYY-MM-DD)' },
              { name: 'category', type: 'text', description: 'Issue type (Billing, Technical, Account, Shipping, etc.)' },
              { name: 'priority', type: 'text', description: 'Ticket priority (low, medium, high, critical)' },
              { name: 'status', type: 'text', description: 'Current status (open, in-progress, resolved, closed)' },
              { name: 'agent', type: 'text', description: 'Name or ID of the assigned support agent' },
              { name: 'resolution_hours', type: 'number', description: 'Hours from open to resolved (null if unresolved)' },
            ]}
            steps={[
              { step: 'Upload the tickets CSV', detail: 'Data Sources → Upload Dataset.' },
              { step: 'Add a computed column for month', detail: 'Name it month, expression STRFTIME(created_date, \'%Y-%m\'), type text.' },
              { step: 'Add a computed column for SLA breach', detail: 'Name it breached_sla, expression CASE WHEN resolution_hours > 24 THEN 1 ELSE 0 END, type number.' },
              { step: 'Chart 1 — Ticket volume by category', detail: 'Bar chart. X Axis: category, Y Axis: ticket_id, Aggregation: COUNT. Title: "Tickets by Category".' },
              { step: 'Chart 2 — Ticket trend over time', detail: 'Line chart. X Axis: month, Y Axis: ticket_id, Aggregation: COUNT. Title: "Monthly Ticket Volume".' },
              { step: 'Chart 3 — Avg resolution time by category', detail: 'Bar chart. X Axis: category, Y Axis: resolution_hours, Aggregation: AVG. Title: "Avg Resolution Time (hrs)".' },
              { step: 'Chart 4 — Tickets per agent', detail: 'Bar chart. X Axis: agent, Y Axis: ticket_id, Aggregation: COUNT. Title: "Workload by Agent". Add filter status = resolved.' },
              { step: 'Add priority filter', detail: 'On Chart 3 add a filter priority = high to show resolution time for high-priority tickets specifically.' },
            ]}
            insights={[
              'Which issue categories generate the most ticket volume — often the best target for self-service documentation.',
              'How ticket volume trends month-over-month, flagging spikes that may correlate with product releases or incidents.',
              'Which categories take longest to resolve, highlighting areas needing process improvement or additional training.',
              'Whether workload is evenly distributed across agents or whether some agents are consistently overloaded.',
            ]}
            tip="Use the Global Filters date range on the Dashboard to compare two time periods side by side by opening two browser tabs with different filter ranges."
          />

          <ExampleReport
            id="example-5"
            number={5}
            title="Product Inventory & Supplier Analysis"
            role="Operations / Supply Chain"
            icon={Package}
            overview="Give operations teams visibility into stock levels, inventory valuation, and supplier concentration. This report helps identify which products need reordering, which suppliers carry the most risk, and where inventory investment is heaviest."
            columns={[
              { name: 'product_id', type: 'text', description: 'Unique SKU or product identifier' },
              { name: 'product_name', type: 'text', description: 'Human-readable product name' },
              { name: 'category', type: 'text', description: 'Product category (Electronics, Apparel, Food, etc.)' },
              { name: 'supplier', type: 'text', description: 'Supplier company name' },
              { name: 'stock_qty', type: 'number', description: 'Current units in stock' },
              { name: 'unit_cost', type: 'number', description: 'Cost per unit from the supplier' },
              { name: 'reorder_point', type: 'number', description: 'Minimum stock level before reorder is needed' },
              { name: 'lead_time_days', type: 'number', description: 'Days from order to delivery for this supplier' },
            ]}
            steps={[
              { step: 'Upload the inventory CSV', detail: 'Data Sources → Upload Dataset.' },
              { step: 'Add a computed column for inventory value', detail: 'Name it inventory_value, expression stock_qty * unit_cost, type number.' },
              { step: 'Add a computed column for stock status', detail: 'Name it needs_reorder, expression CASE WHEN stock_qty <= reorder_point THEN 1 ELSE 0 END, type number.' },
              { step: 'Chart 1 — Stock quantity by category', detail: 'Bar chart. X Axis: category, Y Axis: stock_qty, Aggregation: SUM. Title: "Stock by Category".' },
              { step: 'Chart 2 — Inventory value by supplier', detail: 'Bar chart. X Axis: supplier, Y Axis: inventory_value, Aggregation: SUM. Title: "Inventory Value by Supplier".' },
              { step: 'Chart 3 — Items needing reorder', detail: 'Bar chart. X Axis: category, Y Axis: needs_reorder, Aggregation: SUM. Add filter: needs_reorder = 1. Title: "Reorder Required by Category".' },
              { step: 'Chart 4 — Avg lead time by supplier', detail: 'Bar chart. X Axis: supplier, Y Axis: lead_time_days, Aggregation: AVG. Title: "Avg Lead Time by Supplier".' },
              { step: 'Join with purchase orders', detail: 'If you have a purchase_orders CSV with product_id, join it LEFT on product_id to see outstanding order volumes alongside current stock.' },
            ]}
            insights={[
              'Which product categories hold the most inventory by unit count and by value — they carry the most financial risk.',
              'Which suppliers represent the highest inventory investment, indicating single-source dependency risk.',
              'How many products per category are currently below reorder point and need urgent action.',
              'Which suppliers have the longest lead times, informing safety-stock calculations and reorder timing.',
            ]}
            tip="Add a filter to Chart 1 for needs_reorder = 1 to create a reorder-focused view. On the Dashboard, combine it with the lead-time chart and cross-filter by supplier to instantly see which at-risk products have the longest resupply delay."
          />
        </section>

      </div>
    </div>
  )
}
