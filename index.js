const express = require("express");
const app = express();

require("dotenv").config();

app.use(express.static("public"));

app.use(require("./src/routes/index.js"));

app.all("/{*any}", (req, res, next) => {
    const err = new Error(`Route not found!`);
    err.statusCode = 404;

    next(err);
});

const errorHandler = require("./src/middleware/errorHandler.js");
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
