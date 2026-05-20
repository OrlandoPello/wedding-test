// ====== 1. CONFIG ======
const defaultConfig = {
    bride_name: 'Chikmatun Chamidah',
    groom_name: 'Ahmad Yaufhy'
};

// URL dan Anon Key diambil langsung dari dashboard Supabase lu (Foto ke-2)
const SUPABASE_URL = "https://cwzpsbadhtfwbzcghjst.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3enBzYmFkaHRmd2J6Y2doanN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTYyMTMsImV4cCI6MjA5NDc3MjIxM30.C8jL-gyv0lJ1QatpfgFiMJZuV7JmuP2867RT0docN1k";

const lagu = document.getElementById('bg-music');

// ====== 2. BUKA UNDANGAN ======
function openInvitation() {
    document.getElementById('cover-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';

    if (lagu) {
        lagu.volume = 0.5;
        lagu.play().catch(() => console.log("Musik butuh interaksi user"));
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    startCountdown();
    initObserver();
    createLeaves();
    fetchWishes(); // Ambil ucapan asli dari Supabase saat undangan dibuka
}

// ====== 3. RSVP HANDLER (LANGSUNG KE SUPABASE) ======
document.getElementById('rsvp-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('rsvp-submit');
    const name = document.getElementById('rsvp-name').value;
    const message = document.getElementById('rsvp-message').value;
    const attendance = document.getElementById('rsvp-attendance').value;

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Mengirim...";

    try {
        // Tembak langsung ke tabel bernama 'wishes' di Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name: name,
                message: message,
                attendance: attendance,
                created_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert("Ucapan dan RSVP kamu berhasil terkirim! ✨");
            this.reset();
            fetchWishes(); // Refresh list ucapan biar langsung muncul yang baru
        } else {
            throw new Error("Gagal menyimpan ke Supabase");
        }
    } catch (err) { 
        console.error("Error Supabase:", err);
        alert("Waduh gagal kirim, Wir. Cek koneksi atau struktur tabel database lu.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
});

// ====== 4. CATAT HADIAH (LANGSUNG KE SUPABASE) ======
document.getElementById('gift-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('gift-submit');
    const name = document.getElementById('gift-name').value || "Anonim";
    const amountSelect = document.getElementById('gift-amount').value;
    const customAmount = document.getElementById('custom-gift-amount')?.value;
    
    const finalAmount = amountSelect === 'custom' ? customAmount : amountSelect;

    if (!finalAmount) {
        alert("Pilih atau isi nominal dulu Wir!");
        return;
    }

    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = "Mencatat...";

    try {
        // Tembak ke tabel bernama 'gifts' di Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                amount: finalAmount,
                created_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert(`Terima kasih ${name}! Konfirmasi hadiah Rp ${finalAmount} berhasil dicatat. 🙏`);
            this.reset();
            const wrapper = document.getElementById('custom-amount-wrapper');
            if (wrapper) wrapper.style.display = 'none';
        } else {
            throw new Error("Gagal menyimpan data hadiah");
        }
    } catch (err) {
        console.error(err);
        alert("Gagal mencatat hadiah, Wir.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
});

document.getElementById('gift-amount')?.addEventListener('change', function() {
    const wrapper = document.getElementById('custom-amount-wrapper');
    if (wrapper) wrapper.style.display = this.value === 'custom' ? 'block' : 'none';
});

// ====== 5. FETCH WISHES (DARI SUPABASE) ======
async function fetchWishes() {
    const list = document.getElementById('wishes-list');
    if (!list) return;

    try {
        // Ambil data dari tabel 'wishes' diurutkan berdasarkan yang terbaru
        const response = await fetch(`${SUPABASE_URL}/rest/v1/?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            const wishes = await response.json();

            if (wishes && wishes.length > 0) {
                const emptyEl = document.getElementById('wishes-empty');
                if (emptyEl) emptyEl.style.display = 'none';
                
                list.innerHTML = wishes.map(w => `
                    <div class="mb-4 p-4 rounded-lg bg-white/5 border border-white/10 text-left animate-fade-in">
                        <p class="font-bold text-sm text-amber-200">${w.name || 'Anonim'} <span class="text-[10px] opacity-50 text-white font-normal ml-2 italic">(${w.attendance || ''})</span></p>
                        <p class="text-sm opacity-80 mt-2 text-white">${w.message || ''}</p>
                    </div>
                `).join('');
            }
        }
    } catch (e) { 
        console.log("Gagal ambil list ucapan dari Supabase:", e); 
    }
}

// ====== 6. TOOLS & ANIMASI ======
function openMapDirections() {
    const alamat = "Jl.Dukuh Bedelan RT 003 / RW 001 Karangsambung Sempor Kebumen";
    window.open(`https://maps.google.com/?q=${encodeURIComponent(alamat)}`, '_blank');
}

function startCountdown() {
    const target = new Date('2026-06-13T08:00:00').getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        if (diff < 0) return;
        
        const d = document.getElementById('cd-days');
        const h = document.getElementById('cd-hours');
        const m = document.getElementById('cd-mins');
        const s = document.getElementById('cd-secs');

        if (d) d.textContent = Math.floor(diff / 86400000);
        if (h) h.textContent = Math.floor((diff % 86400000) / 3600000);
        if (m) m.textContent = Math.floor((diff % 3600000) / 60000);
        if (s) s.textContent = Math.floor((diff % 60000) / 1000);
    }, 1000);
}

function toggleMusic() {
    if (!lagu) return;
    if (lagu.paused) {
        lagu.play();
        showToast("Musik Diputar 🎵");
    } else {
        lagu.pause();
        showToast("Musik Berhenti 🔇");
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function initObserver() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('obs-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-obs]').forEach(el => obs.observe(el));
}

function createLeaves() {
    const c = document.getElementById('leaves-container');
    if (!c) return;
    for (let i = 0; i < 6; i++) {
        const l = document.createElement('div');
        l.className = 'leaf';
        l.style.left = Math.random() * 100 + '%';
        l.style.animation = `leaf-fall ${10 + Math.random() * 10}s linear infinite`;
        l.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" opacity="0.2"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75"/></svg>';
        c.appendChild(l);
    }
}
