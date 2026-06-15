from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel


class ColumnSchema(BaseModel):
    name: str
    type: str


class DatasetMeta(BaseModel):
    id: str
    name: str
    original_filename: str
    row_count: int
    columns: list[ColumnSchema]
    created_at: datetime


class DatasetPreview(BaseModel):
    columns: list[ColumnSchema]
    rows: list[dict]
    total_rows: int
    page: int
    page_size: int


class FilterSpec(BaseModel):
    field: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"]
    value: Any


class AggregationRequest(BaseModel):
    dataset_id: str
    x_field: str
    y_field: str | None = None
    aggregation: Literal["count", "sum", "avg", "min", "max", "distinct_count"] = "count"
    group_by: list[str] = []
    filters: list[FilterSpec] = []
    limit: int = 1000


class AggregationResponse(BaseModel):
    rows: list[dict]
    row_count: int


class RawQueryRequest(BaseModel):
    dataset_id: str
    sql: str


class ComputedColumnCreate(BaseModel):
    name: str
    expression: str
    result_type: Literal["number", "text", "boolean"]


class ComputedColumnOut(BaseModel):
    id: str
    dataset_id: str
    name: str
    expression: str
    result_type: str


class JoinedDatasetCreate(BaseModel):
    name: str
    left_dataset_id: str
    right_dataset_id: str
    left_key: str
    right_key: str
    join_type: Literal["inner", "left", "right"]


class JoinedDatasetOut(BaseModel):
    id: str
    name: str
    left_dataset_id: str
    right_dataset_id: str
    left_key: str
    right_key: str
    join_type: str
    created_at: datetime
    columns: list[ColumnSchema]


class JoinPreviewResponse(BaseModel):
    columns: list[ColumnSchema]
    rows: list[dict]


class ReportCreate(BaseModel):
    name: str


class ReportUpdate(BaseModel):
    name: str


class ReportSummary(BaseModel):
    id: str
    name: str
    chart_count: int
    created_at: datetime
    updated_at: datetime


class ChartConfigCreate(BaseModel):
    title: str
    chart_type: Literal["bar", "line", "area", "pie", "scatter", "heatmap"]
    dataset_id: str
    x_field: str
    y_field: str | None = None
    aggregation: Literal["count", "sum", "avg", "min", "max", "distinct_count"] = "count"
    group_by: list[str] = []
    filters: list[FilterSpec] = []
    color_field: str | None = None
    color_palette: list[str] = []
    sort_order: int = 0


class ChartConfigOut(BaseModel):
    id: str
    report_id: str
    title: str
    chart_type: str
    dataset_id: str
    x_field: str
    y_field: str | None
    aggregation: str
    group_by: list[str]
    filters: list[FilterSpec]
    color_field: str | None
    color_palette: list[str]
    sort_order: int


class LayoutItemIn(BaseModel):
    chart_id: str
    x: int
    y: int
    w: int
    h: int


class LayoutItemOut(BaseModel):
    id: str
    report_id: str
    chart_id: str
    x: int
    y: int
    w: int
    h: int


class ReportDetail(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    charts: list[ChartConfigOut]
    layout: list[LayoutItemOut]
