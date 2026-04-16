const router = require("express").Router();

router.all("/profile/*", require("./profile"));
router.all("/forums/*", require("./forum"));
router.all("/clubs/*", require("./club"));
router.all("/friends/*", require("./friend"));

module.exports = router;
