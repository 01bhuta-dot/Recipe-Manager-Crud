
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CREATE TABLE
db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        prep_time INTEGER
    )
`, (err) => {
    if (err) {
        console.error('Table creation error:', err.message);
    } else {
        console.log('Recipes table is ready.');
    }
});

// ADD prep_time TO AN EXISTING TABLE IF IT IS MISSING
db.run(
    'ALTER TABLE recipes ADD COLUMN prep_time INTEGER',
    (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Preparation time column error:', err.message);
        }
    }
);

// HELPER: READ PREPARATION TIME
function getPrepTime(body) {
    const value = body.prepTime ?? body.prep_time;

    if (value === '' || value === null || value === undefined) {
        return null;
    }

    return Number(value);
}

// HOME ROUTE
app.get('/', (req, res) => {
    res.send('Recipe Card API is running!');
});

// READ ALL RECIPES
app.get('/api/recipes', (req, res) => {
    db.all(
        'SELECT * FROM recipes ORDER BY id DESC',
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(rows);
        }
    );
});

// CREATE RECIPE
app.post('/api/recipes', (req, res) => {
    const { title, ingredients, category } = req.body;
    const instructions = req.body.instructions || ingredients;
    const prepTime = getPrepTime(req.body);

    console.log('Received preparation time:', prepTime);

    if (!title || !ingredients) {
        return res.status(400).json({
            error: 'Title and ingredients are required.'
        });
    }

    if (
        prepTime !== null &&
        (!Number.isFinite(prepTime) || prepTime < 1)
    ) {
        return res.status(400).json({
            error: 'Preparation time must be at least 1 minute.'
        });
    }

    db.run(
        `INSERT INTO recipes
         (title, ingredients, instructions, category, prep_time)
         VALUES (?, ?, ?, ?, ?)`,
        [
            title,
            ingredients,
            instructions,
            category || 'General',
            prepTime
        ],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                id: this.lastID,
                message: 'Recipe created successfully!',
                prep_time: prepTime
            });
        }
    );
});

// READ ONE RECIPE
app.get('/api/recipes/:id', (req, res) => {
    db.get(
        'SELECT * FROM recipes WHERE id = ?',
        [req.params.id],
        (err, recipe) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!recipe) {
                return res.status(404).json({
                    error: 'Recipe not found.'
                });
            }

            res.json(recipe);
        }
    );
});

// UPDATE RECIPE
app.put('/api/recipes/:id', (req, res) => {
    const { title, ingredients, category } = req.body;
    const instructions = req.body.instructions || ingredients;
    const prepTime = getPrepTime(req.body);

    console.log('Updated preparation time:', prepTime);

    if (!title || !ingredients) {
        return res.status(400).json({
            error: 'Title and ingredients are required.'
        });
    }

    if (
        prepTime !== null &&
        (!Number.isFinite(prepTime) || prepTime < 1)
    ) {
        return res.status(400).json({
            error: 'Preparation time must be at least 1 minute.'
        });
    }

    db.run(
        `UPDATE recipes
         SET title = ?,
             ingredients = ?,
             instructions = ?,
             category = ?,
             prep_time = ?
         WHERE id = ?`,
        [
            title,
            ingredients,
            instructions,
            category || 'General',
            prepTime,
            req.params.id
        ],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: 'Recipe not found.'
                });
            }

            res.json({
                message: 'Recipe updated successfully!',
                prep_time: prepTime
            });
        }
    );
});

// DELETE RECIPE
app.delete('/api/recipes/:id', (req, res) => {
    db.run(
        'DELETE FROM recipes WHERE id = ?',
        [req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: 'Recipe not found.'
                });
            }

            res.json({
                message: 'Recipe deleted successfully!'
            });
        }
    );
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Recipe server running at http://localhost:${PORT}`);
});
