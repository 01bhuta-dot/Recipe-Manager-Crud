
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'recipes.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to the recipe database.');

        db.run(
            `CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                instructions TEXT,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                prep_time INTEGER
            )`,
            (err) => {
                if (err) {
                    console.error('Table creation failed:', err.message);
                } else {
                    console.log('Recipes table is ready.');
                }
            }
        );

        db.run(
            `ALTER TABLE recipes ADD COLUMN prep_time INTEGER`,
            (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Preparation time column error:', err.message);
                }
            }
        );
    }
});

module.exports = db;

