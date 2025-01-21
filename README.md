# Werfactory - WhatsApp Bot

Werfactory is a Node.js-based WhatsApp bot designed to automate various tasks, such as sending daily screenshots of the Forex Factory calendar, providing server status, and performing speed tests. This bot uses the `whatsapp-web.js` library for WhatsApp integration without relying on an API.

---

## Features

1. **Daily Screenshot**: Automatically captures and sends a screenshot of the Forex Factory calendar every day at 09:00 AM (Asia/Jakarta timezone).
2. **Server Status**: Responds to `!status` command to display:
   - Uptime
   - CPU usage
   - RAM usage
   - Disk usage
   - Load average
3. **Internet Speed Test**: Responds to `!speedtest` command to perform and display:
   - Download speed
   - Upload speed
   - Ping
   - Server location

---

## Requirements

- Node.js (v16 or newer)
- npm (v7 or newer)
- Google Chrome or Chromium (required by Puppeteer)
- Ubuntu (recommended for deployment)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/werfactory.git
   cd werfactory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   nano .env
   ```
   Add the following content:
   ```env
   RECIPIENT_NUMBER=6281234567890
   ```
   Replace `6281234567890` with the recipient's WhatsApp number in international format (without `+` or spaces).

4. Start the bot:
   ```bash
   npm start
   ```

---

## Usage

### Commands

- **`!status`**: Sends the current server status.
- **`!speedtest`**: Performs an internet speed test and sends the result.

### Automated Tasks

- **Daily Screenshot**: The bot automatically sends the Forex Factory calendar screenshot every day at 09:00 AM (Asia/Jakarta timezone).

---

## File Structure

```
werfactory/
├── .env                 # Environment variables
├── bot.js               # Main bot logic
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Exact dependency versions
└── README.md            # Project documentation
```

---

## Deployment

### Using PM2 (Process Manager)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the bot using PM2:
   ```bash
   pm2 start bot.js --name werfactory
   ```

3. Save the PM2 process list:
   ```bash
   pm2 save
   ```

4. Ensure PM2 starts on system boot:
   ```bash
   pm2 startup
   ```

---

## Dependencies

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js): For WhatsApp Web integration.
- [puppeteer](https://github.com/puppeteer/puppeteer): For web automation and screenshot capture.
- [node-os-utils](https://github.com/SunilWang/node-os-utils): For retrieving server statistics.
- [speedtest-net](https://github.com/ddsol/speedtest.net): For performing internet speed tests.
- [dotenv](https://github.com/motdotla/dotenv): For managing environment variables.
- [cron](https://github.com/kelektiv/node-cron): For task scheduling.

---

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes.
4. Push your branch and create a pull request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact

For questions or issues, please contact:
- **Name**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [yourusername](https://github.com/yourusername)

