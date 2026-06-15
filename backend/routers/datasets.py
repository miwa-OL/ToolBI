import json
from pathlib import Path
from uuid import uuid4

import duckdb
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from config import DATASETS_DIR
from schemas import (
    ColumnSchema,
    ComputedColumnCreate,
    ComputedColumnOut,
    DatasetMeta,
    DatasetPreview,
    JoinedDatasetCreate,
    JoinedDatasetOut,
    JoinPreviewResponse,
)
from services.csv_parser import parse_csv, save_as_parquet
from services.query_engine import validate_expression
from services.storage import (
    add_computed_column,
    create_joined_dataset,
    delete_computed_column,
    delete_dataset_record,
    delete_joined_dataset,
    get_computed_column,
    get_dataset_record,
    get_joined_dataset,
    list_computed_columns,
    list_dataset_records,
    list_joined_datasets,
    save_dataset_record,
)

router = APIRouter(prefix="/datasets")


def _to_meta(record) -> DatasetMeta:
    return DatasetMeta(
        id=record.id,
        name=record.name,
        original_filename=record.original_filename,
        row_count=record.row_count,
        columns=[ColumnSchema(**c) for c in json.loads(record.columns)],
        created_at=record.created_at,
    )


def _parquet_path(dataset_id: str) -> str:
    path = DATASETS_DIR / f"{dataset_id}.parquet"
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_id}")
    return path.as_posix().replace("'", "''")


def _merged_columns(left_id: str, right_id: str) -> list[ColumnSchema]:
    left_record = get_dataset_record(left_id)
    right_record = get_dataset_record(right_id)
    cols: list[ColumnSchema] = []
    seen: set[str] = set()
    for record in filter(None, [left_record, right_record]):
        for c in json.loads(record.columns):
            if c["name"] not in seen:
                cols.append(ColumnSchema(**c))
                seen.add(c["name"])
    return cols


def _to_joined_out(j) -> JoinedDatasetOut:
    return JoinedDatasetOut(
        id=j.id,
        name=j.name,
        left_dataset_id=j.left_dataset_id,
        right_dataset_id=j.right_dataset_id,
        left_key=j.left_key,
        right_key=j.right_key,
        join_type=j.join_type,
        created_at=j.created_at,
        columns=_merged_columns(j.left_dataset_id, j.right_dataset_id),
    )


@router.post("/upload", response_model=DatasetMeta, status_code=201)
async def upload_dataset(file: UploadFile = File(...)):
    dataset_id = str(uuid4())
    temp_path = DATASETS_DIR / f"{dataset_id}_tmp.csv"
    parquet_path = DATASETS_DIR / f"{dataset_id}.parquet"

    content = await file.read()
    temp_path.write_bytes(content)

    try:
        meta = parse_csv(temp_path)
        df = pd.read_csv(temp_path)
        save_as_parquet(df, parquet_path)
    finally:
        temp_path.unlink(missing_ok=True)

    name = Path(file.filename or "upload").stem
    record = save_dataset_record(
        id=dataset_id,
        name=name,
        filename=file.filename or "upload.csv",
        row_count=meta["row_count"],
        columns_json=json.dumps(meta["columns"]),
    )
    return _to_meta(record)


@router.get("", response_model=list[DatasetMeta])
def list_datasets():
    return [_to_meta(r) for r in list_dataset_records()]


@router.post("/join", response_model=JoinedDatasetOut, status_code=201)
def create_join(body: JoinedDatasetCreate):
    if not get_dataset_record(body.left_dataset_id):
        raise HTTPException(status_code=404, detail="Left dataset not found")
    if not get_dataset_record(body.right_dataset_id):
        raise HTTPException(status_code=404, detail="Right dataset not found")
    joined = create_joined_dataset(
        id=str(uuid4()),
        name=body.name,
        left_dataset_id=body.left_dataset_id,
        right_dataset_id=body.right_dataset_id,
        left_key=body.left_key,
        right_key=body.right_key,
        join_type=body.join_type,
    )
    return _to_joined_out(joined)


