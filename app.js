require('dotenv').config();
const express = require('express');
const { connect } = require('http2');
const mysql = require('mysql2');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('❌', err.message);
        process.exit(1);
    }
    console.log('✅');
});

app.get('/products', (req, res) => {
    db.query('SELECT * FROM products WHERE is_deleted = 0', (err, results) => {
        if (err) {
            console.error('MySQL Error:', err);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสินค้า' });
        }
        res.json(results);
    });
});

app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    
    const sql = 'SELECT * FROM products WHERE id = ? AND is_deleted = 0';
    db.query(sql, [productId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'ไม่พบสินค้า' });
        }
        
        res.json(results[0]);
    });
});

app.get('/products/search/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    const sql = 'SELECT * FROM products WHERE name LIKE ? AND is_deleted = 0';
    
    db.query(sql, [`%${keyword}%`], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบสินค้า' });
        }
        res.json(results);
    });
});

app.post('/products', (req, res) => {
    const { name, price, discount, review_count, image_url } = req.body;
    db.query(
        'INSERT INTO products (name, price, discount, review_count, image_url) VALUES (?, ?, ?, ?, ?)',
        [name, price, discount, review_count, image_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Product created'});
        }
    );
});

app.put('/products/:id', (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  db.query(
    'UPDATE products SET name = ?, price = ?, discount = ?, review_count = ?, image_url = ? WHERE id = ?',
    [name, price, discount, review_count, image_url, req.params.id],
    (err) => {
            if (err) return res.status(500).json({error: err.message});
            res.json({ message: 'Product updated'});
        }
    );
});

app.delete('/products/:id', (req, res) => {
    db.query(
        'UPDATE products SET is_deleted = 1 WHERE id = ?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message});
            res.json({ message: 'Product soft-deleted' });
        }
    );
});

app.put('/products/restore/:id', (req, res) => {
    db.query(
        'UPDATE products SET is_deleted = 0 WHERE id=?',
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message});
            res.json({ message: 'Product restored'});
        }
    )
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});