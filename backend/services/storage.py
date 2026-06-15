from datetime import datetime
from uuid import uuid4

from sqlmodel import Session, SQLModel, create_engine, select

from config import DB_PATH
from models import ChartConfig, ComputedColumn, DatasetRecord, JoinedDataset, LayoutItem, Report

engine = create_engine(f"sqlite:///{DB_PATH}")


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def save_dataset_record(
    id: str,
    name: str,
    filename: str,
    row_count: int,
    columns_json: str,
) -> DatasetRecord:
    record = DatasetRecord(
        id=id,
        name=name,
        original_filename=filename,
        row_count=row_count,
        columns=columns_json,
        created_at=datetime.utcnow(),
    )
    with Session(engine) as session:
        session.add(record)
        session.commit()
        session.refresh(record)
        return record


def list_dataset_records() -> list[DatasetRecord]:
    with Session(engine) as session:
        return list(session.exec(select(DatasetRecord)).all())


def get_dataset_record(id: str) -> DatasetRecord | None:
    with Session(engine) as session:
        return session.get(DatasetRecord, id)


def delete_dataset_record(id: str) -> None:
    with Session(engine) as session:
        record = session.get(DatasetRecord, id)
        if record:
            session.delete(record)
            session.commit()


def add_computed_column(
    id: str, dataset_id: str, name: str, expression: str, result_type: str
) -> ComputedColumn:
    col = ComputedColumn(
        id=id, dataset_id=dataset_id, name=name, expression=expression, result_type=result_type
    )
    with Session(engine) as session:
        session.add(col)
        session.commit()
        session.refresh(col)
        return col


def list_computed_columns(dataset_id: str) -> list[ComputedColumn]:
    with Session(engine) as session:
        return list(
            session.exec(
                select(ComputedColumn).where(ComputedColumn.dataset_id == dataset_id)
            ).all()
        )


def get_computed_column(col_id: str) -> ComputedColumn | None:
    with Session(engine) as session:
        return session.get(ComputedColumn, col_id)


def delete_computed_column(col_id: str) -> None:
    with Session(engine) as session:
        col = session.get(ComputedColumn, col_id)
        if col:
            session.delete(col)
            session.commit()


def create_joined_dataset(
    id: str,
    name: str,
    left_dataset_id: str,
    right_dataset_id: str,
    left_key: str,
    right_key: str,
    join_type: str,
) -> JoinedDataset:
    joined = JoinedDataset(
        id=id,
        name=name,
        left_dataset_id=left_dataset_id,
        right_dataset_id=right_dataset_id,
        left_key=left_key,
        right_key=right_key,
        join_type=join_type,
        created_at=datetime.utcnow(),
    )
    with Session(engine) as session:
        session.add(joined)
        session.commit()
        session.refresh(joined)
        return joined


def list_joined_datasets() -> list[JoinedDataset]:
    with Session(engine) as session:
        return list(session.exec(select(JoinedDataset)).all())


def get_joined_dataset(id: str) -> JoinedDataset | None:
    with Session(engine) as session:
        return session.get(JoinedDataset, id)


def delete_joined_dataset(id: str) -> None:
    with Session(engine) as session:
        joined = session.get(JoinedDataset, id)
        if joined:
            session.delete(joined)
            session.commit()


def create_report(id: str, name: str) -> Report:
    now = datetime.utcnow()
    report = Report(id=id, name=name, created_at=now, updated_at=now)
    with Session(engine) as session:
        session.add(report)
        session.commit()
        session.refresh(report)
        return report


def list_reports() -> list[Report]:
    with Session(engine) as session:
        return list(session.exec(select(Report).order_by(Report.created_at)).all())


def get_report(id: str) -> Report | None:
    with Session(engine) as session:
        return session.get(Report, id)


def update_report_name(id: str, name: str) -> Report | None:
    with Session(engine) as session:
        report = session.get(Report, id)
        if not report:
            return None
        report.name = name
        report.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(report)
        return report