@router.post("/join-preview", response_model=JoinPreviewResponse)
def join_preview(body: JoinedDatasetCreate):
    if not get_dataset_record(body.left_dataset_id):
        raise HTTPException(status_code=404, detail="Left dataset not found")
    if not get_dataset_record(body.right_dataset_id):
        raise HTTPException(status_code=404, detail="Right dataset not found")
    try:
        left = _parquet_path(body.left_dataset_id)
        right = _parquet_path(body.right_dataset_id)
        join_type = body.join_type.upper()
        sql = (
            f"SELECT * FROM read_parquet('{left}') l "
            f"{join_type} JOIN read_parquet('{right}') r "
            f"ON l.{body.left_key} = r.{body.right_key} "
            f"LIMIT 20"
        )
        con = duckdb.connect()
        try:
            cursor = con.execute(sql)
            col_names = [d[0] for d in cursor.description]
            rows = [dict(zip(col_names, row)) for row in cursor.fetchall()]
        finally:
            con.close()
        columns = _merged_columns(body.left_dataset_id, body.right_dataset_id)
        return JoinPreviewResponse(columns=columns, rows=rows)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/joined", response_model=list[JoinedDatasetOut])
def list_joins():
    return [_to_joined_out(j) for j in list_joined_datasets()]


@router.delete("/joined/{join_id}", status_code=204)
def delete_join(join_id: str):
    if not get_joined_dataset(join_id):
        raise HTTPException(status_code=404, detail="Joined dataset not found")
    delete_joined_dataset(join_id)


@router.get("/{dataset_id}", response_model=DatasetMeta)
def get_dataset(dataset_id: str):
    record = get_dataset_record(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return _to_meta(record)


@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def preview_dataset(dataset_id: str, page: int = 1, page_size: int = 100):
    record = get_dataset_record(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    parquet_path = DATASETS_DIR / f"{dataset_id}.parquet"
    df = pd.read_parquet(parquet_path)

    offset = (page - 1) * page_size
    page_df = df.iloc[offset : offset + page_size]

    rows = json.loads(page_df.to_json(orient="records", date_format="iso"))
    columns = [ColumnSchema(**c) for c in json.loads(record.columns)]

    return DatasetPreview(
        columns=columns,
        rows=rows,
        total_rows=record.row_count,
        page=page,
        page_size=page_size,
    )


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(dataset_id: str):
    record = get_dataset_record(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    parquet_path = DATASETS_DIR / f"{dataset_id}.parquet"
    parquet_path.unlink(missing_ok=True)
    delete_dataset_record(dataset_id)


@router.post("/{dataset_id}/computed-columns", response_model=ComputedColumnOut, status_code=201)
def create_computed_column(dataset_id: str, body: ComputedColumnCreate):
    if not get_dataset_record(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    valid, error = validate_expression(body.expression, dataset_id)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid expression: {error}")
    col = add_computed_column(
        id=str(uuid4()),
        dataset_id=dataset_id,
        name=body.name,
        expression=body.expression,
        result_type=body.result_type,
    )
    return ComputedColumnOut(
        id=col.id,
        dataset_id=col.dataset_id,
        name=col.name,
        expression=col.expression,
        result_type=col.result_type,
    )


@router.get("/{dataset_id}/computed-columns", response_model=list[ComputedColumnOut])
def get_computed_columns(dataset_id: str):
    if not get_dataset_record(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    cols = list_computed_columns(dataset_id)
    return [
        ComputedColumnOut(
            id=c.id,
            dataset_id=c.dataset_id,
            name=c.name,
            expression=c.expression,
            result_type=c.result_type,
        )
        for c in cols
    ]


@router.delete("/{dataset_id}/computed-columns/{col_id}", status_code=204)
def remove_computed_column(dataset_id: str, col_id: str):
    col = get_computed_column(col_id)
    if not col or col.dataset_id != dataset_id:
        raise HTTPException(status_code=404, detail="Computed column not found")
    delete_computed_column(col_id)
