const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4"
});

async function testDatabaseConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            "SELECT DATABASE() AS database_name, NOW() AS server_time"
        );

        console.log(
            `[CoSISS] Connected to MySQL database: ${rows[0].database_name}`
        );
        console.log(
            `[CoSISS] MySQL server time: ${rows[0].server_time}`
        );
    } catch (error) {
        console.error("[CoSISS] MySQL connection failed:");
        console.error(error.message);

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    testDatabaseConnection
};