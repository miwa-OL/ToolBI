from pathlib import Path

import pandas as pd


def _infer_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_string_dtype(series):
        try:
            pd.to_datetime(series.dropna(), format="mixed")
            return "date"
        except Exception:
            pass
    return "text"


def parse_csv(file_path: Path) -> dict:
    df = pd.read_csv(file_path)
    columns = [{"name": col, "type": _infer_type(df[col])} for col in df.columns]
    return {"row_count": len(df), "columns": columns}


def save_as_parquet(df: pd.DataFrame, dest_path: Path) -> None:
    df.to_parquet(dest_path, index=False)
