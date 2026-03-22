import pool from "../../config/db.js";
import bcrypt from "bcryptjs";

const seed = async () => {
    console.log("🌱 Starting Seeding Process...");

    try {
        // 1. Create a Test User
        const hashedPassword = await bcrypt.hash("password123", 10);
        const userResult = await pool.query(
            "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id",
            ["tester@example.com", hashedPassword, "Test User"]
        );
        const userId = userResult.rows[0].id;
        console.log(`✅ User created/verified: ID ${userId}`);

        // 2. Clear old monitors (optional, but good for a clean seed)
        await pool.query("DELETE FROM monitors WHERE user_id = $1", [userId]);

        // 3. Insert 3 Types of Monitors
        const monitors = [
            { name: "Google", url: "https://www.google.com", interval: 1, threshold: 3 },
            { name: "Broken Site", url: "https://this-is-a-broken-url-1234.com", interval: 1, threshold: 2 },
            { name: "Slow Response Site", url: "https://httpstat.us/200?sleep=5000", interval: 1, threshold: 3 }
        ];

        for (const m of monitors) {
            await pool.query(
                "INSERT INTO monitors (user_id, name, url, check_interval, alert_threshold) VALUES ($1, $2, $3, $4, $5)",
                [userId, m.name, m.url, m.interval, m.threshold]
            );
            console.log(`📡 Added Monitor: ${m.name} (${m.url})`);
        }

        console.log("🚀 Seeding Complete! Your workers should start pinging these in roughly 60 seconds.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seed();
