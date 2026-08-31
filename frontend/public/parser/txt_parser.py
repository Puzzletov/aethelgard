import json

MAX_LINES = 200_000
MAX_LINE_CODE_POINTS = 100_000
MAX_SOURCES = 100_000
MAX_DOCUMENT_CODE_POINTS = 2_000_000


def parse_txt(path):
    with open(path, "rb") as source:
        text = source.read().decode("utf-8-sig", errors="strict")
    sources: list[dict[str, object]] = []
    total_points = 0
    for line_number, value in enumerate(text.splitlines(), start=1):
        if line_number > MAX_LINES:
            raise ValueError("line_limit")
        content = value.strip()
        if not content:
            continue
        if len(content) > MAX_LINE_CODE_POINTS:
            raise ValueError("line_length_limit")
        total_points += len(content)
        if total_points > MAX_DOCUMENT_CODE_POINTS:
            raise ValueError("document_limit")
        if len(sources) >= MAX_SOURCES:
            raise ValueError("source_count_limit")
        sources.append({"line_start": line_number, "line_end": line_number, "content": content})
    if not sources:
        raise ValueError("no_text")
    return json.dumps(
        {"schema_version": "1", "format": "txt", "sources": sources},
        ensure_ascii=False,
        separators=(",", ":"),
    )


parse_txt("/tmp/aethelgard-source.txt")
