-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: localhost    Database: nkh_restaurant
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendances`
--

DROP TABLE IF EXISTS `attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned NOT NULL,
  `clock_in_at` timestamp NOT NULL,
  `clock_out_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendances_location_id_foreign` (`location_id`),
  KEY `attendances_employee_id_clock_in_at_index` (`employee_id`,`clock_in_at`),
  KEY `attendances_clock_in_at_index` (`clock_in_at`),
  KEY `attendances_clock_out_at_index` (`clock_out_at`),
  CONSTRAINT `attendances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attendances_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendances`
--

LOCK TABLES `attendances` WRITE;
/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auditable_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  KEY `audit_logs_created_at_index` (`created_at`),
  KEY `audit_logs_action_index` (`action`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned DEFAULT NULL,
  `slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_location_id_slug_unique` (`location_id`,`slug`),
  KEY `categories_slug_index` (`slug`),
  KEY `categories_is_active_index` (`is_active`),
  CONSTRAINT `categories_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_translations`
--

DROP TABLE IF EXISTS `category_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_translations_category_id_locale_unique` (`category_id`,`locale`),
  KEY `category_translations_locale_index` (`locale`),
  CONSTRAINT `category_translations_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_translations`
--

LOCK TABLES `category_translations` WRITE;
/*!40000 ALTER TABLE `category_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line_1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `delivery_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_addresses_customer_id_label_index` (`customer_id`,`label`),
  CONSTRAINT `customer_addresses_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
INSERT INTO `customer_addresses` VALUES (1,1,'Home','No. 45, Street 123','Sangkat Boeung Keng Kang','Phnom Penh','Phnom Penh','12345',11.5564000,104.9282000,'Leave at the front desk.','2025-09-29 01:04:15','2025-09-29 01:04:15'),(2,1,'Work','Tower A, 12th Floor','Russian Blvd','Phnom Penh','Phnom Penh','12000',11.5621000,104.8885000,'Call upon arrival.','2025-09-29 01:04:15','2025-09-29 01:04:15');
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `preferred_location_id` bigint unsigned DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `points_balance` int NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_user_id_unique` (`user_id`),
  KEY `customers_preferred_location_id_index` (`preferred_location_id`),
  CONSTRAINT `customers_preferred_location_id_foreign` FOREIGN KEY (`preferred_location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `customers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,2,1,NULL,'other',NULL,0,NULL,'2025-09-29 01:04:15','2025-09-29 01:04:15');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `position_id` bigint unsigned DEFAULT NULL,
  `location_id` bigint unsigned NOT NULL,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date DEFAULT NULL,
  `salary_type` enum('hourly','monthly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `salary` decimal(12,2) DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','terminated','on_leave') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employees_location_id_employee_code_unique` (`location_id`,`employee_code`),
  UNIQUE KEY `employees_user_id_unique` (`user_id`),
  KEY `employees_position_id_foreign` (`position_id`),
  KEY `employees_status_index` (`status`),
  CONSTRAINT `employees_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `employees_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_categories_location_id_foreign` (`location_id`),
  KEY `expense_categories_is_active_index` (`is_active`),
  CONSTRAINT `expense_categories_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `expense_category_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','approved','paid','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_location_id_foreign` (`location_id`),
  KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  KEY `expenses_created_by_foreign` (`created_by`),
  KEY `expenses_status_index` (`status`),
  CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `expenses_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `visibility` enum('public','private','internal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `feedback_location_id_foreign` (`location_id`),
  KEY `feedback_customer_id_index` (`customer_id`),
  KEY `feedback_order_id_index` (`order_id`),
  CONSTRAINT `feedback_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `feedback_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `feedback_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `floors`
--

DROP TABLE IF EXISTS `floors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `floors_location_id_foreign` (`location_id`),
  KEY `floors_is_active_index` (`is_active`),
  CONSTRAINT `floors_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `floors`
--

LOCK TABLES `floors` WRITE;
/*!40000 ALTER TABLE `floors` DISABLE KEYS */;
/*!40000 ALTER TABLE `floors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `sku` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unit',
  `quantity_on_hand` decimal(12,3) NOT NULL DEFAULT '0.000',
  `reorder_level` decimal(12,3) NOT NULL DEFAULT '0.000',
  `reorder_quantity` decimal(12,3) DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ingredients_location_id_sku_unique` (`location_id`,`sku`),
  KEY `ingredients_location_id_name_index` (`location_id`,`name`),
  KEY `ingredients_is_active_index` (`is_active`),
  CONSTRAINT `ingredients_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `ingredient_id` bigint unsigned NOT NULL,
  `type` enum('in','out','adjust') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `value` decimal(12,2) DEFAULT NULL,
  `sourceable_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sourceable_id` bigint unsigned DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transacted_at` datetime NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inventory_transactions_location_id_foreign` (`location_id`),
  KEY `inventory_transactions_ingredient_id_foreign` (`ingredient_id`),
  KEY `inventory_transactions_created_by_foreign` (`created_by`),
  KEY `inventory_transactions_sourceable_type_index` (`sourceable_type`),
  KEY `inventory_transactions_sourceable_id_index` (`sourceable_id`),
  KEY `inventory_transactions_transacted_at_index` (`transacted_at`),
  CONSTRAINT `inventory_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned NOT NULL,
  `invoice_number` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `issued_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  KEY `invoices_location_id_foreign` (`location_id`),
  KEY `invoices_order_id_index` (`order_id`),
  KEY `invoices_issued_at_index` (`issued_at`),
  CONSTRAINT `invoices_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` enum('annual','sick','unpaid','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'annual',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_requests_location_id_foreign` (`location_id`),
  KEY `leave_requests_employee_id_start_date_index` (`employee_id`,`start_date`),
  KEY `leave_requests_start_date_index` (`start_date`),
  KEY `leave_requests_end_date_index` (`end_date`),
  KEY `leave_requests_status_index` (`status`),
  CONSTRAINT `leave_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `accepts_online_orders` tinyint(1) NOT NULL DEFAULT '0',
  `accepts_pickup` tinyint(1) NOT NULL DEFAULT '0',
  `accepts_delivery` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `locations_code_unique` (`code`),
  KEY `locations_is_active_index` (`is_active`),
  KEY `locations_accepts_online_orders_index` (`accepts_online_orders`),
  KEY `locations_accepts_pickup_index` (`accepts_pickup`),
  KEY `locations_accepts_delivery_index` (`accepts_delivery`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'MAIN','Main Branch','123 Main St',NULL,'Phnom Penh','Phnom Penh','12000','Cambodia','+855 12 345 678',1,1,1,1,'2025-09-29 01:04:09','2025-09-29 01:04:09');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_points`
--

DROP TABLE IF EXISTS `loyalty_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_points` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `location_id` bigint unsigned NOT NULL,
  `type` enum('earn','redeem','adjust') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `balance_after` int NOT NULL,
  `occurred_at` datetime NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loyalty_points_order_id_foreign` (`order_id`),
  KEY `loyalty_points_location_id_foreign` (`location_id`),
  KEY `idx_loyalty_customer_time` (`customer_id`,`occurred_at`),
  CONSTRAINT `loyalty_points_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `loyalty_points_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `loyalty_points_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_points`
--

LOCK TABLES `loyalty_points` WRITE;
/*!40000 ALTER TABLE `loyalty_points` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item_translations`
--

DROP TABLE IF EXISTS `menu_item_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` bigint unsigned NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_item_translations_menu_item_id_locale_unique` (`menu_item_id`,`locale`),
  KEY `menu_item_translations_locale_index` (`locale`),
  CONSTRAINT `menu_item_translations_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_translations`
--

LOCK TABLES `menu_item_translations` WRITE;
/*!40000 ALTER TABLE `menu_item_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_item_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_items_location_id_slug_unique` (`location_id`,`slug`),
  UNIQUE KEY `menu_items_location_id_sku_unique` (`location_id`,`sku`),
  KEY `menu_items_category_id_foreign` (`category_id`),
  KEY `menu_items_slug_index` (`slug`),
  KEY `menu_items_is_popular_index` (`is_popular`),
  KEY `menu_items_is_active_index` (`is_active`),
  CONSTRAINT `menu_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `menu_items_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2025_09_18_080023_create_locations_table',1),(5,'2025_09_18_080024_create_settings_table',1),(6,'2025_09_18_080025_alter_users_add_profile_fields',1),(7,'2025_09_18_080026_create_roles_table',1),(8,'2025_09_18_080027_create_permissions_table',1),(9,'2025_09_18_080028_create_role_permission_table',1),(10,'2025_09_18_080029_create_role_user_table',1),(11,'2025_09_18_080030_create_audit_logs_table',1),(12,'2025_09_18_080031_create_positions_table',1),(13,'2025_09_18_080032_create_employees_table',1),(14,'2025_09_18_080033_create_attendances_table',1),(15,'2025_09_18_080034_create_payrolls_table',1),(16,'2025_09_18_080035_create_leave_requests_table',1),(17,'2025_09_18_080036_create_categories_table',1),(18,'2025_09_18_080037_create_category_translations_table',1),(19,'2025_09_18_080038_create_menu_items_table',1),(20,'2025_09_18_080039_create_menu_item_translations_table',1),(21,'2025_09_18_080040_create_recipes_table',1),(22,'2025_09_18_080043_create_ingredients_table',1),(23,'2025_09_18_080044_create_purchase_orders_table',1),(24,'2025_09_18_080044_create_suppliers_table',1),(25,'2025_09_18_080045_create_purchase_order_items_table',1),(26,'2025_09_18_080046_create_inventory_transactions_table',1),(27,'2025_09_18_080048_create_floors_table',1),(28,'2025_09_18_080049_create_tables_table',1),(29,'2025_09_18_080050_create_reservations_table',1),(30,'2025_09_18_080051_create_payment_methods_table',1),(31,'2025_09_18_080052_create_orders_table',1),(32,'2025_09_18_080053_create_order_items_table',1),(33,'2025_09_18_080054_create_invoices_table',1),(34,'2025_09_18_080055_create_payments_table',1),(35,'2025_09_18_080057_create_customers_table',1),(36,'2025_09_18_080058_create_feedback_table',1),(37,'2025_09_18_080059_create_promotions_table',1),(38,'2025_09_18_080100_create_loyalty_points_table',1),(39,'2025_09_18_080101_create_expense_categories_table',1),(40,'2025_09_18_080102_create_expenses_table',1),(41,'2025_09_18_102300_create_recipe_ingredients_table',1),(42,'2025_09_18_110000_create_customer_addresses_table',1),(43,'2025_09_18_110100_create_operating_hours_table',1),(44,'2025_09_18_110200_add_online_flags_to_locations_table',1),(45,'2025_09_18_110300_create_order_time_slots_table',1),(46,'2025_09_18_110400_add_online_ordering_fields_to_orders_table',1),(47,'2025_09_18_120000_update_orders_base_structure',1),(48,'2025_09_18_120010_update_payment_methods_structure',1),(49,'2025_09_18_120020_update_customers_structure',1),(50,'2025_09_18_130000_create_personal_access_tokens_table',1),(51,'2025_09_19_140500_fix_schema_relationships_phase1',1),(52,'2025_09_19_141000_fix_schema_relationships_phase2',1),(53,'2025_09_28_160000_fix_order_status_enum',1),(54,'2025_09_29_120000_add_order_preparation_fields',1),(55,'2025_09_29_120000_add_payment_method_fields',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operating_hours`
--

DROP TABLE IF EXISTS `operating_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operating_hours` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL,
  `service_type` enum('dine-in','pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `operating_hours_location_id_day_of_week_service_type_unique` (`location_id`,`day_of_week`,`service_type`),
  CONSTRAINT `operating_hours_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operating_hours`
--

LOCK TABLES `operating_hours` WRITE;
/*!40000 ALTER TABLE `operating_hours` DISABLE KEYS */;
INSERT INTO `operating_hours` VALUES (1,1,0,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(2,1,0,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(3,1,0,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(4,1,1,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(5,1,1,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(6,1,1,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(7,1,2,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(8,1,2,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(9,1,2,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(10,1,3,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(11,1,3,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(12,1,3,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(13,1,4,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(14,1,4,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(15,1,4,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(16,1,5,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(17,1,5,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(18,1,5,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(19,1,6,'dine-in','09:00:00','21:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(20,1,6,'pickup','09:30:00','20:30:00','2025-09-29 01:04:10','2025-09-29 01:04:10'),(21,1,6,'delivery','10:00:00','20:00:00','2025-09-29 01:04:10','2025-09-29 01:04:10');
/*!40000 ALTER TABLE `operating_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `kitchen_status` enum('pending','preparing','ready','served','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_menu_item_id_index` (`menu_item_id`),
  KEY `order_items_kitchen_status_index` (`kitchen_status`),
  KEY `idx_order_item_menu` (`order_id`,`menu_item_id`),
  CONSTRAINT `order_items_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_time_slots`
--

DROP TABLE IF EXISTS `order_time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_time_slots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `slot_date` date NOT NULL,
  `slot_start_time` time NOT NULL,
  `slot_type` enum('pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_orders` int unsigned NOT NULL,
  `current_orders` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_time_slots_unique` (`location_id`,`slot_date`,`slot_start_time`,`slot_type`),
  KEY `order_time_slots_slot_date_slot_type_index` (`slot_date`,`slot_type`),
  KEY `order_time_slots_slot_type_index` (`slot_type`),
  CONSTRAINT `order_time_slots_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_time_slots`
--

LOCK TABLES `order_time_slots` WRITE;
/*!40000 ALTER TABLE `order_time_slots` DISABLE KEYS */;
INSERT INTO `order_time_slots` VALUES (1,1,'2025-09-29','09:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(2,1,'2025-09-29','10:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(3,1,'2025-09-29','10:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(4,1,'2025-09-29','11:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(5,1,'2025-09-29','11:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(6,1,'2025-09-29','12:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(7,1,'2025-09-29','12:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(8,1,'2025-09-29','13:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(9,1,'2025-09-29','13:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(10,1,'2025-09-29','14:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(11,1,'2025-09-29','14:30:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(12,1,'2025-09-29','15:00:00','pickup',20,0,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(13,1,'2025-09-29','15:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(14,1,'2025-09-29','16:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(15,1,'2025-09-29','16:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(16,1,'2025-09-29','17:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(17,1,'2025-09-29','17:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(18,1,'2025-09-29','18:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(19,1,'2025-09-29','18:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(20,1,'2025-09-29','19:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(21,1,'2025-09-29','19:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(22,1,'2025-09-29','20:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(23,1,'2025-09-29','10:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(24,1,'2025-09-29','10:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(25,1,'2025-09-29','11:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(26,1,'2025-09-29','11:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(27,1,'2025-09-29','12:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(28,1,'2025-09-29','12:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(29,1,'2025-09-29','13:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(30,1,'2025-09-29','13:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(31,1,'2025-09-29','14:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(32,1,'2025-09-29','14:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(33,1,'2025-09-29','15:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(34,1,'2025-09-29','15:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(35,1,'2025-09-29','16:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(36,1,'2025-09-29','16:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(37,1,'2025-09-29','17:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(38,1,'2025-09-29','17:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(39,1,'2025-09-29','18:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(40,1,'2025-09-29','18:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(41,1,'2025-09-29','19:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(42,1,'2025-09-29','19:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(43,1,'2025-09-30','09:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(44,1,'2025-09-30','10:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(45,1,'2025-09-30','10:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(46,1,'2025-09-30','11:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(47,1,'2025-09-30','11:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(48,1,'2025-09-30','12:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(49,1,'2025-09-30','12:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(50,1,'2025-09-30','13:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(51,1,'2025-09-30','13:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(52,1,'2025-09-30','14:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(53,1,'2025-09-30','14:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(54,1,'2025-09-30','15:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(55,1,'2025-09-30','15:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(56,1,'2025-09-30','16:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(57,1,'2025-09-30','16:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(58,1,'2025-09-30','17:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(59,1,'2025-09-30','17:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(60,1,'2025-09-30','18:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(61,1,'2025-09-30','18:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(62,1,'2025-09-30','19:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(63,1,'2025-09-30','19:30:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(64,1,'2025-09-30','20:00:00','pickup',20,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(65,1,'2025-09-30','10:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(66,1,'2025-09-30','10:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(67,1,'2025-09-30','11:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(68,1,'2025-09-30','11:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(69,1,'2025-09-30','12:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(70,1,'2025-09-30','12:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(71,1,'2025-09-30','13:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(72,1,'2025-09-30','13:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(73,1,'2025-09-30','14:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(74,1,'2025-09-30','14:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(75,1,'2025-09-30','15:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(76,1,'2025-09-30','15:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(77,1,'2025-09-30','16:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(78,1,'2025-09-30','16:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(79,1,'2025-09-30','17:00:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(80,1,'2025-09-30','17:30:00','delivery',12,0,'2025-09-29 01:04:11','2025-09-29 01:04:11'),(81,1,'2025-09-30','18:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(82,1,'2025-09-30','18:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(83,1,'2025-09-30','19:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(84,1,'2025-09-30','19:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(85,1,'2025-10-01','09:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(86,1,'2025-10-01','10:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(87,1,'2025-10-01','10:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(88,1,'2025-10-01','11:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(89,1,'2025-10-01','11:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(90,1,'2025-10-01','12:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(91,1,'2025-10-01','12:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(92,1,'2025-10-01','13:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(93,1,'2025-10-01','13:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(94,1,'2025-10-01','14:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(95,1,'2025-10-01','14:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(96,1,'2025-10-01','15:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(97,1,'2025-10-01','15:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(98,1,'2025-10-01','16:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(99,1,'2025-10-01','16:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(100,1,'2025-10-01','17:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(101,1,'2025-10-01','17:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(102,1,'2025-10-01','18:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(103,1,'2025-10-01','18:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(104,1,'2025-10-01','19:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(105,1,'2025-10-01','19:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(106,1,'2025-10-01','20:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(107,1,'2025-10-01','10:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(108,1,'2025-10-01','10:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(109,1,'2025-10-01','11:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(110,1,'2025-10-01','11:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(111,1,'2025-10-01','12:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(112,1,'2025-10-01','12:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(113,1,'2025-10-01','13:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(114,1,'2025-10-01','13:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(115,1,'2025-10-01','14:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(116,1,'2025-10-01','14:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(117,1,'2025-10-01','15:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(118,1,'2025-10-01','15:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(119,1,'2025-10-01','16:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(120,1,'2025-10-01','16:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(121,1,'2025-10-01','17:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(122,1,'2025-10-01','17:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(123,1,'2025-10-01','18:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(124,1,'2025-10-01','18:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(125,1,'2025-10-01','19:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(126,1,'2025-10-01','19:30:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(127,1,'2025-10-02','09:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(128,1,'2025-10-02','10:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(129,1,'2025-10-02','10:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(130,1,'2025-10-02','11:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(131,1,'2025-10-02','11:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(132,1,'2025-10-02','12:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(133,1,'2025-10-02','12:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(134,1,'2025-10-02','13:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(135,1,'2025-10-02','13:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(136,1,'2025-10-02','14:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(137,1,'2025-10-02','14:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(138,1,'2025-10-02','15:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(139,1,'2025-10-02','15:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(140,1,'2025-10-02','16:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(141,1,'2025-10-02','16:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(142,1,'2025-10-02','17:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(143,1,'2025-10-02','17:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(144,1,'2025-10-02','18:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(145,1,'2025-10-02','18:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(146,1,'2025-10-02','19:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(147,1,'2025-10-02','19:30:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(148,1,'2025-10-02','20:00:00','pickup',20,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(149,1,'2025-10-02','10:00:00','delivery',12,0,'2025-09-29 01:04:12','2025-09-29 01:04:12'),(150,1,'2025-10-02','10:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(151,1,'2025-10-02','11:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(152,1,'2025-10-02','11:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(153,1,'2025-10-02','12:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(154,1,'2025-10-02','12:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(155,1,'2025-10-02','13:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(156,1,'2025-10-02','13:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(157,1,'2025-10-02','14:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(158,1,'2025-10-02','14:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(159,1,'2025-10-02','15:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(160,1,'2025-10-02','15:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(161,1,'2025-10-02','16:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(162,1,'2025-10-02','16:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(163,1,'2025-10-02','17:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(164,1,'2025-10-02','17:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(165,1,'2025-10-02','18:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(166,1,'2025-10-02','18:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(167,1,'2025-10-02','19:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(168,1,'2025-10-02','19:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(169,1,'2025-10-03','09:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(170,1,'2025-10-03','10:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(171,1,'2025-10-03','10:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(172,1,'2025-10-03','11:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(173,1,'2025-10-03','11:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(174,1,'2025-10-03','12:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(175,1,'2025-10-03','12:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(176,1,'2025-10-03','13:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(177,1,'2025-10-03','13:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(178,1,'2025-10-03','14:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(179,1,'2025-10-03','14:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(180,1,'2025-10-03','15:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(181,1,'2025-10-03','15:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(182,1,'2025-10-03','16:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(183,1,'2025-10-03','16:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(184,1,'2025-10-03','17:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(185,1,'2025-10-03','17:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(186,1,'2025-10-03','18:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(187,1,'2025-10-03','18:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(188,1,'2025-10-03','19:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(189,1,'2025-10-03','19:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(190,1,'2025-10-03','20:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(191,1,'2025-10-03','10:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(192,1,'2025-10-03','10:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(193,1,'2025-10-03','11:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(194,1,'2025-10-03','11:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(195,1,'2025-10-03','12:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(196,1,'2025-10-03','12:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(197,1,'2025-10-03','13:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(198,1,'2025-10-03','13:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(199,1,'2025-10-03','14:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(200,1,'2025-10-03','14:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(201,1,'2025-10-03','15:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(202,1,'2025-10-03','15:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(203,1,'2025-10-03','16:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(204,1,'2025-10-03','16:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(205,1,'2025-10-03','17:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(206,1,'2025-10-03','17:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(207,1,'2025-10-03','18:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(208,1,'2025-10-03','18:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(209,1,'2025-10-03','19:00:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(210,1,'2025-10-03','19:30:00','delivery',12,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(211,1,'2025-10-04','09:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(212,1,'2025-10-04','10:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(213,1,'2025-10-04','10:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(214,1,'2025-10-04','11:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(215,1,'2025-10-04','11:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(216,1,'2025-10-04','12:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(217,1,'2025-10-04','12:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(218,1,'2025-10-04','13:00:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(219,1,'2025-10-04','13:30:00','pickup',20,0,'2025-09-29 01:04:13','2025-09-29 01:04:13'),(220,1,'2025-10-04','14:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(221,1,'2025-10-04','14:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(222,1,'2025-10-04','15:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(223,1,'2025-10-04','15:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(224,1,'2025-10-04','16:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(225,1,'2025-10-04','16:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(226,1,'2025-10-04','17:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(227,1,'2025-10-04','17:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(228,1,'2025-10-04','18:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(229,1,'2025-10-04','18:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(230,1,'2025-10-04','19:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(231,1,'2025-10-04','19:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(232,1,'2025-10-04','20:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(233,1,'2025-10-04','10:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(234,1,'2025-10-04','10:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(235,1,'2025-10-04','11:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(236,1,'2025-10-04','11:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(237,1,'2025-10-04','12:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(238,1,'2025-10-04','12:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(239,1,'2025-10-04','13:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(240,1,'2025-10-04','13:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(241,1,'2025-10-04','14:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(242,1,'2025-10-04','14:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(243,1,'2025-10-04','15:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(244,1,'2025-10-04','15:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(245,1,'2025-10-04','16:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(246,1,'2025-10-04','16:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(247,1,'2025-10-04','17:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(248,1,'2025-10-04','17:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(249,1,'2025-10-04','18:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(250,1,'2025-10-04','18:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(251,1,'2025-10-04','19:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(252,1,'2025-10-04','19:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(253,1,'2025-10-05','09:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(254,1,'2025-10-05','10:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(255,1,'2025-10-05','10:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(256,1,'2025-10-05','11:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(257,1,'2025-10-05','11:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(258,1,'2025-10-05','12:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(259,1,'2025-10-05','12:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(260,1,'2025-10-05','13:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(261,1,'2025-10-05','13:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(262,1,'2025-10-05','14:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(263,1,'2025-10-05','14:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(264,1,'2025-10-05','15:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(265,1,'2025-10-05','15:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(266,1,'2025-10-05','16:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(267,1,'2025-10-05','16:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(268,1,'2025-10-05','17:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(269,1,'2025-10-05','17:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(270,1,'2025-10-05','18:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(271,1,'2025-10-05','18:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(272,1,'2025-10-05','19:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(273,1,'2025-10-05','19:30:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(274,1,'2025-10-05','20:00:00','pickup',20,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(275,1,'2025-10-05','10:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(276,1,'2025-10-05','10:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(277,1,'2025-10-05','11:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(278,1,'2025-10-05','11:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(279,1,'2025-10-05','12:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(280,1,'2025-10-05','12:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(281,1,'2025-10-05','13:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(282,1,'2025-10-05','13:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(283,1,'2025-10-05','14:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(284,1,'2025-10-05','14:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(285,1,'2025-10-05','15:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(286,1,'2025-10-05','15:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(287,1,'2025-10-05','16:00:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(288,1,'2025-10-05','16:30:00','delivery',12,0,'2025-09-29 01:04:14','2025-09-29 01:04:14'),(289,1,'2025-10-05','17:00:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15'),(290,1,'2025-10-05','17:30:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15'),(291,1,'2025-10-05','18:00:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15'),(292,1,'2025-10-05','18:30:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15'),(293,1,'2025-10-05','19:00:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15'),(294,1,'2025-10-05','19:30:00','delivery',12,0,'2025-09-29 01:04:15','2025-09-29 01:04:15');
/*!40000 ALTER TABLE `order_time_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `table_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `employee_id` bigint unsigned DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('dine_in','takeaway','delivery') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine_in',
  `preparation_status` enum('pending','preparing','ready','served') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` int NOT NULL DEFAULT '0',
  `status` enum('pending','received','preparing','ready','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `placed_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `order_type` enum('dine-in','pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine-in',
  `customer_address_id` bigint unsigned DEFAULT NULL,
  `payment_status` enum('unpaid','paid','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `kitchen_submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_location_order_unique` (`location_id`,`order_number`),
  UNIQUE KEY `orders_location_id_order_number_unique` (`location_id`,`order_number`),
  KEY `orders_table_id_foreign` (`table_id`),
  KEY `orders_employee_id_foreign` (`employee_id`),
  KEY `orders_customer_id_index` (`customer_id`),
  KEY `orders_type_index` (`type`),
  KEY `orders_status_index` (`status`),
  KEY `orders_placed_at_index` (`placed_at`),
  KEY `orders_closed_at_index` (`closed_at`),
  KEY `orders_customer_address_id_foreign` (`customer_address_id`),
  KEY `orders_order_type_index` (`order_type`),
  KEY `orders_payment_status_index` (`payment_status`),
  KEY `orders_scheduled_at_index` (`scheduled_at`),
  KEY `orders_preparation_status_index` (`preparation_status`),
  CONSTRAINT `fk_orders_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_customer_address_id_foreign` FOREIGN KEY (`customer_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `orders_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_methods_name_unique` (`name`),
  UNIQUE KEY `payment_methods_code_unique` (`code`),
  KEY `payment_methods_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'Cash','CASH',1,1,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(2,'Credit Card','CARD',2,1,'2025-09-29 01:04:10','2025-09-29 01:04:10'),(3,'Mobile Pay','MOBILE',3,1,'2025-09-29 01:04:10','2025-09-29 01:04:10');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `payment_method_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `paid_at` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_invoice_id_foreign` (`invoice_id`),
  KEY `payments_payment_method_id_foreign` (`payment_method_id`),
  KEY `payments_location_id_foreign` (`location_id`),
  KEY `payments_created_by_foreign` (`created_by`),
  KEY `payments_status_index` (`status`),
  CONSTRAINT `payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payments_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payrolls`
--

DROP TABLE IF EXISTS `payrolls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payrolls` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `gross_pay` decimal(12,2) NOT NULL,
  `bonuses` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(12,2) NOT NULL,
  `status` enum('draft','paid','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payrolls_employee_id_period_start_period_end_index` (`employee_id`,`period_start`,`period_end`),
  KEY `payrolls_period_start_index` (`period_start`),
  KEY `payrolls_period_end_index` (`period_end`),
  KEY `payrolls_status_index` (`status`),
  CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payrolls`
--

LOCK TABLES `payrolls` WRITE;
/*!40000 ALTER TABLE `payrolls` DISABLE KEYS */;
/*!40000 ALTER TABLE `payrolls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'Manage Users','users.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(2,'Manage Roles','roles.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(3,'Manage Permissions','permissions.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(4,'Manage Locations','locations.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(5,'Manage Settings','settings.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(6,'View Employees','employees.view',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(7,'Create Employees','employees.create',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(8,'Update Employees','employees.update',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(9,'Delete Employees','employees.delete',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(10,'View Menu Items','menu_items.view',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(11,'Create Menu Items','menu_items.create',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(12,'Update Menu Items','menu_items.update',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(13,'Delete Menu Items','menu_items.delete',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(14,'View Orders','orders.view',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(15,'Create Orders','orders.create',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(16,'Update Orders','orders.update',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(17,'Delete Orders','orders.delete',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(18,'View Inventory','inventory.view',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(19,'Update Inventory','inventory.update',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(20,'Process Payments','payments.process',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(21,'Process Refunds','refunds.process',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(22,'Manage Promotions','promotions.manage',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(23,'View Reports','reports.view',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `positions_title_unique` (`title`),
  KEY `positions_is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `purchase_order_id` bigint unsigned NOT NULL,
  `ingredient_id` bigint unsigned NOT NULL,
  `quantity_ordered` decimal(12,3) NOT NULL,
  `quantity_received` decimal(12,3) NOT NULL DEFAULT '0.000',
  `unit_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `status` enum('open','partial','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_order_items_purchase_order_id_foreign` (`purchase_order_id`),
  KEY `purchase_order_items_ingredient_id_foreign` (`ingredient_id`),
  KEY `purchase_order_items_status_index` (`status`),
  CONSTRAINT `purchase_order_items_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_order_items_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `order_date` date NOT NULL,
  `expected_date` date DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `status` enum('draft','submitted','partial','received','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_orders_location_id_foreign` (`location_id`),
  KEY `purchase_orders_supplier_id_foreign` (`supplier_id`),
  KEY `purchase_orders_created_by_foreign` (`created_by`),
  KEY `purchase_orders_status_index` (`status`),
  CONSTRAINT `purchase_orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_ingredients`
--

DROP TABLE IF EXISTS `recipe_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipe_ingredients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recipe_id` bigint unsigned NOT NULL,
  `ingredient_id` bigint unsigned NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recipe_ingredients_recipe_id_ingredient_id_unique` (`recipe_id`,`ingredient_id`),
  KEY `recipe_ingredients_ingredient_id_foreign` (`ingredient_id`),
  CONSTRAINT `recipe_ingredients_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `recipe_ingredients_recipe_id_foreign` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_ingredients`
--

LOCK TABLES `recipe_ingredients` WRITE;
/*!40000 ALTER TABLE `recipe_ingredients` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipes`
--

DROP TABLE IF EXISTS `recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` bigint unsigned NOT NULL,
  `yield_portions` int unsigned NOT NULL DEFAULT '1',
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recipes_menu_item_id_unique` (`menu_item_id`),
  CONSTRAINT `recipes_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipes`
--

LOCK TABLES `recipes` WRITE;
/*!40000 ALTER TABLE `recipes` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `table_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reserved_for` datetime NOT NULL,
  `duration_minutes` int unsigned NOT NULL DEFAULT '60',
  `guest_count` int unsigned NOT NULL DEFAULT '2',
  `status` enum('pending','confirmed','seated','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservations_code_unique` (`code`),
  KEY `reservations_location_id_foreign` (`location_id`),
  KEY `reservations_table_id_foreign` (`table_id`),
  KEY `reservations_customer_id_foreign` (`customer_id`),
  KEY `reservations_reserved_for_index` (`reserved_for`),
  KEY `reservations_status_index` (`status`),
  CONSTRAINT `reservations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission`
--

DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `role_permission_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permission_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permission_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission`
--

LOCK TABLES `role_permission` WRITE;
/*!40000 ALTER TABLE `role_permission` DISABLE KEYS */;
INSERT INTO `role_permission` VALUES (1,1),(2,1),(1,2),(2,2),(1,3),(2,3),(1,4),(2,4),(1,5),(2,5),(1,6),(2,6),(3,6),(1,7),(2,7),(1,8),(2,8),(3,8),(1,9),(2,9),(1,10),(2,10),(3,10),(4,10),(1,11),(2,11),(3,11),(1,12),(2,12),(3,12),(1,13),(2,13),(1,14),(2,14),(3,14),(4,14),(5,14),(6,14),(1,15),(2,15),(3,15),(5,15),(6,15),(1,16),(2,16),(3,16),(4,16),(5,16),(1,17),(2,17),(1,18),(2,18),(3,18),(1,19),(2,19),(3,19),(1,20),(2,20),(3,20),(5,20),(1,21),(2,21),(1,22),(2,22),(3,22),(1,23),(2,23),(3,23);
/*!40000 ALTER TABLE `role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_user` (
  `role_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`user_id`),
  KEY `role_user_user_id_foreign` (`user_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_user`
--

LOCK TABLES `role_user` WRITE;
/*!40000 ALTER TABLE `role_user` DISABLE KEYS */;
INSERT INTO `role_user` VALUES (1,1);
/*!40000 ALTER TABLE `role_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','super-admin',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(2,'Admin','admin',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(3,'Manager','manager',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(4,'Chef','chef',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(5,'Waiter','waiter',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(6,'Customer','customer',NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('UwKoRObSXNNOf1Dttc842OTd7XW4uTs2e8yiRFc1',NULL,'127.0.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','YTo0OntzOjY6Il90b2tlbiI7czo0MDoickV6bEI4QU1mVkI3TmFiWjBNZXhLbmgxWU5QbURTWkFsUk1TQ3U1TiI7czoyMjoiUEhQREVCVUdCQVJfU1RBQ0tfREFUQSI7YTowOnt9czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1759137254);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned DEFAULT NULL,
  `key` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_location_id_key_unique` (`location_id`,`key`),
  KEY `settings_key_index` (`key`),
  CONSTRAINT `settings_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suppliers_location_id_foreign` (`location_id`),
  KEY `suppliers_is_active_index` (`is_active`),
  CONSTRAINT `suppliers_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `floor_id` bigint unsigned NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int unsigned NOT NULL DEFAULT '2',
  `status` enum('available','reserved','occupied','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tables_floor_id_code_unique` (`floor_id`,`code`),
  KEY `tables_status_index` (`status`),
  CONSTRAINT `tables_floor_id_foreign` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_location_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `ux_users_phone` (`phone`),
  KEY `users_default_location_id_foreign` (`default_location_id`),
  KEY `users_is_active_index` (`is_active`),
  CONSTRAINT `users_default_location_id_foreign` FOREIGN KEY (`default_location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test User','test@example.com',NULL,NULL,'$2y$12$te7JEfb0E5qtO42GHNyR5eVQ40sJL2tv4WvVdF84xpjHRfwhWmfXG',1,NULL,NULL,'2025-09-29 01:04:09','2025-09-29 01:04:09'),(2,'Sample Customer','customer@example.com','+855 98 765 432',NULL,'$2y$12$EbacPvxKism2WmWFVLu5fuH9dA0xhy3JIMd9cuM4TmuA9rNm3wYt2',1,NULL,1,'2025-09-29 01:04:15','2025-09-29 01:04:15');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-29 22:18:55
