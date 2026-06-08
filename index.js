const express = require("express");
const http = require("http"); // Core Node.js module
const { WebSocketServer } = require("ws");
const cors = require("cors");
require("dotenv").config();

const app = express();

const {
    authMiddleware,
    isAdmin,
} = require("./src/middleware/authMiddleware.js");

app.use(cors());
app.use(express.json());
// app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// 1. Create a core HTTP server using Express
const server = http.createServer(app);

// 2. Attach WebSocket server to the SAME HTTP server
const wss = new WebSocketServer({ server });

// 3. Client Registry: Map User IDs to their active WebSocket connection
// We use global so your Express route files can access this map to send messages
global.activeClients = new Map();

wss.on("connection", (ws, req) => {
    // 1. Catch raw socket errors to prevent the whole server from crashing
    ws.on("error", console.error);

    // Extract the user's ID from the connection URL
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = url.searchParams.get("userId");

    if (userId) {
        console.log(`User ${userId} connected!`);

        // 2. FIX: Support multiple tabs/devices per user using a Set
        if (!global.activeClients.has(userId)) {
            global.activeClients.set(userId, new Set());
        }
        global.activeClients.get(userId).add(ws);
    } else {
        console.log("A client connected without a userId.");
        // Optional: ws.close() here if you strictly require auth
    }

    // Send a welcome payload formatted as JSON
    ws.send(
        JSON.stringify({
            system_message: true,
            content: "Connected to server.",
        }),
    );

    ws.on("message", (message) => {
        // 3. FIX: Convert the Buffer to a string before logging or parsing
        console.log(`Received from User ${userId}: ${message.toString()}`);
    });

    ws.on("close", () => {
        if (userId) {
            console.log(`A connection for User ${userId} closed.`);

            // 4. FIX: Safely remove ONLY this specific tab's socket
            const userConnections = global.activeClients.get(userId);
            if (userConnections) {
                userConnections.delete(ws);

                // If the user has no more open tabs, remove them from the Map entirely
                if (userConnections.size === 0) {
                    console.log(`User ${userId} has completely disconnected.`);
                    global.activeClients.delete(userId);
                }
            }
        }
    });
});

// Routes & Middleware
app.use(require("./src/routes"));
app.use("/admin", require("./src/routes/admin"));

app.all("/{*any}", (req, res, next) => {
    const err = new Error(`Route not found!`);
    err.statusCode = 404;
    next(err);
});

const errorHandler = require("./src/middleware/errorHandler.js");
app.use(errorHandler);

// 5. Start the HTTP Server (which now runs both Express and WS)
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(
        `Express and WebSocket server listening at http://localhost:${port}`,
    );
});
