const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

exports.index = async (req, res) => {
    console.log(req.host);
    console.log(new Date().toTimeString());
    await Promise.all([
        Book.countDocuments({}),
        BookInstance.countDocuments({}),
        BookInstance.countDocuments({
            status: "Available",
        }),
        Author.countDocuments({}),
        Genre.countDocuments({}),
    ]).then((values) => {
        console.log(new Date().toTimeString());
        const dataKeys = [
            "bookCount",
            "bookInstanceCount",
            "bookInstanceAvailableCount",
            "authorCount",
            "genreCount",
        ];
        const data = {};
        for (let i = 0; i < dataKeys.length; i++) {
            data[dataKeys[i]] = values[i];
        }
        res.status(200).json(data);
    });
};

// Display list of all books.
exports.book_list = (req, res, next) => {
    Book.find({}, "title author")
        .populate("author")
        .then((books) => {
            books.sort((a, b) =>
                a.title.toUpperCase() > b.title.toUpperCase()
                    ? 1
                    : a.title.toUpperCase() < b.title.toUpperCase()
                    ? -1
                    : 0
            );
            books = books.map((book) => {
                return {
                    id: book._id,
                    title: book.title,
                    author: {
                        name: book.author.name,
                    },
                };
            });
            console.log(books);
            res.status(200).json(books);
        })
        .catch((err) => {
            return next(err);
        });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
    async.parallel(
        {
            book: function (cb) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(cb);
            },
            bookInstances: function (cb) {
                BookInstance.find({ book: req.params.id }).exec(cb);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                // No results.
                err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.book);

            results.bookInstances = results.bookInstances.map(
                (boookInstance) => ({
                    id: boookInstance._id,
                    status: boookInstance.status,
                    imprint: boookInstance.imprint,
                    due_back: boookInstance.due_back,
                    url: boookInstance.url,
                })
            );
            // Successful, so render.
            res.status(200).json({
                book: {
                    id: results.book._id,
                    url: results.book.url,
                    title: results.book.title,
                    author: {
                        id: results.book.author._id,
                        url: results.book.author.url,
                        name: results.book.author.name,
                    },
                    summary: results.book.summary,
                    isbn: results.book.isbn,
                    genre: results.book.genre.map((g) => ({
                        id: g._id,
                        url: g.url,
                        name: g.name,
                    })),
                },
                bookInstances: results.bookInstances,
            });
        }
    );
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
    body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
    body("author", "Select an author").trim().isLength({ min: 1 }),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

    // Sanitize fields (using wildcard).
    //sanitizeBody("*").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                book: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    summary: book.summary,
                    isbn: book.isbn,
                    genre: req.body.genre,
                },
                error,
            });
            return;
        } else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) {
                    return next(err);
                }
                //successful - redirect to new book record.
                res.status(200).json({
                    book: {
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        summary: book.summary,
                        isbn: book.isbn,
                        genre: req.body.genre,
                    },
                });
            });
        }
    },
];

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) => {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.body.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_bookinstances: function (callback) {
                BookInstance.find({ book: req.body.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.book_bookinstances.length > 0) {
                // Book has book_instances. Render in same way as for GET route.
                res.status(400).json({
                    error: {
                        book: "Unable to delete book, this book has copies",
                    },
                });
                return;
            } else {
                // Book has no BookInstance objects. Delete object and redirect to the list of books.
                Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
                    if (err) {
                        return next(err);
                    }
                    // Success - got to books list.
                    res.status(200).json({ book: "Book deleted" });
                });
            }
        }
    );
};

// Handle book update on POST.
exports.book_update_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body("title", "Title must not be empty.").trim().isLength({ min: 1 }),
    body("author", "Author must not be empty.").trim().isLength({ min: 1 }),
    body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }),

    // // Sanitize fields.
    // sanitizeBody("title").escape(),
    // sanitizeBody("author").escape(),
    // sanitizeBody("summary").escape(),
    // sanitizeBody("isbn").escape(),
    // sanitizeBody("genre.*").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id, //This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                book: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    summary: book.summary,
                    isbn: book.isbn,
                    genre: book.genre,
                },
                error,
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (
                err,
                thebook
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to book detail page.
                Book.findById(thebook._id, (err, updatedBook) => {
                    res.status(200).json({
                        book: {
                            id: updatedBook._id,
                            title: updatedBook.title,
                            author: updatedBook.author,
                            summary: updatedBook.summary,
                            isbn: updatedBook.isbn,
                            genre: updatedBook.genre,
                        },
                    });
                });
            });
        }
    },
];
