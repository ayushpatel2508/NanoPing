import pool from "../config/db.js";
import bcrypt from "bcryptjs";

const seed = async () => {
    console.log("🌱 Starting Multi-User Seeding Process...");

    try {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const usersData = [
            {
                name: "Alice Johnson",
                email: "alice@example.com",
                monitors: [
                    { name: "Google", url: "https://www.google.com", interval: 3, threshold: 2 },
                    { name: "GitHub", url: "https://github.com", interval: 5, threshold: 3 },
                    { name: "Broken Link", url: "https://this-is-a-broken-url-99.com", interval: 3, threshold: 1 }
                ]
            },
            {
                name: "Bob Smith",
                email: "bob@example.com",
                monitors: [
                    { name: "Microsoft", url: "https://www.microsoft.com", interval: 5, threshold: 3 },
                    { name: "Apple", url: "https://www.apple.com", interval: 10, threshold: 2 },
                    { name: "Slow API", url: "https://httpstat.us/200?sleep=3000", interval: 3, threshold: 3 }
                ]
            },
            {
                name: "Charlie Davis",
                email: "charlie@example.com",
                monitors: [
                    { name: "Amazon", url: "https://www.amazon.com", interval: 3, threshold: 5 },
                    { name: "Netflix", url: "https://www.netflix.com", interval: 5, threshold: 2 },
                    { name: "Error 500", url: "https://httpstat.us/500", interval: 3, threshold: 2 }
                ]
            }
        ];

        for (const userData of usersData) {
            // 1. Create/Verify User
            const userResult = await pool.query(
                "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id",
                [userData.email, hashedPassword, userData.name]
            );
            const userId = userResult.rows[0].id;
            console.log(`✅ User verified: ${userData.name} (ID: ${userId})`);

            // 2. Clear old monitors for this user for a clean seed
            await pool.query("DELETE FROM monitors WHERE user_id = $1", [userId]);

            // 3. Insert fresh monitors
            for (const m of userData.monitors) {
                await pool.query(
                    "INSERT INTO monitors (user_id, name, url, check_interval, alert_threshold) VALUES ($1, $2, $3, $4, $5)",
                    [userId, m.name, m.url, m.interval, m.threshold]
                );
                console.log(`   📡 Added: ${m.name} [${m.url}]`);
            }
        }

        console.log("\n🚀 Seeding Complete! 3 users and 9 monitors successfully seeded.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seed();
