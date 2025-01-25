const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const osu = require('node-os-utils');
const speedTest = require('speedtest-net');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

// Inisialisasi WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Menangani mode root
    }
});

// Event: QR Code
client.on('qr', (qr) => {
    console.log('⚠️ Silakan scan QR Code berikut dengan WhatsApp Anda:');
    qrcode.generate(qr, { small: true }); // Menampilkan QR Code visual di terminal
});

// Event: Bot Siap
client.on('ready', () => {
    console.log('✅ Bot WhatsApp siap digunakan!');
    scheduleDailyScreenshot(); // Jadwalkan pengiriman screenshot Forex Factory harian
});

// Fungsi: Ambil Screenshot dari URL yang Diminta
async function takeCustomScreenshot(url) {
    try {
        console.log(`📸 Mengambil screenshot dari URL: ${url}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const filePath = path.join(__dirname, 'custom_screenshot.png');
        await page.screenshot({ path: filePath, fullPage: true });
        await browser.close();

        console.log('✅ Screenshot berhasil diambil:', filePath);
        return filePath;
    } catch (error) {
        console.error('❌ Gagal mengambil screenshot:', error.message);
        throw error;
    }
}

// Fungsi: Kirim Screenshot ke WhatsApp
async function sendScreenshot() {
    try {
        const filePath = await takeScreenshot();
        const chatId = `${process.env.RECIPIENT_NUMBER}@c.us`;

        const media = fs.readFileSync(filePath);
        await client.sendMessage(chatId, '📈 Berikut adalah kalender Forex hari ini:', { media });

        console.log('✅ Screenshot berhasil dikirim!');
    } catch (error) {
        console.error('❌ Gagal mengirim screenshot:', error.message);
    }
}

// Fungsi: Status Server
async function getServerStatus() {
    const cpu = await osu.cpu.usage();
    const mem = await osu.mem.info();
    const disk = await osu.drive.info();
    const uptime = os.uptime();
    const loadAverage = os.loadavg()[0];

    return `
💻 *Status Server* 💻
=====================
🕒 *Uptime:* ${Math.floor(uptime / 3600)} jam
💽 *CPU Usage:* ${cpu.toFixed(2)}%
🧠 *RAM Usage:* ${mem.usedMemMb}MB / ${mem.totalMemMb}MB
📀 *Disk Usage:* ${disk.usedGb}GB / ${disk.totalGb}GB
⚙️ *Load Average:* ${loadAverage.toFixed(2)}
=====================
    `;
}

// Fungsi: Jalankan Speedtest
async function runSpeedTest() {
    try {
        console.log('🚀 Menjalankan Speedtest...');
        const result = await speedTest({ acceptLicense: true });

        return `
🚀 *Hasil Speedtest* 🚀
=====================
🏓 *Ping:* ${result.ping.latency} ms
⬇️ *Download Speed:* ${(result.download.bandwidth / 125000).toFixed(2)} Mbps
⬆️ *Upload Speed:* ${(result.upload.bandwidth / 125000).toFixed(2)} Mbps
📍 *Server:* ${result.server.location} (${result.server.country})
=====================
        `;
    } catch (error) {
        console.error('❌ Speedtest gagal:', error.message);
        return '⚠️ Gagal melakukan speedtest. Coba lagi nanti!';
    }
}

// Fungsi: Jadwalkan Screenshot Harian (Pukul 09:00)
function scheduleDailyScreenshot() {
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Menjalankan tugas harian...');
        await sendScreenshot();
    }, {
        timezone: "Asia/Jakarta"
    });

    console.log('✅ Jadwal pengiriman screenshot Forex Factory sudah diatur.');
}

// Event: Pesan Diterima
client.on('message', async (message) => {
    const command = message.body.toLowerCase();

    if (command.startsWith('!webss ')) {
        const url = command.replace('!webss ', '').trim();

        // Validasi URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            client.sendMessage(message.from, '⚠️ URL tidak valid! Harap masukkan URL yang dimulai dengan "http://" atau "https://".');
            return;
        }

        console.log(`📩 Menerima perintah web screenshot untuk URL: ${url}`);
        client.sendMessage(message.from, '📸 Sedang mengambil screenshot, harap tunggu...');

        try {
            const screenshotPath = await takeCustomScreenshot(url);
            const media = fs.readFileSync(screenshotPath);

            // Kirim hasil screenshot ke pengguna
            await client.sendMessage(message.from, '✅ Berikut adalah screenshot dari website yang Anda minta:', { media });
            console.log('✅ Screenshot berhasil dikirim!');
        } catch (error) {
            console.error('❌ Gagal mengirim screenshot:', error.message);
            client.sendMessage(message.from, '❌ Gagal mengambil screenshot dari URL yang diminta. Coba lagi nanti!');
        }
    } else if (command === '!status') {
        console.log('📩 Menerima perintah status server...');
        const statusMessage = await getServerStatus();
        client.sendMessage(message.from, statusMessage);
    } else if (command === '!speedtest') {
        console.log('📩 Menerima perintah speedtest...');
        client.sendMessage(message.from, '🚀 Sedang menjalankan speedtest, harap tunggu sebentar...');
        const speedResult = await runSpeedTest();
        client.sendMessage(message.from, speedResult);
    }
});

// Event: Error
client.on('error', (err) => {
    console.error('❌ Terjadi kesalahan:', err.message);
});

// Inisialisasi Client
client.initialize();
