const { Schema, model } = require("mongoose");
const moment = require("moment");
//Author schema definition
const AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxlength: 100 },
    last_name: { type: String, required: true, maxlength: 100 },
    date_of_birth: Date,
    date_of_death: Date,
});

// virtual - author's full name
AuthorSchema.virtual("name").get(function () {
    //let fullName = ''

    return this.first_name && this.last_name
        ? this.first_name + " " + this.last_name
        : "";
});

//virtual - author's lifespan
AuthorSchema.virtual("lifespan").get(function () {
    return `${moment(this.date_of_birth).format(
        "MMMM Do YYYY"
    )} - ${moment(this.date_of_death).format("MMMM Do YYYY")}`;
});

// virtual - author's URL
AuthorSchema.virtual("url").get(function () {
    return "/catalog/author/" + this._id;
});

module.exports = model("Author", AuthorSchema);
