require("dotenv").config();
const { connect, connection } = require("mongoose");

connect(process.env.DB_URI, { useNewUrlParser: true });

const conn = connection;
conn.on("error", console.error.bind(console, "connection error:"));
conn.once("open", function () {
    console.log("Connection established");
});
