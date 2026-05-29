-- Create join_requests table for club membership requests
CREATE TABLE IF NOT EXISTS club_join_requests (
    id int primary key auto_increment,
    profile_id int not null,
    club_id int not null,
    status enum('pending', 'approved', 'declined') default 'pending',
    created_at datetime default current_timestamp,
    foreign key (profile_id) references profile(id) on update cascade on delete cascade,
    foreign key (club_id) references clubs(id) on update cascade on delete cascade
);

-- Create events table for club events
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
);

-- Add admins to clubs (using existing profiles from the database)
-- Assuming profile IDs exist: 1=julian, 2=Lin Mei-Hui, 3=John Doe, etc.
-- We'll assign 1-2 admins to each club

-- Club 1: Software Engineering Hub - admins: Julian (1) and Dr. Akira Sato (4)
INSERT INTO club_members (profile_id, role, club_id) VALUES (1, 'admin', 1);
INSERT INTO club_members (profile_id, role, club_id) VALUES (4, 'admin', 1);

-- Club 2: Taiwan Riders - admins: Lin Mei-Hui (2) and John Doe (3)
INSERT INTO club_members (profile_id, role, club_id) VALUES (2, 'admin', 2);
INSERT INTO club_members (profile_id, role, club_id) VALUES (3, 'admin', 2);

-- Club 3: IDX Quant Trading - admins: Siti Aminah (5) and Carlos Mendoza (6)
INSERT INTO club_members (profile_id, role, club_id) VALUES (5, 'admin', 3);
INSERT INTO club_members (profile_id, role, club_id) VALUES (6, 'admin', 3);

-- Club 4: Expat Network - admins: Prof. Emma Williams (7) and Ahmad Khan (8)
INSERT INTO club_members (profile_id, role, club_id) VALUES (7, 'admin', 4);
INSERT INTO club_members (profile_id, role, club_id) VALUES (8, 'admin', 4);

-- Club 5: Skincare & Wellness - admins: Chloe Dubois (9) and Dr. Wei Chen (10)
INSERT INTO club_members (profile_id, role, club_id) VALUES (9, 'admin', 5);
INSERT INTO club_members (profile_id, role, club_id) VALUES (10, 'admin', 5);

-- Club 6: Cloud Builders - admins: Nadia Petrova (11) and James O'Connor (12)
INSERT INTO club_members (profile_id, role, club_id) VALUES (11, 'admin', 6);
INSERT INTO club_members (profile_id, role, club_id) VALUES (12, 'admin', 6);

-- Add some sample events to clubs
INSERT INTO club_events (club_id, title, description, event_date, location) VALUES
(1, 'Node.js Workshop', 'Learn best practices for building scalable Node.js applications', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Tech Hub - Room 301'),
(1, 'SaaS Product Pitch Night', 'Present your startup ideas to investors', DATE_ADD(NOW(), INTERVAL 14 DAY), 'Main Auditorium'),
(2, 'Group Huandao Trip - East Coast Loop', 'Ride the scenic east coast route together. Meet at 8am', DATE_ADD(NOW(), INTERVAL 21 DAY), 'Starting point: Central Station'),
(3, 'Monthly Trading Analysis Meetup', 'Review this month''s market trends and algorithmic strategies', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Conference Room B'),
(4, 'Expat Networking Mixer', 'Meet fellow expats, share experiences, and make new friends', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Rooftop Bar - Downtown'),
(5, 'Skincare Science Seminar', 'Understanding pH, actives, and moisture barriers with dermatologist guest', DATE_ADD(NOW(), INTERVAL 5 DAY), 'Wellness Center - Room 105'),
(6, 'Kubernetes Deep Dive Workshop', 'Container orchestration best practices and deployment strategies', DATE_ADD(NOW(), INTERVAL 8 DAY), 'Cloud Lab - Building A');
