const router = require("express").Router();
const { getProfileById } = require("../dataaccess/profileDAO");
const {
    ensureTableExists,
    getMessagesForUser,
    getConversation,
    sendMessage,
    markMessagesAsRead,
} = require("../dataaccess/messageDAO");
const { authMiddleware } = require("../middleware/authMiddleware");

ensureTableExists().catch((err) => {
    console.error("Failed to initialize messages table:", err);
});

// Apply auth middleware to all message routes
router.use(authMiddleware);

router.get("/conversations", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;

    try {
        const messages = await getMessagesForUser(CURRENT_USER_ID);
        const conversationsMap = new Map();

        messages.forEach((message) => {
            const contactId =
                message.sender_id === CURRENT_USER_ID
                    ? message.receiver_id
                    : message.sender_id;
            const contactName =
                message.sender_id === CURRENT_USER_ID
                    ? message.receiver_name
                    : message.sender_name;
            const lastMessage = message.content;
            const lastAt = message.created_at;
            const unreadCount =
                message.receiver_id === CURRENT_USER_ID && !message.is_read
                    ? 1
                    : 0;

            const existing = conversationsMap.get(contactId);
            if (!existing) {
                conversationsMap.set(contactId, {
                    id: contactId,
                    name: contactName,
                    last_message: lastMessage,
                    last_at: lastAt,
                    unreadCount,
                });
            } else {
                if (new Date(lastAt) > new Date(existing.last_at)) {
                    existing.last_message = lastMessage;
                    existing.last_at = lastAt;
                }
                existing.unreadCount += unreadCount;
            }
        });

        const conversations = Array.from(conversationsMap.values()).sort(
            (a, b) => new Date(b.last_at) - new Date(a.last_at),
        );

        res.json(conversations);
    } catch (err) {
        console.error("Failed to load conversations:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/conversations/:contactId", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;
    const contactId = parseInt(req.params.contactId, 10);

    if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
    }

    try {
        const conversation = await getConversation(CURRENT_USER_ID, contactId);
        const [contactProfile] = await getProfileById(contactId);

        if (!contactProfile || contactProfile.length === 0) {
            return res.status(404).json({ error: "Contact profile not found" });
        }

        res.json({ conversation, contact: contactProfile[0] });
    } catch (err) {
        console.error("Failed to load conversation:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/conversations/:contactId", async (req, res) => {
    const CURRENT_USER_ID = req.user.id;
    const contactId = parseInt(req.params.contactId, 10);
    const { content } = req.body;

    if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
    }

    if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
    ) {
        return res
            .status(400)
            .json({ error: "Message content cannot be empty" });
    }

    try {
        const savedMessage = await sendMessage(
            CURRENT_USER_ID,
            contactId,
            content.trim(),
        );

        const receiverSockets = global.activeClients?.get(String(contactId));

        if (receiverSockets) {
            receiverSockets.forEach((clientWs) => {
                if (clientWs.readyState === 1) {
                    // 2. UPDATE THIS WEBSOCKET PAYLOAD
                    // Wrap the message in the type format the frontend expects
                    clientWs.send(
                        JSON.stringify({
                            type: "chat_message",
                            payload: savedMessage,
                        }),
                    );
                }
            });
        }

        console.log("Saved message from API:", savedMessage);
        res.json(savedMessage);
    } catch (err) {
        console.error("Failed to send message:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/read/:contactId", async (req, res) => {
    const CURRENT_USER_ID = req.user.id; // The person reading the messages
    const contactId = parseInt(req.params.contactId, 10); // The person who sent them

    if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
    }

    try {
        // Update the database: Mark messages sent BY the contact, TO the current user, as read.
        await markMessagesAsRead(contactId, CURRENT_USER_ID);

        // Find the sender's WebSockets and tell them their messages were read
        const senderSockets = global.activeClients?.get(String(contactId));

        if (senderSockets) {
            senderSockets.forEach((clientWs) => {
                if (clientWs.readyState === 1) {
                    // This matches the `type: 'read_receipt'` we set up in Vue!
                    clientWs.send(
                        JSON.stringify({
                            type: "read_receipt",
                            reader_id: CURRENT_USER_ID,
                        }),
                    );
                }
            });
        }

        res.json({ success: true, message: "Messages marked as read" });
    } catch (err) {
        console.error("Failed to mark messages as read:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
