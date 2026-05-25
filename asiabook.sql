-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: asiabook
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `club_members`
--

DROP TABLE IF EXISTS `club_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `club_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int DEFAULT NULL,
  `role` enum('admin','member') DEFAULT NULL,
  `club_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profile_id` (`profile_id`),
  KEY `club_id` (`club_id`),
  CONSTRAINT `club_members_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `club_members_ibfk_2` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `club_members`
--

LOCK TABLES `club_members` WRITE;
/*!40000 ALTER TABLE `club_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `club_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clubs`
--

DROP TABLE IF EXISTS `clubs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clubs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clubs`
--

LOCK TABLES `clubs` WRITE;
/*!40000 ALTER TABLE `clubs` DISABLE KEYS */;
INSERT INTO `clubs` VALUES (1,'Software Engineering Hub','Discussions on full-stack development, JavaFX, Node.js, and building SaaS platforms.'),(2,'Taiwan Riders','Planning island-loop (Huandao) trips, scooter maintenance, and sharing mountain routes.'),(3,'IDX Quant Trading','Algorithmic trading on the Indonesian Stock Exchange, technical analysis, and corporate actions.'),(4,'Expat Network','Navigating life overseas, from banking and language learning to finding local opportunities.'),(5,'Skincare & Wellness','Sharing routines, non-comedogenic product recommendations, and general wellness tips.'),(6,'Cloud Builders','Practical discussions on cloud infrastructure, Docker, and deployment pipelines.');
/*!40000 ALTER TABLE `clubs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum`
--

DROP TABLE IF EXISTS `forum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `post_by` int DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `post_by` (`post_by`),
  CONSTRAINT `forum_ibfk_1` FOREIGN KEY (`post_by`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum`
--

LOCK TABLES `forum` WRITE;
/*!40000 ALTER TABLE `forum` DISABLE KEYS */;
INSERT INTO `forum` VALUES (1,'where do i find femboy near the school',1,'i would like to meet 1 femboy that is interested in cooking mama'),(2,'JavaFX vs Web for Desktop SaaS',1,'I am building a management system. Is JavaFX still a good choice for the desktop client, or should I just wrap a Node.js/Express web app?'),(3,'Best route for Huandao in Autumn?',3,'Planning to loop the island on my scooter this October or November. Anyone have recommendations for the east coast segments?'),(4,'IDX Algorithmic Trading with Python',5,'Looking for resources on implementing MACD and RSI trading bots for the Indonesian Stock Exchange. Any library recommendations?'),(5,'Mandarin phrases for banking in Taiwan',8,'I need to open a bank account next week. What are the essential local phrases I should know so I can navigate the process smoothly?'),(6,'Cloud Computing Practice: Docker issues',4,'For those enrolled in the cloud computing module, please ensure your Docker daemon is running before executing the setup script.'),(7,'Review: SYM Jet SL 125 vs Yamaha SMAX 155',2,'Trying to decide between these two for daily commuting and weekend mountain runs. Thoughts on suspension, resale value, and storage?'),(8,'Non-comedogenic sunscreen recommendations?',7,'My skin has been breaking out lately. Does anyone have good mineral sunscreen recommendations that do not clog pores? I have tried Senka and Manyo before.'),(9,'Handling rights issues and warrants',13,'Can someone explain the best strategy for exercising rights issues? I missed the trading window for a few recently and want to be better prepared.'),(10,'Need help with UI Controller paths',9,'I keep getting a 404 error when hitting my endpoints. My controller is located in com.julian.ui.controller, but the router isn\'t picking it up.'),(11,'Designing an offline-first architecture',1,'If I am building an offline version of a software without a mobile phone app, what is the best way to handle eventual data syncing when they do get an internet connection?');
/*!40000 ALTER TABLE `forum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_reply`
--

DROP TABLE IF EXISTS `forum_reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_reply` (
  `id` int NOT NULL AUTO_INCREMENT,
  `forum_id` int DEFAULT NULL,
  `post_by` int DEFAULT NULL,
  `reply_of` int DEFAULT NULL,
  `content` text,
  PRIMARY KEY (`id`),
  KEY `forum_id` (`forum_id`),
  KEY `post_by` (`post_by`),
  CONSTRAINT `forum_reply_ibfk_1` FOREIGN KEY (`forum_id`) REFERENCES `forum` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forum_reply_ibfk_2` FOREIGN KEY (`post_by`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum_reply`
--

LOCK TABLES `forum_reply` WRITE;
/*!40000 ALTER TABLE `forum_reply` DISABLE KEYS */;
INSERT INTO `forum_reply` VALUES (1,1,2,NULL,'i usually go to the back of the school to meet my regular femboy called joel'),(2,1,1,1,'ok got it can i have his phone number'),(3,1,2,2,'his phone number 12344444');
/*!40000 ALTER TABLE `forum_reply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_reply_votes`
--

DROP TABLE IF EXISTS `forum_reply_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_reply_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reply_id` int NOT NULL,
  `user_id` int NOT NULL,
  `vote` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reply_user` (`reply_id`,`user_id`),
  CONSTRAINT `forum_reply_votes_ibfk_1` FOREIGN KEY (`reply_id`) REFERENCES `forum_reply` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum_reply_votes`
--

LOCK TABLES `forum_reply_votes` WRITE;
/*!40000 ALTER TABLE `forum_reply_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `forum_reply_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_votes`
--

DROP TABLE IF EXISTS `forum_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `forum_id` int NOT NULL,
  `user_id` int NOT NULL,
  `vote` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_forum_user` (`forum_id`,`user_id`),
  CONSTRAINT `forum_votes_ibfk_1` FOREIGN KEY (`forum_id`) REFERENCES `forum` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum_votes`
--

LOCK TABLES `forum_votes` WRITE;
/*!40000 ALTER TABLE `forum_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `forum_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friend_request`
--

DROP TABLE IF EXISTS `friend_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requested_by` int DEFAULT NULL,
  `requested_to` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requested_by` (`requested_by`),
  KEY `requested_to` (`requested_to`),
  CONSTRAINT `friend_request_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friend_request_ibfk_2` FOREIGN KEY (`requested_to`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_request`
--

LOCK TABLES `friend_request` WRITE;
/*!40000 ALTER TABLE `friend_request` DISABLE KEYS */;
INSERT INTO `friend_request` VALUES (1,2,1),(2,1,13),(3,1,6),(4,1,25);
/*!40000 ALTER TABLE `friend_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_id_1` int DEFAULT NULL,
  `profile_id_2` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `profile_id_1` (`profile_id_1`),
  KEY `profile_id_2` (`profile_id_2`),
  CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`profile_id_1`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`profile_id_2`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,25,22,'asalamualaikum my broder',0,'2026-05-12 13:34:03'),(2,25,22,'p',0,'2026-05-12 13:41:15'),(3,22,25,'kontol',0,'2026-05-12 14:32:08'),(4,22,25,'coba socket',0,'2026-05-12 14:44:38'),(5,22,25,'coba socket 2',0,'2026-05-12 14:53:26'),(6,22,25,'coba socket 3',0,'2026-05-12 14:54:47'),(7,25,22,'coba soket 4',0,'2026-05-12 14:59:49'),(8,22,25,'tes',0,'2026-05-12 15:01:29'),(9,25,22,'s',0,'2026-05-12 15:07:41'),(10,22,25,'ohio',0,'2026-05-12 15:08:01'),(11,22,25,'test socket 6',0,'2026-05-12 15:13:20'),(12,22,25,'test',0,'2026-05-12 15:13:42'),(13,22,25,'test',0,'2026-05-12 15:15:44'),(14,22,25,'sss',0,'2026-05-12 15:16:07'),(15,25,22,'ass',0,'2026-05-12 15:18:55'),(16,25,22,'i like ass',0,'2026-05-12 15:19:04'),(17,25,22,'alvin likes nigger',0,'2026-05-12 15:19:14');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int DEFAULT NULL,
  `comment_by` int DEFAULT NULL,
  `content` text,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `comment_by` (`comment_by`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`comment_by`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_picture`
--

DROP TABLE IF EXISTS `post_picture`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_picture` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int DEFAULT NULL,
  `location` text,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `post_picture_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_picture`
--

LOCK TABLES `post_picture` WRITE;
/*!40000 ALTER TABLE `post_picture` DISABLE KEYS */;
INSERT INTO `post_picture` VALUES (1,1,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(2,7,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(3,7,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(4,8,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(5,9,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(6,11,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(7,11,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(8,12,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg'),(9,13,'https://www.maxphoto.co.uk/media/magefan_blog/how_to_take_a_good_photo.jpg');
/*!40000 ALTER TABLE `post_picture` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `posted_by` int DEFAULT NULL,
  `caption` text,
  `likes` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `posted_by` (`posted_by`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,1,'this is my dick and balls',0),(2,1,'post number 2',0),(3,1,'post number 3',0),(4,2,'Just finished the east coast segment of my Huandao! The views near Hualien are unbelievable. ??',0),(5,1,'Finally got the offline data syncing mapped out for the new gym management SaaS. Local SQLite to the rescue!',0),(6,5,'IDX took a slight dip today. Looking at the MACD, might be a good time to accumulate some blue chips. Thoughts? ?',0),(7,8,'Found a great local breakfast spot near Xitun District. Their danbing is absolute perfection! ?',0),(8,7,'Switched to a new mineral sunscreen to handle the humid Taiwan weather. No breakouts so far, highly recommend it for sensitive skin.',0),(9,1,'Drafting the new UI for the dashboard. Decided to go full dark mode. Let me know what you guys think of the contrast.',0),(10,9,'Trying to integrate a physical barcode scanner for the gym management system. Since there is no phone app for the offline version, the front desk relies entirely on this USB scanner setup.',0),(11,3,'Did a quick maintenance run today. Changed the oil and cleaned the CVT filter on the SYM Jet SL 125. Getting her ready for the Taichung mountain roads this weekend! ??',0),(12,5,'Did anyone catch the momentum on BLUE today? The volume spike caught my algorithmic scanner right at the market open. Glad I had my scripts running! ?',0),(13,8,'For those working in the service industry here in Taiwan, what are the most natural phrases to use when politely asking a customer to wait? \"Q?ng sh?od?ng\" sometimes feels a bit too formal for a casual restaurant.',0),(14,11,'Been working on an LSTM model for forecasting time-series data, but the loss curve is plateauing way too early. Should I switch to a GRU architecture or just aggressively tweak the learning rate first?',0),(15,7,'Updating my evening routine. The Clarins serum is great, but I need a solid double-cleansing oil that won\'t irritate acne-prone skin. Any thoughts on the Manyo Pure Cleansing Oil?',0),(16,1,'Pitching the new SaaS to a gym owner tomorrow. I am going to mention the success we had scaling the management system at the Roca Clubhouse to build some early credibility. Wish me luck! ?',0),(17,1,'test',0);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `birth_date` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `role` enum('student','teacher') DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `language` text,
  `contact_info` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profile`
--

LOCK TABLES `profile` WRITE;
/*!40000 ALTER TABLE `profile` DISABLE KEYS */;
INSERT INTO `profile` VALUES (1,'kenneth','kennet@email.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2006-01-01','indonesia','student','computer science','indonesia tercinta','0919123456789'),(2,'julian','julian@email.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2005-01-01','indonesia','student','computer science','indonesia tercinta','0919123456789'),(3,'Alice Smith','alice.smith@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2001-05-14','USA','student','Computer Science','English, Spanish','+1-555-0101'),(4,'Dr. Robert Jones','rjones@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1975-08-22','UK','teacher','Mathematics','English','+44-7700-900123'),(5,'Chen Wei','chen.wei@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1999-11-30','Taiwan','student','Information Technology','Mandarin, English','Line ID: chen_wei99'),(6,'Maria Garcia','m.garcia@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1982-02-15','Spain','teacher','Physics','Spanish, English','+34-600-123-456'),(7,'Budi Santoso','budi.s@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2002-07-08','Indonesia','student','Business Administration','Indonesian, English','WhatsApp: +62-812-3456-7890'),(8,'Dr. Sarah Connor','sconnor@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1980-12-05','Canada','teacher','Robotics','English, French','sarah.connor@example.edu'),(9,'Yuki Tanaka','ytanaka@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2000-03-21','Japan','student','Design','Japanese, English','+81-90-1234-5678'),(10,'Lin Mei-Hui','mei.hui.lin@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2001-09-12','Taiwan','student','Computer Science','Mandarin, English','Line ID: meihui_lin'),(11,'John Doe','jdoe@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1998-04-25','USA','student','Mechanical Engineering','English','+1-555-019-8899'),(12,'Dr. Akira Sato','asato@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1968-11-03','Japan','teacher','Artificial Intelligence','Japanese, English','Office: Room 402'),(13,'Siti Aminah','siti.a@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2003-01-18','Indonesia','student','Cloud Computing','Indonesian, English','WhatsApp: +62-811-222-3333'),(14,'Carlos Mendoza','cmendoza@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2000-12-05','Mexico','student','Graphic Design','Spanish, English','+52-55-1234-5678'),(15,'Prof. Emma Williams','ewilliams@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1975-06-22','UK','teacher','Data Science','English','emma.w@example.edu'),(16,'Ahmad Khan','akhan@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1999-08-30','Pakistan','student','Business Administration','Urdu, English','+92-300-1234567'),(17,'Chloe Dubois','cdubois@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2002-05-14','France','student','Linguistics','French, English, Mandarin','+33-6-12-34-56-78'),(18,'Dr. Wei Chen','weichen@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1982-02-19','Singapore','teacher','Software Engineering','Mandarin, English','Line ID: prof_wei'),(19,'Nadia Petrova','npetrova@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2001-10-08','Russia','student','Physics','Russian, English','+7-916-123-45-67'),(20,'James O Connor','joconnor@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1997-03-17','Ireland','student','History','English, Irish','+353-85-123-4567'),(21,'Prof. Linda Taylor','ltaylor@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1965-09-29','Canada','teacher','Mathematics','English','Office: Room 305B'),(22,'Mateo Silva','msilva@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2004-07-11','Brazil','student','Economics','Portuguese, English','+55-11-98765-4321'),(23,'Kim Min-ji','minji.kim@example.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','2002-11-26','South Korea','student','Media Studies','Korean, English','KakaoTalk: minji_k'),(24,'Dr. Henrik Oberg','hoberg@example.edu','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq','1971-04-14','Sweden','teacher','Environmental Science','Swedish, English','+46-70-123-45-67'),(25,'julian handoyo','julianhandoyo5@gmail.com','$2b$10$tmAlW199wyMepD7sfFn1F.E3chLveBQPHBDITpIkYK..XwHIx5xmq',NULL,NULL,'student','General',NULL,NULL);
/*!40000 ALTER TABLE `profile` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-24 22:22:29
