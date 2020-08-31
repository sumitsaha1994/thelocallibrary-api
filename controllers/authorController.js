const Author = require("../models/author");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const moment = require("moment");

// Display list of all Authors.
exports.author_list = (req, res, next) => {
    Author.find({})
        .then((authors) => {
            authors = authors.map((author) => {
                return {
                    id: author._id,
                    name: author.name,
                    url: author.url,
                    date_of_birth: author.date_of_birth,
                    date_of_death: author.date_of_death,
                    lifespan: author.lifespan,
                };
            });
            res.status(200).json(authors);
        })
        .catch((err) => {
            return next(err);
        });
};

// Display detail page for a specific Author.
exports.author_detail = (req, res, next) => {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.params.id }, "title summary").exec(
                    callback
                );
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            } // Error in API usage.
            if (results.author == null) {
                // No results.
                err = new Error("Author not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.author);
            // Successful, so render.
            res.status(200).json({
                author: {
                    id: results.author._id,
                    name: results.author.name,
                    first_name: results.author.first_name,
                    last_name: results.author.last_name,
                    date_of_birth: moment(results.author.date_of_birth).format(
                        "YYYY-MM-DD"
                    ),
                    date_of_death: results.author.date_of_death
                        ? moment(results.author.date_of_death).format(
                              "YYYY-MM-DD"
                          )
                        : "",
                    lifespan: results.author.lifespan,
                },
                author_books: results.authors_books.map((book) => {
                    return {
                        id: book._id,
                        title: book.title,
                        summary: book.summary,
                    };
                }),
            });
        }
    );
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate fields.
    body("first_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("last_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("Last name must be specified.")
        .isAlphanumeric()
        .withMessage("Last name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth").isISO8601(),
    body("date_of_death", "Invalid date of death")
        .optional({ checkFalsy: true })
        .isISO8601(),

    // Sanitize fields.
    sanitizeBody("first_name").escape(),
    sanitizeBody("last_name").escape(),
    sanitizeBody("date_of_birth").toDate(),
    sanitizeBody("date_of_death").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        var author = new Author({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            // Create an Author object with escaped and trimmed data.date_of_death: req.body.date_of_death,
        });
        console.log(errors);
        if (!errors.isEmpty()) {
            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });

            res.status(400).json({
                author: {
                    id: author._id,
                    first_name: author.first_name,
                    last_name: author.last_name,
                    date_of_birth: moment(author.date_of_birth).format(
                        "YYYY-MM-DD"
                    ),
                    date_of_death: author.date_of_death
                        ? moment(author.date_of_death).format("YYYY-MM-DD")
                        : "",
                },
                error,
            });
            return;
        } else {
            // Data from form is valid.
            author.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new author record.
                res.status(200).json({
                    author: {
                        id: author._id,
                        first_name: author.first_name,
                        last_name: author.last_name,
                        date_of_birth: moment(author.date_of_birth).format(
                            "YYYY-MM-DD"
                        ),
                        date_of_death: author.date_of_death
                            ? moment(author.date_of_death).format("YYYY-MM-DD")
                            : "",
                    },
                });
            });
        }
    },
];

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.body.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.body.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.authors_books.length > 0) {
                // Author has books. Render in same way as for GET route.
                res.status(400).json({
                    error: {
                        author:
                            "Unable to delete author, Author has books associated with it",
                    },
                });
                return;
            } else {
                // Author has no books. Delete object and redirect to the list of authors.
                Author.findByIdAndRemove(req.body.id, function deleteAuthor(
                    err
                ) {
                    if (err) {
                        return next(err);
                    }
                    // Success - go to author list
                    res.status(200).json({ author: "Author deleted" });
                });
            }
        }
    );
};

// Handle Author update on POST.
exports.author_update_post = [
    // Validate fields.
    body("first_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("last_name")
        .isLength({ min: 1 })
        .trim()
        .withMessage("last name must be specified.")
        .isAlphanumeric()
        .withMessage("last name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth").isISO8601(),
    body("date_of_death", "Invalid date of death")
        .optional({ checkFalsy: true })
        .isISO8601(),

    // Sanitize fields.
    sanitizeBody("first_name").escape(),
    sanitizeBody("last_name").escape(),
    sanitizeBody("date_of_birth").toDate(),
    sanitizeBody("date_of_death").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        var author = new Author({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            console.log(errors);
            res.status(400).json({
                author: {
                    id: author._id,
                    first_name: author.first_name,
                    last_name: author.last_name,
                    date_of_birth: moment(author.date_of_birth).format(
                        "YYYY-MM-DD"
                    ),
                    date_of_death: author.date_of_death
                        ? moment(author.date_of_death).format("YYYY-MM-DD")
                        : "",
                },
                error,
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Author.findByIdAndUpdate(req.params.id, author, {}, function (
                err,
                theauthor
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to genre detail page.
                Author.findById(theauthor._id, (err, updatedAuthor) => {
                    res.status(200).json({
                        author: {
                            id: updatedAuthor._id,
                            first_name: updatedAuthor.first_name,
                            last_name: updatedAuthor.last_name,
                            date_of_birth: moment(
                                updatedAuthor.date_of_birth
                            ).format("YYYY-MM-DD"),
                            date_of_death: author.date_of_death
                                ? moment(updatedAuthor.date_of_death).format(
                                      "YYYY-MM-DD"
                                  )
                                : "",
                        },
                    });
                });
            });
        }
    },
];
