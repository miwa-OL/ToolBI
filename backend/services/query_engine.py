import datetime
import re

import duckdb

from config import DATASETS_DIR
from schemas import FilterSpec

_OP_MAP = {
    "eq": "=",
    "neq": "!=",
    "gt": ">",
    "gte": ">=",
    "lt": "<",
    "lte": "<=",
}


def _safe_field(name: str) -> str:
    if not re.match(r"^[a-zA-Z0-9_]+$", name):
        raise ValueError(f"Invalid field name: '{name}'")
    return name


def _serialize(value: object) -> object:
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return value


def _cursor_to_dicts(cursor: duckdb.DuckDBPyConnection) -> list[dict]:
    col_names = [d[0] for d in cursor.description]
    return [
        {col: _serialize(val) for col, val in zip(col_names, row)}
        for row in cursor.fetchall()
    ]


def _build_where(filters: list[FilterSpec]) -> tuple[str, list]:
    if not filters:
        return "", []

    clauses: list[str] = []
    params: list = []

    for f in filters:
        field = _safe_field(f.field)
        if f.operator in _OP_MAP:
            clauses.append(f"{field} {_OP_MAP[f.operator]} ?")
            params.append(f.value)
        elif f.operator == "contains":
            clauses.append(f"CAST({field} AS VARCHAR) LIKE ?")
            params.append(f"%{f.value}%")
        elif f.operator == "in":
            placeholders = ", ".join("?" for _ in f.value)
            clauses.append(f"{field} IN ({placeholders})")
            params.extend(f.value)

    return "WHERE " + " AND ".join(clauses), params


def _agg_expr(aggregation: str, y_field: str | None) -> str:
    if aggregation == "count":
        return "COUNT(*)"
    if y_field is None:
        raise ValueError(f"y_field required for aggregation '{aggregation}'")
    safe_y = _safe_field(y_field)
    exprs = {
        "sum": f"SUM({safe_y})",
        "avg": f"AVG({safe_y})",
        "min": f"MIN({safe_y})",
        "max": f"MAX({safe_y})",
        "distinct_count": f"COUNT(DISTINCT {safe_y})",
    }
    if aggregation not in exprs:
        raise ValueError(f"Unknown aggregation: '{aggregation}'")
    return exprs[aggregation]


def resolve_parquet(dataset_id: str) -> str:
    path = DATASETS_DIR / f"{dataset_id}.parquet"
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_id}")
    return path.as_posix().replace("'", "''")


def _build_from(
    dataset_id: str | None,
    join_spec: dict | None,
    computed_columns: list[dict] | None,
) -> str:
    if join_spec:
        left = join_spec["left_path"]
        right = join_spec["right_path"]
        left_key = _safe_field(join_spec["left_key"])
        right_key = _safe_field(join_spec["right_key"])
        join_type = join_spec["join_type"].upper()
        base = (
            f"read_parquet('{left}') l "
            f"{join_type} JOIN read_parquet('{right}') r "
            f"ON l.{left_key} = r.{right_key}"
        )
    else:
        if dataset_id is None:
            raise ValueError("dataset_id required when join_spec is not provided")
        base = f"read_parquet('{resolve_parquet(dataset_id)}')"

    if not computed_columns:
        return base

    computed_exprs = ", ".join(
        f"({col['expression']}) AS {_safe_field(col['name'])}"
        for col in computed_columns
    )
    return f"(SELECT *, {computed_exprs} FROM {base})"


def validate_expression(expression: str, dataset_id: str) -> tuple[bool, str | None]:
    try:
        path = resolve_parquet(dataset_id)
        con = duckdb.connect()
        try:
            con.execute(f"SELECT ({expression}) FROM read_parquet('{path}') LIMIT 0")
            return True, None
        except Exception as exc:
            return False, str(exc)
        finally:
            con.close()
    except FileNotFoundError as exc:
        return False, str(exc)


def run_aggregation(
    dataset_id: str | None,
    x_field: str,
    y_field: str | None,
    aggregation: str,
    group_by: list[str],
    filters: list[FilterSpec],
    limit: int = 1000,
    computed_columns: list[dict] | None = None,
    join_spec: dict | None = None,
) -> list[dict]:
    safe_x = _safe_field(x_field)
    safe_extras = [_safe_field(f) for f in group_by]
    all_groups = [safe_x] + safe_extras

    agg = _agg_expr(aggregation, y_field)
    select_clause = ", ".join(all_groups + [f"{agg} AS value"])
    group_clause = ", ".join(all_groups)
    where_clause, params = _build_where(filters)

    from_clause = _build_from(dataset_id, join_spec, computed_columns)

    sql = (
        f"SELECT {select_clause} "
        f"FROM {from_clause} "
        f"{where_clause} "
        f"GROUP BY {group_clause} "
        f"ORDER BY value DESC "
        f"LIMIT {int(limit)}"
    )

    con = duckdb.connect()
    try:
        return _cursor_to_dicts(con.execute(sql, params))
    finally:
        con.close()


def get_distinct_values(dataset_id: str, field: str) -> list[str]:
    path = resolve_parquet(dataset_id)
    safe = _safe_field(field)
    sql = (
        f"SELECT DISTINCT CAST({safe} AS VARCHAR) AS val "
        f"FROM read_parquet('{path}') "
        f"WHERE {safe} IS NOT NULL "
        f"ORDER BY val "
        f"LIMIT 50"
    )
    con = duckdb.connect()
    try:
        return [row[0] for row in con.execute(sql).fetchall()]
    finally:
        con.close()


def run_raw_query(dataset_id: str, sql: str) -> list[dict]:
    path = resolve_parquet(dataset_id)

    if not sql.strip().lower().startswith("select"):
        raise ValueError("Only SELECT statements are permitted")

    con = duckdb.connect()
    try:
        con.execute(f"CREATE VIEW data AS SELECT * FROM read_parquet('{path}')")
        return _cursor_to_dicts(con.execute(sql))
    finally:
        con.close()
