-- MySQL dump 10.13  Distrib 8.4.8, for Win64 (x86_64)
--
-- Host: localhost    Database: cosiss
-- ------------------------------------------------------
-- Server version	8.4.8

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
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `surname` varchar(50) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('President','Vice President','Secretary','Treasurer','Innovation Director','Admin') NOT NULL DEFAULT 'Admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
  `candidate_id` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `member_id` int NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `manifesto` text,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`candidate_id`),
  KEY `election_id` (`election_id`),
  KEY `member_id` (`member_id`),
  CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`election_id`) REFERENCES `elections` (`election_id`) ON DELETE CASCADE,
  CONSTRAINT `candidates_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `elections`
--

DROP TABLE IF EXISTS `elections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `elections` (
  `election_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `status` enum('Upcoming','Running','Closed') DEFAULT 'Upcoming',
  PRIMARY KEY (`election_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `venue` varchar(150) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `poster` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_event_date` (`event_date`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms`
--

DROP TABLE IF EXISTS `forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms` (
  `form_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`form_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `membership_number` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `surname` varchar(50) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `student_id` varchar(30) NOT NULL,
  `programme` varchar(100) NOT NULL,
  `year_of_study` tinyint NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `status` enum('Pending Payment','Active','Inactive') DEFAULT 'Pending Payment',
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `membership_number` (`membership_number`),
  KEY `idx_member_email` (`email`),
  KEY `idx_member_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `news_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`news_id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_news_created` (`created_at`),
  CONSTRAINT `news_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `payment_reference` varchar(100) NOT NULL,
  `gateway_transaction_id` varchar(100) DEFAULT NULL,
  `gateway` varchar(30) DEFAULT 'PayChangu',
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) DEFAULT 'MWK',
  `payment_status` enum('Pending','Paid','Failed') DEFAULT 'Pending',
  `payment_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payment_reference` (`payment_reference`),
  KEY `member_id` (`member_id`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `receipt_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`receipt_id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `member_id` (`member_id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `votes`
--

DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes` (
  `vote_id` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `candidate_id` int NOT NULL,
  `voter_student_id` varchar(30) NOT NULL,
  `voted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `election_id` (`election_id`,`voter_student_id`),
  KEY `candidate_id` (`candidate_id`),
  CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`election_id`) REFERENCES `elections` (`election_id`) ON DELETE CASCADE,
  CONSTRAINT `votes_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-28 20:57:50
