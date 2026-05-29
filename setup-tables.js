const pool = require('./src/database');

async function setupTables() {
  try {
    console.log('Creating club_join_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_join_requests (
        id int primary key auto_increment,
        profile_id int not null,
        club_id int not null,
        status enum('pending', 'approved', 'declined') default 'pending',
        created_at datetime default current_timestamp,
        foreign key (profile_id) references profile(id) on update cascade on delete cascade,
        foreign key (club_id) references clubs(id) on update cascade on delete cascade
      )
    `);
    console.log('✓ club_join_requests table created');

    console.log('Creating club_events table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_events (
        id int primary key auto_increment,
        club_id int not null,
        title varchar(255) not null,
        description text,
        event_date datetime not null,
        location varchar(255),
        created_at datetime default current_timestamp,
        updated_at datetime default current_timestamp on update current_timestamp,
        foreign key (club_id) references clubs(id) on update cascade on delete cascade
      )
    `);
    console.log('✓ club_events table created');

    console.log('\n✓ All tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

setupTables();
