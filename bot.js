const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const os = require('os');
const osu = require('node-os-utils');
const speedTest = require('speedtest-net');
const cron = require('node-cron');
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

// Fungsi: Ambil Screenshot dari URL dengan Puppeteer dan Stealth Plugin
async function takeCustomScreenshot(url, filename) {
    try {
        console.log(`📸 Mengambil screenshot dari URL: ${url}`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

        await page.goto(url, { waitUntil: 'networkidle2' });

        const filePath = path.join(__dirname, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        await browser.close();

        console.log('✅ Screenshot berhasil diambil:', filePath);
        return filePath;
    } catch (error) {
        console.error('❌ Gagal mengambil screenshot:', error.message);
        throw error;
    }
}

// Fungsi: Kirim Screenshot ke Grup WhatsApp
async function sendScreenshotToGroup() {
    try {
        const filePath = await takeCustomScreenshot('https://www.forexfactory.com/calendar', 'forex_calendar.png');
        const groupId = `${process.env.GROUP_ID}`; // ID Grup WhatsApp

        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(groupId, media, {
            caption: '📈 Berikut adalah kalender Forex hari ini:',
            sendMediaAsDocument: true // Kirim sebagai dokumen tanpa kompresi
        });

        console.log('✅ Screenshot berhasil dikirim ke grup!');
    } catch (error) {
        console.error('❌ Gagal mengirim screenshot ke grup:', error.message);
    }
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
        await sendScreenshotToGroup();
    }, {
        timezone: "Asia/Jakarta"
    });

    console.log('✅ Jadwal pengiriman screenshot Forex Factory sudah diatur.');
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
            const screenshotPath = await takeCustomScreenshot(url, 'custom_screenshot.png');
            const media = MessageMedia.fromFilePath(screenshotPath);

            // Kirim hasil screenshot ke pengguna
            await client.sendMessage(message.from, media, {
                caption: '✅ Berikut adalah screenshot dari website yang Anda minta:',
                sendMediaAsDocument: true // Kirim sebagai dokumen
            });
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
    } else if (command === '!groupid') {
        console.log('📩 Menerima perintah untuk mendapatkan Group ID...');
        if (message.from.endsWith('@g.us')) {
            client.sendMessage(message.from, `🆔 *Group ID*: ${message.from}`);
        } else {
            client.sendMessage(message.from, '⚠️ Perintah ini hanya dapat digunakan dalam grup!');
        }
    }
});

// Event: Error
client.on('error', (err) => {
    console.error('❌ Terjadi kesalahan:', err.message);
});

// Inisialisasi Client
client.initialize();
