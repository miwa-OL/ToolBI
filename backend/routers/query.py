from fastapi import APIRouter, HTTPException

from config import DATASETS_DIR
from schemas import AggregationRequest, AggregationResponse, RawQueryRequest
from services.query_engine import (
    get_distinct_values,
    run_aggregation,
    run_raw_query,
    validate_expression,
)
from services.storage import (
    get_dataset_record,
    get_joined_dataset,
    list_computed_columns,
)

router = APIRouter(prefix="/query")


def _parquet_path(dataset_id: str) -> str:
    path = DATASETS_DIR / f"{dataset_id}.parquet"
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_id}")
    return path.as_posix().replace("'", "''")


@router.post("/aggregate", response_model=AggregationResponse)
def aggregate(request: AggregationRequest):
    try:
        record = get_dataset_record(request.dataset_id)
        if record:
            computed = list_computed_columns(request.dataset_id)
            computed_specs = (
                [{"name": c.name, "expression": c.expression} for c in computed]
                if computed
                else None
            )
            rows = run_aggregation(
                dataset_id=request.dataset_id,
                x_field=request.x_field,
                y_field=request.y_field,
                aggregation=request.aggregation,
                group_by=request.group_by,
                filters=request.filters,
                limit=request.limit,
                computed_columns=computed_specs,
            )
        else:
            joined = get_joined_dataset(request.dataset_id)
            if not joined:
                raise HTTPException(
                    status_code=404,
                    detail=f"Dataset not found: {request.dataset_id}",
                )
            rows = run_aggregation(
                dataset_id=None,
                x_field=request.x_field,
                y_field=request.y_field,
                aggregation=request.aggregation,
                group_by=request.group_by,
                filters=request.filters,
                limit=request.limit,
                join_spec={
                    "left_path": _parquet_path(joined.left_dataset_id),
                    "right_path": _parquet_path(joined.right_dataset_id),
                    "left_key": joined.left_key,
                    "right_key": joined.right_key,
                    "join_type": joined.join_type,
                },
            )
        return AggregationResponse(rows=rows, row_count=len(rows))
    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/distinct-values")
def distinct_values(dataset_id: str, field: str):
    try:
        return get_distinct_values(dataset_id, field)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/validate-expression")
def validate_expr(dataset_id: str, expression: str):
    valid, error = validate_expression(expression, dataset_id)
    return {"valid": valid, "error": error}


@router.post("/raw")
def raw_query(request: RawQueryRequest):
    try:
        return run_raw_query(request.dataset_id, request.sql)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
