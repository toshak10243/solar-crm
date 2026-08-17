require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");
const { startScheduledNotifications } = require("./services/scheduledNotifications");

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server Running on Port ${PORT}`);
        console.log(`Local Access: http://localhost:${PORT}`);
        console.log(`Network Access: http://10.20.51.188:${PORT}`);
        
        // 👇 Server start hote hi scheduled notifications shuru
        startScheduledNotifications();
    });
}

startServer();