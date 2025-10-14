// Tüm DOM içeriği yüklendikten sonra script'i çalıştır
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // Sayfa Navigasyonu (Tek Sayfa Uygulama Mantığı)
    // ==========================================================================
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.main-content .section');

    function showSection(targetId) {
        sections.forEach(section => {
            if ('#' + section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mobil menüyü kapat
        if (document.getElementById('navMenu')) {
            document.getElementById('navMenu').classList.remove('show');
        }
    }

    // Menü linklerine tıklama olayını dinle
    const navMenuElement = document.querySelector('.nav-menu');
    if (navMenuElement) {
        navMenuElement.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                e.preventDefault();
                const link = e.target.closest('a');
                const targetId = link.getAttribute('href');
                showSection(targetId);
            }
        });
    }

    // Dashboard kartlarındaki linklere tıklama olayını dinle
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        dashboardGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-link')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href');
                showSection(targetId);
            }
        });
    }

    // Sayfa ilk yüklendiğinde ana sayfayı göster
    showSection('#ana-sayfa');


    // ==========================================================================
    // Mobil Menü
    // ==========================================================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }

    // ==========================================================================
    // Randevu Formu
    // ==========================================================================
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hospital = document.getElementById('hospital').options[document.getElementById('hospital').selectedIndex].text;
            const department = document.getElementById('department').options[document.getElementById('department').selectedIndex].text;
            const doctor = document.getElementById('doctor').options[document.getElementById('doctor').selectedIndex].text;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;

            if (hospital && department && doctor && date && time) {
                alert(`Randevunuz başarıyla oluşturuldu!\n\n Hastane: ${hospital}\n Bölüm: ${department}\n Doktor: ${doctor}\n Tarih: ${date}\n Saat: ${time}`);
                appointmentForm.reset();
            } else {
                alert("Lütfen tüm zorunlu alanları doldurun.");
            }
        });
    }
    
    // Randevu İptal
    const appointmentsList = document.querySelector('.appointments-list-card');
    if(appointmentsList) {
        appointmentsList.addEventListener('click', (e) => {
            if (e.target.closest('.btn-cancel')) {
                const appointmentItem = e.target.closest('.appointment-item');
                if (confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?")) {
                    appointmentItem.style.transition = 'opacity 0.5s ease';
                    appointmentItem.style.opacity = '0';
                    setTimeout(() => {
                        appointmentItem.remove();
                    }, 500);
                }
            }
        });
    }
});


// ==========================================================================
// YENİ GEMINI SOHBET ARAYÜZÜ MANTIĞI
// ==========================================================================
const apiKey = 'AIzaSyA80mTpjPlhmn2qvETNgDvRPCFohGVLci4'; // Lütfen kendi Gemini API anahtarınızı buraya girin.
let messages = [];
let responseTimes = [];

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    addMessage('user', message);
    input.value = '';

    const sendBtn = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    
    sendBtn.disabled = true;
    typingIndicator.classList.add('active');

    const startTime = Date.now();

    try {
        const response = await callGeminiAPI(message);
        const duration = (Date.now() - startTime) / 1000;
        
        responseTimes.push(duration);
        addMessage('ai', response, duration);
        updateStats();
    } catch (error) {
        addMessage('ai', `❌ Hata: ${error.message}`);
        console.error('Full error:', error);
    } finally {
        sendBtn.disabled = false;
        typingIndicator.classList.remove('active');
    }
}

async function callGeminiAPI(userMessage) {
    // *** HATA DÜZELTİLDİ: Stabil ve uyumlu API adresi (v1) ve modeli (gemini-pro) kullanılıyor. ***
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const contents = [
        {
            role: "user",
            parts: [{ text: "Sen E-Sağlık platformunda çalışan HEMŞO adında, Türkçe konuşan yardımsever bir sağlık asistanısın. Tıbbi tavsiye vermediğini, sadece bilgilendirme yaptığını ve her zaman bir doktora danışılması gerektiğini belirt." }]
        },
        {
            role: "model",
            parts: [{ text: "Anlaşıldı! Ben HEMŞO, E-Sağlık platformunuzdaki kişisel sağlık asistanınızım. Sağlıkla ilgili sorularınızda size bilgi vererek yardımcı olabilirim. Unutmayın, söylediklerim tıbbi tavsiye niteliği taşımaz. Sağlığınızla ilgili her zaman bir doktora danışmalısınız." }]
        }
    ];

    const recentMessages = messages.slice(-8); // Son 8 mesajı hafızada tut
    for (const msg of recentMessages) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }
    
    // En son kullanıcı mesajını ekle
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const requestBody = {
        contents: contents,
        generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            throw new Error(`API Hatası: ${response.status} - ${errorText}`);
        }

        if (errorData.error?.message?.includes('API_KEY_INVALID') || 
            errorData.error?.message?.includes('API key not valid')) {
            throw new Error('Geçersiz API anahtarı!');
        }
        
        if (errorData.error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API kotanız doldu. Lütfen daha sonra tekrar deneyin.');
        }

        // Gelen hatayı doğrudan göster
        if(errorData.error?.message){
             throw new Error(errorData.error.message);
        }

        throw new Error(`API Hatası: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            return `İsteğiniz güvenlik filtreleri nedeniyle engellendi: ${data.promptFeedback.blockReason}`;
        }
        throw new Error('API yanıt vermedi. Lütfen tekrar deneyin.');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Yanıt içeriği bulunamadı.');
    }

    return candidate.content.parts[0].text || 'Yanıt alınamadı.';
}

function addMessage(role, content, duration = null) {
    messages.push({ role, content, timestamp: new Date() });

    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    let timeStr = new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    if (duration) {
        timeStr += ` • ⚡${duration.toFixed(1)}s`;
    }

    messageDiv.innerHTML = `
        <div class="message-content">
            <div>${content.replace(/\n/g, '<br>')}</div>
            <div class="message-time">${timeStr}</div>
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearChat() {
    if (confirm('Konuşmayı temizlemek istediğinize emin misiniz?')) {
        messages = [];
        responseTimes = [];
        document.getElementById('chatContainer').innerHTML = `
            <div class="message ai">
                <div class="message-content">
                    <div>👋 Yeni sohbet başladı!</div>
                </div>
            </div>
        `;
        updateStats();
    }
}

function saveChat() {
    const data = {
        savedAt: new Date().toISOString(),
        messages: messages
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `gemini_chat_${new Date().toISOString().slice(0, 16).replace(/:/g, '')}.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function showStats() {
    const avgTime = responseTimes.length > 0 
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
        : 0;
    
    alert(`📊 İstatistikler:
    
    Toplam Mesaj: ${messages.length}
    Kullanıcı: ${messages.filter(m => m.role === 'user').length}
    AI: ${messages.filter(m => m.role === 'ai').length}
    Ortalama Yanıt Süresi: ${avgTime}s`);
}

function updateStats() {
    const avgTime = responseTimes.length > 0 
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
        : 0;
    
    document.getElementById('stats').textContent = 
        `Mesaj: ${messages.length} | Ortalama: ${avgTime}s`;
}