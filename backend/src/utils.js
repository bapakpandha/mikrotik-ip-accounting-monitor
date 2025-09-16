require("dotenv").config();

function readSettings(key) {
    switch (key) {
        case "MIKROTIK_IP":
            return process.env.MIKROTIK_IP || "192.168.100.8";
        case "LOG_INTERVAL":
            return parseInt(process.env.LOG_INTERVAL) || 10;
        case "AGGREGATE_INTERVAL":
            return parseInt(process.env.AGGREGATE_INTERVAL) || 1800;
        case "DB_NAME":
            return process.env.DB_NAME || "mikrotik";
        case "DB_USER":
            return process.env.DB_USER || "rootfs";
        case "DB_PASSWORD":
            return process.env.DB_PASSWORD || "";
        case "DB_HOST":
            return process.env.DB_HOST || "localhost";
        default:
            throw new Error(`Invalid argument: ${key}`);
    }
}

module.exports = { readSettings };
