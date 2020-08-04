const { Schema, model } = require("mongoose");
const moment = require("moment");

const BookInstanceSchema = new Schema({
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true }, //reference to the associated book
    imprint: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ["Available", "Maintenance", "Loaned", "Reserved"],
        default: "Maintenance",
    },
    due_back: { type: Date, default: Date.now },
});

// virtual - book instance url
BookInstanceSchema.virtual("url").get(function () {
    return "/catalog/bookinstance/" + this._id;
});

BookInstanceSchema.virtual("due_back_formatted").get(function () {
    return moment(this.due_back).format("MMMM Do, YYYY");
});

module.exports = model("BookInstance", BookInstanceSchema);
