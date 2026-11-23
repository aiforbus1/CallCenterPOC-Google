#!/usr/bin/env python3
"""
STT Corrector Evaluation Script
Reads a CSV containing (raw, reference) pairs, runs Gemma STT post-corrector,
and reports:
  - Exact-match rate
  - Digit-accuracy rate
  - Needs_review rate
"""

import argparse
import asyncio
import csv
import os
import re
import sys
from pathlib import Path

# Add services/api to sys.path to import application modules
API_DIR = Path(__file__).resolve().parent.parent / "services" / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.services.stt_corrector import (
    GemmaTranscriptionCorrector,
    normalize_digits,
)


def extract_normalized_digits(text: str) -> str:
    """Extracts and concatenates all normalized ASCII digits from text."""
    if not text:
        return ""
    norm = normalize_digits(text)
    return "".join(re.findall(r'\d+', norm))


def normalize_whitespace(text: str) -> str:
    """Collapses consecutive whitespace and trims."""
    return re.sub(r'\s+', ' ', (text or "").strip())


async def evaluate_csv(csv_path: str, model: str = None) -> dict:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    corrector = GemmaTranscriptionCorrector(model=model)
    print(f"\n=======================================================")
    print(f"  Evaluating STT Corrector with model: {corrector.model}")
    print(f"  Source CSV: {csv_path}")
    print(f"=======================================================\n")

    rows = []
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            raw = (row.get("raw") or row.get("Raw") or "").strip()
            ref = (row.get("reference") or row.get("Reference") or "").strip()
            if not raw:
                continue
            rows.append({"id": idx, "raw": raw, "reference": ref})

    if not rows:
        print("No valid rows found in CSV.")
        return {}

    total = len(rows)
    exact_matches = 0
    digit_matches = 0
    needs_review_count = 0

    results = []

    for item in rows:
        raw_text = item["raw"]
        ref_text = item["reference"]

        # Run correction
        val_res = await corrector.correct_transcription(raw_text)
        corrected_text = str(val_res)
        needs_review = bool(val_res.needs_review)
        reasons = list(val_res.reasons)

        # 1. Exact Match
        is_exact = normalize_whitespace(corrected_text) == normalize_whitespace(ref_text)
        if is_exact:
            exact_matches += 1

        # 2. Digit Accuracy
        corr_digits = extract_normalized_digits(corrected_text)
        ref_digits = extract_normalized_digits(ref_text)
        is_digit_match = corr_digits == ref_digits
        if is_digit_match:
            digit_matches += 1

        # 3. Needs Review
        if needs_review:
            needs_review_count += 1

        results.append({
            "id": item["id"],
            "raw": raw_text,
            "corrected": corrected_text,
            "reference": ref_text,
            "exact_match": is_exact,
            "digit_match": is_digit_match,
            "needs_review": needs_review,
            "reasons": reasons,
        })

    # Summary Metrics
    exact_rate = (exact_matches / total) * 100
    digit_rate = (digit_matches / total) * 100
    review_rate = (needs_review_count / total) * 100

    # Print Table
    header_fmt = "{:<3} | {:<25} | {:<25} | {:<6} | {:<6} | {:<6}"
    print(header_fmt.format("#", "Corrected Text", "Reference Text", "Exact", "Digits", "Review"))
    print("-" * 85)
    for r in results:
        short_corr = (r['corrected'][:22] + "...") if len(r['corrected']) > 25 else r['corrected']
        short_ref = (r['reference'][:22] + "...") if len(r['reference']) > 25 else r['reference']
        print(header_fmt.format(
            r["id"],
            short_corr,
            short_ref,
            "YES" if r["exact_match"] else "NO",
            "YES" if r["digit_match"] else "NO",
            "YES" if r["needs_review"] else "NO",
        ))
        if r["reasons"]:
            print(f"    -> Reasons: {r['reasons']}")

    print("\n" + "=" * 55)
    print("                  EVALUATION REPORT")
    print("=" * 55)
    print(f"Total Test Samples   : {total}")
    print(f"Exact Match Rate     : {exact_matches}/{total} ({exact_rate:.1f}%)")
    print(f"Digit Accuracy Rate  : {digit_matches}/{total} ({digit_rate:.1f}%)")
    print(f"Needs Review Rate    : {needs_review_count}/{total} ({review_rate:.1f}%)")
    print("=" * 55 + "\n")

    return {
        "total": total,
        "exact_matches": exact_matches,
        "exact_match_rate": exact_rate,
        "digit_matches": digit_matches,
        "digit_accuracy_rate": digit_rate,
        "needs_review_count": needs_review_count,
        "needs_review_rate": review_rate,
        "details": results,
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate Gemma STT Corrector on CSV dataset")
    parser.add_argument(
        "--csv",
        type=str,
        default=str(Path(__file__).resolve().parent / "stt_eval_samples.csv"),
        help="Path to CSV dataset with raw and reference columns",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Model override (defaults to google/gemma-4-26b-a4b-it)",
    )
    args = parser.parse_args()

    asyncio.run(evaluate_csv(args.csv, model=args.model))


if __name__ == "__main__":
    main()
