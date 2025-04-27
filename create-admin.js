const bcrypt = require('bcrypt');
const db = require('./db');

async function createAdminUser() {
    const name = 'Admin User';
    const email = 'admin@example.com';
    const password = 'admin123';
    
    try {
        // Check if admin already exists
        const adminCheck = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);
        if (adminCheck.rows.length > 0) {
            console.log('Admin user already exists!');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const result = await db.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role`,
            [name, email, hashedPassword, 'admin']
        );

        console.log('Admin user created successfully!');
        console.log('Login credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
    } catch (err) {
        console.error('Error creating admin user:', err);
    }
}

createAdminUser();