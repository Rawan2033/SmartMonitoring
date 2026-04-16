from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from ..config import settings
from ..schemas import InsightOut


USER_PROMPT = (
    "You are an expert in solar panel monitoring systems. Based on the readings of sensors and "
    "the current trends of sensors and event cleaning triggered. PLease analyze the dashboard "
    "and provide expert insights. Include: Key observations in bullet points. Use clear, non "
    "technical language suitable for general users. Keep teh response under 120 words."
)

#this will be changed to it will fallback as showing the latest updates with a signal of failure
# this is a comment from the mentor 
def _fallback_insights() -> list[InsightOut]:
    return [
        InsightOut(
            title="Dust accumulation increased in the last 2 hours",
            reason="Soiling values are trending upward while humidity is moderate.",
        ),
        InsightOut(
            title="Cleaning event likely to trigger soon",
            reason="Dust remains above your moderate threshold for consecutive intervals.",
        ),
        InsightOut(
            title="Temperature stable for panel health",
            reason="Temperature has stayed within normal operating band.",
        ),
    ]


def _normalize_item(item: Any) -> InsightOut | None:
    if not isinstance(item, dict):
        return None

    title = (
        item.get("title")
        or item.get("heading")
        or item.get("observation")
        or item.get("point")
        or ""
    )
    reason = (
        item.get("reason")
        or item.get("details")
        or item.get("explanation")
        or item.get("why")
        or ""
    )

    title = str(title).strip()
    reason = str(reason).strip()
    if not title:
        return None
    if not reason:
        reason = "Derived from latest sensor trends and cleaning events."

    return InsightOut(title=title, reason=reason)


def _parse_insights(text: str) -> list[InsightOut]:
    text = text.strip()
    if not text:
        return []

    candidates: list[Any] = []

    # 1) Direct JSON
    try:
        candidates.append(json.loads(text))
    except Exception:
        pass

    # 2) JSON array embedded in markdown/text
    start_arr = text.find("[")
    end_arr = text.rfind("]")
    if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
        try:
            candidates.append(json.loads(text[start_arr : end_arr + 1]))
        except Exception:
            pass

    # 3) JSON object embedded in markdown/text
    start_obj = text.find("{")
    end_obj = text.rfind("}")
    if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
        try:
            candidates.append(json.loads(text[start_obj : end_obj + 1]))
        except Exception:
            pass

    parsed_insights: list[InsightOut] = []
    for parsed in candidates:
        items: list[Any] = []
        if isinstance(parsed, list):
            items = parsed
        elif isinstance(parsed, dict):
            for key in ("insights", "items", "data", "result"):
                value = parsed.get(key)
                if isinstance(value, list):
                    items = value
                    break
            if not items:
                items = [parsed]

        for item in items:
            normalized = _normalize_item(item)
            if normalized:
                parsed_insights.append(normalized)

        if parsed_insights:
            break

    # 4) Last-resort parse for bullet text
    if not parsed_insights:
        raw_lines = [line.strip(" -•\t") for line in text.splitlines() if line.strip()]
        for line in raw_lines:
            if ":" in line:
                t, r = line.split(":", 1)
                t = t.strip()
                r = r.strip()
                if t:
                    parsed_insights.append(
                        InsightOut(
                            title=t,
                            reason=r or "Derived from latest sensor trends and cleaning events.",
                        )
                    )
            elif line:
                parsed_insights.append(
                    InsightOut(
                        title=line,
                        reason="Derived from latest sensor trends and cleaning events.",
                    )
                )
            if len(parsed_insights) >= 3:
                break

    return parsed_insights[:3]


def generate_insights_from_openai(context: dict) -> list[InsightOut]:
    if not settings.openai_api_key:
        return _fallback_insights()

    client = OpenAI(api_key=settings.openai_api_key)

    prompt = (
        f"{USER_PROMPT}\n\n"
        f"Dashboard data: {json.dumps(context, default=str)}\n\n"
        "Return ONLY valid JSON as an array with exactly 3 objects. "
        "Each object must include keys: title, reason. "
        "Do not include markdown fences or extra text."
    )

    try:
        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
            temperature=0.3,
        )
        text = (response.output_text or "").strip()
        insights = _parse_insights(text)
        if insights:
            return insights

        print(f"OpenAI insight parse failed. Raw output: {text}")
        return _fallback_insights()
    except Exception as e:
        print(f"OpenAI insight error: {e}")
        return _fallback_insights()
