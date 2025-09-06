const express = require('express');
const app = express();

app.use(express.json());

// Ambil data rahasia payload dari Environment Variables Vercel
// Ini adalah cara yang aman untuk menyimpan data sensitif.
const PAYLOAD_PART_1 = process.env.PAYLOAD_PART_1;
const PAYLOAD_PART_2 = process.env.PAYLOAD_PART_2;

// Fungsi CRC16 untuk validasi QRIS
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

// Endpoint API untuk generate QRIS
app.post('/api/generate', (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    if (!PAYLOAD_PART_1 || !PAYLOAD_PART_2) {
        console.error("Environment Variables not set!");
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    // Gabungkan payload dengan nominal yang diinput
    const amountLength = String(amount).length.toString().padStart(2, '0');
    const amountTag = `54${amountLength}${amount}`;
    const payloadForCrc = PAYLOAD_PART_1 + amountTag + PAYLOAD_PART_2 + "6304";
    const crcValue = crc16_ccitt(payloadForCrc);
    const finalPayload = payloadForCrc + crcValue;

    res.status(200).json({ success: true, payload: finalPayload });
});

module.exports = app;
