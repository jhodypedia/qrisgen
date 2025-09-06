// --- Referensi Elemen HTML ---
const nominalInput = document.getElementById('nominalInput');
const bayarBtn = document.getElementById('bayarBtn');
const quickAmountButtons = document.querySelectorAll('.quick-amounts button');
const modalOverlay = document.getElementById('modalOverlay');
const closeBtn = document.getElementById('closeBtn');
const qrcodeContainer = document.getElementById('qrcode');
const paymentAmountEl = document.getElementById('paymentAmount');

// --- Fungsi Helper ---
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID').format(angka);
const unformatRupiah = (rupiahStr) => parseInt(String(rupiahStr).replace(/\./g, ''), 10) || 0;

// --- Logika Utama ---
function handleInputChange(event) {
    const rawValue = unformatRupiah(event.target.value);
    const formattedValue = rawValue > 0 ? formatRupiah(rawValue) : '';
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
            new QRCode(qrcodeContainer, { text: data.payload, width: 256, height: 256 });
            paymentAmountEl.textContent = `Rp ${formatRupiah(nominal)}`;
            modalOverlay.classList.add('show');
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
        bayarBtn.disabled = false;
        bayarBtn.textContent = 'Bayar';
    }
}

// --- Event Listeners ---
nominalInput.addEventListener('input', handleInputChange);
quickAmountButtons.forEach(button => {
    button.addEventListener('click', () => setNominal(button.dataset.amount));
});

bayarBtn.addEventListener('click', requestQRISFromServer);
closeBtn.addEventListener('click', () => modalOverlay.classList.remove('show'));
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) modalOverlay.classList.remove('show');
});
