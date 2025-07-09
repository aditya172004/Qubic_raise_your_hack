# 🖥️ Qubic Smart Contract Auditor — Frontend

This is the **React-based frontend** for the **Qubic Smart Contract Auditor** — an AI-powered auditing platform for Qubic blockchain smart contracts. It connects to a FastAPI backend that leverages RAG (Retrieval-Augmented Generation) and Google Gemini to detect vulnerabilities and non-compliance with Qubic’s smart contract standards.

🔗 **Built for Qubic — the world’s fastest blockchain (15.5M TPS, verified by CertiK)**

---

## 🚀 Features

✅ **User-Friendly UI**: Minimal, clean interface for smart contract analysis  
📁 **Upload or Paste URL**: Upload `.cpp` files locally or paste a GitHub link  
🔍 **Live Analysis Display**: View syntax errors, standard violations, and insights  
🔗 **Connects to FastAPI backend**: Integrates with the AI auditing pipeline  
⚡ **Built with React + Tailwind**: Responsive and modern UI components

---

## 🧱 Tech Stack

- **Framework**: React (with create react app)
- **Styling**: Tailwind CSS
- **Data Fetching**: Fetch API
- **Backend API**: FastAPI (auditing logic)
- **Model Integration**: Gemini via LangChain (handled by backend)

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aditya172004/Qubic_raise_your_hack.git
cd Qubic_raise_your_hack
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
```
### 4. Start the FASTAPI backend server
```bash
git clone https://github.com/anubhavsultania/Qubic.git
cd Qubic
pip install -r requirements.txt
uvicorn main:app --reload
```
## 🌐 Usage

1. Upload a Qubic smart contract `.cpp` file **or** paste a GitHub URL.
2. Click **Analyze**.
3. The app will display:
   - Detected syntax issues  
   - Violations of Qubic smart contract standards  
   - Any AI-detected flaws or structural concerns  

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you'd like to modify.

---

## 📫 Contact

Need help or have questions?

👉 Open a GitHub Issue in this repository.


