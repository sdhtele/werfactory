const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const osu = require('node-os-utils');
const speedTest = require('speedtest-net');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,  // Ubah ke true jika ingin berjalan di background
    }
});

client.on('qr', (qr) => {
    console.log('Scan QR Code ini dengan WhatsApp Anda.');
});

client.on('ready', () => {
    console.log('Bot WhatsApp siap digunakan!');
    scheduleDailyScreenshot();
});

// Fungsi untuk mengambil screenshot dari Forex Factory
async function takeScreenshot() {
    console.log('Mengambil screenshot dari Forex Factory...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.forexfactory.com/calendar', { waitUntil: 'networkidle2' });

    await page.waitForSelector('.calendar__table');

    const filePath = path.join(__dirname, 'forex_calendar.png');
    await page.screenshot({ path: filePath, fullPage: true });
    await browser.close();

    console.log('Screenshot berhasil diambil:', filePath);
    return filePath;
}

// Fungsi untuk mengirim screenshot ke WhatsApp
async function sendScreenshot() {
    const filePath = await takeScreenshot();
    const chatId = process.env.RECIPIENT_NUMBER + '@c.us';

    client.sendMessage(chatId, 'Berikut adalah kalender Forex hari ini:', {
        media: fs.readFileSync(filePath),
    }).then(() => {
        console.log('Screenshot berhasil dikirim!');
    }).catch((error) => {
        console.error('Gagal mengirim pesan:', error);
    });
}

// Fungsi untuk mengambil status server
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

// Fungsi untuk melakukan speedtest
async function runSpeedTest() {
    try {
        console.log('Menjalankan Speedtest...');
        const result = await speedTest({ acceptLicense: true });

        return `
🚀 *Hasil Speedtest* 🚀
=====================
🏓 *Ping:* ${result.ping.latency} ms
⬇️ *Download Speed:* ${result.download.bandwidth / 125000} Mbps
⬆️ *Upload Speed:* ${result.upload.bandwidth / 125000} Mbps
📍 *Server:* ${result.server.location} (${result.server.country})
=====================
        `;
    } catch (error) {
        console.error('Speedtest gagal:', error);
        return 'Gagal melakukan speedtest. Coba lagi nanti!';
    }
}

// Fungsi untuk menjadwalkan pengiriman screenshot setiap hari pukul 09:00
function scheduleDailyScreenshot() {
    cron.schedule('0 9 * * *', async () => {
        console.log('Menjalankan tugas harian...');
        await sendScreenshot();
    }, {
        timezone: "Asia/Jakarta"
    });

    console.log('Jadwal pengiriman screenshot Forex Factory sudah diatur.');
}

// Event listener untuk menerima pesan WhatsApp
client.on('message', async (message) => {
    if (message.body.toLowerCase() === '!status') {
        console.log('Menerima perintah status server...');
        const statusMessage = await getServerStatus();
        client.sendMessage(message.from, statusMessage);
    } else if (message.body.toLowerCase() === '!speedtest') {
        console.log('Menerima perintah speedtest...');
        client.sendMessage(message.from, '🚀 Sedang menjalankan speedtest, harap tunggu sebentar...');
        const speedResult = await runSpeedTest();
        client.sendMessage(message.from, speedResult);
    }
});

client.on('error', (err) => {
    console.error('Terjadi kesalahan:', err);
});

client.initialize();
