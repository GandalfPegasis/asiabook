const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleUsers() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE || 'asiabook'
        });

        console.log('Connected to database');

        // Sample users data
        const users = [
            {
                name: 'Alice Johnson',
                email: 'alice.johnson@email.com',
                password: '$2b$10$hashedpassword1', // This would be properly hashed in real app
                birth_date: '1995-03-15',
                nationality: 'American',
                role: 'student',
                department: 'Computer Science',
                language: 'English, Spanish',
                contact_info: 'alice@example.com'
            },
            {
                name: 'Bob Smith',
                email: 'bob.smith@email.com',
                password: '$2b$10$hashedpassword2',
                birth_date: '1993-07-22',
                nationality: 'Canadian',
                role: 'student',
                department: 'Mathematics',
                language: 'English, French',
                contact_info: 'bob@example.com'
            },
            {
                name: 'Charlie Brown',
                email: 'charlie.brown@email.com',
                password: '$2b$10$hashedpassword3',
                birth_date: '1994-11-08',
                nationality: 'British',
                role: 'teacher',
                department: 'Physics',
                language: 'English',
                contact_info: 'charlie@example.com'
            },
            {
                name: 'Diana Prince',
                email: 'diana.prince@email.com',
                password: '$2b$10$hashedpassword4',
                birth_date: '1992-05-30',
                nationality: 'Greek',
                role: 'student',
                department: 'History',
                language: 'Greek, English',
                contact_info: 'diana@example.com'
            },
            {
                name: 'Edward Norton',
                email: 'edward.norton@email.com',
                password: '$2b$10$hashedpassword5',
                birth_date: '1991-12-12',
                nationality: 'Australian',
                role: 'student',
                department: 'Engineering',
                language: 'English',
                contact_info: 'edward@example.com'
            },
            {
                name: 'Fiona Green',
                email: 'fiona.green@email.com',
                password: '$2b$10$hashedpassword6',
                birth_date: '1996-01-18',
                nationality: 'Irish',
                role: 'teacher',
                department: 'Literature',
                language: 'English, Irish',
                contact_info: 'fiona@example.com'
            },
            {
                name: 'George Lucas',
                email: 'george.lucas@email.com',
                password: '$2b$10$hashedpassword7',
                birth_date: '1990-09-25',
                nationality: 'American',
                role: 'student',
                department: 'Film Studies',
                language: 'English',
                contact_info: 'george@example.com'
            },
            {
                name: 'Helen Troy',
                email: 'helen.troy@email.com',
                password: '$2b$10$hashedpassword8',
                birth_date: '1997-04-10',
                nationality: 'Turkish',
                role: 'student',
                department: 'Archaeology',
                language: 'Turkish, English',
                contact_info: 'helen@example.com'
            },
            {
                name: 'Ian Malcolm',
                email: 'ian.malcolm@email.com',
                password: '$2b$10$hashedpassword9',
                birth_date: '1989-08-14',
                nationality: 'Scottish',
                role: 'teacher',
                department: 'Biology',
                language: 'English, Scottish Gaelic',
                contact_info: 'ian@example.com'
            },
            {
                name: 'Julia Roberts',
                email: 'julia.roberts@email.com',
                password: '$2b$10$hashedpassword10',
                birth_date: '1998-02-28',
                nationality: 'American',
                role: 'student',
                department: 'Drama',
                language: 'English',
                contact_info: 'julia@example.com'
            },
            {
                name: 'Kevin Hart',
                email: 'kevin.hart@email.com',
                password: '$2b$10$hashedpassword11',
                birth_date: '1993-06-05',
                nationality: 'American',
                role: 'student',
                department: 'Comedy',
                language: 'English',
                contact_info: 'kevin@example.com'
            },
            {
                name: 'Laura Palmer',
                email: 'laura.palmer@email.com',
                password: '$2b$10$hashedpassword12',
                birth_date: '1995-10-20',
                nationality: 'American',
                role: 'teacher',
                department: 'Psychology',
                language: 'English',
                contact_info: 'laura@example.com'
            }
        ];

        // Insert users
        for (const user of users) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO profile (name, email, password, birth_date, nationality, role, department, language, contact_info)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.name,
                        user.email,
                        user.password,
                        user.birth_date,
                        user.nationality,
                        user.role,
                        user.department,
                        user.language,
                        user.contact_info
                    ]
                );
                console.log(`✅ Added user: ${user.name} (ID: ${result.insertId})`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  User ${user.email} already exists, skipping...`);
                } else {
                    console.error(`❌ Error adding user ${user.name}:`, error.message);
                }
            }
        }

        console.log('\n🎉 Sample users added successfully!');

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run the function
addSampleUsers();