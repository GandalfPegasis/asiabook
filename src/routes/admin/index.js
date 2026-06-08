const router = require("express").Router();

const {
    authMiddleware,
    isAdmin,
} = require("../../middleware/authMiddleware.js");

router.use(authMiddleware);
router.use(isAdmin);

router.use("/dashboard", require("./dashboard.js"));
router.use("/user", require("./user.js"));
router.use("/post", require("./post.js"));
router.use("/club", require("./club.js"));
router.use("/forums", require("./forum.js"));
router.use("/replies", require("./reply.js"));

module.exports = router;
