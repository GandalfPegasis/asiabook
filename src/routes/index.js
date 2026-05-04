const router = require("express").Router();

router.use("/profile", require("./profile"));
router.use("/forum", require("./forum"));
router.use("/clubs", require("./club"));
router.use("/friends", require("./friend"));
router.use("/posts", require("./post"));

module.exports = router;
