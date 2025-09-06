// --- Referensi Elemen HTML ---
const nominalInput = document.getElementById('nominalInput');
const bayarBtn = document.getElementById('bayarBtn');
const quickAmountButtons = document.querySelectorAll('.quick-amounts button');
const merchantNameEl = document.getElementById('merchantName');
const merchantInitialEl = document.getElementById('merchantInitial');
const modalOverlay = document.getElementById('modalOverlay');
const closeBtn = document.getElementById('closeBtn');
const qrcodeContainer = document.getElementById('qrcode');
const paymentAmountEl = document.getElementById('paymentAmount');

// --- Nama Merchant (Bisa di-hardcode atau diambil dari API nanti) ---
const MERCHANT_NAME = "Pansa Store";

// --- Fungsi Helper ---
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID').format(angka);
const unformatRupiah = (rupiahStr) => parseInt(String(rupiahStr).replace(/\./g, ''), 10) || 0;

// --- Logika Utama ---
function handleInputChange(event) {
    const rawValue = unformatRupiah(event.target.value);
    const formattedValue = rawValue > 0 ? formatRupiah(rawValue) : '';
    // Trik untuk menjaga posisi kursor
    if (nominalInput.value !== formattedValue) {
        nominalInput.value = formattedValue;
    }
    bayarBtn.disabled = rawValue <= 0;
}

function setNominal(amount) {
    nominalInput.value = formatRupiah(amount);
    nominalInput.dispatchEvent(new Event('input'));
}

async function requestQRISFromServer() {
    const nominal = unformatRupiah(nominalInput.value);
    if (nominal <= 0) return;

    // Tampilkan loading & nonaktifkan tombol
    bayarBtn.disabled = true;
    bayarBtn.textContent = 'Memproses...';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: nominal }),
        });

        const data = await response.json();

        if (data.success) {
            qrcodeContainer.innerHTML = "";
            new QRCode(qrcodeContainer, {
                text: data.payload,
                width: 256,
                height: 256,
            });
            paymentAmountEl.textContent = `Rp ${formatRupiah(nominal)}`;
            modalOverlay.classList.add('show');
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Tidak dapat terhubung ke server. Silakan coba lagi.');
    } finally {
        // Kembalikan tombol ke keadaan semula
        bayarBtn.disabled = false;
        bayarBtn.textContent = 'Bayar';
    }
}

// --- Inisialisasi & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    merchantNameEl.textContent = MERCHANT_NAME;
    merchantInitialEl.textContent = MERCHANT_NAME.charAt(0);
});

nominalInput.addEventListener('input', handleInputChange);
quickAmountButtons.forEach(button => {
    button.addEventListener('click', () => setNominal(button.dataset.amount));
});

bayarBtn.addEventListener('click', requestQRISFromServer);
closeBtn.addEventListener('click', () => modalOverlay.classList.remove('show'));
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) modalOverlay.classList.remove('show');
});
