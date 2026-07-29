// Members register and pay through PayChangu.
// Only administrators receive login sessions.

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const bcrypt = require("bcryptjs");
const multer = require("multer");

const { pool, testDatabaseConnection } =
    require("./database/db");

const {
    initializeTransaction,
    verifyTransaction
} = require("./lib/paychangu");

const app = express();
const db = pool;


/* =========================================================
   APPLICATION CONFIGURATION
   ========================================================= */

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const PORT =
    Number(process.env.PORT) || 3002;

const APP_BASE_URL =
    process.env.APP_BASE_URL ||
    `http://localhost:${PORT}`;

const DEFAULT_MEMBERSHIP_FEE =
    Number(
        process.env.MEMBERSHIP_FEE ||
        5000
    );

const DEFAULT_CURRENCY =
    process.env.MEMBERSHIP_CURRENCY ||
    "MWK";

const FRONTEND_DIR =
    path.join(__dirname, "public");

const UPLOADS_DIR =
    path.join(FRONTEND_DIR, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(
        UPLOADS_DIR,
        {
            recursive: true
        }
    );
}


/* =========================================================
   GENERAL MIDDLEWARE
   ========================================================= */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    createDatabaseTable: true,

    schema: {
        tableName: "sessions",
        columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data"
        }
    }
});

app.use(
    session({
        name: "cosiss.sid",

        secret:
            process.env.SESSION_SECRET ||
            "dev-only-secret-change-me",
        store: sessionStore,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            sameSite: "lax",

            secure:
                process.env.NODE_ENV ===
                "production",

            maxAge:
                1000 * 60 * 60 * 8
        }
    })
);

app.use(
    express.static(FRONTEND_DIR)
);

app.use(
    "/uploads",
    express.static(UPLOADS_DIR)
);


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

async function getSetting(
    key,
    fallback
) {
    const [rows] =
        await db.execute(
            `SELECT setting_value
             FROM settings
             WHERE setting_key = ?
             LIMIT 1`,
            [key]
        );

    return rows.length
        ? rows[0].setting_value
        : fallback;
}


function createMembershipNumber(
    memberId
) {
    return (
        `COSISS-${new Date().getFullYear()}-` +
        String(memberId).padStart(5, "0")
    );
}


function normalizePaymentStatus(
    paymentStatus
) {
    return String(
        paymentStatus || ""
    )
        .trim()
        .toLowerCase();
}


function paymentWasSuccessful(
    paymentStatus
) {
    const normalizedStatus =
        normalizePaymentStatus(
            paymentStatus
        );

    return (
        normalizedStatus ===
            "successful" ||
        normalizedStatus ===
            "success" ||
        normalizedStatus ===
            "paid" ||
        normalizedStatus ===
            "completed"
    );
}


/* =========================================================
   ADMIN INITIALIZATION
   ========================================================= */

