const { Schema, model } = require("mongoose");

const GenreSchema = new Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100,
        minlength: 3,
        //enum: ["fiction", "non-fiction", "romance", "military history"],
    },
});

// virtual genre url
GenreSchema.virtual("url").get(function () {
    return "/catalog/genre/" + this._id;
});

module.exports = model("Genre", GenreSchema);
