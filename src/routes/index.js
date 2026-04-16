const router = require("express").Router();

router.all("/profile/*", require("./profile"));
router.all("/forums/*", require("./forum"));

module.exports = router;
