import csv
import io
import json
import re
import zipfile
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models import ChartConfig, LayoutItem
from schemas import (
    ChartConfigCreate,
    ChartConfigOut,
    FilterSpec,
    LayoutItemIn,
    LayoutItemOut,
    ReportCreate,
    ReportDetail,
    ReportSummary,
    ReportUpdate,
)
from services.query_engine import resolve_parquet, run_aggregation
from services.storage import (
    add_chart,
    count_charts,
    create_report,
    delete_chart,
    delete_report,
    get_chart,
    get_dataset_record,
    get_joined_dataset,
    get_report,
    list_charts,
    list_computed_columns,
    list_layout,
    list_reports,
    replace_layout,
    update_chart,
    update_report_name,
)

router = APIRouter(prefix="/reports")


def _chart_to_out(chart: ChartConfig) -> ChartConfigOut:
    return ChartConfigOut(
        id=chart.id,
        report_id=chart.report_id,
        title=chart.title,
        chart_type=chart.chart_type,
        dataset_id=chart.dataset_id,
        x_field=chart.x_field,
        y_field=chart.y_field,
        aggregation=chart.aggregation,
        group_by=json.loads(chart.group_by),
        filters=[FilterSpec(**f) for f in json.loads(chart.filters)],
        color_field=chart.color_field,
        color_palette=json.loads(chart.color_palette),
        sort_order=chart.sort_order,
    )


def _layout_to_out(item: LayoutItem) -> LayoutItemOut:
    return LayoutItemOut(
        id=item.id,
        report_id=item.report_id,
        chart_id=item.chart_id,
        x=item.x,
        y=item.y,
        w=item.w,
        h=item.h,
    )


@router.post("", response_model=ReportSummary, status_code=201)
def create_new_report(body: ReportCreate):
    report = create_report(id=str(uuid4()), name=body.name)
    return ReportSummary(
        id=report.id,
        name=report.name,
        chart_count=0,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.get("", response_model=list[ReportSummary])
def list_all_reports():
    reports = list_reports()
    return [
        ReportSummary(
            id=r.id,
            name=r.name,
            chart_count=count_charts(r.id),
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in reports
    ]


@router.get("/{report_id}", response_model=ReportDetail)
def get_report_detail(report_id: str):
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportDetail(
        id=report.id,
        name=report.name,
        created_at=report.created_at,
        updated_at=report.updated_at,
        charts=[_chart_to_out(c) for c in list_charts(report_id)],
        layout=[_layout_to_out(i) for i in list_layout(report_id)],
    )


@router.put("/{report_id}", response_model=ReportSummary)
def rename_report(report_id: str, body: ReportUpdate):
    report = update_report_name(report_id, body.name)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportSummary(
        id=report.id,
        name=report.name,
        chart_count=count_charts(report.id),
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.delete("/{report_id}", status_code=204)
def remove_report(report_id: str):
    if not get_report(report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    delete_report(report_id)


@router.post("/{report_id}/charts", response_model=ChartConfigOut, status_code=201)
def add_chart_to_report(report_id: str, body: ChartConfigCreate):
    if not get_report(report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    chart = add_chart(
        id=str(uuid4()),
        report_id=report_id,
        title=body.title,
        chart_type=body.chart_type,
        dataset_id=body.dataset_id,
        x_field=body.x_field,
        y_field=body.y_field,
        aggregation=body.aggregation,
        group_by_json=json.dumps(body.group_by),
        filters_json=json.dumps([f.model_dump() for f in body.filters]),
        color_field=body.color_field,
        color_palette_json=json.dumps(body.color_palette),
        sort_order=body.sort_order,
    )
    return _chart_to_out(chart)


@router.put("/{report_id}/charts/{chart_id}", response_model=ChartConfigOut)
def update_chart_config(report_id: str, chart_id: str, body: ChartConfigCreate):
    existing = get_chart(chart_id)
    if not existing or existing.report_id != report_id:
        raise HTTPException(status_code=404, detail="Chart not found")
    chart = update_chart(
        chart_id=chart_id,
        title=body.title,
        chart_type=body.chart_type,
        dataset_id=body.dataset_id,
        x_field=body.x_field,
        y_field=body.y_field,
        aggregation=body.aggregation,
        group_by_json=json.dumps(body.group_by),
        filters_json=json.dumps([f.model_dump() for f in body.filters]),
        color_field=body.color_field,
        color_palette_json=json.dumps(body.color_palette),
        sort_order=body.sort_order,
    )
    return _chart_to_out(chart)


@router.delete("/{report_id}/charts/{chart_id}", status_code=204)
def remove_chart(report_id: str, chart_id: str):
    existing = get_chart(chart_id)
    if not existing or existing.report_id != report_id:
        raise HTTPException(status_code=404, detail="Chart not found")
    delete_chart(chart_id)


@router.put("/{report_id}/layout", response_model=list[LayoutItemOut])
def set_layout(report_id: str, body: list[LayoutItemIn]):
    if not get_report(report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    items = replace_layout(report_id, [item.model_dump() for item in body])
    return [_layout_to_out(i) for i in items]


@router.get("/{report_id}/export/csv")
def export_csv(report_id: str):
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    charts = list_charts(report_id)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for chart in charts:
            filters = [FilterSpec(**f) for f in json.loads(chart.filters)]
            group_by = json.loads(chart.group_by)

            try:
                record = get_dataset_record(chart.dataset_id)
                if record:
                    computed = list_computed_columns(chart.dataset_id)
                    computed_specs = (
                        [{"name": c.name, "expression": c.expression} for c in computed]
                        if computed
                        else None
                    )
                    rows = run_aggregation(
                        dataset_id=chart.dataset_id,
                        x_field=chart.x_field,
                        y_field=chart.y_field,
                        aggregation=chart.aggregation,
                        group_by=group_by,
                        filters=filters,
                        limit=10000,
                        computed_columns=computed_specs,
                    )
                else:
                    joined = get_joined_dataset(chart.dataset_id)
                    if not joined:
                        continue
                    rows = run_aggregation(
                        dataset_id=None,
                        x_field=chart.x_field,
                        y_field=chart.y_field,
                        aggregation=chart.aggregation,
                        group_by=group_by,
                        filters=filters,
                        limit=10000,
                        join_spec={
                            "left_path": resolve_parquet(joined.left_dataset_id),
                            "right_path": resolve_parquet(joined.right_dataset_id),
                            "left_key": joined.left_key,
                            "right_key": joined.right_key,
                            "join_type": joined.join_type,
                        },
                    )
            except Exception:
                continue

            if not rows:
                continue

            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)

            safe_title = re.sub(r"[^\w\s-]", "", chart.title).strip().replace(" ", "_")
            filename = f"{safe_title or chart.id}.csv"
            zf.writestr(filename, buf.getvalue())

    zip_buffer.seek(0)
    safe_name = re.sub(r"[^\w\s-]", "", report.name).strip().replace(" ", "_") or report_id
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.zip"'},
    )
