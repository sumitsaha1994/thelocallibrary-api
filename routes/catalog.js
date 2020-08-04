const express = require("express");
const catalogRouter = express.Router();

// Require controller modules.
var bookController = require("../controllers/bookController");
var authorController = require("../controllers/authorController");
var genreController = require("../controllers/genreController");
var bookInstanceController = require("../controllers/bookinstanceController");

/// BOOK ROUTES ///

// GET catalog home page.
catalogRouter.get("/", bookController.index);

// POST request for creating Book.
catalogRouter.post("/book/create", bookController.book_create_post);

// POST request to delete Book.
catalogRouter.post("/book/delete", bookController.book_delete_post);

// POST request to update Book.
catalogRouter.post("/book/:id/update", bookController.book_update_post);

// GET request for one Book.
catalogRouter.get("/book/:id", bookController.book_detail);

// GET request for list of all Book items.
catalogRouter.get("/books", bookController.book_list);

/// AUTHOR ROUTES ///

// POST request for creating Author.
catalogRouter.post("/author/create", authorController.author_create_post);

// POST request to delete Author.
catalogRouter.post("/author/delete", authorController.author_delete_post);

// POST request to update Author.
catalogRouter.post("/author/:id/update", authorController.author_update_post);

// GET request for one Author.
catalogRouter.get("/author/:id", authorController.author_detail);

// GET request for list of all Authors.
catalogRouter.get("/authors", authorController.author_list);

/// GENRE ROUTES ///

//POST request for creating Genre.
catalogRouter.post("/genre/create", genreController.genre_create_post);

// POST request to delete Genre.
catalogRouter.post("/genre/delete", genreController.genre_delete_post);

// POST request to update Genre.
catalogRouter.post("/genre/:id/update", genreController.genre_update_post);

// GET request for one Genre.
catalogRouter.get("/genre/:id", genreController.genre_detail);

// GET request for list of all Genre.
catalogRouter.get("/genres", genreController.genre_list);

/// BOOKINSTANCE ROUTES ///

// POST request for creating BookInstance.
catalogRouter.post(
    "/bookinstance/create",
    bookInstanceController.bookinstance_create_post
);

// POST request to delete BookInstance.
catalogRouter.post(
    "/bookinstance/delete",
    bookInstanceController.bookinstance_delete_post
);

// POST request to update BookInstance.
catalogRouter.post(
    "/bookinstance/:id/update",
    bookInstanceController.bookinstance_update_post
);

// GET request for one BookInstance.
catalogRouter.get(
    "/bookinstance/:id",
    bookInstanceController.bookinstance_detail
);

// GET request for list of all BookInstance.
catalogRouter.get("/bookinstances", bookInstanceController.bookinstance_list);

module.exports = catalogRouter;
