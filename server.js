const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Built-in middleware to parse incoming JSON request bodies
app.use(express.json());

// 2. Serve frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for books: { id, author, price }
let books = [
  { id: 1, author: 'F. Scott Fitzgerald', price: 12.99 },
  { id: 2, author: 'George Orwell', price: 14.5 }
];
let nextId = 3;

// GET /books -> Retrieve all books
app.get('/books', (req, res) => {
  res.status(200).json(books);
});

// GET /book/:id -> Retrieve a particular book
app.get('/book/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }

  res.status(200).json(book);
});

// POST /books -> Add a new book
app.post('/books', (req, res) => {
  const { author, price } = req.body;
  const numericPrice = Number(price);

  if (!author || typeof author !== 'string' || !author.trim()) {
    return res.status(400).json({ error: 'Author is required' });
  }
  if (price === undefined || Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Valid non-negative price is required' });
  }

  const newBook = {
    id: nextId++,
    author: author.trim(),
    price: numericPrice
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// PUT /book/:id -> Update book details
app.put('/book/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }

  const { author, price } = req.body;
  const numericPrice = price !== undefined ? Number(price) : book.price;

  if (author !== undefined && (!author || !String(author).trim())) {
    return res.status(400).json({ error: 'Author cannot be empty' });
  }
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid non-negative number' });
  }

  if (author !== undefined) {
    book.author = String(author).trim();
  }
  book.price = numericPrice;

  res.status(200).json(book);
});

// DELETE /book/:id -> Delete a book
app.delete('/book/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }

  const [deletedBook] = books.splice(index, 1);
  res.status(200).json({ message: 'Book deleted', book: deletedBook });
});

// JSON syntax error handler (from express.json)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Book server running at http://localhost:${PORT}`);
});