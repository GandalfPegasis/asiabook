const router = require("express").Router();
const { getProfileById } = require("../dataaccess/profileDAO");
const {
<<<<<<< HEAD
    ensureTableExists,
    getMessagesForUser,
    getConversation,
    sendMessage,
=======
  ensureTableExists,
  getMessagesForUser,
  getConversation,
  sendMessage,
>>>>>>> 2502acc96136733e8f54272237e9ee82151237d1
} = require("../dataaccess/messageDAO");
const { authMiddleware } = require("../middleware/authMiddleware");

ensureTableExists().catch((err) => {
<<<<<<< HEAD
    console.error("Failed to initialize messages table:", err);
=======
  console.error("Failed to initialize messages table:", err);
>>>>>>> 2502acc96136733e8f54272237e9ee82151237d1
});

// Apply auth middleware to all message routes
router.use(authMiddleware);

router.get("/conversations", async (req, res) => {
<<<<<<< HEAD
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
        // 1. Ensure your DAO function returns the newly created message object
        const savedMessage = await sendMessage(
            CURRENT_USER_ID,
            contactId,
            content.trim(),
        );

        // 2. WEBSOCKET BROADCAST: Check if the receiver is currently online
        // Use optional chaining (?.) just in case global.activeClients hasn't initialized
        const receiverSockets = global.activeClients?.get(String(contactId));

        if (receiverSockets) {
            // Loop through all of the receiver's open tabs/devices
            receiverSockets.forEach((clientWs) => {
                // 1 means the WebSocket connection is OPEN
                if (clientWs.readyState === 1) {
                    clientWs.send(JSON.stringify(savedMessage));
                }
            });
        }

        // 3. Return the fully formed message back to the sender
        // so their Vue app can instantly render it in the chat window.
        console.log("Saved message from API:", savedMessage);
        res.json(savedMessage);
    } catch (err) {
        console.error("Failed to send message:", err);
        res.status(500).json({ error: err.message });
    }
=======
  const CURRENT_USER_ID = req.user.id;

  try {
    const messages = await getMessagesForUser(CURRENT_USER_ID);
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const contactId = message.sender_id === CURRENT_USER_ID ? message.receiver_id : message.sender_id;
      const contactName = message.sender_id === CURRENT_USER_ID ? message.receiver_name : message.sender_name;
      const lastMessage = message.content;
      const lastAt = message.created_at;
      const unreadCount = message.receiver_id === CURRENT_USER_ID && !message.is_read ? 1 : 0;

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

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Message content cannot be empty" });
  }

  try {
    await sendMessage(CURRENT_USER_ID, contactId, content.trim());
    res.json({ success: true, message: "Message sent" });
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ error: err.message });
  }
>>>>>>> 2502acc96136733e8f54272237e9ee82151237d1
});

module.exports = router;
