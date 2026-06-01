// middlewares/moderation.js

// A sample list of words you want to flag.
// In the future, you could fetch this from a database table!
const flaggedWords = [
    "buy followers",
    "homework answers",
    "pay to do",
    "crypto scam",
    "essay writing service",
];

// Build a smart Regex pattern: \b(word1|word2|word3)\b
const flaggedRegex = new RegExp("\\b(" + flaggedWords.join("|") + ")\\b", "i");

const autoFlagMiddleware = (req, res, next) => {
    // 1. Grab the text the user is trying to post
    const postContent = req.body.caption || "";

    // 2. Test the content against our list of bad words
    if (flaggedRegex.test(postContent)) {
        // If it matches, we quietly attach a 'reviewing' status to the request
        console.log("⚠️ Moderation Alert: Flagged word detected.");
        req.body.status = "reviewing";
    } else {
        // Otherwise, it's good to go live!
        req.body.status = "active";
    }

    // 3. Move on to the actual router function
    next();
};

module.exports = { autoFlagMiddleware };
