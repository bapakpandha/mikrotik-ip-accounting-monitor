// persistence.js
const mysql = require("mysql2/promise");
const { readSettings } = require("./utils");

async function getDb() {
  try {
    const db = await mysql.createConnection({
      host: readSettings("DB_HOST"),
      user: readSettings("DB_USER"),
      password: readSettings("DB_PASSWORD"),
      database: readSettings("DB_NAME"),
    });
    return db;
  } catch (err) {
    console.error("MySQL Error:", err);
    return null;
  }
}

async function init() {
  try {
    const db = await getDb();
    if (!db) return;

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE
      )
    `);
    await db.execute(
      `INSERT INTO users (user_id, username) VALUES (1,'TOTAL')
       ON DUPLICATE KEY UPDATE username="TOTAL"`
    );

    await db.execute(`
      CREATE TABLE IF NOT EXISTS raw_bandwidth_logs (
        log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        source_ip VARCHAR(45) NULL,
        destination_ip VARCHAR(45) NULL,
        tx_bytes BIGINT UNSIGNED NOT NULL,
        rx_bytes BIGINT UNSIGNED NOT NULL,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX (user_id),
        INDEX (timestamp)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS aggregated_bandwidth_logs_30min (
        agg_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interval_start DATETIME NOT NULL,
        interval_end DATETIME NOT NULL,
        total_tx_bytes BIGINT UNSIGNED NOT NULL,
        total_rx_bytes BIGINT UNSIGNED NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX (user_id),
        INDEX (interval_start)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS aggregated_bandwidth_logs_3hr (
        agg_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interval_start DATETIME NOT NULL,
        interval_end DATETIME NOT NULL,
        total_tx_bytes BIGINT UNSIGNED NOT NULL,
        total_rx_bytes BIGINT UNSIGNED NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX (user_id),
        INDEX (interval_start)
      )
    `);

    await db.end();
  } catch (err) {
    console.error("Error initializing DB:", err);
  }
}

async function queryDb(sql, params = []) {
  let db, rows;
  try {
    db = await getDb();
    [rows] = await db.execute(sql, params);
    return rows;
  } catch (err) {
    console.error("Query error:", err);
    return [];
  } finally {
    if (db) await db.end();
  }
}

async function readUserLists() {
  return await queryDb("SELECT * FROM users;");
}

async function addNewUserToLists(username) {
  try {
    const db = await getDb();
    await db.execute("INSERT INTO users (username) VALUES (?)", [username]);
    await db.end();
  } catch (err) {
    console.error("Error addNewUserToLists:", err);
  }
}

async function getUserIdFromUsername(username) {
  const result = await queryDb("SELECT user_id FROM users WHERE username = ?", [username]);
  return result.length > 0 ? result[0].user_id : null;
}

async function addRawData(userId, tx, rx, timestamp) {
  try {
    const db = await getDb();
    await db.execute(
      "INSERT INTO raw_bandwidth_logs (user_id, tx_bytes, rx_bytes, timestamp) VALUES (?, ?, ?, ?)",
      [userId, tx, rx, timestamp]
    );
    await db.end();
  } catch (err) {
    console.error("Error addRawData:", err);
  }
}

async function aggregateData(userId, start, end, tx, rx) {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO aggregated_bandwidth_logs_30min (user_id, interval_start, interval_end, total_tx_bytes, total_rx_bytes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, start, end, tx, rx]
    );
    await db.execute("DELETE FROM raw_bandwidth_logs WHERE user_id = ?", [userId]);
    await db.end();
  } catch (err) {
    console.error("Error aggregateData:", err);
  }
}

init();

module.exports = {
  getDb,
  queryDb,
  readUserLists,
  addNewUserToLists,
  getUserIdFromUsername,
  addRawData,
  aggregateData,
};
