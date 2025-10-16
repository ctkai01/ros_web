const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
    user: 'sa',
    password: '123456',
    server: 'localhost',
    database: 'NTURobot',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createPreferredTable() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected to database successfully');

        // Read SQL file
        const sqlFilePath = path.join(__dirname, 'server', 'database', 'preferred_zones.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing SQL script...');
        const result = await pool.request().query(sqlContent);
        
        console.log('SQL script executed successfully');
        console.log('Result:', result);

        await pool.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
    }
}

createPreferredTable();
