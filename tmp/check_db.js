const Database = require('better-sqlite3');
const db = new Database('foodlink.db');
try {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    console.log("COLUMNS:", columns.map(c => c.name).join(', '));
} finally {
    db.close();
}
