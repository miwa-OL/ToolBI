from datetime import datetime
from sqlmodel import Field, SQLModel


class ComputedColumn(SQLModel, table=True):
    id: str = Field(primary_key=True)
    dataset_id: str
    name: str
    expression: str
    result_type: str


class JoinedDataset(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    left_dataset_id: str
    right_dataset_id: str
    left_key: str
    right_key: str
    join_type: str
    created_at: datetime


class DatasetRecord(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    original_filename: str
    row_count: int
    columns: str
    created_at: datetime


class Report(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    created_at: datetime
    updated_at: datetime


class ChartConfig(SQLModel, table=True):
    id: str = Field(primary_key=True)
    report_id: str = Field(foreign_key="report.id")
    title: str
    chart_type: str
    dataset_id: str
    x_field: str
    y_field: str | None = Field(default=None)
    aggregation: str
    group_by: str
    filters: str
    color_field: str | None = Field(default=None)
    color_palette: str
    sort_order: int


class LayoutItem(SQLModel, table=True):
    id: str = Field(primary_key=True)
    report_id: str = Field(foreign_key="report.id")
    chart_id: str = Field(foreign_key="chartconfig.id")
    x: int
    y: int
    w: int
    h: int
