const express = require("express");
const bcrypt = require("bcryptjs");

const { pool } = require("../database/db");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| POST /api/login
|--------------------------------------------------------------------------
| Logs an administrator into the dashboard.
*/
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required."
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const [rows] = await pool.execute(
            `
                SELECT
                    admin_id,
                    first_name,
                    surname,
                    email,
                    password_hash,
                    role,
                    is_active
                FROM admins
                WHERE email = ?
                LIMIT 1
            `,
            [normalizedEmail]
        );

        const admin = rows[0];

        if (!admin) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        if (!admin.is_active) {
            return res.status(403).json({
                error: "This administrator account has been disabled."
            });
        }

        const passwordIsCorrect = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordIsCorrect) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        // Regenerate the session ID after login.
        req.session.regenerate((sessionError) => {
            if (sessionError) {
                return next(sessionError);
            }

            req.session.adminId = admin.admin_id;
            req.session.adminEmail = admin.email;
            req.session.adminRole = admin.role;

            req.session.save((saveError) => {
                if (saveError) {
                    return next(saveError);
                }

                return res.json({
                    ok: true,
                    admin: {
                        id: admin.admin_id,
                        firstName: admin.first_name,
                        surname: admin.surname,
                        email: admin.email,
                        role: admin.role
                    }
                });
            });
        });
    } catch (error) {
        next(error);
    }
});

/*
|--------------------------------------------------------------------------
| POST /api/logout
|--------------------------------------------------------------------------
*/
router.post("/logout", requireAdmin, (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie("cosiss.sid");

        return res.json({
            ok: true,
            message: "Logged out successfully."
        });
    });
});

/*
|--------------------------------------------------------------------------
| GET /api/me
|--------------------------------------------------------------------------
| Checks whether the current browser has a valid admin session.
*/
router.get("/me", requireAdmin, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            `
                SELECT
                    admin_id,
                    first_name,
                    surname,
                    email,
                    role,
                    is_active,
                    created_at
                FROM admins
                WHERE admin_id = ?
                LIMIT 1
            `,
            [req.session.adminId]
        );

        const admin = rows[0];

        if (!admin || !admin.is_active) {
            return req.session.destroy(() => {
                res.status(401).json({
                    authenticated: false
                });
            });
        }

        return res.json({
            authenticated: true,
            admin: {
                id: admin.admin_id,
                firstName: admin.first_name,
                surname: admin.surname,
                email: admin.email,
                role: admin.role,
                createdAt: admin.created_at
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;