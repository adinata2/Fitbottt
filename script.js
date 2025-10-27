document.addEventListener('DOMContentLoaded', () => {

    // === BAGIAN 1: PENGELOLAAN HALAMAN & MODAL ===
    const openChatBtn = document.getElementById('open-chat-modal-btn');
    const chatModalOverlay = document.getElementById('chat-modal-overlay');

    openChatBtn.addEventListener('click', () => {
        chatModalOverlay.classList.add('active');
        
        // Cek jumlah pesan. Jika 0, berarti chat baru.
        if (chatBox.querySelectorAll('.message').length === 0) {
             startOnboarding();
        }
        // Jika sudah ada pesan, kita tidak melakukan apa-apa
        // (membiarkan percakapan yang sedang berlangsung).
    });


    // === BAGIAN 2: LOGIKA INTI CHATBOT INTERAKTIF ===
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatApiUrl = 'http://localhost:3000/chat';

    let onboardingState = 'IDLE';
    
    // userData menyimpan semua data pengguna selama onboarding
    const userData = { 
        name: null, 
        age: null, 
        gender: null, 
        weight: null, 
        height: null, 
        medicalHistory: null,   
        equipment: null,        
        activityLevel: null,    
        availableTime: null,    
        goal: null 
    };

    const startOnboarding = () => {
        chatBox.innerHTML = ''; // Selalu bersihkan chat saat mulai
        onboardingState = 'ASKING_NAME';
        
        // Tambahkan pesan selamat datang secara dinamis
        const welcomeMessage = "Selamat datang di FitBot, asisten kebugaran virtual Anda. " +
                               "Berikan data diri Anda untuk dapat disesuaikan dengan kebutuhan yang Anda inginkan. Siapa nama Anda?";
        addMessage({ text: welcomeMessage }, 'bot');
    };

    const addMessage = (message, sender) => {
        const msgEl = document.createElement('div');
        msgEl.classList.add('message', `${sender}-message`);
        
        let content = '';
        if (message.text) {
            // Mengubah barDetails
            let processedText = message.text
                .replace(/\*/g, '')  
                .replace(/#/g, '');   
            
            processedText = processedText.replace(/\n(?=\d+\.)/g, '<br><br>');
            processedText = processedText.replace(/\n/g, '<br>');

            content += `<p>${processedText}</p>`;
        }
        if (message.options) {
            content += '<div class="chat-options">';
            message.options.forEach(opt => {
                content += `<button class="chat-option-btn" data-value="${opt.value}">${opt.text}</button>`;
            });
            content += '</div>';
        }
        msgEl.innerHTML = content;
        chatBox.appendChild(msgEl);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- FUNGSI HELPER BARU UNTUK VALIDASI ---
    const isValidNumber = (input) => {
        const num = parseFloat(input);
        return !isNaN(num) && num > 0;
    };

    const isValidName = (input) => {
        // Cek jika input hanya berisi huruf dan spasi (bukan angka/simbol)
        return /^[a-zA-Z\s]+$/.test(input);
    };

    // FUNGSI Untuk menghitung dan mengkategorikan BMI ---
    const getBmiCategory = (bmi) => {
        if (bmi < 18.5) return 'Kurang berat badan';
        if (bmi >= 18.5 && bmi <= 24.9) return 'Berat badan normal';
        if (bmi >= 25 && bmi <= 29.9) return 'Kelebihan berat badan';
        return 'Obesitas';
    };

    // --- FUNGSI UNTUK LOGIKA USIA ---
    const requestInitialRecommendation = () => {
        // --- LOGIKA BARU BERDASARKAN USIA ---
        const age = parseInt(userData.age);
        let ageSpecificInstruction = ''; // Variabel untuk instruksi tambahan

        if (age < 18) {
            ageSpecificInstruction = "Karena pengguna masih remaja (di bawah 18 tahun), fokuskan pada latihan yang mendukung pertumbuhan, menggunakan berat badan sendiri, dan hindari beban yang terlalu berat. Pastikan latihannya menyenangkan dan membangun kebiasaan baik.";
        } else if (age >= 18 && age <= 45) {
            ageSpecificInstruction = "Pengguna berada di usia dewasa prima (18-45 tahun). Rencana bisa lebih komprehensif, mencakup kombinasi kardio, latihan kekuatan untuk membangun otot, dan fleksibilitas untuk menunjang kebugaran secara keseluruhan.";
        } else if (age > 45 && age <= 60) {
            ageSpecificInstruction = "Untuk pengguna di rentang usia 45-60 tahun, prioritaskan latihan yang menjaga massa otot, kekuatan tulang, dan kesehatan jantung. Sarankan untuk menghindari latihan high-impact jika tidak terbiasa dan fokus pada fleksibilitas sendi.";
        } else { // Di atas 60 tahun
            ageSpecificInstruction = "Pengguna berusia di atas 60 tahun. Fokus utama adalah pada keseimbangan untuk mencegah jatuh, kekuatan fungsional untuk aktivitas sehari-hari, dan mobilitas sendi. Semua latihan harus low-impact dan aman.";
        }
        // --- AKHIR LOGIKA USIA ---

        const fullProfilePrompt = `
            Halo AI. Saya adalah pengguna baru. Tolong buatkan saya rencana kebugaran awal yang sangat dipersonalisasi berdasarkan data lengkap saya berikut ini:
            - Nama: ${userData.name}
            - Usia: ${userData.age} tahun
            - Jenis Kelamin: ${userData.gender}
            - Berat: ${userData.weight} kg
            - Tinggi: ${userData.height} cm
            - Riwayat Penyakit/Cedera: ${userData.medicalHistory}
            - Alat yang Dimiliki: ${userData.equipment}
            - Tingkat Aktivitas Harian: ${userData.activityLevel}
            - Waktu Luang per Minggu: ${userData.availableTime}
            - Tujuan Utama: ${userData.goal}

            **Instruksi Tambahan Penting Berdasarkan Usia:** ${ageSpecificInstruction}
            Gunakan informasi ini untuk menyesuaikan rencana latihan yang aman, efektif, dan menyenangkan.
            
            Berikan sapaan hangat (sebut nama saya) dan berikan contoh rencana latihan awal (misalnya untuk 3 hari) yang mempertimbangkan SEMUA faktor di atas.
            Setelah itu, tanyakan apakah saya mau memulai rencana ini atau ada pertanyaan lain.
        `;

        // Kirim prompt ini ke AI. false berarti kita tidak menampilkan prompt ini sebagai pesan user.
        handleGeneralQuery(fullProfilePrompt, false); 
    };


    const advanceOnboarding = (userResponse) => {
        switch (onboardingState) {
            case 'ASKING_NAME':
                if (!isValidName(userResponse)) {
                    addMessage({ text: "Nama sepertinya tidak valid. Mohon gunakan huruf saja. Siapa nama panggilan Anda?" }, 'bot');
                    break; // Tetap di state ASKING_NAME
                }
                userData.name = userResponse;
                onboardingState = 'ASKING_AGE';
                addMessage({ text: `Senang bertemu denganmu, ${userData.name}! Boleh tahu berapa usia Anda sekarang? (Contoh: 25)` }, 'bot');
                break;

            case 'ASKING_AGE':
                const age = parseInt(userResponse);
                if (!isValidNumber(userResponse) || age < 12 || age > 99) {
                    addMessage({ text: "Input tidak valid. Mohon masukkan usia Anda dalam bentuk angka yang wajar (contoh: 12-99)." }, 'bot');
                    break; // Tetap di state ASKING_AGE
                }
                userData.age = userResponse;
                onboardingState = 'ASKING_GENDER';
                addMessage({ text: "Oke, dicatat. Selanjutnya, apa jenis kelamin Anda?", options: [{ text: 'Pria', value: 'Pria' }, { text: 'Wanita', value: 'Wanita' }] }, 'bot');
                break;

            case 'ASKING_GENDER':
                userData.gender = userResponse;
                onboardingState = 'ASKING_WEIGHT';
                addMessage({ text: "Berapa berat badan Anda saat ini (dalam kg)? (Contoh: 60)"}, 'bot');
                break;

            case 'ASKING_WEIGHT':
                 if (!isValidNumber(userResponse) || userResponse < 30) {
                    addMessage({ text: "Input tidak valid. Mohon masukkan berat badan Anda dalam kg (contoh: 60)." }, 'bot');
                    break;
                }
                userData.weight = userResponse;
                onboardingState = 'ASKING_Height';
                addMessage({ text: `Terima kasih! Sekarang, berapa tinggi badan Anda (dalam cm)? (Contoh: 170)` }, 'bot');
                break;

            case 'ASKING_Height':
                if (!isValidNumber(userResponse) || userResponse < 100) {
                    addMessage({ text: "Input tidak valid. Mohon masukkan tinggi badan Anda dalam cm (contoh: 170)." }, 'bot');
                    break;
                }
                userData.height = userResponse;
                onboardingState = 'ASKING_MEDICAL'; // <-- ALUR BARU
                addMessage({ text: "Apakah Anda memiliki riwayat penyakit atau cedera tertentu yang perlu saya perhatikan? (Contoh: 'Asma', 'Cedera lutut', atau 'Tidak ada')" }, 'bot');
                break;

            // --- TAHAPAN ONBOARDING BARU DIMULAI DI SINI ---

            case 'ASKING_MEDICAL':
                userData.medicalHistory = userResponse;
                onboardingState = 'ASKING_EQUIPMENT';
                addMessage({ text: "Alat olahraga apa yang Anda miliki di rumah? (Contoh: 'Dumbbell', 'Tali skipping', atau 'Hanya berat badan')" }, 'bot');
                break;

            case 'ASKING_EQUIPMENT':
                userData.equipment = userResponse;
                onboardingState = 'ASKING_ACTIVITY';
                addMessage({ 
                    text: "Bagaimana tingkat kesibukan atau aktivitas Anda sehari-hari?", 
                    options: [
                        { text: 'Santai (banyak duduk)', value: 'Santai / Sedentary' }, 
                        { text: 'Cukup Aktif (misal: pelajar/mahasiswa)', value: 'Cukup Aktif' },
                        { text: 'Sangat Aktif (misal: pekerja fisik)', value: 'Sangat Aktif' }
                    ] 
                }, 'bot');
                break;
            
            case 'ASKING_ACTIVITY':
                userData.activityLevel = userResponse;
                onboardingState = 'ASKING_TIME';
                addMessage({ text: "Berapa banyak total waktu luang yang bisa Anda sediakan untuk berolahraga setiap minggu? (Contoh: '2-3 jam', '30 menit setiap hari', 'Tidak tentu')" }, 'bot');
                break;

            case 'ASKING_TIME':
                userData.availableTime = userResponse;
                onboardingState = 'ASKING_GOAL'; // <-- Pindah ke state goal
                addMessage({ text: `Hampir selesai! Apa tujuan utama kebugaran Anda? (Contoh: "turun berat badan", "membentuk otot", "hidup lebih sehat")` }, 'bot');
                break;

            // --- AKHIR TAHAPAN ---

            case 'ASKING_GOAL':
                userData.goal = userResponse;
                onboardingState = 'CONFIRMING_DATA'; // Pindah ke state konfirmasi

                // --- LOGIKA PERHITUNGAN BMI ---
                const weight = parseFloat(userData.weight);
                const heightInMeters = parseFloat(userData.height) / 100;
                let bmiInfo = ''; 
                if (weight > 0 && heightInMeters > 0) {
                    const bmi = weight / (heightInMeters * heightInMeters);
                    const bmiCategory = getBmiCategory(bmi);
                    bmiInfo = `• BMI Anda: <strong>${bmi.toFixed(1)} (${bmiCategory})</strong>\n`;
                }
                
                // --- RANGKUMAN DATA (DIPERBARUI) ---
                const summary = `Baik, terima kasih! Mohon konfirmasi jika data berikut sudah benar:\n
                                • Nama: ${userData.name}
                                • Usia: ${userData.age}
                                • Jenis Kelamin: ${userData.gender}
                                • Berat/Tinggi: ${userData.weight} kg / ${userData.height} cm
                                ${bmiInfo}
                                • Riwayat Medis: ${userData.medicalHistory}
                                • Alat Tersedia: ${userData.equipment}
                                • Aktivitas Harian: ${userData.activityLevel}
                                • Waktu Olahraga: ${userData.availableTime}
                                • Tujuan Utama: ${userData.goal}\n
                                Apakah data ini sudah benar?`;

                addMessage({ 
                    text: summary, 
                    options: [
                        { text: '👍 Ya, Benar', value: 'confirm_correct' }, 
                        { text: '❌ Tidak, Ulangi', value: 'confirm_repeat' }
                    ] 
                }, 'bot');
                break;

            case 'CONFIRMING_DATA':
                if (userResponse === 'confirm_correct') {
                    onboardingState = 'CONVERSATION';
                    addMessage({ text: "Luar biasa! Saya akan siapkan rekomendasi awal yang dipersonalisasi untuk Anda. Mohon tunggu sebentar..." }, 'bot');
                    setTimeout(requestInitialRecommendation, 1500); // Panggil rekomendasi AI
                } else if (userResponse === 'confirm_repeat') {
                    addMessage({ text: "Baik, mari kita ulangi dari awal untuk memastikan semuanya benar." }, 'bot');
                    // Reset data dan state
                    Object.keys(userData).forEach(key => userData[key] = null);
                    setTimeout(startOnboarding, 1500);
                }
                break;
        }
    };

    // --- FUNGSI INI DIMODIFIKASI untuk menerima parameter `displayUserMessage` ---
    const handleGeneralQuery = async (messageText, displayUserMessage = true) => {
        if (displayUserMessage) {
            addMessage({ text: messageText }, 'user');
        }
        userInput.value = '';

        // Tampilkan indikator "sedang mengetik"
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot-message', 'typing-indicator');
        typingIndicator.innerHTML = '<p>FitBot sedang mengetik...</p>';
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // Kirim data ke API
            const response = await fetch(chatApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Kirim pesan DAN seluruh profil pengguna jika sudah selesai onboarding
                body: JSON.stringify({ 
                    message: messageText,
                    userProfile: (onboardingState === 'CONVERSATION') ? userData : null
                }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // Hapus indikator "sedang mengetik"
            chatBox.removeChild(typingIndicator);
            
            // Tampilkan jawaban AI
            addMessage({ text: data.reply }, 'bot');

        } catch (error) {
            console.error('Fetch Error:', error);
            // Hapus indikator "sedang mengetik" jika error
            if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            addMessage({ text: 'Maaf, terjadi masalah koneksi ke server AI.' }, 'bot');
        }
    };

    const handleUserInput = () => {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        if (onboardingState.startsWith('ASKING_')) {
            addMessage({ text: messageText }, 'user');
            userInput.value = '';
            // Tambahkan jeda sedikit 
            setTimeout(() => advanceOnboarding(messageText), 300);
        } else {
            // State 'CONVERSATION' atau 'IDLE'
            handleGeneralQuery(messageText);
        }
    };

    sendBtn.addEventListener('click', handleUserInput);
    
    // Ini adalah perbaikan Enter
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Mencegah baris baru
            handleUserInput();
        }
    });

    chatBox.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-option-btn')) {
            const value = e.target.dataset.value;
            const text = e.target.innerText;
            
            // Tampilkan pilihan sebagai pesan user, kecuali untuk tombol konfirmasi
            if (onboardingState !== 'CONFIRMING_DATA') {
                addMessage({ text: text }, 'user');
            }
            
            // Nonaktifkan semua tombol di grup itu
            e.target.parentElement.querySelectorAll('.chat-option-btn').forEach(btn => {
                btn.disabled = true;
                
            });
            
            // Tambahkan jeda sedikit
            setTimeout(() => advanceOnboarding(value), 300);
        }
    });
});


