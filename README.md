# Clinical Symptom Guidance

> An India-focused AI-powered healthcare triage assistant built using React, Vite, FastAPI, LangChain, and Google Gemini.

The platform provides structured symptom guidance, urgency assessment, and safe medical recommendations while intentionally avoiding diagnosis claims.

The application helps users better understand symptom severity and decide when to seek medical attention using professional, safety-oriented responses tailored for Indian healthcare contexts.

---

# 🚀 Features

- 🤖 AI-powered structured symptom guidance
- 🚨 Urgency classification system
  - Low
  - Medium
  - High
- 🇮🇳 India-focused emergency recommendations
  - **112** — National Emergency Helpline
  - **108 / 102** — Ambulance Services
- 🩺 Safe and professional medical response formatting
- ❌ Avoids direct diagnosis claims
- 💻 Modern responsive user interface
- ⚡ FastAPI REST API backend
- 🧠 LangChain + Google Gemini integration
- ☁️ Deployable on Vercel and Render

---

# 🛠️ Tech Stack

## Frontend
- React
- Vite
- CSS

## Backend
- Python
- FastAPI
- Uvicorn

## AI / LLM
- LangChain
- Google Gemini API

## Deployment
- Vercel (Frontend)
- Render (Backend)

---

# 📁 Folder Structure

```bash
Clinical-Symptom-Guidance/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── services/
│   ├── routes/
│   ├── utils/
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── screenshots/
│
├── README.md
└── .gitignore
```

---

# 📸 Screenshots

## 🏠 Home Page

<img width="1919" height="970" alt="Home Page" src="https://github.com/user-attachments/assets/5425a920-d018-4f6b-9e7a-375eed32d391" />

---

## 🤖 AI Guidance Response

<img width="1919" height="960" alt="AI Guidance Response" src="https://github.com/user-attachments/assets/f5009e4c-40c0-4941-a664-84613564e367" />

---

# 🔑 Environment Variables

## Backend `.env`

```env
GOOGLE_API_KEY=your_google_gemini_api_key
```

## Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

# ⚙️ Backend Setup

## 1️⃣ Navigate to Backend Folder

```bash
cd backend
```

## 2️⃣ Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

## 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

## 4️⃣ Run FastAPI Server

```bash
uvicorn main:app --reload
```

Backend will run on:

```bash
http://127.0.0.1:8000
```

---

# 🎨 Frontend Setup

## 1️⃣ Navigate to Frontend Folder

```bash
cd frontend
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Start Development Server

```bash
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

# 🔌 API Endpoint Details

## Base URL

```bash
http://localhost:8000
```

## POST `/chat`

Generates structured medical triage guidance.

### Request Body

```json
{
  "message": "I have chest pain and dizziness"
}
```

### Sample Response

```json
{
  "urgency": "High",
  "summary": "Your symptoms may require urgent medical evaluation.",
  "guidance": [
    "Seek immediate medical attention.",
    "Avoid self-medication.",
    "Call 108 or 112 if symptoms worsen."
  ],
  "disclaimer": "This system does not provide medical diagnosis."
}
```

---

# ☁️ Deployment

# 🚀 Backend Deployment on Render

## 1️⃣ Push Backend Code to GitHub

Push your backend project to GitHub.

## 2️⃣ Create New Web Service on Render

- Select your GitHub repository
- Choose the `backend` folder
- Runtime: Python

## 3️⃣ Build Command

```bash
pip install -r requirements.txt
```

## 4️⃣ Start Command

```bash
uvicorn main:app --host 0.0.0.0 --port 10000
```

## 5️⃣ Add Environment Variables

```env
GOOGLE_API_KEY=your_google_gemini_api_key
```

---

# 🌐 Frontend Deployment on Vercel

## 1️⃣ Import Project to Vercel

- Connect GitHub repository
- Select the `frontend` folder

## 2️⃣ Configure Environment Variable

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## 3️⃣ Deploy

Vercel will automatically build and deploy the React application.

---

# ⚠️ Safety Disclaimer

> ## Important Notice
>
> Clinical Symptom Guidance is an AI-powered informational triage assistant and **NOT** a licensed medical professional.
>
> ### The application:
>
> - Does **NOT** provide medical diagnosis
> - Does **NOT** replace doctors or emergency services
> - May generate incomplete or inaccurate responses
> - Should only be used for general informational guidance
>
> Always consult a qualified healthcare professional for medical concerns.
>
> ### In emergencies, contact:
>
> - **112** — National Emergency Helpline (India)
> - **108 / 102** — Ambulance Services

---

# 🔮 Future Improvements

- 🌍 Multi-language Indian language support
- 🎤 Voice input and speech responses
- 🔐 User authentication
- 📋 Medical history tracking
- 📄 PDF medical guidance export
- 🏥 Hospital recommendation integration
- 📊 Symptom severity visualization
- 🧠 Conversation memory
- 🚦 Rate limiting and API security
- 🐳 Docker deployment support

---

# 📜 License

```txt
MIT License

Add your license details here.
```

---

# 👨‍💻 Author

Developed with ❤️ using **FastAPI, React, LangChain, and Google Gemini**.
