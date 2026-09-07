import os
import json
import time
import jsonlines
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

SYSTEM_PROMPT = Path("system_prompt.txt").read_text(encoding="utf-8")
TEST_FILE     = "miqyas_test.jsonl"
SCORE_TOLERANCE = 15


def analyze_code(source_code: str, context: str = "") -> dict:
    user_message = "Evaluate this source code:\n\n"
    if context:
        user_message += f"# Context: {context}\n\n"
    user_message += f"```\n{source_code}\n```"

    response = client.chat.completions.create(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message}
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def format_report(result: dict, expected: dict = None) -> str:
    lines = []
    lines.append(f"Rating      : {result['rating']}")
    lines.append(f"Score       : {result['score']} / 100")
    lines.append(f"Cybersecurity   : {result['breakdown']['cybersecurity']} / 100")
    lines.append(f"Performance     : {result['breakdown']['performance']} / 100")
    lines.append(f"Clean Code      : {result['breakdown']['clean_code']} / 100")
    lines.append(f"DGA Compliance  : {result['breakdown']['dga_compliance']} / 100")
    lines.append("Issues:")
    for issue in result["issues"]:
        lines.append(f"  - {issue}")
    lines.append(f"Recommendation : {result['recommendation']}")

    if expected:
        rating_match = result["rating"] == expected.get("expected_rating", "")
        score_diff   = abs(result["score"] - expected.get("expected_score", result["score"]))
        score_match  = score_diff <= SCORE_TOLERANCE
        lines.append(f"Expected Rating : {expected.get('expected_rating', 'N/A')}")
        lines.append(f"Expected Score  : {expected.get('expected_score', 'N/A')}")
        lines.append(f"Rating Match    : {'PASS' if rating_match else 'FAIL'}")
        lines.append(f"Score Match     : {'PASS' if score_match else 'FAIL'} (diff={score_diff})")

    return "\n".join(lines)


def evaluate_test_file(filepath: str):
    samples = []
    with jsonlines.open(filepath) as reader:
        for obj in reader:
            samples.append(obj)

    total          = len(samples)
    rating_correct = 0
    score_correct  = 0
    results_log    = []

    print(f"Running evaluation on {total} samples from {filepath}\n")

    for i, sample in enumerate(samples, start=1):
        code    = sample.get("code", "")
        context = sample.get("context", "")
        expected_rating = sample.get("expected_rating", "")
        expected_score  = sample.get("expected_score",  None)

        print(f"Sample {i}/{total}")

        try:
            result = analyze_code(code, context)

            rating_match = result["rating"] == expected_rating
            score_diff   = abs(result["score"] - expected_score) if expected_score is not None else None
            score_match  = score_diff <= SCORE_TOLERANCE if score_diff is not None else False

            if rating_match:
                rating_correct += 1
            if score_match:
                score_correct += 1

            report = format_report(result, {
                "expected_rating": expected_rating,
                "expected_score":  expected_score
            })
            print(report)
            print()

            results_log.append({
                "sample_id":      i,
                "context":        context,
                "expected_rating": expected_rating,
                "expected_score":  expected_score,
                "actual_rating":  result["rating"],
                "actual_score":   result["score"],
                "breakdown":      result["breakdown"],
                "issues":         result["issues"],
                "recommendation": result["recommendation"],
                "rating_match":   rating_match,
                "score_match":    score_match,
                "score_diff":     score_diff
            })

        except Exception as e:
            print(f"ERROR on sample {i}: {e}\n")
            results_log.append({
                "sample_id": i,
                "error":     str(e)
            })

        time.sleep(0.5)

    rating_accuracy = (rating_correct / total) * 100
    score_accuracy  = (score_correct  / total) * 100

    print("Evaluation Complete")
    print(f"Total Samples       : {total}")
    print(f"Rating Accuracy     : {rating_accuracy:.1f}% ({rating_correct}/{total})")
    print(f"Score Accuracy      : {score_accuracy:.1f}% ({score_correct}/{total}) [tolerance={SCORE_TOLERANCE}]")
    print(f"Target              : 90%")
    print(f"Rating Status       : {'PASS' if rating_accuracy >= 90 else 'FAIL'}")
    print(f"Score Status        : {'PASS' if score_accuracy >= 90 else 'FAIL'}")

    output_path = "miqyas_evaluation_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total":            total,
                "rating_accuracy":  round(rating_accuracy, 2),
                "score_accuracy":   round(score_accuracy,  2),
                "rating_correct":   rating_correct,
                "score_correct":    score_correct,
                "tolerance":        SCORE_TOLERANCE,
                "target":           90
            },
            "results": results_log
        }, f, indent=2, ensure_ascii=False)

    print(f"\nDetailed results saved to {output_path}")


if __name__ == "__main__":
    evaluate_test_file(TEST_FILE)
