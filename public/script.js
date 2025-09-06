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

// --- 1. DATA PAYLOAD DIKEMBALIKAN KE FRONTEND ---
// Ganti nilai ini jika Anda memiliki data QRIS statis yang berbeda
const PAYLOAD_PART_1 = "00020101021126610014COM.GO-JEK.WWW01189360091438098430560210G8098430560303UMI51440014ID.CO.QRIS.WWW0215ID10254038798730303UMI520454995303360";
const PAYLOAD_PART_2 = "5802ID5911Pansa Store6010BOJONEGORO61056211162070703A01";
const MERCHANT_NAME = "Pansa Store";

// --- Fungsi Helper ---
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID').format(angka);
const unformatRupiah = (rupiahStr) => parseInt(String(rupiahStr).replace(/\./g, ''), 10) || 0;

// --- 2. FUNGSI CRC16 DIKEMBALIKAN KE FRONTEND ---
// Fungsi ini wajib ada untuk menghitung checksum QRIS agar valid
function crc16_ccitt(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// --- 3. FUNGSI UTAMA DIPERBARUI (TIDAK LAGI MENGHUBUNGI SERVER) ---
// Logika pembuatan QRIS terjadi langsung di sini
function generateLocalQRIS() {
    const nominal = unformatRupiah(nominalInput.value);
    if (nominal <= 0) {
        alert("Silakan masukkan nominal yang valid.");
        return;
    }

    // A. Buat Tag '54' (Transaction Amount)
    const amountLength = String(nominal).length.toString().padStart(2, '0');
    const amountTag = `54${amountLength}${nominal}`;

    // B. Gabungkan payload untuk dihitung CRC-nya
    const payloadForCrc = PAYLOAD_PART_1 + amountTag + PAYLOAD_PART_2 + "6304";
    
    // C. Hitung CRC
    const crcValue = crc16_ccitt(payloadForCrc);

    // D. Gabungkan semua menjadi payload QRIS final
    const finalPayload = payloadForCrc + crcValue;

    // E. Bersihkan QR code lama dan buat yang baru
    qrcodeContainer.innerHTML = "";
    new QRCode(qrcodeContainer, {
        text: finalPayload,
        width: 256,
        height: 256
    });
    
    // F. Tampilkan modal dengan info nominal
    paymentAmountEl.textContent = `Rp ${formatRupiah(nominal)}`;
    modalOverlay.classList.add('show');
}

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

// --- Inisialisasi & Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    merchantNameEl.textContent = MERCHANT_NAME;
    merchantInitialEl.textContent = MERCHANT_NAME.charAt(0);
});

nominalInput.addEventListener('input', handleInputChange);
quickAmountButtons.forEach(button => {
    button.addEventListener('click', () => setNominal(button.dataset.amount));
});

// Tombol bayar sekarang memanggil fungsi lokal `generateLocalQRIS`
bayarBtn.addEventListener('click', generateLocalQRIS);
closeBtn.addEventListener('click', () => modalOverlay.classList.remove('show'));
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) modalOverlay.classList.remove('show');
});
