const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const validator = require("express-validator");
// const { body, validationResult } = require("express-validator/check");
// const { sanitizeBody } = require("express-validator/filter");

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
    Genre.find({}).exec((err, genres) => {
        if (err) {
            return next(err);
        }
        console.log(genres);
        genres = genres.map((genre) => {
            return {
                id: genre._id,
                name: genre.name,
            };
        });
        res.status(200).json(genres);
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    async.parallel(
        {
            genre: function (cb) {
                Genre.findById(req.params.id).exec(cb);
            },
            genreBooks: function (cb) {
                Book.find({ genre: req.params.id }).exec(cb);
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }
            if (results.genre == null) {
                // No results.
                const err = new Error("Genre not found");
                err.status = 404;
                return next(err);
            }
            console.log(results.genre.toJSON());
            console.log(results.genreBooks);
            res.status(200).json({
                genre: {
                    id: results.genre._id,
                    name: results.genre.name,
                    url: results.genre.url,
                },
                genreBooks: results.genreBooks.map((genreBook) => {
                    return {
                        id: genreBook._id,
                        title: genreBook.title,
                        summary: genreBook.summary,
                        url: genreBook.url,
                    };
                }),
            });
        }
    );
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate that the name field is not empty.
    validator
        .body("name", "Genre name required and min length 2")
        .trim()
        .isLength({ min: 2 }),

    // Sanitize (escape) the name field.
    validator.sanitizeBody("name").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                genre: {
                    id: genre._id,
                    name: genre.name,
                },
                error,
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ name: req.body.name }).exec(function (
                err,
                found_genre
            ) {
                if (err) {
                    return next(err);
                }

                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.status(409).json({
                        error: { name: "Genre Already exists" },
                    });
                } else {
                    genre.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                        // Genre saved. Redirect to genre detail page.
                        res.status(200).json({
                            genre: {
                                id: genre._id,
                                name: genre.name,
                            },
                        });
                    });
                }
            });
        }
    },
];

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
    async.parallel(
        {
            genre: function (callback) {
                Genre.findById(req.body.id).exec(callback);
            },
            genre_books: function (callback) {
                Book.find({ genre: req.body.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // Success
            if (results.genre_books.length > 0) {
                res.status(400).json({
                    error: {
                        genre:
                            "Unable to delete genre, Genre has books associated with it",
                    },
                });
                return;
            } else {
                // Genre has no books. Delete object and redirect to the list of genres.
                Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
                    if (err) {
                        return next(err);
                    }
                    // Success - go to genres list.
                    res.status(200).json({ genre: "Genre deleted" });
                });
            }
        }
    );
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate that the name field is not empty.
    validator.body("name", "Genre name required").isLength({ min: 1 }).trim(),

    // Sanitize (escape) the name field.
    validator.sanitizeBody("name").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request .
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                genre: {
                    id: genre._id,
                    name: genre.name,
                },
                error,
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (
                err,
                thegenre
            ) {
                if (err) {
                    return next(err);
                }
                console.log(thegenre);
                // Successful - redirect to genre detail page.
                Genre.findById(thegenre._id, function (err, updatedGenre) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({
                        genre: {
                            id: updatedGenre._id,
                            name: updatedGenre.name,
                        },
                    });
                });
            });
        }
    },
];
