import csv
import io
import json

MAX_ROWS = 100_000
MAX_COLUMNS = 1_000
MAX_FIELD_CODE_POINTS = 100_000
MAX_SOURCES = 100_000
MAX_DOCUMENT_CODE_POINTS = 2_000_000


def parse_csv(path):
    with open(path, "rb") as source:
        text = source.read().decode("utf-8-sig", errors="strict")
    csv.field_size_limit(MAX_FIELD_CODE_POINTS)
    reader = csv.reader(io.StringIO(text, newline=""), dialect="excel", strict=True)
    sources: list[dict[str, object]] = []
    total_points = 0
    for row_index, row in enumerate(reader, start=1):
        if row_index > MAX_ROWS:
            raise ValueError("row_limit")
        if len(row) > MAX_COLUMNS:
            raise ValueError("column_limit")
        for column_index, value in enumerate(row, start=1):
            content = value.strip()
            if not content:
                continue
            if len(content) > MAX_FIELD_CODE_POINTS:
                raise ValueError("field_limit")
            total_points += len(content)
            if total_points > MAX_DOCUMENT_CODE_POINTS:
                raise ValueError("document_limit")
            if len(sources) >= MAX_SOURCES:
                raise ValueError("source_count_limit")
            sources.append({"row": row_index, "column": column_index, "content": content})
    if not sources:
        raise ValueError("no_text")
    return json.dumps(
        {"schema_version": "1", "format": "csv", "sources": sources},
        ensure_ascii=False,
        separators=(",", ":"),
    )


parse_csv("/tmp/aethelgard-source.csv")
