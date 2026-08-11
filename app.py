import os
import json
from flask import Flask, request, jsonify, render_template
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a senior QA automation engineer. Given a user story or requirement, \
output ONLY valid JSON (no markdown fences, no preamble, no trailing commentary) with this exact shape:

{
  "cases": [
    {
      "category": "positive|negative|edge",
      "title": "short descriptive title",
      "steps": ["step 1", "step 2", "..."],
      "expected": "expected result"
    }
  ],
  "playwright": "a complete, runnable Playwright TypeScript test file covering the two most \
important cases. Use \\n for newlines."
}

Include 6-9 cases total, spanning all three categories (at least two of each where sensible). \
Be specific to the actual requirement given - do not use generic placeholder cases."""


@app.route("/debug-env")
def debug_env():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return jsonify({"found": False, "message": "ANTHROPIC_API_KEY not found in environment"})
    return jsonify({"found": True, "starts_with": key[:8], "length": len(key)})


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    story = (data.get("story") or "").strip()

    if not story:
        return jsonify({"error": "Missing user story"}), 400
    if len(story) > 4000:
        return jsonify({"error": "Story too long (max 4000 characters)"}), 400

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": story}],
        )
        text = "".join(block.text for block in response.content if hasattr(block, "text"))
        clean = text.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(clean)
        except json.JSONDecodeError:
            # Response likely got cut off mid-object - try to salvage the complete cases
            last_brace = clean.rfind("}")
            if last_brace == -1:
                raise
            repaired = clean[: last_brace + 1]
            if not repaired.rstrip().endswith("]}"):
                last_complete_case = repaired.rfind("},")
                if last_complete_case != -1:
                    repaired = repaired[: last_complete_case + 1] + "]}"
            parsed = json.loads(repaired)
            parsed.setdefault("playwright", "")

        return jsonify(parsed)

    except json.JSONDecodeError:
        return jsonify({"error": "The model returned malformed JSON. Try again."}), 502
    except Exception as exc:  # noqa: BLE001 - surface real error to the caller for debugging
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
