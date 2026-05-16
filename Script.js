// ====== 1. CONFIG ======
const defaultConfig = {
    bride_name: 'Chikmatun Chamidah',
    groom_name: 'Ahmad Yaufhy'
};

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
    fetchWishes(); 
}

// ====== 3. RSVP HANDLER (SMART HYBRID) ======
document.getElementById('rsvp-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('rsvp-submit');
    const name = document.getElementById('rsvp-name').value;
    const message = document.getElementById('rsvp-message').value;
    const attendance = document.getElementById('rsvp-attendance').value;

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Mengirim...";

    if (window.dataSdk) {
        // JALUR SDK PERMANEN
        try {
            const res = await window.dataSdk.create({ 
                name, message, attendance, 
                created_at: new Date().toISOString() 
            });
            if (res.isOk) {
                alert("Terkirim ke Database Pembina! ✨");
                this.reset();
                if (typeof fetchWishes === 'function') fetchWishes();
            }
        } catch (err) { console.error("Error SDK:", err); }
    } else {
        // JALUR SIMULASI (Muncul di bawah)
        setTimeout(() => {
            const list = document.getElementById('wishes-list');
            if (list) {
                document.getElementById('wishes-empty').style.display = 'none';
                const html = `
                    <div class="mb-4 p-4 rounded-lg bg-white/5 border border-white/10 text-left animate-fade-in">
                        <p class="font-bold text-sm text-amber-200">${name} <span class="text-[10px] opacity-50 text-white font-normal ml-2 italic">(${attendance})</span></p>
                        <p class="text-sm opacity-90 mt-2 text-white">${message}</p>
                    </div>`;
                list.insertAdjacentHTML('afterbegin', html);
            }
            alert("Berhasil! (Mode Simulasi)");
            this.reset();
        }, 800);
    }
    btn.disabled = false;
    btn.innerHTML = originalHTML;
});

// ====== 4. CATAT HADIAH (SMART HYBRID) ======
document.getElementById('gift-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('gift-submit');
    const name = document.getElementById('gift-name').value || "Anonim";
    const amountSelect = document.getElementById('gift-amount').value;
    const customAmount = document.getElementById('custom-gift-amount')?.value;
    
    // Tentukan nominal yang dipakai
    const finalAmount = amountSelect === 'custom' ? customAmount : amountSelect;

    if (!finalAmount) {
        alert("Pilih atau isi nominal dulu Wir!");
        return;
    }

    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = "Mencatat...";

    if (window.dataSdk) {
        try {
            await window.dataSdk.create({ 
                type: 'gift', 
                name, 
                amount: finalAmount,
                created_at: new Date().toISOString() 
            });
            alert("Konfirmasi hadiah tersimpan di Database! 🙏");
            this.reset();
        } catch (err) { console.error(err); }
    } else {
        setTimeout(() => {
            alert(`Terima kasih ${name}! Konfirmasi hadiah Rp ${finalAmount} diterima (Mode Simulasi).`);
            this.reset();
            const wrapper = document.getElementById('custom-amount-wrapper');
            if (wrapper) wrapper.style.display = 'none';
        }, 800);
    }
    btn.disabled = false;
    btn.innerHTML = originalHTML;
});

// Logika munculin input nominal custom
document.getElementById('gift-amount')?.addEventListener('change', function() {
    const wrapper = document.getElementById('custom-amount-wrapper');
    if (wrapper) wrapper.style.display = this.value === 'custom' ? 'block' : 'none';
});

// ====== 5. FETCH WISHES (DARI SDK) ======
async function fetchWishes() {
    const list = document.getElementById('wishes-list');
    if (!list || !window.dataSdk) return;

    try {
        const res = await window.dataSdk.list();
        if (res.isOk && res.data) {
            const wishes = res.data
                .filter(w => w.name && w.message)
                .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

            if (wishes.length > 0) {
                document.getElementById('wishes-empty').style.display = 'none';
                list.innerHTML = wishes.map(w => `
                    <div class="mb-4 p-4 rounded-lg bg-white/5 border border-white/10 text-left">
                        <p class="font-bold text-sm text-amber-200">${w.name} <span class="text-[10px] opacity-50 text-white font-normal ml-2 italic">(${w.attendance})</span></p>
                        <p class="text-sm opacity-80 mt-2 text-white">${w.message}</p>
                    </div>
                `).join('');
            }
        }
    } catch (e) { console.log("Gagal ambil list ucapan"); }
}

// ====== 6. TOOLS & ANIMASI ======
function openMapDirections() {
    const alamat = "Jl.Dukuh Bedelan RT 003 / RW 001 Karangsambung Sempor Kebumen";
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}`, '_blank');
}

function startCountdown() {
    const target = new Date('2026-06-13T08:00:00').getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        if (diff < 0) return;
        document.getElementById('cd-days').textContent = Math.floor(diff / 86400000);
        document.getElementById('cd-hours').textContent = Math.floor((diff % 86400000) / 3600000);
        document.getElementById('cd-mins').textContent = Math.floor((diff % 3600000) / 60000);
        document.getElementById('cd-secs').textContent = Math.floor((diff % 60000) / 1000);
    }, 1000);
}

function toggleMusic() {
    if (!lagu) return;
    const toast = document.getElementById('toast');
    
    if (lagu.paused) {
        lagu.play();
        showToast("Musik Diputar 🎵");
    } else {
        lagu.pause();
        showToast("Musik Berhenti 🔇");
    }
}

// Fungsi munculin notif di tengah
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    // notif ilang setelah 2 detik
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

// ====== 7. INIT ======
if (window.dataSdk) window.dataSdk.init();
if (window.elementSdk) window.elementSdk.init({ defaultConfig, onConfigChange: () => {} });