def delete_report(id: str) -> None:
    with Session(engine) as session:
        for item in list(session.exec(select(LayoutItem).where(LayoutItem.report_id == id)).all()):
            session.delete(item)
        for chart in list(session.exec(select(ChartConfig).where(ChartConfig.report_id == id)).all()):
            session.delete(chart)
        report = session.get(Report, id)
        if report:
            session.delete(report)
        session.commit()


def count_charts(report_id: str) -> int:
    with Session(engine) as session:
        return len(session.exec(select(ChartConfig).where(ChartConfig.report_id == report_id)).all())


def list_charts(report_id: str) -> list[ChartConfig]:
    with Session(engine) as session:
        return list(
            session.exec(
                select(ChartConfig)
                .where(ChartConfig.report_id == report_id)
                .order_by(ChartConfig.sort_order)
            ).all()
        )


def get_chart(chart_id: str) -> ChartConfig | None:
    with Session(engine) as session:
        return session.get(ChartConfig, chart_id)


def add_chart(
    id: str,
    report_id: str,
    title: str,
    chart_type: str,
    dataset_id: str,
    x_field: str,
    y_field: str | None,
    aggregation: str,
    group_by_json: str,
    filters_json: str,
    color_field: str | None,
    color_palette_json: str,
    sort_order: int,
) -> ChartConfig:
    chart = ChartConfig(
        id=id,
        report_id=report_id,
        title=title,
        chart_type=chart_type,
        dataset_id=dataset_id,
        x_field=x_field,
        y_field=y_field,
        aggregation=aggregation,
        group_by=group_by_json,
        filters=filters_json,
        color_field=color_field,
        color_palette=color_palette_json,
        sort_order=sort_order,
    )
    with Session(engine) as session:
        session.add(chart)
        report = session.get(Report, report_id)
        if report:
            report.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(chart)
        return chart


def update_chart(
    chart_id: str,
    title: str,
    chart_type: str,
    dataset_id: str,
    x_field: str,
    y_field: str | None,
    aggregation: str,
    group_by_json: str,
    filters_json: str,
    color_field: str | None,
    color_palette_json: str,
    sort_order: int,
) -> ChartConfig | None:
    with Session(engine) as session:
        chart = session.get(ChartConfig, chart_id)
        if not chart:
            return None
        chart.title = title
        chart.chart_type = chart_type
        chart.dataset_id = dataset_id
        chart.x_field = x_field
        chart.y_field = y_field
        chart.aggregation = aggregation
        chart.group_by = group_by_json
        chart.filters = filters_json
        chart.color_field = color_field
        chart.color_palette = color_palette_json
        chart.sort_order = sort_order
        report = session.get(Report, chart.report_id)
        if report:
            report.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(chart)
        return chart


def delete_chart(chart_id: str) -> None:
    with Session(engine) as session:
        chart = session.get(ChartConfig, chart_id)
        if chart:
            report = session.get(Report, chart.report_id)
            if report:
                report.updated_at = datetime.utcnow()
            session.delete(chart)
            session.commit()


def list_layout(report_id: str) -> list[LayoutItem]:
    with Session(engine) as session:
        return list(session.exec(select(LayoutItem).where(LayoutItem.report_id == report_id)).all())


def replace_layout(report_id: str, items: list[dict]) -> list[LayoutItem]:
    with Session(engine) as session:
        for item in list(session.exec(select(LayoutItem).where(LayoutItem.report_id == report_id)).all()):
            session.delete(item)
        new_items = [
            LayoutItem(
                id=str(uuid4()),
                report_id=report_id,
                chart_id=data["chart_id"],
                x=data["x"],
                y=data["y"],
                w=data["w"],
                h=data["h"],
            )
            for data in items
        ]
        for item in new_items:
            session.add(item)
        report = session.get(Report, report_id)
        if report:
            report.updated_at = datetime.utcnow()
        session.commit()
        for item in new_items:
            session.refresh(item)
        return new_items
