const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../bot_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance INTEGER DEFAULT 0,
            last_daily_claim TEXT,
            last_weekly_claim TEXT
        )
    `);
});

const getBalance = (userId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
            if (err) reject(err);
            resolve(row ? row.balance : 0);
        });
    });
};

const updateBalance = (userId, newBalance) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO users (id, balance) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET balance = excluded.balance", 
            [userId, newBalance], (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

const getLastClaim = (userId, claimType) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT ${claimType} FROM users WHERE id = ?`, [userId], (err, row) => {
            if (err) reject(err);
            resolve(row ? row[claimType] : null);
        });
    });
};

const updateLastClaim = (userId, claimType, timestamp) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (id, ${claimType}) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET ${claimType} = excluded.${claimType}`,
            [userId, timestamp], (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

module.exports = { getBalance, updateBalance, getLastClaim, updateLastClaim };
