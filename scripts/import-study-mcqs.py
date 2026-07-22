#!/usr/bin/env python3
"""Normalize MCQ-formatted rows from the existing Anki CSV exports."""

from __future__ import annotations

import csv
import hashlib
import html
import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(
    os.environ.get(
        "MED_SCHOOL_MCQS_DIR",
        Path.home() / "Documents" / "MED SCHOOL BOOKS" / "MCQs",
    )
)
OUT_DIR = ROOT / "data" / "bank" / "questions"

HISTOLOGY_TOPICS = {
    1: "Histology methods and stains",
    2: "Cytoplasm",
    3: "Nucleus",
    4: "Epithelial tissue",
    5: "Connective tissue",
    6: "Adipose tissue",
    7: "Cartilage",
    8: "Bone",
    9: "Nerve tissue and nervous system",
    10: "Muscle tissue",
    11: "Circulatory system",
    12: "Blood",
    13: "Hemopoiesis",
    14: "Immune system and lymphoid organs",
    15: "Digestive tract",
    16: "Organs associated with the digestive tract",
    17: "Respiratory system",
    18: "Skin",
    19: "Urinary system",
    20: "Endocrine glands",
    21: "Male reproductive system",
    22: "Female reproductive system",
    23: "Eye and ear",
}

EMBRYOLOGY_TOPICS = {
    "1": "Molecular regulation and signaling",
    "2_ch3": "Gametogenesis and first week",
    "2_ch3_class": "Gametogenesis and first week",
    "4": "Second week: bilaminar germ disc",
    "5": "Third week: trilaminar germ disc",
    "5_5": "Third to eighth weeks",
    "6": "Embryonic period and folding",
    "7": "Fetal period and placenta",
    "8*": "Birth defects and prenatal diagnosis",
    "9": "Skeletal system development",
    "10": "Muscular system development",
}

OPTION_RE = re.compile(r"(?<![A-Za-z0-9])([A-Fa-f])[\)\.]\s+")
ANSWER_RE = re.compile(r"\bcorrect(?:\s+answer)?\s*[:\-]?\s*([A-F])(?:[\)\.]|\b)", re.I)


def clean(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("**", "").replace("\u00a0", " ")
    return re.sub(r"\s+", " ", value).strip()


def parse_prompt(raw: str):
    text = clean(raw)
    if not text.lower().startswith("mcq:"):
        return None
    text = re.sub(r"^mcq:\s*", "", text, flags=re.I)
    matches = list(OPTION_RE.finditer(text))
    first_a = next((index for index, match in enumerate(matches) if match.group(1).upper() == "A"), None)
    if first_a is not None:
        matches = matches[first_a:]
    if len(matches) < 4:
        return None
    prompt = text[: matches[0].start()].strip(" :-")
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({"id": match.group(1).upper(), "text": text[match.end() : end].strip(" ;")})
    if len({item["id"] for item in options}) != len(options):
        return None
    return prompt, options


def parse_answer(raw: str):
    text = clean(raw)
    match = ANSWER_RE.search(text)
    if not match:
        return None
    correct = match.group(1).upper()
    explanation = re.sub(r"^correct(?:\s+answer)?\s*[:\-]?\s*[A-F](?:[\)\.]|\b)\s*", "", text, flags=re.I)
    explanation = explanation.strip(" .")
    if len(explanation) < 10:
        explanation = text
    return correct, explanation


def stable_id(subject: str, chapter: str, prompt: str) -> str:
    digest = hashlib.sha1(f"{subject}|{chapter}|{prompt}".encode()).hexdigest()[:12]
    return f"{subject[:4]}-{chapter.replace('_', '-')}-{digest}".lower().replace("*", "star")


def build_question(subject: str, chapter_key: str, topic: str, prompt: str, options, correct: str, explanation: str, filename: str):
    correct_text = next(option["text"] for option in options if option["id"] == correct)
    distractors = {
        option["id"]: f"{option['text']} is not the best answer here. Contrast it with {correct_text}: {explanation}"
        for option in options
        if option["id"] != correct
    }
    clinical = bool(re.search(r"\b(patient|woman|man|child|infant|clinical|biopsy|deficiency|disease)\b", prompt, re.I))
    return {
        "schemaVersion": "1.0.0",
        "id": stable_id(subject, chapter_key, prompt),
        "revision": 1,
        "status": "verified",
        "kind": "single_best_answer",
        "subject": subject,
        "topic": topic,
        "chapter": f"Chapter {chapter_key.replace('_', '–').replace('*', '')}",
        "difficulty": 4 if clinical else 3,
        "prompt": prompt,
        "options": options,
        "correctOptionId": correct,
        "acceptedFreeText": [correct, correct_text],
        "explanation": explanation,
        "distractorExplanations": distractors,
        "learningObjective": f"Apply core knowledge of {topic.lower()} to a single-best-answer question.",
        "source": {
            "title": "Junqueira's Basic Histology" if subject == "histology" else "Existing embryology study bank",
            "edition": "16th" if subject == "histology" else "Course-aligned notes",
            "chapter": f"Chapter {chapter_key.replace('_', '–').replace('*', '')}",
            "excerpt": f"Imported from {filename}; wording and keyed explanation preserved.",
        },
        "tags": [subject, re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")],
        "examPriority": "high" if subject == "embryology" or clinical else "standard",
        "qualityFlags": ["imported-existing-bank", "distractor-explanations-auto-expanded"],
    }


def import_file(path: Path, subject: str, chapter_key: str, topic: str):
    questions = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.reader(handle):
            if len(row) < 2:
                continue
            parsed_prompt = parse_prompt(row[0])
            parsed_answer = parse_answer(row[1])
            if not parsed_prompt or not parsed_answer:
                continue
            prompt, options = parsed_prompt
            correct, explanation = parsed_answer
            if correct not in {option["id"] for option in options}:
                continue
            questions.append(build_question(subject, chapter_key, topic, prompt, options, correct, explanation, path.name))
    return questions


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {"histology": [], "embryology": []}

    for path in sorted((SOURCE_ROOT / "HISTOLOGY").glob("histo_ch*.csv")):
        chapter = int(re.search(r"ch(\d+)", path.stem).group(1))
        results["histology"].extend(import_file(path, "histology", str(chapter), HISTOLOGY_TOPICS[chapter]))

    for path in sorted((SOURCE_ROOT / "EMBRYOLOGY").glob("*.csv")):
        match = re.search(r"ch(.+)$", path.stem.replace(" ", "_"))
        if not match:
            continue
        chapter = match.group(1)
        topic = EMBRYOLOGY_TOPICS.get(chapter, f"Embryology chapter {chapter}")
        results["embryology"].extend(import_file(path, "embryology", chapter, topic))

    for subject, questions in results.items():
        out = OUT_DIR / f"{subject}-existing.jsonl"
        with out.open("w", encoding="utf-8") as handle:
            for question in questions:
                handle.write(json.dumps(question, ensure_ascii=False, separators=(",", ":")) + "\n")
        print(f"{subject}: {len(questions)} -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
