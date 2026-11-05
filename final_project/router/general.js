const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL used by the Axios client functions below
const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password are required." });
  }
  if (!isValid(username)) {
    return res.status(404).json({ message: "User already exists!" });
  }

  users.push({ username: username, password: password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/* ------------------------------------------------------------------
 * Tasks 10-13: routes implemented with Promises / async-await
 * ------------------------------------------------------------------ */

// Simulates an asynchronous data source for the book list
const getBooks = () => {
  return new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject(new Error("No books available"));
    }
  });
};

// Task 10: Get the book list available in the shop (async/await)
public_users.get('/', async function (req, res) {
  try {
    const allBooks = await getBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Task 11: Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  getBooks()
    .then((allBooks) => {
      if (allBooks[isbn]) {
        return res.status(200).send(JSON.stringify(allBooks[isbn], null, 4));
      }
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    })
    .catch((error) => res.status(500).json({ message: error.message }));
});

// Task 12: Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author.toLowerCase();
  try {
    const allBooks = await getBooks();
    const booksByAuthor = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].author.toLowerCase() === author)
      .map((isbn) => ({ isbn: isbn, title: allBooks[isbn].title, reviews: allBooks[isbn].reviews }));

    if (booksByAuthor.length > 0) {
      return res.status(200).send(JSON.stringify({ booksbyauthor: booksByAuthor }, null, 4));
    }
    return res.status(404).json({ message: `No books found by author ${req.params.author}` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Task 13: Get all books based on title (Promise callbacks)
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title.toLowerCase();
  getBooks()
    .then((allBooks) => {
      const booksByTitle = Object.keys(allBooks)
        .filter((isbn) => allBooks[isbn].title.toLowerCase() === title)
        .map((isbn) => ({ isbn: isbn, author: allBooks[isbn].author, reviews: allBooks[isbn].reviews }));

      if (booksByTitle.length > 0) {
        return res.status(200).send(JSON.stringify({ booksbytitle: booksByTitle }, null, 4));
      }
      return res.status(404).json({ message: `No books found with title ${req.params.title}` });
    })
    .catch((error) => res.status(500).json({ message: error.message }));
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

/* ------------------------------------------------------------------
 * Tasks 10-13: Axios client functions (Promise callbacks and async/await)
 * These call the REST endpoints above over HTTP using Axios.
 * ------------------------------------------------------------------ */

// Task 10: Get all books using async/await with Axios
const getAllBooksAxios = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log("All books:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching all books:", error.message);
    throw error;
  }
};

// Task 11: Get book details by ISBN using Promise callbacks with Axios
const getBookByISBNAxios = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => {
      console.log(`Book with ISBN ${isbn}:`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(`Error fetching book with ISBN ${isbn}:`, error.message);
      throw error;
    });
};

// Task 12: Get book details by author using async/await with Axios
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    console.log(`Books by ${author}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching books by ${author}:`, error.message);
    throw error;
  }
};

// Task 13: Get book details by title using Promise callbacks with Axios
const getBooksByTitleAxios = (title) => {
  return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => {
      console.log(`Books titled ${title}:`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(`Error fetching books titled ${title}:`, error.message);
      throw error;
    });
};

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
