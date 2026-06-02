const router = require("express").Router();
const {
    isSuspended,
    authMiddleware,
} = require("../middleware/authMiddleware.js");

router.use("/auth", require("./auth"));

// router.use(authMiddleware);
router.use(isSuspended);

router.use("/profile", require("./profile"));
router.use("/forum", require("./forum"));
router.use("/clubs", require("./club"));
router.use("/friends", require("./friend"));
router.use("/messages", require("./message"));
router.use("/posts", require("./post"));

module.exports = router;
