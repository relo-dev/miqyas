import json
import os
from openai import OpenAI
from dotenv import load_dotenv
from prompt import MIQYAS_SYSTEM_PROMPT

load_dotenv()


def get_client() -> OpenAI:
    """
    Creates the OpenAI client lazily (only when needed),
    AFTER load_dotenv() has already populated os.environ.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. "
            "Make sure your .env file exists in the miqyas_api/ folder "
            "and contains: OPENAI_API_KEY=sk-..."
        )

    return OpenAI(api_key=api_key)


def analyze_code(code_block: str) -> dict:
    """
    Sends the concatenated source code to GPT-4o with the
    Miqyas system prompt and returns the parsed JSON result.
    """
    client = get_client()

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.0,
        messages=[
            {
                "role": "system",
                "content": MIQYAS_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": (
                    "Analyze the following source code files and return "
                    "your evaluation in the required JSON format only.\n\n"
                    + code_block
                )
            }
        ]
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON: {e}\nRaw: {raw}")
