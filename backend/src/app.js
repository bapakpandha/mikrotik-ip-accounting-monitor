// app.js
const fs = require("fs");
const axios = require("axios");
const persistence = require("./persistence");
const path = require("path");
const { readSettings } = require("./utils");
const logFile = path.join(__dirname, "../../app.log");

function log(msg) {
    const line = `${new Date().toISOString()} - ${msg}\n`;
    fs.appendFileSync(logFile, line);
}

function roundTimeForward(interval, now = new Date()) {
    const seconds = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600;
    const rounding = Math.ceil((seconds + 1) / interval) * interval;
    const midnight = new Date(now).setHours(0, 0, 0, 0);
    const next = new Date(midnight + rounding * 1000);
    return next;
}

async function waitToNextInterval(interval) {
    const now = new Date();
    const next = roundTimeForward(interval, now);
    if (next <= now) {
        throw new Error("Next interval time is not in the future")};
    const diff = next - now;
    return new Promise((resolve) => setTimeout(resolve, diff));
}

async function getData(IP) {
    let data = [];
    let allUsers = [];
    let totalUp = 0;
    let totalDn = 0;

    let pulled;
    try {
        const res = await axios.get(`http://${IP}/accounting/ip.cgi`);
        pulled = res.data.trim().split("\n");
    } catch (err) {
        log("Error request: " + err);
        return;
    }

    let userList = await persistence.readUserLists();
    let userDict = {};
    userList.forEach((u) => (userDict[u.username] = u.user_id));

    for (let line of pulled) {
        const s = line.split(" ");
        if (s.length < 6) continue;
        const usernameUp = s[4];
        const usernameDown = s[5];

        if (usernameUp !== "*") {
            let userId = userDict[usernameUp];
            if (!userId) {
                await persistence.addNewUserToLists(usernameUp);
                userList = await persistence.readUserLists();
                userDict = {};
                userList.forEach((u) => (userDict[u.username] = u.user_id));
                userId = userDict[usernameUp];
            }
            allUsers.push(userId);
            data.push([userId, parseFloat(s[2]), 0.0]);
        } else if (usernameDown !== "*") {
            let userId = userDict[usernameDown];
            if (!userId) {
                await persistence.addNewUserToLists(usernameDown);
                userList = await persistence.readUserLists();
                userDict = {};
                userList.forEach((u) => (userDict[u.username] = u.user_id));
                userId = userDict[usernameDown];
            }
            allUsers.push(userId);
            data.push([userId, 0.0, parseFloat(s[2])]);
        }
    }

    const uniqueUsers = [...new Set(allUsers)];
    for (let uid of uniqueUsers) {
        let up = 0,
            dn = 0;
        for (let d of data) {
            if (d[0] === uid) {
                up += d[1];
                dn += d[2];
            }
        }
        totalUp += up;
        totalDn += dn;
        await persistence.addRawData(uid, up, dn, new Date());
    }
    await persistence.addRawData(1, totalUp, totalDn, new Date());
}

async function aggregateData30Min() {
    try {
        const users = await persistence.readUserLists();
        for (let u of users) {
            const userId = u.user_id;
            const count = await persistence.queryDb(
                "SELECT COUNT(*) as count FROM raw_bandwidth_logs WHERE user_id = ?",
                [userId]
            );
            if (count[0].count === 0) continue;

            const sum = await persistence.queryDb(
                "SELECT SUM(tx_bytes) as total_tx_bytes, SUM(rx_bytes) as total_rx_bytes FROM raw_bandwidth_logs WHERE user_id = ?",
                [userId]
            );
            const timestamps = await persistence.queryDb(
                "SELECT timestamp FROM raw_bandwidth_logs WHERE user_id = ?",
                [userId]
            );
            const times = timestamps.map((t) => new Date(t.timestamp));
            const earliest = new Date(Math.min(...times));
            const latest = new Date(Math.max(...times));

            await persistence.aggregateData(
                userId,
                earliest,
                latest,
                sum[0].total_tx_bytes || 0,
                sum[0].total_rx_bytes || 0
            );
        }
    } catch (err) {
        console.error("Error aggregateData30Min:", err);
    }
}

async function main() {
    const IP_MIKROTIK = readSettings("MIKROTIK_IP");
    const LOG_INTERVAL = readSettings("LOG_INTERVAL");
    const AGGREGATE_INTERVAL = readSettings("AGGREGATE_INTERVAL");

    let currentTime = new Date();
    let aggregateTime = roundTimeForward(AGGREGATE_INTERVAL, currentTime);

      while (true) {
        await getData(IP_MIKROTIK);
        log(`GET_DATA: ${new Date().toISOString()}`);

        currentTime = new Date();
        if (currentTime >= aggregateTime) {
            log(`AGGREGATED: ${currentTime.toISOString()}`);
            await aggregateData30Min();
            aggregateTime = roundTimeForward(AGGREGATE_INTERVAL, currentTime);
        }
        await waitToNextInterval(LOG_INTERVAL);
    }
}

if (require.main === module) {
    main().catch((err) => console.error("Fatal error:", err));
}
