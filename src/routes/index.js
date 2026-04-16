const router = require("express").Router();

router.use("/profile", require("./profile"));
router.use("/forum", require("./forum"));
router.use("/clubs", require("./club"));
router.use("/friends", require("./friend"));

module.exports = router;
