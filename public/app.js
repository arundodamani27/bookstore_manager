const bookForm = document.getElementById('bookForm');
const formTitle = document.getElementById('formTitle');
const editingIdInput = document.getElementById('editingId');
const authorInput = document.getElementById('authorInput');
const priceInput = document.getElementById('priceInput');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const lookupIdInput = document.getElementById('lookupIdInput');
const lookupBtn = document.getElementById('lookupBtn');
const showAllBtn = document.getElementById('showAllBtn');
const booksTableBody = document.getElementById('booksTableBody');
const messageBox = document.getElementById('messageBox');

function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function clearMessage() {
  messageBox.textContent = '';
  messageBox.className = 'message hidden';
}

function resetForm() {
  editingIdInput.value = '';
  bookForm.reset();
  formTitle.textContent = 'Add New Book';
  submitBtn.textContent = 'Add Book';
  cancelEditBtn.classList.add('hidden');
}

function startEdit(book) {
  editingIdInput.value = book.id;
  authorInput.value = book.author;
  priceInput.value = book.price;
  formTitle.textContent = `Update Book #${book.id}`;
  submitBtn.textContent = 'Update Book';
  cancelEditBtn.classList.remove('hidden');
  authorInput.focus();
}

function renderBooks(bookList) {
  if (!Array.isArray(bookList) || bookList.length === 0) {
    booksTableBody.innerHTML = '<tr><td colspan="4">No books found.</td></tr>';
    return;
  }

  booksTableBody.innerHTML = '';

  bookList.forEach((book) => {
    const tr = document.createElement('tr');

    const idTd = document.createElement('td');
    idTd.textContent = book.id;

    const authorTd = document.createElement('td');
    authorTd.textContent = book.author;

    const priceTd = document.createElement('td');
    priceTd.textContent = Number(book.price).toFixed(2);

    const actionsTd = document.createElement('td');
    actionsTd.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(book));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteBook(book.id));

    actionsTd.append(editBtn, deleteBtn);
    tr.append(idTd, authorTd, priceTd, actionsTd);
    booksTableBody.appendChild(tr);
  });
}

// Helper for fetch requests with consistent error parsing
async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errMsg = (data && data.error) || `Request failed (${response.status})`;
    throw new Error(errMsg);
  }

  return data;
}

// GET /books
async function loadBooks() {
  try {
    const books = await requestJson('/books');
    renderBooks(books);
  } catch (err) {
    booksTableBody.innerHTML = '<tr><td colspan="4">Failed to load books.</td></tr>';
    showMessage(err.message, 'error');
  }
}

// GET /book/:id
async function findBookById() {
  const id = lookupIdInput.value.trim();
  if (!id) {
    showMessage('Please enter a Book ID to search.', 'error');
    return;
  }

  try {
    const book = await requestJson(`/book/${encodeURIComponent(id)}`);
    renderBooks([book]);
    showMessage(`Found book #${book.id}.`, 'success');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// POST /books or PUT /book/:id
bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();

  const author = authorInput.value.trim();
  const price = Number(priceInput.value);
  const editingId = editingIdInput.value;

  if (!author || Number.isNaN(price) || price < 0) {
    showMessage('Please enter a valid author and non-negative price.', 'error');
    return;
  }

  try {
    if (editingId) {
      await requestJson(`/book/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        body: JSON.stringify({ author, price })
      });
      showMessage(`Book #${editingId} updated successfully.`, 'success');
    } else {
      const created = await requestJson('/books', {
        method: 'POST',
        body: JSON.stringify({ author, price })
      });
      showMessage(`Book #${created.id} added successfully.`, 'success');
    }

    resetForm();
    await loadBooks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

// DELETE /book/:id
async function deleteBook(id) {
  clearMessage();
  try {
    await requestJson(`/book/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (editingIdInput.value === String(id)) {
      resetForm();
    }
    showMessage(`Book #${id} deleted successfully.`, 'success');
    await loadBooks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

cancelEditBtn.addEventListener('click', resetForm);
lookupBtn.addEventListener('click', findBookById);
showAllBtn.addEventListener('click', async () => {
  clearMessage();
  lookupIdInput.value = '';
  await loadBooks();
});

// Initial load
loadBooks();