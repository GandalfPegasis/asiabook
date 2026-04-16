const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
        message:
            process.env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message || "Internal Server Error",
    });
};

module.exports = errorHandler;
