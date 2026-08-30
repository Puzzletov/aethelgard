import json

from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer

MAX_PDF_PAGES = 500
MAX_LAYOUT_ELEMENTS_PER_PAGE = 10_000
MAX_PAGE_CODE_POINTS = 100_000
MAX_DOCUMENT_CODE_POINTS = 2_000_000


def page_text(layout):
    chunks: list[str] = []
    page_points = 0
    for element_index, element in enumerate(layout):
        if element_index >= MAX_LAYOUT_ELEMENTS_PER_PAGE:
            raise ValueError("layout_limit")
        if not isinstance(element, LTTextContainer):
            continue
        text = element.get_text().strip()
        if not text:
            continue
        page_points += len(text)
        if page_points > MAX_PAGE_CODE_POINTS:
            raise ValueError("page_limit")
        chunks.append(text)
    return "\n".join(chunks)


def parse_pdf(path):
    pages: list[dict[str, object]] = []
    total_points = 0
    with open(path, "rb") as source:
        for page_index, layout in enumerate(extract_pages(source), start=1):
            if page_index > MAX_PDF_PAGES:
                raise ValueError("page_count_limit")
            text = page_text(layout)
            total_points += len(text)
            if total_points > MAX_DOCUMENT_CODE_POINTS:
                raise ValueError("document_limit")
            pages.append({"page": page_index, "content": text})
    if not pages:
        raise ValueError("no_pages")
    if total_points == 0:
        raise ValueError("no_text")
    return json.dumps(
        {"schema_version": "1", "format": "pdf", "pages": pages},
        ensure_ascii=False,
        separators=(",", ":"),
    )


parse_pdf("/tmp/aethelgard-source.pdf")
