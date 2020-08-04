const BookInstance = require("../models/bookinstance");
const moment = require("moment");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const async = require("async");
// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate("book")
        .exec(function (err, bookInstanceList) {
            if (err) {
                return next(err);
            }
            bookInstanceList = bookInstanceList.map((instance) => ({
                id: instance._id,
                url: instance.url,
                book: {
                    title: instance.book.title,
                },
                imprint: instance.imprint,
                status: instance.status,
                due_back: moment(instance.due_back).format("MMMM Do YYYY"),
            }));
            //Successful, so render
            res.status(200).json(bookInstanceList);
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookInstance) {
            if (err) {
                return next(err);
            }
            if (bookInstance == null) {
                // No results.
                err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.status(200).json({
                bookInstance: {
                    id: bookInstance._id.toString(),
                    url: bookInstance.url,
                    book: {
                        id: bookInstance.book._id.toString(),
                        url: bookInstance.book.url,
                        title: bookInstance.book.title,
                    },
                    imprint: bookInstance.imprint,
                    status: bookInstance.status,
                    due_back: moment(bookInstance.due_back).format(
                        "YYYY-MM-DD"
                    ),
                },
            });
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate fields.
    body("book", "Book must be specified").trim().isLength({ min: 1 }),
    body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody("book").escape(),
    sanitizeBody("imprint").escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.

            let error = {};
            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                bookInstance: {
                    id: bookInstance.id,
                    book: bookInstance.book,
                    imprint: bookInstance.imprint,
                    status: bookInstance.status,
                    due_back: moment(bookInstance.due_back).format(
                        "YYYY-MM-DD"
                    ),
                },
                error,
            });

            return;
        } else {
            // Data from form is valid.
            bookInstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to new record.
                res.status(200).json({
                    bookInstance: {
                        id: bookInstance.id,
                        book: bookInstance.book.toString(),
                        imprint: bookInstance.imprint,
                        status: bookInstance.status,
                        due_back: moment(bookInstance.due_back).format(
                            "YYYY-MM-DD"
                        ),
                    },
                });
            });
        }
    },
];

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
    // Assume valid BookInstance id in field.
    BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(
        err
    ) {
        if (err) {
            return next(err);
        }
        // Success, so redirect to list of BookInstance items.
        res.status(200).json({ bookInstance: "Book copy has been deleted" });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body("book", "Book must be specified").isLength({ min: 1 }).trim(),
    body("imprint", "Imprint must be specified").isLength({ min: 1 }).trim(),
    body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody("book").escape(),
    sanitizeBody("imprint").escape(),
    sanitizeBody("status").escape(),
    sanitizeBody("due_back").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped/trimmed data and current id.
        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors so render the form again, passing sanitized values and errors.

            errors.array().forEach((err) => {
                error[err.param] = err.msg;
            });
            res.status(400).json({
                bookInstance: {
                    id: bookInstance.id,
                    book: bookInstance.book,
                    imprint: bookInstance.imprint,
                    status: bookInstance.status,
                    due_back: moment(bookInstance.due_back).format(
                        "YYYY-MM-DD"
                    ),
                },
                error,
            });
            return;
        } else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(
                req.params.id,
                bookInstance,
                {},
                function (err, thebookinstance) {
                    if (err) {
                        return next(err);
                    }
                    // Successful - redirect to detail page.
                    res.status(200).json({
                        bookInstance: {
                            id: thebookinstance._id,
                            book: thebookinstance.book,
                            imprint: thebookinstance.imprint,
                            status: thebookinstance.status,
                            due_back: moment(thebookinstance.due_back).format(
                                "YYYY-MM-DD"
                            ),
                        },
                    });
                }
            );
        }
    },
];
