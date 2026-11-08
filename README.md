# 🌐 AI Translation Hub

A professional multilingual translation web application built with **Flask** and **Vanilla JavaScript**, supporting **20 languages** with real-time voice input and audio output.

---

## 🚀 Features

- 🌍 **20 Languages** — Arabic, Bengali, Chinese, Dutch, English, Farsi, French, German, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese, Punjabi, Russian, Spanish, Swahili, Turkish, Urdu
- 🎤 **Voice Input** — Speak directly into the app using browser's Speech Recognition API
- 🔊 **Voice Output** — Translated text converted to audio using Google Text-to-Speech (gTTS)
- ▶ **Play / Stop** — Full control over audio playback
- ⇄ **Swap Languages** — Switch source and target languages instantly
- 🕒 **Translation History** — Every translation saved with Copy & Delete options
- 📋 **Copy to Clipboard** — One click copy of translated text
- 📱 **Responsive Design** — Works on all screen sizes
- 🎨 **Professional UI** — White/Cream theme with Golden accents

---

## 🛠️ Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python, Flask           |
| Frontend  | HTML5, CSS3, JavaScript |
| Translation | deep-translator (Google Translate) |
| TTS       | gTTS (Google Text-to-Speech) |
| Voice Input | Web Speech Recognition API |

---

## 📁 Project Structure

```
translation_hub/
├── app.py                 ← Flask backend
├── requirements.txt       ← Python dependencies
└── static/
    ├── index.html         ← UI structure
    ├── style.css          ← Styling
    └── script.js          ← Frontend logic
```

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-translation-hub.git
cd ai-translation-hub
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the server
```bash
py -3.10 app.py
```

### 4. Open in browser
```
http://localhost:5000
```

---

## 📦 Requirements

```
flask
deep-translator
gTTS
SpeechRecognition
```

---

## 🌐 Supported Languages

Arabic • Bengali • Chinese (Simplified) • Dutch • English • Farsi • French • German • Hindi • Indonesian • Italian • Japanese • Korean • Portuguese • Punjabi • Russian • Spanish • Swahili • Turkish • Urdu

---

## 👩‍💻 Author

**Your Name**
- GitHub: [https://github.com/zainabilyas205-source/Code-Alpha-Translation-hub]
- LinkedIn: [https://www.linkedin.com/feed/update/urn:li:activity:7452395781858222080/]

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
