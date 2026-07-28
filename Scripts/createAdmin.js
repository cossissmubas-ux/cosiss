require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("../database/db");

async function createAdmin() {
    try {
        const firstName = process.env.ADMIN_FIRST_NAME;
        const surname = process.env.ADMIN_SURNAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!firstName || !surname || !email || !password) {
            throw new Error(
                "ADMIN_FIRST_NAME, ADMIN_SURNAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env."
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existingAdmins] = await pool.execute(
            `
                SELECT admin_id
                FROM admins
                WHERE email = ?
                LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingAdmins.length > 0) {
            console.log(
                `[CoSISS] An admin with email ${normalizedEmail} already exists.`
            );

            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `
                INSERT INTO admins
                (
                    first_name,
                    surname,
                    email,
                    password_hash,
                    role
                )
                VALUES (?, ?, ?, ?, ?)
            `,
            [
                firstName.trim(),
                surname.trim(),
                normalizedEmail,
                passwordHash,
                "Admin"
            ]
        );

        console.log("[CoSISS] First admin created successfully.");
        console.log(`[CoSISS] Admin ID: ${result.insertId}`);
        console.log(`[CoSISS] Email: ${normalizedEmail}`);
    } catch (error) {
        console.error("[CoSISS] Could not create admin:");
        console.error(error.message);

        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

createAdmin();