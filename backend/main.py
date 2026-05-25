import json
import re
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

load_dotenv()

app = FastAPI(
    title="Medical Assistant API",
    description="Backend for the India-focused healthcare assistant",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

system_template = """
You are a professional healthcare triage assistant for users in India.

Your role:
- Provide careful, concise health guidance and triage.
- Do not diagnose, prescribe, or claim certainty.
- Use Indian emergency guidance: call 112 for emergencies; ambulance services such as 108/102 may be available depending on the state.
- Never mention 911 unless the user explicitly asks about another country.
- Do not use a visible heading called "Emotional Support".
- Do not repeat the same template after every message.
- Use a polished clinical tone: direct, reassuring, and practical.

High-risk symptoms that should usually be "High" urgency include:
- chest pain or pressure, especially with breathlessness, sweating, nausea, dizziness, fainting, confusion, or pain spreading to arm/jaw/back
- sudden confusion, difficulty speaking, facial droop, weakness/numbness on one side, severe sudden headache, seizure, loss of consciousness
- severe breathlessness, blue lips, severe allergic reaction, severe bleeding, major injury or burns
- pregnancy emergencies, severe abdominal pain, suicidal thoughts or self-harm risk

Respond with ONLY valid JSON in this exact shape:
{{
  "reply": "A short natural-language answer for compatibility.",
  "urgency": "Low | Medium | High",
  "summary": "One concise clinical summary without diagnosis claims.",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"],
  "red_flags": ["Warning sign 1", "Warning sign 2"],
  "home_care": ["Safe home-care point or emergency caveat"],
  "doctor_visit_guidance": "Clear guidance about when/where to seek care.",
  "disclaimer": "AI medical disclaimer."
}}

Rules:
- For greeting or non-medical small talk, set urgency to "Low", keep arrays short, and invite the user to describe symptoms.
- For High urgency, the first recommended action must tell the user to seek emergency medical care now and call 112 in India or local ambulance support such as 108/102 if available.
- For High urgency, home_care must not list remedies. It should say home remedies are not appropriate and urgent evaluation is needed.
- If information is missing, ask one or two focused follow-up questions, but do not delay emergency guidance when red flags are present.
- Keep every list item under 24 words.
"""

prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_template),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{user_message}")
])

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)

ai_chain = prompt_template | llm | StrOutputParser()

chain_with_history = RunnableWithMessageHistory(
    ai_chain,
    get_session_history,
    input_messages_key="user_message",
    history_messages_key="chat_history",
)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    urgency: str = "Low"
    summary: str = ""
    recommended_actions: List[str] = Field(default_factory=list)
    red_flags: List[str] = Field(default_factory=list)
    home_care: List[str] = Field(default_factory=list)
    doctor_visit_guidance: str = ""
    disclaimer: str = "I am an AI assistant, not a doctor. This information is educational and does not replace professional medical advice."

def _clean_llm_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        parsed = {
            "reply": cleaned,
            "urgency": "Medium",
            "summary": "I could not structure the response fully, but the guidance below may still help.",
            "recommended_actions": [cleaned],
            "red_flags": [],
            "home_care": [],
            "doctor_visit_guidance": "Please consult a qualified doctor if symptoms persist, worsen, or feel concerning.",
            "disclaimer": "I am an AI assistant, not a doctor. This information is educational and does not replace professional medical advice."
        }

    return {
        "reply": str(parsed.get("reply") or parsed.get("summary") or "").strip(),
        "urgency": str(parsed.get("urgency") or "Low").strip().title(),
        "summary": str(parsed.get("summary") or "").strip(),
        "recommended_actions": _as_string_list(parsed.get("recommended_actions")),
        "red_flags": _as_string_list(parsed.get("red_flags")),
        "home_care": _as_string_list(parsed.get("home_care")),
        "doctor_visit_guidance": str(parsed.get("doctor_visit_guidance") or "").strip(),
        "disclaimer": str(parsed.get("disclaimer") or "I am an AI assistant, not a doctor. This information is educational and does not replace professional medical advice.").strip(),
    }

def _as_string_list(value) -> List[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []

def _apply_emergency_guardrails(message: str, response_data: dict) -> dict:
    high_risk_pattern = re.compile(
        r"\b(chest pain|chest pressure|confusion|confused|breathless|shortness of breath|"
        r"faint|fainted|seizure|stroke|face droop|weakness|numbness|severe bleeding|"
        r"suicidal|self[- ]?harm|pregnan|blue lips)\b",
        re.IGNORECASE,
    )

    if high_risk_pattern.search(message):
        response_data["urgency"] = "High"
        first_action = "Seek emergency medical care now. In India, call 112 or ambulance support such as 108/102 if available."
        actions = response_data.get("recommended_actions", [])
        filtered_actions = []
        for action in actions:
            normalized = action.lower()
            if "911" in normalized or action == first_action:
                continue
            if "seek emergency medical care" in normalized or "call 112" in normalized:
                continue
            filtered_actions.append(action)
        response_data["recommended_actions"] = [first_action] + filtered_actions[:2]
        response_data["home_care"] = [
            "Home remedies are not appropriate for these symptoms; urgent medical evaluation is needed."
        ]

    for key in ("reply", "summary", "doctor_visit_guidance", "disclaimer"):
        response_data[key] = response_data.get(key, "").replace("911", "112")
    for key in ("recommended_actions", "red_flags", "home_care"):
        response_data[key] = [item.replace("911", "112") for item in response_data.get(key, [])]

    if response_data["urgency"] not in {"Low", "Medium", "High"}:
        response_data["urgency"] = "Medium"

    return response_data

@app.get("/")
async def root():
    return {"status": "online", "message": "India-focused Medical API is running."}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        bot_reply = chain_with_history.invoke(
            {"user_message": request.message},
            config={"configurable": {"session_id": request.session_id}}
        )
        response_data = _clean_llm_json(bot_reply)
        response_data = _apply_emergency_guardrails(request.message, response_data)

        return ChatResponse(
            session_id=request.session_id,
            **response_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