async function seedAdmin() {
    const [rows] =
        await db.execute(
            `SELECT COUNT(*) AS total
             FROM admins`
        );

    if (
        Number(rows[0].total) > 0
    ) {
        return;
    }

    const email =
        process.env.ADMIN_EMAIL;

    const password =
        process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.warn(
            "[CoSISS] No admin account exists. " +
            "Set ADMIN_EMAIL and ADMIN_PASSWORD " +
            "in .env, then restart the server."
        );

        return;
    }

    const passwordHash =
        await bcrypt.hash(
            password,
            12
        );

    await db.execute(
        `INSERT INTO admins
        (
            first_name,
            surname,
            email,
            password_hash,
            role
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            process.env
                .ADMIN_FIRST_NAME ||
                "System",

            process.env
                .ADMIN_SURNAME ||
                "Administrator",

            email
                .trim()
                .toLowerCase(),

            passwordHash,

            process.env.ADMIN_ROLE ||
                "Admin"
        ]
    );

    console.log(
        `[CoSISS] Created admin account for ${email}.`
    );
}


/* =========================================================
   AUTHORIZATION MIDDLEWARE
   ========================================================= */

function requireAdmin(
    req,
    res,
    next
) {
    if (
        req.session &&
        req.session.adminId
    ) {
        return next();
    }

    return res.status(401).json({
        error:
            "You need to be logged in as an admin."
    });
}


/* =========================================================
   ADMIN AUTHENTICATION
   ========================================================= */

app.post(
    "/api/login",
    async (req, res, next) => {
        try {
            const {
                email,
                password
            } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error:
                        "Email and password are required."
                });
            }

            const normalizedEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const [rows] =
                await db.execute(
                    `SELECT
                        admin_id,
                        first_name,
                        surname,
                        email,
                        password_hash,
                        role
                     FROM admins
                     WHERE email = ?
                     LIMIT 1`,
                    [normalizedEmail]
                );

            const admin =
                rows[0];

            if (
                !admin ||
                !(
                    await bcrypt.compare(
                        String(password),
                        admin.password_hash
                    )
                )
            ) {
                return res.status(401).json({
                    error:
                        "Invalid email or password."
                });
            }

            req.session.regenerate(
                (error) => {
                    if (error) {
                        return next(error);
                    }

                    req.session.adminId =
                        admin.admin_id;

                    req.session.save(
                        (saveError) => {
                            if (saveError) {
                                return next(
                                    saveError
                                );
                            }

                            return res.json({
                                ok: true,

                                admin: {
                                    id:
                                        admin.admin_id,

                                    firstName:
                                        admin.first_name,

                                    surname:
                                        admin.surname,

                                    email:
                                        admin.email,

                                    role:
                                        admin.role
                                }
                            });
                        }
                    );
                }
            );
        } catch (error) {
            next(error);
        }
    }
);


app.post(
    "/api/logout",
    (req, res, next) => {
        req.session.destroy(
            (error) => {
                if (error) {
                    return next(error);
                }

                res.clearCookie(
                    "cosiss.sid"
                );

                return res.json({
                    ok: true
                });
            }
        );
    }
);


app.get(
    "/api/me",
    async (req, res, next) => {
        try {
            if (
                !req.session ||
                !req.session.adminId
            ) {
                return res.status(401).json({
                    authenticated: false
                });
            }

            const [rows] =
                await db.execute(
                    `SELECT
                        admin_id,
                        first_name,
                        surname,
                        email,
                        role
                     FROM admins
                     WHERE admin_id = ?
                     LIMIT 1`,
                    [
                        req.session.adminId
                    ]
                );

            const admin =
                rows[0];

            if (!admin) {
                return req.session.destroy(
                    () => {
                        res.status(401).json({
                            authenticated:
                                false
                        });
                    }
                );
            }

            return res.json({
                authenticated: true,

                admin: {
                    id:
                        admin.admin_id,

                    firstName:
                        admin.first_name,

                    surname:
                        admin.surname,

                    email:
                        admin.email,

                    role:
                        admin.role
                }
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   MEMBER REGISTRATION AND PAYMENT INITIALIZATION
   ========================================================= */

app.post(
    "/api/register",
    async (req, res, next) => {
        let connection;

        let transactionStarted =
            false;

        let transactionCommitted =
            false;

        try {
            const {
                name,
                sname,
                email,
                phone,
                studentId,
                student_id,
                program,
                programme,
                year,
                gender
            } = req.body;

            const firstName =
                String(name || "")
                    .trim();

            const surname =
                String(sname || "")
                    .trim();

            const normalizedEmail =
                String(email || "")
                    .trim()
                    .toLowerCase();

            const normalizedPhone =
                String(phone || "")
                    .trim()
                    .replace(
                        /[\s-]/g,
                        ""
                    );

            const normalizedStudentId =
                String(
                    studentId ||
                    student_id ||
                    ""
                ).trim();

            const normalizedProgramme =
                String(
                    program ||
                    programme ||
                    ""
                ).trim();

            const numericYear =
                Number(year);

            const genderMap = {
                m: "Male",
                male: "Male",
                f: "Female",
                female: "Female"
            };

            const normalizedGender =
                genderMap[
                    String(
                        gender || ""
                    )
                        .trim()
                        .toLowerCase()
                ];

            if (
                !firstName ||
                !surname ||
                !normalizedEmail ||
                !normalizedPhone ||
                !normalizedStudentId ||
                !normalizedProgramme ||
                !year ||
                !normalizedGender
            ) {
                return res.status(400).json({
                    error:
                        "First name, surname, email, " +
                        "phone, student ID, programme, " +
                        "year and gender are required."
                });
            }

            if (
                firstName.length < 2
            ) {
                return res.status(400).json({
                    error:
                        "First name must contain at least 2 characters."
                });
            }

            if (
                surname.length < 2
            ) {
                return res.status(400).json({
                    error:
                        "Surname must contain at least 2 characters."
                });
            }

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(
                    normalizedEmail
                )
            ) {
                return res.status(400).json({
                    error:
                        "Please provide a valid email address."
                });
            }

            const phonePattern =
                /^(?:\+265|0)?[789]\d{8}$/;

            if (
                !phonePattern.test(
                    normalizedPhone
                )
            ) {
                return res.status(400).json({
                    error:
                        "Please provide a valid Malawi phone number."
                });
            }

            if (
                !Number.isInteger(
                    numericYear
                ) ||
                numericYear < 1 ||
                numericYear > 6
            ) {
                return res.status(400).json({
                    error:
                        "Please provide a valid year of study."
                });
            }

            const registrationOpen =
                await getSetting(
                    "registration_open",
                    "true"
                );

            if (
                String(
                    registrationOpen
                )
                    .trim()
                    .toLowerCase() !==
                "true"
            ) {
                return res.status(403).json({
                    error:
                        "Membership registration is currently closed."
                });
            }

            const amount =
                Number(
                    await getSetting(
                        "membership_fee",
                        DEFAULT_MEMBERSHIP_FEE
                    )
                );

            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {
                return res.status(500).json({
                    error:
                        "The membership fee is not configured correctly."
                });
            }

            const currency =
                String(
                    await getSetting(
                        "currency",
                        DEFAULT_CURRENCY
                    )
                )
                    .trim()
                    .toUpperCase();

            if (!currency) {
                return res.status(500).json({
                    error:
                        "The payment currency is not configured correctly."
                });
            }

            const txRef =
                `cosiss-${crypto.randomUUID()}`;

            const callbackUrl =
                `${APP_BASE_URL}` +
                "/api/payment/callback";

            const returnUrl =
                `${APP_BASE_URL}` +
                "/api/payment/return";

            connection =
                await db.getConnection();

            await connection
                .beginTransaction();

            transactionStarted =
                true;

            const [duplicates] =
                await connection.execute(
                    `SELECT
                        member_id,
                        email,
                        student_id,
                        status
                     FROM members
                     WHERE email = ?
                        OR student_id = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [
                        normalizedEmail,
                        normalizedStudentId
                    ]
                );

            if (
                duplicates.length > 0
            ) {
                await connection.rollback();

                transactionStarted =
                    false;

                return res.status(409).json({
                    error:
                        "A member with that email or student ID already exists."
                });
            }

            const [memberResult] =
                await connection.execute(
                    `INSERT INTO members
                    (
                        membership_number,
                        first_name,
                        surname,
                        email,
                        phone,
                        student_id,
                        programme,
                        year_of_study,
                        gender,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        null,
                        firstName,
                        surname,
                        normalizedEmail,
                        normalizedPhone,
                        normalizedStudentId,
                        normalizedProgramme,
                        numericYear,
                        normalizedGender,
                        "Pending Payment"
                    ]
                );

            const memberId =
                memberResult.insertId;

            await connection.execute(
                `INSERT INTO payments
                (
                    member_id,
                    payment_reference,
                    gateway,
                    amount,
                    currency,
                    payment_status
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    memberId,
                    txRef,
                    "PayChangu",
                    amount,
                    currency,
                    "Pending"
                ]
            );

            const payChanguResponse =
                await initializeTransaction({
                    txRef,
                    amount,
                    currency,

                    email:
                        normalizedEmail,

                    firstName,

                    lastName:
                        surname,

                    callbackUrl,

                    returnUrl
                });

            console.log(
                "PayChangu initialization response:",
                JSON.stringify(
                    payChanguResponse,
                    null,
                    2
                )
            );

            const responseStatus =
                normalizePaymentStatus(
                    payChanguResponse
                        ?.status
                );

            if (
                responseStatus &&
                responseStatus !==
                    "success"
            ) {
                throw new Error(
                    payChanguResponse
                        ?.message ||
                    "PayChangu payment initialization failed."
                );
            }

            const checkoutUrl =
                payChanguResponse
                    ?.data
                    ?.checkout_url ||
                payChanguResponse
                    ?.checkout_url;

            if (
                !checkoutUrl ||
                typeof checkoutUrl !==
                    "string"
            ) {
                throw new Error(
                    "PayChangu did not return a checkout URL."
                );
            }

            await connection.commit();

            transactionCommitted =
                true;

            transactionStarted =
                false;

            return res.status(201).json({
                message:
                    "Membership registration started.",

                memberId,

                txRef,

                amount,

                currency,

                checkoutUrl
            });
        } catch (error) {
            if (
                connection &&
                transactionStarted &&
                !transactionCommitted
            ) {
                try {
                    await connection
                        .rollback();
                } catch (
                    rollbackError
                ) {
                    console.error(
                        "Registration rollback failed:",
                        rollbackError
                            .message
                    );
                }
            }

            console.error(
                "Registration failed:",
                error.response?.data ||
                error.message
            );

            next(error);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


/* =========================================================
   PAYMENT VERIFICATION API
   ========================================================= */

app.get(
    "/api/payment/verify/:txRef",
    async (req, res, next) => {
        let connection;

        let transactionStarted =
            false;

        try {
            const txRef =
                String(
                    req.params.txRef ||
                    ""
                ).trim();

            if (!txRef) {
                return res.status(400).json({
                    error:
                        "Transaction reference is required."
                });
            }

            const verification =
                await verifyTransaction(
                    txRef
                );

            console.log(
                "PayChangu verification response:",
                JSON.stringify(
                    verification,
                    null,
                    2
                )
            );

            const paymentData =
                verification?.data ||
                verification;

            const paymentStatus =
                paymentData?.status ||
                paymentData
                    ?.payment_status;

            if (
                !paymentWasSuccessful(
                    paymentStatus
                )
            ) {
                return res.status(200).json({
                    paid: false,

                    status:
                        normalizePaymentStatus(
                            paymentStatus
                        ) ||
                        "pending"
                });
            }

            const verifiedTxRef =
                paymentData?.tx_ref ||
                paymentData?.reference ||
                txRef;

            connection =
                await db.getConnection();

            await connection
                .beginTransaction();

            transactionStarted =
                true;

            const [payments] =
                await connection.execute(
                    `SELECT
                        payment_id,
                        member_id,
                        amount,
                        currency,
                        payment_status
                     FROM payments
                     WHERE payment_reference = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [verifiedTxRef]
                );

            if (!payments.length) {
                await connection.rollback();

                transactionStarted =
                    false;

                return res.status(404).json({
                    error:
                        "The payment record could not be found."
                });
            }

            const payment =
                payments[0];

            const verifiedAmount =
                Number(
                    paymentData?.amount ||
                    paymentData
                        ?.charged_amount ||
                    0
                );

            const verifiedCurrency =
                String(
                    paymentData
                        ?.currency ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            if (
                verifiedAmount !==
                Number(payment.amount)
            ) {
                await connection.rollback();

                transactionStarted =
                    false;

                return res.status(400).json({
                    error:
                        "The verified payment amount does not match the membership fee."
                });
            }

            if (
                verifiedCurrency &&
                verifiedCurrency !==
                    String(
                        payment.currency
                    )
                        .trim()
                        .toUpperCase()
            ) {
                await connection.rollback();

                transactionStarted =
                    false;

                return res.status(400).json({
                    error:
                        "The verified payment currency does not match."
                });
            }

            const gatewayTransactionId =
                String(
                    paymentData
                        ?.transaction_id ||
                    paymentData?.id ||
                    paymentData
                        ?.reference ||
                    verifiedTxRef
                );

            await connection.execute(
                `UPDATE payments
                 SET
                    payment_status = ?,
                    gateway_transaction_id = ?,
                    payment_date =
                        COALESCE(
                            payment_date,
                            NOW()
                        )
                 WHERE payment_id = ?`,
                [
                    "Successful",

                    gatewayTransactionId,

                    payment.payment_id
                ]
            );

            const membershipNumber =
                createMembershipNumber(
                    payment.member_id
                );

            await connection.execute(
                `UPDATE members
                 SET
                    membership_number =
                        COALESCE(
                            membership_number,
                            ?
                        ),
                    status = ?
                 WHERE member_id = ?`,
                [
                    membershipNumber,

                    "Active",

                    payment.member_id
                ]
            );

            await connection.commit();

            transactionStarted =
                false;

            return res.json({
                paid: true,

                status:
                    "Successful",

                membershipNumber
            });
        } catch (error) {
            if (
                connection &&
                transactionStarted
            ) {
                try {
                    await connection
                        .rollback();
                } catch (
                    rollbackError
                ) {
                    console.error(
                        "Payment rollback failed:",
                        rollbackError
                            .message
                    );
                }
            }

            console.error(
                "Payment verification failed:",
                error.response?.data ||
                error.message
            );

            next(error);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


/* =========================================================
   PAYCHANGU CALLBACK
   ========================================================= */

app.get(
    "/api/payment/callback",
    async (req, res) => {
        const txRef =
            String(
                req.query.tx_ref ||
                ""
            ).trim();

        if (!txRef) {
            return res.redirect(
                "/registration-failed.html" +
                "?reason=missing_reference"
            );
        }

        try {
            const [rows] =
                await db.execute(
                    `SELECT
                        p.payment_id,
                        p.member_id,
                        p.amount,
                        p.currency,
                        p.payment_status,
                        m.status
                            AS member_status
                     FROM payments AS p
                     JOIN members AS m
                       ON m.member_id =
                          p.member_id
                     WHERE p.payment_reference = ?
                     LIMIT 1`,
                    [txRef]
                );

            const payment =
                rows[0];

            if (!payment) {
                return res.redirect(
                    "/registration-failed.html" +
                    "?reason=unknown_reference"
                );
            }

            if (
                payment.payment_status ===
                    "Paid" &&
                payment.member_status ===
                    "Active"
            ) {
                return res.redirect(
                    "/registration-success.html" +
                    `?ref=${encodeURIComponent(
                        txRef
                    )}`
                );
            }

            const verification =
                await verifyTransaction(
                    txRef
                );

            const paymentData =
                verification?.data ||
                verification;

            const status =
                paymentData?.status ||
                paymentData
                    ?.payment_status;

            const successful =
                paymentWasSuccessful(
                    status
                );

            const verifiedAmount =
                Number(
                    paymentData?.amount ||
                    paymentData
                        ?.charged_amount ||
                    0
                );

            const verifiedCurrency =
                String(
                    paymentData
                        ?.currency ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            const amountMatches =
                verifiedAmount ===
                Number(
                    payment.amount
                );

            const currencyMatches =
                !verifiedCurrency ||
                verifiedCurrency ===
                    String(
                        payment.currency
                    )
                        .trim()
                        .toUpperCase();

            if (
                !successful ||
                !amountMatches ||
                !currencyMatches
            ) {
                return res.redirect(
                    "/registration-failed.html" +
                    "?reason=not_confirmed"
                );
            }

            const connection =
                await db.getConnection();

            try {
                await connection
                    .beginTransaction();

                const gatewayTransactionId =
                    String(
                        paymentData
                            ?.transaction_id ||
                        paymentData?.id ||
                        paymentData
                            ?.reference ||
                        txRef
                    );

                await connection.execute(
                    `UPDATE payments
                     SET
                        payment_status = ?,
                        gateway_transaction_id = ?,
                        payment_date =
                            COALESCE(
                                payment_date,
                                NOW()
                            )
                     WHERE payment_id = ?`,
                    [
                        "Paid",

                        gatewayTransactionId,

                        payment.payment_id
                    ]
                );

                const membershipNumber =
                    createMembershipNumber(
                        payment.member_id
                    );

                await connection.execute(
                    `UPDATE members
                     SET
                        status = ?,
                        membership_number =
                            COALESCE(
                                membership_number,
                                ?
                            )
                     WHERE member_id = ?`,
                    [
                        "Active",

                        membershipNumber,

                        payment.member_id
                    ]
                );

                await connection.commit();
            } catch (error) {
                await connection
                    .rollback();

                throw error;
            } finally {
                connection.release();
            }

            return res.redirect(
                "/registration-success.html" +
                `?ref=${encodeURIComponent(
                    txRef
                )}`
            );
        } catch (error) {
            console.error(
                "[CoSISS] Payment callback error:",
                error.response?.data ||
                error.message
            );

            return res.redirect(
                "/registration-failed.html" +
                "?reason=verification_unavailable"
            );
        }
    }
);


/* =========================================================
   PAYMENT RETURN ROUTE
   ========================================================= */

app.get(
    "/api/payment/return",
    (req, res) => {
        const txRef =
            String(req.query.tx_ref || "").trim();

        if (!txRef) {
            return res.redirect(
                "/registration-failed.html" +
                "?reason=missing_reference"
            );
        }

        return res.redirect(
            "/api/payment/callback" +
            `?tx_ref=${encodeURIComponent(txRef)}`
        );
    }
);


/* =========================================================
   MEMBER MANAGEMENT
   ========================================================= */

app.get(
    "/api/members",
    requireAdmin,
    async (req, res, next) => {
        try {
            const [members] =
                await db.execute(
                    `SELECT
                        m.member_id AS id,
                        m.membership_number
                            AS membershipNumber,
                        m.first_name AS name,
                        m.surname AS sname,
                        m.email,
                        m.phone,
                        m.student_id
                            AS studentId,
                        m.programme
                            AS program,
                        m.year_of_study
                            AS year,
                        m.gender,
                        m.status,
                        m.registered_at
                            AS createdAt,
                        p.payment_reference
                            AS paymentReference,
                        p.amount,
                        p.currency,
                        p.payment_status
                            AS paymentStatus,
                        p.payment_date
                            AS paidAt
                     FROM members AS m
                     LEFT JOIN payments AS p
                       ON p.member_id =
                          m.member_id
                     ORDER BY
                        m.registered_at DESC`
                );

            return res.json(
                members
            );
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   NEWS IMAGE UPLOAD CONFIGURATION
   ========================================================= */

const upload =
    multer({
        storage:
            multer.diskStorage({
                destination: (
                    req,
                    file,
                    callback
                ) => {
                    callback(
                        null,
                        UPLOADS_DIR
                    );
                },

                filename: (
                    req,
                    file,
                    callback
                ) => {
                    const safeName =
                        file.originalname
                            .replace(
                                /[^a-zA-Z0-9.\-_]/g,
                                "_"
                            );

                    callback(
                        null,
                        `${Date.now()}-${safeName}`
                    );
                }
            }),

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter: (
            req,
            file,
            callback
        ) => {
            if (
                !file.mimetype
                    .startsWith(
                        "image/"
                    )
            ) {
                return callback(
                    new Error(
                        "Only image uploads are allowed."
                    )
                );
            }

            callback(
                null,
                true
            );
        }
    });


/* =========================================================
   NEWS ROUTES
   ========================================================= */

app.get(
    "/api/news",
    async (req, res, next) => {
        try {
            const [news] =
                await db.execute(
                    `SELECT
                        news_id AS id,
                        title,
                        description,
                        image_path AS image,
                        created_at
                            AS createdAt
                     FROM news
                     ORDER BY
                        created_at DESC`
                );

            return res.json(news);
        } catch (error) {
            next(error);
        }
    }
);


app.post(
    "/api/news",
    requireAdmin,
    upload.single("image"),
    async (req, res, next) => {
        try {
            const {
                title,
                description
            } = req.body;

            const normalizedTitle =
                String(
                    title || ""
                ).trim();

            const normalizedDescription =
                String(
                    description || ""
                ).trim();

            if (
                !normalizedTitle ||
                !normalizedDescription ||
                !req.file
            ) {
                if (req.file) {
                    fs.unlink(
                        req.file.path,
                        () => {}
                    );
                }

                return res.status(400).json({
                    error:
                        "Title, description and an image are required."
                });
            }

            const imagePath =
                `/uploads/${req.file.filename}`;

            const [result] =
                await db.execute(
                    `INSERT INTO news
                    (
                        admin_id,
                        title,
                        description,
                        image_path
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        req.session.adminId,

                        normalizedTitle,

                        normalizedDescription,

                        imagePath
                    ]
                );

            const [rows] =
                await db.execute(
                    `SELECT
                        news_id AS id,
                        title,
                        description,
                        image_path AS image,
                        created_at
                            AS createdAt
                     FROM news
                     WHERE news_id = ?
                     LIMIT 1`,
                    [
                        result.insertId
                    ]
                );

            return res
                .status(201)
                .json(rows[0]);
        } catch (error) {
            if (req.file) {
                fs.unlink(
                    req.file.path,
                    () => {}
                );
            }

            next(error);
        }
    }
);


app.delete(
    "/api/news/:id",
    requireAdmin,
    async (req, res, next) => {
        try {
            const newsId =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(
                    newsId
                ) ||
                newsId <= 0
            ) {
                return res.status(400).json({
                    error:
                        "Invalid news ID."
                });
            }

            const [rows] =
                await db.execute(
                    `SELECT image_path
                     FROM news
                     WHERE news_id = ?
                     LIMIT 1`,
                    [newsId]
                );

            if (!rows.length) {
                return res.status(404).json({
                    error:
                        "News item not found."
                });
            }

            await db.execute(
                `DELETE FROM news
                 WHERE news_id = ?`,
                [newsId]
            );

            const imagePath =
                rows[0].image_path;

            if (imagePath) {
                const absoluteImagePath =
                    path.join(
                        FRONTEND_DIR,

                        imagePath.replace(
                            /^\/+/,
                            ""
                        )
                    );

                fs.unlink(
                    absoluteImagePath,
                    () => {}
                );
            }

            return res.json({
                ok: true
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    "/api/health",
    (req, res) => {
        return res.json({
            ok: true,

            service:
                "CoSISS Website",

            environment:
                process.env.NODE_ENV ||
                "development",

            timestamp:
                new Date()
                    .toISOString()
        });
    }
);


/* =========================================================
   FRONTEND FALLBACK
   ========================================================= */

app.get(
    "/",
    (req, res) => {
        return res.sendFile(
            path.join(
                FRONTEND_DIR,
                "index.html"
            )
        );
    }
);


/* =========================================================
   NOT FOUND HANDLER
   ========================================================= */

app.use(
    "/api",
    (req, res) => {
        return res.status(404).json({
            error:
                "The requested API endpoint was not found."
        });
    }
);


/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        console.error(
            "[CoSISS] Request error:",
            error
        );

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                error:
                    "That record already exists."
            });
        }

        if (
            error instanceof
            multer.MulterError
        ) {
            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {
                return res.status(400).json({
                    error:
                        "The selected image is larger than 5 MB."
                });
            }

            return res.status(400).json({
                error:
                    error.message
            });
        }

        if (
            error.message ===
            "Only image uploads are allowed."
        ) {
            return res.status(400).json({
                error:
                    error.message
            });
        }

        return res.status(500).json({
            error:
                process.env.NODE_ENV ===
                "production"
                    ? "An internal server error occurred."
                    : error.message
        });
    }
);


/* =========================================================
   SERVER STARTUP
   ========================================================= */

async function startServer() {
    try {
        await testDatabaseConnection();

        await seedAdmin();

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `[CoSISS] Server running at ${APP_BASE_URL}`
                );

                console.log(
                    `[CoSISS] Public directory: ${FRONTEND_DIR}`
                );
            }
        );
    } catch (error) {
        console.error(
            "[CoSISS] Server startup failed:"
        );

        console.error(error);

        process.exit(1);
    }
}

startServer();