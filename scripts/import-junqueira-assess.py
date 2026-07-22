#!/usr/bin/env python3
"""Extract the official Assess Your Knowledge MCQs from Junqueira 16e.

Run with a Python environment containing PyMuPDF (fitz). The generated JSONL
is dependency-free and is validated by the normal bank validator.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
PDF = Path(
    os.environ.get(
        "JUNQUEIRA_PDF",
        Path.home()
        / "Documents"
        / "MED SCHOOL BOOKS"
        / "Junqueira's Basic Histology 16th Edition.pdf",
    )
)
OUT = ROOT / "data" / "bank" / "questions" / "histology-junqueira-assess.jsonl"

TOPICS = {
    1: "Histology methods and stains", 2: "Cytoplasm", 3: "Nucleus", 4: "Epithelial tissue",
    5: "Connective tissue", 6: "Adipose tissue", 7: "Cartilage", 8: "Bone",
    9: "Nerve tissue and nervous system", 10: "Muscle tissue", 11: "Circulatory system",
    12: "Blood", 13: "Hemopoiesis", 14: "Immune system and lymphoid organs",
    15: "Digestive tract", 16: "Organs associated with the digestive tract",
    17: "Respiratory system", 18: "Skin", 19: "Urinary system", 20: "Endocrine glands",
    21: "Male reproductive system", 22: "Female reproductive system", 23: "Eye and ear",
}

# Zero-indexed PDF pages: Assess page through the page containing the answer key.
PAGE_RANGES = {
    1: (26, 26), 2: (62, 62), 3: (80, 80), 4: (103, 105), 5: (130, 131),
    6: (138, 138), 7: (146, 147), 8: (169, 170), 9: (201, 202), 10: (224, 224),
    11: (245, 246), 12: (263, 263), 13: (275, 276),
}


def clean(text: str) -> str:
    text = text.replace("\xad", "").replace("\u2002", " ")
    text = re.sub(r"(?<=\w)-\s*\n\s*(?=[a-z])", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def answer_key(document, start: int, end: int):
    combined = "\n".join(document[page].get_text() for page in range(start, end + 1))
    match = re.search(r"Answers\s*:?[ ]*((?:\d+\s*[a-e][,;]?\s*){8,})", combined, re.I)
    if not match:
        return {}
    return {int(number): letter.upper() for number, letter in re.findall(r"(\d+)\s*([a-e])", match.group(1), re.I)}


def question_regions(page):
    starts = []
    answer_y = 740
    for block in page.get_text("blocks", sort=True):
        x0, y0, x1, y1, text, *_ = block
        match = re.match(r"^\s*(\d{1,2})\.\s", text)
        if match and 1 <= int(match.group(1)) <= 10:
            starts.append({"number": int(match.group(1)), "x": x0, "y": y0, "column": 0 if x0 < 297 else 1})
        if re.search(r"Answers\s*:?[ ]*1\s*[a-e]", text, re.I):
            answer_y = min(answer_y, y0)

    regions = []
    for item in starts:
        later = [other["y"] for other in starts if other["column"] == item["column"] and other["y"] > item["y"] + 1]
        # The last option sometimes shares vertical space with the answer-key
        # block. Include the page tail and trim the key after option parsing.
        bottom = min(later) - 1 if later else page.rect.height - 28
        left, right = (30, 297) if item["column"] == 0 else (297, 582)
        text = page.get_text("text", clip=fitz.Rect(left, item["y"] - 2, right, bottom), sort=True)
        regions.append((item["number"], text))
    return regions


def parse_question(number: int, raw: str):
    text = raw.replace("\xad", "")
    number = re.search(r"(?m)^[^\n]{0,28}?\b\d{1,2}\.\s*", text)
    if number:
        text = text[number.end():]
    # Two-column extraction can place a few characters from the neighboring
    # column before an option marker. Match only the first marker on a line,
    # which also avoids treating units such as "mm/d." as an option.
    markers = list(re.finditer(r"(?m)^[^\n]{0,28}?\b([a-e])\.\s+", text, re.I))
    if len(markers) < 5:
        return None
    prompt = clean(text[:markers[0].start()])
    options = []
    for index, marker in enumerate(markers[:5]):
        end = markers[index + 1].start() if index + 1 < 5 else len(text)
        option_text = clean(text[marker.end():end])
        # Stop after option e if the crop also includes a footer or answer key.
        option_text = re.split(
            r"\bAnswers\s*:|\d{2}_Mescher_|\s+10[a-e]\s+9[a-e](?:\s*,|,)",
            option_text,
            maxsplit=1,
            flags=re.I,
        )[0].strip()
        options.append({"id": marker.group(1).upper(), "text": option_text})
    if len(prompt) < 10 or any(not option["text"] for option in options):
        return None
    return prompt, options


def stable_id(chapter: int, number: int, prompt: str) -> str:
    digest = hashlib.sha1(f"junqueira16|{chapter}|{number}|{prompt}".encode()).hexdigest()[:10]
    return f"hist-j16-ch{chapter}-q{number}-{digest}"


def build(chapter: int, number: int, prompt: str, options, correct: str):
    correct_text = next(option["text"] for option in options if option["id"] == correct)
    topic = TOPICS[chapter]
    clinical = bool(re.search(r"\b(patient|woman|man|child|infant|newborn|biopsy|disease|syndrome)\b", prompt, re.I))
    explanation = f"Junqueira keys {correct}: {correct_text}. This choice best satisfies the feature or mechanism tested in the stem."
    return {
        "schemaVersion": "1.0.0", "id": stable_id(chapter, number, prompt), "revision": 1,
        "status": "verified", "kind": "single_best_answer", "subject": "histology",
        "topic": topic, "chapter": f"Chapter {chapter}", "difficulty": 4 if clinical else 3,
        "prompt": prompt, "options": options, "correctOptionId": correct,
        "acceptedFreeText": [correct, correct_text], "explanation": explanation,
        "distractorExplanations": {
            option["id"]: f"This is not the keyed choice. The best answer is {correct}: {correct_text}."
            for option in options if option["id"] != correct
        },
        "learningObjective": f"Apply Junqueira chapter {chapter} concepts in {topic.lower()}.",
        "source": {"title": "Junqueira's Basic Histology", "edition": "16th", "chapter": f"Chapter {chapter}", "page": "Assess Your Knowledge", "excerpt": f"Official chapter-end question {number}; answer keyed by the textbook."},
        "tags": ["histology", "junqueira-official", re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")],
        "examPriority": "core" if chapter == 1 else ("high" if clinical else "standard"),
        "qualityFlags": ["official-textbook-question", "official-answer-key", "concise-explanation"],
    }


def main():
    document = fitz.open(PDF)
    questions = []
    failures = []
    for chapter, (start, end) in PAGE_RANGES.items():
        key = answer_key(document, start, end)
        parsed = {}
        for page_index in range(start, end + 1):
            for number, raw in question_regions(document[page_index]):
                result = parse_question(number, raw)
                if result:
                    parsed[number] = result
        for number in range(1, 11):
            if number not in parsed or number not in key:
                failures.append(f"chapter {chapter} question {number}")
                continue
            prompt, options = parsed[number]
            questions.append(build(chapter, number, prompt, options, key[number]))
        print(f"chapter {chapter}: {len(parsed)}/10 parsed, {len(key)}/10 keyed")

    if failures:
        raise SystemExit("Could not extract: " + ", ".join(failures))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as handle:
        for question in questions:
            handle.write(json.dumps(question, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {len(questions)} questions -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
