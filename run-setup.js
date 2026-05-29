const fs = require('fs');
const path = require('path');
const pool = require('./src/database');

async function runSetup() {
  try {
    console.log('Reading setup SQL file...');
    const sqlFile = path.join(__dirname, 'setup-clubs.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into individual statements (simple split on semicolons)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await pool.query(statement);
        console.log('✓ Success');
      } catch (err) {
        // Ignore duplicate entry errors (for admins already added)
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('⚠ Entry already exists (skipping)');
        } else {
          console.error('✗ Error:', err.message);
          throw err;
        }
      }
    }

    console.log('\n✓ Setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

runSetup();
