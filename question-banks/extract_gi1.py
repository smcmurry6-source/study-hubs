#!/usr/bin/env python3
"""Regenerates gi1-question-bank.json from hubs/gi-exam1/index.html's
hand-authored .q-card markup. Run from the repo root:

    python3 question-banks/extract_gi1.py

Only useful before hubs/gi-exam1/ is fully deleted from disk -- once that's
gone, gi1-question-bank.json is the only remaining copy of this data.
Requires beautifulsoup4 (`pip install beautifulsoup4`).
"""
import re, json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "hubs" / "gi-exam1" / "index.html"
OUT = ROOT / "question-banks" / "gi1-question-bank.json"


def extract():
    html = SRC.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(".q-card")

    out = []
    for i, card in enumerate(cards):
        source = card.get("data-source", "")
        prompt_el = card.select_one(".q-prompt-text")
        stem = ""
        if prompt_el:
            prompt_copy = BeautifulSoup(str(prompt_el), "html.parser")
            tags = prompt_copy.select_one(".q-tags")
            if tags:
                tags.decompose()
            stem = prompt_copy.get_text(" ", strip=True)

        choice_els = card.select(".q-choices li")
        explain_el = card.select_one(".q-explain")

        if choice_els:
            choices = [li.get_text(" ", strip=True) for li in choice_els]
            answer = None
            for idx, li in enumerate(choice_els):
                if "correct" in (li.get("class") or []):
                    answer = idx
            ex = ""
            if explain_el:
                ex = explain_el.get_text(" ", strip=True)
                ex = re.sub(r"^Why:\s*", "", ex)
            out.append({
                "id": "gi1-q" + str(i), "lec": "gi1", "type": "mcq",
                "stem": stem, "choices": choices, "answer": answer,
                "ex": ex, "src": source,
            })
        else:
            answer_text = explain_el.get_text(" ", strip=True) if explain_el else ""
            out.append({
                "id": "gi1-q" + str(i), "lec": "gi1", "type": "recall",
                "stem": stem, "answer": answer_text, "src": source,
            })
    return out


if __name__ == "__main__":
    questions = extract()
    bad = [q["id"] for q in questions if q["type"] == "mcq" and q["answer"] is None]
    if bad:
        raise SystemExit("mcq question(s) with no marked correct choice: " + ", ".join(bad))
    OUT.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(questions)} questions to {OUT}")
