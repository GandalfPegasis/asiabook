const pool = require('./src/database');

async function migrateProfileTable() {
  try {
    console.log('Checking profile table structure...');
    
    // Check if contact_number column exists
    const [columns] = await pool.query("SHOW COLUMNS FROM profile LIKE 'contact_number'");
    
    if (columns.length === 0) {
      console.log('Adding contact_number column to profile table...');
      await pool.query(`
        ALTER TABLE profile 
        ADD COLUMN contact_number VARCHAR(20) NULL
      `);
      console.log('✓ contact_number column added successfully');
    } else {
      console.log('✓ contact_number column already exists');
    }

    // Verify role and department columns exist
    const [roleCol] = await pool.query("SHOW COLUMNS FROM profile LIKE 'role'");
    const [deptCol] = await pool.query("SHOW COLUMNS FROM profile LIKE 'department'");
    
    if (roleCol.length > 0) {
      console.log('✓ role column exists');
    } else {
      console.log('Adding role column...');
      await pool.query(`
        ALTER TABLE profile 
        ADD COLUMN role VARCHAR(50) DEFAULT 'student'
      `);
      console.log('✓ role column added');
    }

    if (deptCol.length > 0) {
      console.log('✓ department column exists');
    } else {
      console.log('Adding department column...');
      await pool.query(`
        ALTER TABLE profile 
        ADD COLUMN department VARCHAR(100) DEFAULT 'General'
      `);
      console.log('✓ department column added');
    }

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateProfileTable();
