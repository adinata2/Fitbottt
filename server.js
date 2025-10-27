// Import library yang dibutuhkan
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// Konfigurasi environment variables dari file .env
dotenv.config();

// Inisialisasi aplikasi Express
const app = express();
app.use(cors()); // Mengaktifkan CORS
app.use(express.json()); // Middleware untuk membaca JSON dari request body
const path = require('path');
app.use(express.static(path.join(__dirname)));

// Inisialisasi model Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//gunakan model Gemini 2.5 Flash
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
// --------------------------------------------------------

// Definisikan "kepribadian" chatbot kita
const systemInstruction = `
Anda adalah "FitBot", seorang pelatih kebugaran virtual dan ahli gizi yang cerdas, ramah, dan memotivasi.
Tujuan utama Anda adalah membantu pengguna mencapai tujuan kebugaran mereka dengan memberikan saran yang aman, efektif, dan personal.
Selalu berikan jawaban yang jelas, terstruktur (gunakan poin atau nomor jika perlu), dan positif.
Jika pengguna bertanya di luar topik kebugaran, nutrisi, atau kesehatan, dengan sopan tolak untuk menjawab dan arahkan kembali ke topik utama.
Contoh respons: "Saya adalah asisten kebugaran virtual. Saya bisa bantu Anda dengan rencana latihan, tips nutrisi, atau motivasi. Ada yang bisa saya bantu terkait hal itu?"
Jangan pernah memberikan nasihat medis. Jika pertanyaan mendekati ranah medis, sarankan pengguna untuk berkonsultasi dengan dokter atau profesional kesehatan.
`;

const chat = model.startChat({
  history: [{ role: "user", parts: [{ text: systemInstruction }] }],
  generationConfig: {
    maxOutputTokens: 10000,
  },
});

// Buat endpoint untuk chat
app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body.message;

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("Error saat berkomunikasi dengan Gemini:", error);
    res.status(500).json({ error: "Maaf, terjadi kesalahan pada server." });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});



