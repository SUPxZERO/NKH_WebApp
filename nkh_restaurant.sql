-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Nov 19, 2025 at 09:25 AM
-- Server version: 8.0.44
-- PHP Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nkh_restaurant`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `clock_in_at` timestamp NOT NULL,
  `clock_out_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auditable_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba', 'i:15;', 1763544105),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1763544105;', 1763544105);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED DEFAULT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int UNSIGNED NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `location_id`, `parent_id`, `slug`, `display_order`, `is_active`, `image`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, NULL, 'appetizers', 1, 1, NULL, '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(2, 1, NULL, 'main-dishes', 2, 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(3, 1, NULL, 'soups-salads', 3, 1, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop', '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(4, 1, NULL, 'desserts', 4, 1, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop', '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(5, 1, NULL, 'beverages', 5, 1, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(6, 1, 1, 'hot-appetizers', 1, 1, NULL, '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(7, 1, 1, 'cold-appetizers', 2, 1, NULL, '2025-11-19 01:08:06', '2025-11-19 01:08:06', NULL),
(8, 1, 1, 'sharing-platters', 3, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(9, 1, 2, 'grilled-specialties', 1, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(10, 1, 2, 'pasta-noodles', 2, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(11, 1, 2, 'seafood', 3, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(12, 1, 2, 'vegetarian', 4, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(13, 1, 3, 'traditional-soups', 1, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(14, 1, 3, 'fresh-salads', 2, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(15, 1, 4, 'traditional-desserts', 1, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(16, 1, 4, 'ice-cream', 2, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(17, 1, 4, 'cakes-pastries', 3, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(18, 1, 5, 'hot-beverages', 1, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(19, 1, 5, 'cold-beverages', 2, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(20, 1, 5, 'fresh-juices', 3, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(21, 1, 5, 'alcoholic-beverages', 4, 1, NULL, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `category_translations`
--

CREATE TABLE `category_translations` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `category_translations`
--

INSERT INTO `category_translations` (`id`, `category_id`, `locale`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'en', 'Appetizers', 'Start your meal with our delicious appetizers', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(2, 1, 'km', 'បុព្វាហារ', 'ចាប់ផ្តើមអាហាររបស់អ្នកជាមួយបុព្វាហារដ៏ឆ្ងាញ់របស់យើង', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(3, 2, 'en', 'Main Dishes', 'Experience our selection of hearty main dishes', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(4, 2, 'km', 'មុខម្ហូបសំខាន់ៗ', 'សូមស្វាគមន៍មកកាន់ជម្រើសម្ហូបអាហារដ៏ឆ្ងាញ់របស់យើង', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(5, 3, 'en', 'Soups & Salads', 'Fresh salads and warming soups', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(6, 3, 'km', 'ស៊ុប និងសាឡាត់', 'សាឡាត់ស្រស់ៗ និងស៊ុបក្តៅៗ', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(7, 4, 'en', 'Desserts', 'Sweet treats to end your meal perfectly', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(8, 4, 'km', 'បង្អែម', 'បង្អែមផ្អែមៗដើម្បីបញ្ចប់អាហាររបស់អ្នកយ៉ាងឥតខ្ចោះ', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(9, 5, 'en', 'Beverages', 'Refresh yourself with our selection of drinks', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(10, 5, 'km', 'ភេសជ្ជៈ', 'បំពេញថាមពលជាមួយជម្រើសភេសជ្ជៈរបស់យើង', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(11, 6, 'en', 'Hot Appetizers', 'Warm and delicious starters', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(12, 6, 'km', 'បុព្វាហារក្តៅ', 'បុព្វាហារក្តៅៗ និងឆ្ងាញ់', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(13, 7, 'en', 'Cold Appetizers', 'Refreshing cold starters', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(14, 7, 'km', 'បុព្វាហារត្រជាក់', 'បុព្វាហារត្រជាក់ស្រស់ៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(15, 8, 'en', 'Sharing Platters', 'Perfect for sharing with friends and family', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(16, 8, 'km', 'ចានចែករំលែក', 'ល្អឥតខ្ចោះសម្រាប់ចែករំលែកជាមួយមិត្តភក្តិ និងគ្រួសារ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(17, 9, 'en', 'Grilled Specialties', 'Our signature grilled dishes', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(18, 9, 'km', 'ម្ហូបអាំង', 'ម្ហូបអាំងពិសេសរបស់យើង', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(19, 10, 'en', 'Pasta & Noodles', 'Selection of pasta and noodle dishes', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(20, 10, 'km', 'ប៉ាស្តា និងមី', 'ជម្រើសម្ហូបប៉ាស្តា និងមី', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(21, 11, 'en', 'Seafood', 'Fresh seafood dishes', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(22, 11, 'km', 'អាហារសមុទ្រ', 'អាហារសមុទ្រស្រស់ៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(23, 12, 'en', 'Vegetarian', 'Delicious vegetarian options', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(24, 12, 'km', 'អាហារបន្លែ', 'ជម្រើសអាហារបន្លែដ៏ឆ្ងាញ់', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(25, 13, 'en', 'Traditional Soups', 'Classic Khmer soups', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(26, 13, 'km', 'ស៊ុបប្រពៃណី', 'ស៊ុបប្រពៃណីខ្មែរ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(27, 14, 'en', 'Fresh Salads', 'Light and refreshing salads', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(28, 14, 'km', 'សាឡាត់ស្រស់', 'សាឡាត់ស្រស់ស្រូប', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(29, 15, 'en', 'Traditional Desserts', 'Classic Khmer desserts', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(30, 15, 'km', 'បង្អែមប្រពៃណី', 'បង្អែមប្រពៃណីខ្មែរ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(31, 16, 'en', 'Ice Cream', 'Cool and creamy ice cream treats', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(32, 16, 'km', 'ការ៉េម', 'ការ៉េមត្រជាក់ស្រួយ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(33, 17, 'en', 'Cakes & Pastries', 'Fresh baked cakes and pastries', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(34, 17, 'km', 'នំ និងប៉េស្ទ្រី', 'នំ និងប៉េស្ទ្រីដុតថ្មីៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(35, 18, 'en', 'Hot Beverages', 'Warming drinks and hot beverages', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(36, 18, 'km', 'ភេសជ្ជៈក្តៅ', 'ភេសជ្ជៈក្តៅៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(37, 19, 'en', 'Cold Beverages', 'Refreshing cold drinks', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(38, 19, 'km', 'ភេសជ្ជៈត្រជាក់', 'ភេសជ្ជៈត្រជាក់ស្រស់ស្រូប', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(39, 20, 'en', 'Fresh Juices', 'Freshly squeezed fruit juices', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(40, 20, 'km', 'ទឹកផ្លែឈើស្រស់', 'ទឹកផ្លែឈើច្របាច់ស្រស់ៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(41, 21, 'en', 'Alcoholic Beverages', 'Selection of beer, wine and spirits', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(42, 21, 'km', 'ភេសជ្ជៈមានជាតិស្រា', 'ជម្រើសស្រាបៀរ ស្រាទំពាំងបាយជូរ និងស្រា', '2025-11-19 01:08:07', '2025-11-19 01:08:07');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loyalty_points` int NOT NULL DEFAULT '0',
  `total_spent` decimal(10,2) NOT NULL DEFAULT '0.00',
  `preferred_language` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dietary_preferences` json DEFAULT NULL,
  `marketing_consent` tinyint(1) NOT NULL DEFAULT '0',
  `user_id` bigint UNSIGNED NOT NULL,
  `preferred_location_id` bigint UNSIGNED DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `points_balance` int NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `customer_code`, `loyalty_points`, `total_spent`, `preferred_language`, `dietary_preferences`, `marketing_consent`, `user_id`, `preferred_location_id`, `birth_date`, `gender`, `preferences`, `points_balance`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'CUST-21013', 0, 0.00, NULL, NULL, 0, 31, 1, NULL, 'other', NULL, 0, NULL, '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(2, 'CUST-88633', 257, 197.88, 'km', '\"vegetarian\"', 1, 21, 1, '1978-06-05', 'male', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(3, 'CUST-68896', 245, 1428.53, 'en', '\"halal\"', 0, 22, 1, '1983-11-13', 'other', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(4, 'CUST-99026', 48, 1747.41, 'km', NULL, 0, 23, 1, '1991-05-21', 'other', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(5, 'CUST-66471', 265, 643.85, 'km', '\"no_spicy\"', 1, 24, 1, '1974-01-02', 'female', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(6, 'CUST-15207', 236, 493.65, 'en', NULL, 0, 25, 1, '1978-02-02', 'female', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(7, 'CUST-53769', 96, 527.83, 'en', '\"no_spicy\"', 1, 26, 1, '1962-06-11', 'male', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(8, 'CUST-58460', 327, 1290.71, 'km', '\"halal\"', 0, 27, 1, '1956-03-25', 'female', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(9, 'CUST-74077', 483, 1526.09, 'en', '\"no_spicy\"', 0, 28, 1, '1984-06-10', 'female', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(10, 'CUST-34733', 236, 936.85, 'en', NULL, 0, 29, 1, '1982-03-18', 'other', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(11, 'CUST-13722', 335, 159.52, 'km', NULL, 0, 30, 1, '1956-12-06', 'other', NULL, 0, NULL, '2025-11-19 01:08:12', '2025-11-19 01:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `label`, `address_line_1`, `address_line_2`, `city`, `province`, `postal_code`, `latitude`, `longitude`, `delivery_instructions`, `created_at`, `updated_at`) VALUES
(1, 1, 'Home', 'No. 45, Street 123', 'Sangkat Boeung Keng Kang', 'Phnom Penh', 'Phnom Penh', '12345', 11.5564000, 104.9282000, 'Leave at the front desk.', '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(2, 1, 'Work', 'Tower A, 12th Floor', 'Russian Blvd', 'Phnom Penh', 'Phnom Penh', '12000', 11.5621000, 104.8885000, 'Call upon arrival.', '2025-11-19 01:08:06', '2025-11-19 01:08:06');

-- --------------------------------------------------------

--
-- Table structure for table `customer_requests`
--

CREATE TABLE `customer_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `resolution` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `order_id` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `position_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date DEFAULT NULL,
  `salary_type` enum('hourly','monthly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `salary` decimal(12,2) DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','terminated','on_leave') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `user_id`, `position_id`, `location_id`, `employee_code`, `hire_date`, `salary_type`, `salary`, `phone`, `address`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 32, 3, 1, 'NKH-DT-EMP-8779', '2025-07-26', 'monthly', 2200.00, '+855-82-287-387', '960 Street 51, Mean Chey District, Phnom Penh', 'active', '2025-11-19 01:08:08', '2025-11-19 01:08:08', NULL),
(2, 6, 3, 1, 'NKH-DT-EMP-8257', '2025-04-07', 'monthly', 2200.00, '+855-33-568-858', '98 Street 271, Chamkarmon District, Phnom Penh', 'active', '2025-11-19 01:08:08', '2025-11-19 01:08:08', NULL),
(3, 7, 4, 1, 'NKH-DT-EMP-5908', '2025-03-07', 'monthly', 1600.00, '+855-91-957-138', '597 Street 310, Sen Sok District, Phnom Penh', 'active', '2025-11-19 01:08:09', '2025-11-19 01:08:09', NULL),
(4, 8, 4, 1, 'NKH-DT-EMP-3325', '2025-05-17', 'monthly', 1600.00, '+855-89-953-776', '431 Mao Tse Toung Blvd, Chamkarmon District, Phnom Penh', 'active', '2025-11-19 01:08:09', '2025-11-19 01:08:09', NULL),
(5, 9, 7, 1, 'NKH-DT-EMP-4286', '2025-07-06', 'monthly', 1400.00, '+855-18-144-318', '903 Mao Tse Toung Blvd, Mean Chey District, Phnom Penh', 'active', '2025-11-19 01:08:09', '2025-11-19 01:08:09', NULL),
(6, 10, 7, 1, 'NKH-DT-EMP-9921', '2025-05-30', 'monthly', 1400.00, '+855-43-226-149', '744 Monivong Blvd, Sen Sok District, Phnom Penh', 'on_leave', '2025-11-19 01:08:09', '2025-11-19 01:08:09', NULL),
(7, 11, 8, 1, 'NKH-DT-EMP-5442', '2024-12-29', 'hourly', 8.50, '+855-47-769-755', '651 Mao Tse Toung Blvd, Tuol Kork District, Phnom Penh', 'active', '2025-11-19 01:08:10', '2025-11-19 01:08:10', NULL),
(8, 12, 8, 1, 'NKH-DT-EMP-5079', '2025-06-29', 'hourly', 8.50, '+855-59-190-337', '288 Street 310, Tuol Kork District, Phnom Penh', 'on_leave', '2025-11-19 01:08:10', '2025-11-19 01:08:10', NULL),
(9, 13, 8, 1, 'NKH-DT-EMP-4324', '2025-05-25', 'hourly', 8.50, '+855-56-191-357', '176 Sihanouk Blvd, Sen Sok District, Phnom Penh', 'inactive', '2025-11-19 01:08:10', '2025-11-19 01:08:10', NULL),
(10, 14, 8, 1, 'NKH-DT-EMP-8411', '2025-05-08', 'hourly', 8.50, '+855-78-655-918', '129 Monivong Blvd, Chamkarmon District, Phnom Penh', 'active', '2025-11-19 01:08:11', '2025-11-19 01:08:11', NULL),
(11, 15, 5, 1, 'NKH-DT-EMP-4193', '2025-06-11', 'hourly', 12.00, '+855-78-923-513', '307 Monivong Blvd, Daun Penh District, Phnom Penh', 'active', '2025-11-19 01:08:11', '2025-11-19 01:08:11', NULL),
(12, 16, 5, 1, 'NKH-DT-EMP-2545', '2025-02-06', 'hourly', 12.00, '+855-63-113-627', '164 Norodom Blvd, Chamkarmon District, Phnom Penh', 'active', '2025-11-19 01:08:11', '2025-11-19 01:08:11', NULL),
(13, 17, 9, 1, 'NKH-DT-EMP-3363', '2024-11-21', 'hourly', 10.00, '+855-70-814-545', '103 Street 51, Daun Penh District, Phnom Penh', 'active', '2025-11-19 01:08:11', '2025-11-19 01:08:11', NULL),
(14, 18, 9, 1, 'NKH-DT-EMP-6956', '2025-08-18', 'hourly', 10.00, '+855-63-804-796', '773 Monivong Blvd, Tuol Kork District, Phnom Penh', 'on_leave', '2025-11-19 01:08:12', '2025-11-19 01:08:12', NULL),
(15, 19, 10, 1, 'NKH-DT-EMP-9069', '2025-10-02', 'hourly', 9.00, '+855-34-128-552', '954 Mao Tse Toung Blvd, Daun Penh District, Phnom Penh', 'active', '2025-11-19 01:08:12', '2025-11-19 01:08:12', NULL),
(16, 20, 10, 1, 'NKH-DT-EMP-7022', '2025-03-28', 'hourly', 9.00, '+855-24-442-972', '38 Mao Tse Toung Blvd, Chamkarmon District, Phnom Penh', 'active', '2025-11-19 01:08:12', '2025-11-19 01:08:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `expense_category_id` bigint UNSIGNED NOT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `vendor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','approved','paid','voided') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `visibility` enum('public','private','internal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `floors`
--

CREATE TABLE `floors` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int UNSIGNED NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `floors`
--

INSERT INTO `floors` (`id`, `location_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ground Floor', 1, 1, '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(2, 1, 'Second Floor', 2, 1, '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(3, 1, 'Terrace', 3, 1, '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(4, 1, 'VIP Floor', 4, 1, '2025-11-19 01:08:08', '2025-11-19 01:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`id`, `location_id`, `sku`, `name`, `unit`, `quantity_on_hand`, `reorder_level`, `reorder_quantity`, `cost`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'BEEF-001', 'Premium Beef', 'kg', 25.500, 10.000, 30.000, 18.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(2, 1, 'PORK-001', 'Fresh Pork', 'kg', 18.000, 8.000, 25.000, 12.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(3, 1, 'CHKN-001', 'Free Range Chicken', 'kg', 22.000, 12.000, 30.000, 8.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(4, 1, 'FISH-001', 'Fresh River Fish', 'kg', 15.500, 8.000, 20.000, 14.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(5, 1, 'PRWN-001', 'Fresh Prawns', 'kg', 8.000, 5.000, 15.000, 22.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(6, 1, 'TOFU-001', 'Silken Tofu', 'kg', 12.000, 6.000, 20.000, 3.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(7, 1, 'VEG-001', 'Green Papaya', 'kg', 35.000, 15.000, 40.000, 2.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(8, 1, 'VEG-002', 'Tomatoes', 'kg', 28.000, 12.000, 35.000, 3.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(9, 1, 'VEG-003', 'Morning Glory', 'kg', 20.000, 10.000, 25.000, 1.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(10, 1, 'VEG-004', 'Bean Sprouts', 'kg', 15.000, 8.000, 20.000, 2.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(11, 1, 'VEG-005', 'Lotus Stem', 'kg', 8.500, 5.000, 12.000, 4.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(12, 1, 'VEG-006', 'Lolot Leaves', 'kg', 5.000, 3.000, 8.000, 6.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(13, 1, 'VEG-007', 'Banana Leaves', 'unit', 50.000, 20.000, 60.000, 0.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(14, 1, 'HERB-001', 'Fresh Ginger', 'kg', 8.000, 4.000, 10.000, 5.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(15, 1, 'HERB-002', 'Lemongrass', 'kg', 6.500, 3.000, 8.000, 4.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(16, 1, 'HERB-003', 'Galangal', 'kg', 4.000, 2.000, 6.000, 7.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(17, 1, 'HERB-004', 'Kaffir Lime Leaves', 'kg', 2.500, 1.000, 4.000, 12.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(18, 1, 'HERB-005', 'Thai Basil', 'kg', 3.000, 1.500, 5.000, 8.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(19, 1, 'HERB-006', 'Cilantro', 'kg', 4.500, 2.000, 6.000, 6.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(20, 1, 'SPICE-001', 'Turmeric Powder', 'kg', 5.000, 2.000, 8.000, 15.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(21, 1, 'SPICE-002', 'Chili Powder', 'kg', 6.000, 3.000, 10.000, 12.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(22, 1, 'PANT-001', 'Jasmine Rice', 'kg', 150.000, 50.000, 200.000, 1.20, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(23, 1, 'PANT-002', 'Rice Noodles', 'kg', 45.000, 20.000, 60.000, 2.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(24, 1, 'PANT-003', 'Coconut Milk', 'l', 25.000, 12.000, 35.000, 3.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(25, 1, 'PANT-004', 'Fish Sauce', 'l', 18.000, 8.000, 25.000, 4.20, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(26, 1, 'PANT-005', 'Soy Sauce', 'l', 22.000, 10.000, 30.000, 3.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(27, 1, 'PANT-006', 'Oyster Sauce', 'l', 15.000, 8.000, 20.000, 5.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(28, 1, 'PANT-007', 'Tamarind Paste', 'kg', 8.000, 4.000, 12.000, 6.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(29, 1, 'PANT-008', 'Palm Sugar', 'kg', 12.000, 6.000, 18.000, 4.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(30, 1, 'FRUIT-001', 'Fresh Mangoes', 'kg', 20.000, 10.000, 30.000, 3.20, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(31, 1, 'FRUIT-002', 'Oranges', 'kg', 25.000, 12.000, 35.000, 2.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(32, 1, 'FRUIT-003', 'Watermelon', 'kg', 40.000, 20.000, 60.000, 1.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(33, 1, 'FRUIT-004', 'Limes', 'kg', 15.000, 8.000, 20.000, 4.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(34, 1, 'DAIRY-001', 'Fresh Eggs', 'unit', 200.000, 100.000, 300.000, 0.25, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(35, 1, 'DAIRY-002', 'Condensed Milk', 'l', 20.000, 10.000, 30.000, 3.80, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(36, 1, 'DAIRY-003', 'Heavy Cream', 'l', 12.000, 6.000, 18.000, 5.20, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(37, 1, 'BEV-001', 'Cambodian Coffee Beans', 'kg', 15.000, 8.000, 25.000, 12.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(38, 1, 'BEV-002', 'Jasmine Tea Leaves', 'kg', 8.000, 4.000, 12.000, 18.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(39, 1, 'BEV-003', 'Angkor Beer', 'unit', 120.000, 50.000, 200.000, 1.20, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(40, 1, 'LOW-001', 'Premium Olive Oil', 'l', 2.000, 5.000, 15.000, 25.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(41, 1, 'LOW-002', 'Sea Salt', 'kg', 1.500, 3.000, 10.000, 8.50, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(42, 1, 'OUT-001', 'Black Pepper', 'kg', 0.000, 2.000, 8.000, 35.00, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `ingredient_id` bigint UNSIGNED NOT NULL,
  `type` enum('in','out','adjust') COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `movement_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `value` decimal(12,2) DEFAULT NULL,
  `sourceable_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sourceable_id` bigint UNSIGNED DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `transacted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `ingredient_id`, `type`, `location_id`, `user_id`, `movement_type`, `quantity`, `unit_cost`, `value`, `sourceable_type`, `sourceable_id`, `unit`, `reference_type`, `reference_id`, `notes`, `transacted_at`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 10, 'in', 1, 4, 'adjustment', 84.80, NULL, NULL, NULL, NULL, 'kg', 'order', 14, 'Regular stock replenishment', '2025-10-20 02:01:21', NULL, '2025-10-20 02:01:21', '2025-10-20 02:01:21'),
(2, 37, 'in', 1, 4, 'adjustment', 17.10, NULL, NULL, NULL, NULL, 'kg', 'order', 55, 'Damaged goods disposal', '2025-10-20 05:00:21', NULL, '2025-10-20 05:00:21', '2025-10-20 05:00:21'),
(3, 2, 'in', 1, 3, 'transfer', 18.20, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 79, 'Damaged goods disposal', '2025-10-20 07:00:21', NULL, '2025-10-20 07:00:21', '2025-10-20 07:00:21'),
(4, 13, 'in', 1, 4, 'transfer', 87.70, NULL, NULL, NULL, NULL, 'unit', 'waste_record', 22, NULL, '2025-10-20 06:02:21', NULL, '2025-10-20 06:02:21', '2025-10-20 06:02:21'),
(5, 3, 'in', 1, 3, 'purchase', 91.40, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 69, 'Stock correction after count', '2025-10-20 03:03:21', NULL, '2025-10-20 03:03:21', '2025-10-20 03:03:21'),
(6, 41, 'in', 1, 3, 'adjustment', 57.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 80, 'Emergency order', '2025-10-20 07:00:21', NULL, '2025-10-20 07:00:21', '2025-10-20 07:00:21'),
(7, 11, 'in', 1, 4, 'waste', 10.10, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 53, NULL, '2025-10-21 10:01:21', NULL, '2025-10-21 10:01:21', '2025-10-21 10:01:21'),
(8, 5, 'in', 1, 4, 'transfer', 73.20, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 98, 'Emergency order', '2025-10-21 13:03:21', NULL, '2025-10-21 13:03:21', '2025-10-21 13:03:21'),
(9, 20, 'in', 1, 3, 'waste', 95.20, NULL, NULL, NULL, NULL, 'kg', 'order', 69, 'Emergency order', '2025-10-21 13:00:21', NULL, '2025-10-21 13:00:21', '2025-10-21 13:00:21'),
(10, 1, 'in', 1, 3, 'usage', 36.10, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 35, 'Emergency order', '2025-10-21 15:03:21', NULL, '2025-10-21 15:03:21', '2025-10-21 15:03:21'),
(11, 41, 'in', 1, 3, 'usage', 2.00, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 28, NULL, '2025-10-21 10:02:21', NULL, '2025-10-21 10:02:21', '2025-10-21 10:02:21'),
(12, 42, 'in', 1, 3, 'waste', 96.40, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 15, NULL, '2025-10-21 01:01:21', NULL, '2025-10-21 01:01:21', '2025-10-21 01:01:21'),
(13, 33, 'in', 1, 3, 'adjustment', 96.20, NULL, NULL, NULL, NULL, 'kg', 'order', 30, 'Damaged goods disposal', '2025-10-22 05:02:21', NULL, '2025-10-22 05:02:21', '2025-10-22 05:02:21'),
(14, 38, 'in', 1, 3, 'transfer', 0.40, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 99, 'Damaged goods disposal', '2025-10-21 23:03:21', NULL, '2025-10-21 23:03:21', '2025-10-21 23:03:21'),
(15, 23, 'in', 1, 4, 'transfer', 84.10, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 81, 'Stock correction after count', '2025-10-22 02:00:21', NULL, '2025-10-22 02:00:21', '2025-10-22 02:00:21'),
(16, 25, 'in', 1, 3, 'waste', 78.00, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 13, 'Regular stock replenishment', '2025-10-22 02:03:21', NULL, '2025-10-22 02:03:21', '2025-10-22 02:03:21'),
(17, 22, 'in', 1, 4, 'usage', 9.70, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 35, 'Damaged goods disposal', '2025-10-22 05:02:21', NULL, '2025-10-22 05:02:21', '2025-10-22 05:02:21'),
(18, 7, 'in', 1, 3, 'transfer', 52.10, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 85, 'Stock correction after count', '2025-10-23 10:01:21', NULL, '2025-10-23 10:01:21', '2025-10-23 10:01:21'),
(19, 29, 'in', 1, 4, 'transfer', 95.80, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 79, 'Stock correction after count', '2025-10-23 01:02:21', NULL, '2025-10-23 01:02:21', '2025-10-23 01:02:21'),
(20, 5, 'in', 1, 3, 'adjustment', 77.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 47, 'Damaged goods disposal', '2025-10-23 06:02:21', NULL, '2025-10-23 06:02:21', '2025-10-23 06:02:21'),
(21, 37, 'in', 1, 4, 'waste', 9.60, NULL, NULL, NULL, NULL, 'kg', 'order', 26, NULL, '2025-10-23 03:02:21', NULL, '2025-10-23 03:02:21', '2025-10-23 03:02:21'),
(22, 9, 'in', 1, 4, 'purchase', 35.00, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 32, 'Regular stock replenishment', '2025-10-23 07:02:21', NULL, '2025-10-23 07:02:21', '2025-10-23 07:02:21'),
(23, 40, 'in', 1, 4, 'adjustment', 27.50, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 76, NULL, '2025-10-23 08:02:21', NULL, '2025-10-23 08:02:21', '2025-10-23 08:02:21'),
(24, 11, 'in', 1, 4, 'transfer', 74.10, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 33, 'Damaged goods disposal', '2025-10-23 09:03:21', NULL, '2025-10-23 09:03:21', '2025-10-23 09:03:21'),
(25, 4, 'in', 1, 3, 'adjustment', 59.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 3, NULL, '2025-10-24 13:00:21', NULL, '2025-10-24 13:00:21', '2025-10-24 13:00:21'),
(26, 8, 'in', 1, 4, 'purchase', 54.70, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 81, NULL, '2025-10-24 01:03:21', NULL, '2025-10-24 01:03:21', '2025-10-24 01:03:21'),
(27, 19, 'in', 1, 4, 'waste', 82.90, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 28, 'Stock correction after count', '2025-10-24 04:03:21', NULL, '2025-10-24 04:03:21', '2025-10-24 04:03:21'),
(28, 3, 'in', 1, 3, 'purchase', 11.90, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 75, 'Damaged goods disposal', '2025-10-24 02:00:21', NULL, '2025-10-24 02:00:21', '2025-10-24 02:00:21'),
(29, 41, 'in', 1, 3, 'waste', 50.50, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 80, 'Stock correction after count', '2025-10-24 03:03:21', NULL, '2025-10-24 03:03:21', '2025-10-24 03:03:21'),
(30, 32, 'in', 1, 4, 'purchase', 9.90, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 89, 'Regular stock replenishment', '2025-10-24 11:02:21', NULL, '2025-10-24 11:02:21', '2025-10-24 11:02:21'),
(31, 10, 'in', 1, 3, 'waste', 40.50, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 70, 'Transfer between locations', '2025-10-24 03:00:21', NULL, '2025-10-24 03:00:21', '2025-10-24 03:00:21'),
(32, 40, 'in', 1, 4, 'usage', 86.40, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 76, 'Emergency order', '2025-10-25 02:03:21', NULL, '2025-10-25 02:03:21', '2025-10-25 02:03:21'),
(33, 13, 'in', 1, 3, 'adjustment', 78.20, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 99, NULL, '2025-10-25 08:01:21', NULL, '2025-10-25 08:01:21', '2025-10-25 08:01:21'),
(34, 39, 'in', 1, 4, 'adjustment', 43.30, NULL, NULL, NULL, NULL, 'unit', 'waste_record', 67, 'Emergency order', '2025-10-25 03:01:21', NULL, '2025-10-25 03:01:21', '2025-10-25 03:01:21'),
(35, 42, 'in', 1, 4, 'purchase', 82.60, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 34, 'Damaged goods disposal', '2025-10-25 01:01:21', NULL, '2025-10-25 01:01:21', '2025-10-25 01:01:21'),
(36, 29, 'in', 1, 4, 'usage', 78.00, NULL, NULL, NULL, NULL, 'kg', 'order', 11, NULL, '2025-10-25 11:00:21', NULL, '2025-10-25 11:00:21', '2025-10-25 11:00:21'),
(37, 9, 'in', 1, 4, 'waste', 9.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 22, NULL, '2025-10-26 11:01:21', NULL, '2025-10-26 11:01:21', '2025-10-26 11:01:21'),
(38, 25, 'in', 1, 4, 'usage', 11.60, NULL, NULL, NULL, NULL, 'l', 'order', 84, 'Transfer between locations', '2025-10-26 06:03:21', NULL, '2025-10-26 06:03:21', '2025-10-26 06:03:21'),
(39, 1, 'in', 1, 3, 'usage', 12.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 9, NULL, '2025-10-26 09:02:21', NULL, '2025-10-26 09:02:21', '2025-10-26 09:02:21'),
(40, 34, 'in', 1, 3, 'purchase', 70.90, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 61, 'Emergency order', '2025-10-26 09:01:21', NULL, '2025-10-26 09:01:21', '2025-10-26 09:01:21'),
(41, 12, 'in', 1, 4, 'purchase', 25.40, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 50, 'Regular stock replenishment', '2025-10-26 14:03:21', NULL, '2025-10-26 14:03:21', '2025-10-26 14:03:21'),
(42, 29, 'in', 1, 4, 'usage', 98.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 47, 'Damaged goods disposal', '2025-10-26 08:00:21', NULL, '2025-10-26 08:00:21', '2025-10-26 08:00:21'),
(43, 38, 'in', 1, 4, 'transfer', 9.30, NULL, NULL, NULL, NULL, 'kg', 'order', 97, NULL, '2025-10-26 01:01:21', NULL, '2025-10-26 01:01:21', '2025-10-26 01:01:21'),
(44, 24, 'in', 1, 4, 'purchase', 26.60, NULL, NULL, NULL, NULL, 'l', 'order', 71, 'Transfer between locations', '2025-10-26 13:02:21', NULL, '2025-10-26 13:02:21', '2025-10-26 13:02:21'),
(45, 23, 'in', 1, 3, 'purchase', 97.00, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 37, NULL, '2025-10-26 01:01:21', NULL, '2025-10-26 01:01:21', '2025-10-26 01:01:21'),
(46, 17, 'in', 1, 3, 'usage', 15.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 82, 'Emergency order', '2025-10-26 06:00:21', NULL, '2025-10-26 06:00:21', '2025-10-26 06:00:21'),
(47, 31, 'in', 1, 3, 'usage', 84.80, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 41, 'Emergency order', '2025-10-27 10:01:21', NULL, '2025-10-27 10:01:21', '2025-10-27 10:01:21'),
(48, 42, 'in', 1, 3, 'transfer', 66.00, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 85, NULL, '2025-10-27 15:01:21', NULL, '2025-10-27 15:01:21', '2025-10-27 15:01:21'),
(49, 14, 'in', 1, 4, 'purchase', 33.70, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 60, 'Damaged goods disposal', '2025-10-26 23:01:21', NULL, '2025-10-26 23:01:21', '2025-10-26 23:01:21'),
(50, 7, 'in', 1, 4, 'purchase', 30.00, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 7, 'Stock correction after count', '2025-10-27 12:02:21', NULL, '2025-10-27 12:02:21', '2025-10-27 12:02:21'),
(51, 12, 'in', 1, 3, 'purchase', 4.50, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 69, NULL, '2025-10-27 01:02:21', NULL, '2025-10-27 01:02:21', '2025-10-27 01:02:21'),
(52, 9, 'in', 1, 4, 'purchase', 66.70, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 70, 'Regular stock replenishment', '2025-10-27 03:02:21', NULL, '2025-10-27 03:02:21', '2025-10-27 03:02:21'),
(53, 13, 'in', 1, 4, 'waste', 1.50, NULL, NULL, NULL, NULL, 'unit', 'inventory_count', 24, 'Emergency order', '2025-10-28 09:02:21', NULL, '2025-10-28 09:02:21', '2025-10-28 09:02:21'),
(54, 5, 'in', 1, 4, 'transfer', 25.50, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 88, 'Regular stock replenishment', '2025-10-28 01:02:21', NULL, '2025-10-28 01:02:21', '2025-10-28 01:02:21'),
(55, 12, 'in', 1, 4, 'purchase', 59.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 54, 'Damaged goods disposal', '2025-10-28 06:03:21', NULL, '2025-10-28 06:03:21', '2025-10-28 06:03:21'),
(56, 41, 'in', 1, 3, 'adjustment', 81.30, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 57, NULL, '2025-10-28 11:00:21', NULL, '2025-10-28 11:00:21', '2025-10-28 11:00:21'),
(57, 34, 'in', 1, 3, 'adjustment', 81.70, NULL, NULL, NULL, NULL, 'unit', 'inventory_count', 88, 'Damaged goods disposal', '2025-10-28 11:01:21', NULL, '2025-10-28 11:01:21', '2025-10-28 11:01:21'),
(58, 3, 'in', 1, 3, 'adjustment', 48.80, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 25, 'Stock correction after count', '2025-10-27 23:02:21', NULL, '2025-10-27 23:02:21', '2025-10-27 23:02:21'),
(59, 35, 'in', 1, 4, 'adjustment', 67.40, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 85, 'Damaged goods disposal', '2025-10-28 03:02:21', NULL, '2025-10-28 03:02:21', '2025-10-28 03:02:21'),
(60, 18, 'in', 1, 3, 'waste', 58.70, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 34, 'Emergency order', '2025-10-28 07:02:21', NULL, '2025-10-28 07:02:21', '2025-10-28 07:02:21'),
(61, 40, 'in', 1, 4, 'transfer', 19.70, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 83, 'Transfer between locations', '2025-10-28 13:01:21', NULL, '2025-10-28 13:01:21', '2025-10-28 13:01:21'),
(62, 16, 'in', 1, 3, 'usage', 94.90, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 30, 'Damaged goods disposal', '2025-10-28 23:02:21', NULL, '2025-10-28 23:02:21', '2025-10-28 23:02:21'),
(63, 33, 'in', 1, 3, 'usage', 46.20, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 82, 'Transfer between locations', '2025-10-29 10:03:21', NULL, '2025-10-29 10:03:21', '2025-10-29 10:03:21'),
(64, 12, 'in', 1, 4, 'adjustment', 0.50, NULL, NULL, NULL, NULL, 'kg', 'order', 79, NULL, '2025-10-29 15:02:21', NULL, '2025-10-29 15:02:21', '2025-10-29 15:02:21'),
(65, 12, 'in', 1, 4, 'waste', 51.90, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 79, NULL, '2025-10-29 12:00:21', NULL, '2025-10-29 12:00:21', '2025-10-29 12:00:21'),
(66, 30, 'in', 1, 3, 'usage', 11.30, NULL, NULL, NULL, NULL, 'kg', 'order', 25, NULL, '2025-10-29 04:02:21', NULL, '2025-10-29 04:02:21', '2025-10-29 04:02:21'),
(67, 1, 'in', 1, 3, 'usage', 11.30, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 59, 'Emergency order', '2025-10-29 15:03:21', NULL, '2025-10-29 15:03:21', '2025-10-29 15:03:21'),
(68, 28, 'in', 1, 3, 'waste', 69.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 68, NULL, '2025-10-29 11:01:21', NULL, '2025-10-29 11:01:21', '2025-10-29 11:01:21'),
(69, 25, 'in', 1, 4, 'waste', 73.80, NULL, NULL, NULL, NULL, 'l', 'order', 69, NULL, '2025-10-29 06:00:21', NULL, '2025-10-29 06:00:21', '2025-10-29 06:00:21'),
(70, 40, 'in', 1, 4, 'adjustment', 9.60, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 38, NULL, '2025-10-29 12:03:21', NULL, '2025-10-29 12:03:21', '2025-10-29 12:03:21'),
(71, 28, 'in', 1, 4, 'usage', 25.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 43, 'Stock correction after count', '2025-10-30 08:01:21', NULL, '2025-10-30 08:01:21', '2025-10-30 08:01:21'),
(72, 36, 'in', 1, 3, 'adjustment', 33.70, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 9, NULL, '2025-10-30 14:00:21', NULL, '2025-10-30 14:00:21', '2025-10-30 14:00:21'),
(73, 9, 'in', 1, 3, 'adjustment', 57.60, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 88, NULL, '2025-10-30 10:00:21', NULL, '2025-10-30 10:00:21', '2025-10-30 10:00:21'),
(74, 3, 'in', 1, 4, 'transfer', 87.40, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 6, NULL, '2025-10-30 06:03:21', NULL, '2025-10-30 06:03:21', '2025-10-30 06:03:21'),
(75, 41, 'in', 1, 4, 'waste', 77.00, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 67, 'Damaged goods disposal', '2025-10-30 05:01:21', NULL, '2025-10-30 05:01:21', '2025-10-30 05:01:21'),
(76, 18, 'in', 1, 4, 'waste', 47.50, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 48, NULL, '2025-10-30 12:01:21', NULL, '2025-10-30 12:01:21', '2025-10-30 12:01:21'),
(77, 9, 'in', 1, 4, 'transfer', 83.30, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 39, 'Transfer between locations', '2025-10-30 12:02:21', NULL, '2025-10-30 12:02:21', '2025-10-30 12:02:21'),
(78, 27, 'in', 1, 4, 'waste', 68.40, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 94, NULL, '2025-10-31 02:01:21', NULL, '2025-10-31 02:01:21', '2025-10-31 02:01:21'),
(79, 1, 'in', 1, 3, 'transfer', 55.70, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 73, 'Regular stock replenishment', '2025-10-31 10:03:21', NULL, '2025-10-31 10:03:21', '2025-10-31 10:03:21'),
(80, 25, 'in', 1, 3, 'transfer', 92.90, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 49, NULL, '2025-10-31 04:01:21', NULL, '2025-10-31 04:01:21', '2025-10-31 04:01:21'),
(81, 34, 'in', 1, 4, 'transfer', 64.10, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 96, NULL, '2025-10-31 14:03:21', NULL, '2025-10-31 14:03:21', '2025-10-31 14:03:21'),
(82, 24, 'in', 1, 3, 'waste', 87.30, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 5, 'Transfer between locations', '2025-10-31 12:01:21', NULL, '2025-10-31 12:01:21', '2025-10-31 12:01:21'),
(83, 39, 'in', 1, 3, 'purchase', 67.30, NULL, NULL, NULL, NULL, 'unit', 'waste_record', 85, NULL, '2025-10-31 08:01:21', NULL, '2025-10-31 08:01:21', '2025-10-31 08:01:21'),
(84, 39, 'in', 1, 4, 'adjustment', 12.40, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 36, NULL, '2025-11-01 13:01:21', NULL, '2025-11-01 13:01:21', '2025-11-01 13:01:21'),
(85, 30, 'in', 1, 3, 'adjustment', 71.30, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 74, 'Transfer between locations', '2025-11-01 03:02:21', NULL, '2025-11-01 03:02:21', '2025-11-01 03:02:21'),
(86, 34, 'in', 1, 3, 'waste', 32.90, NULL, NULL, NULL, NULL, 'unit', 'waste_record', 97, NULL, '2025-11-01 06:00:21', NULL, '2025-11-01 06:00:21', '2025-11-01 06:00:21'),
(87, 26, 'in', 1, 3, 'adjustment', 83.30, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 44, 'Regular stock replenishment', '2025-11-01 12:01:21', NULL, '2025-11-01 12:01:21', '2025-11-01 12:01:21'),
(88, 14, 'in', 1, 4, 'transfer', 1.20, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 79, 'Emergency order', '2025-11-01 15:00:21', NULL, '2025-11-01 15:00:21', '2025-11-01 15:00:21'),
(89, 42, 'in', 1, 3, 'adjustment', 33.30, NULL, NULL, NULL, NULL, 'kg', 'order', 44, 'Transfer between locations', '2025-11-02 05:01:21', NULL, '2025-11-02 05:01:21', '2025-11-02 05:01:21'),
(90, 40, 'in', 1, 3, 'usage', 96.70, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 97, 'Transfer between locations', '2025-11-02 01:03:21', NULL, '2025-11-02 01:03:21', '2025-11-02 01:03:21'),
(91, 29, 'in', 1, 4, 'usage', 9.70, NULL, NULL, NULL, NULL, 'kg', 'order', 3, 'Regular stock replenishment', '2025-11-02 07:01:21', NULL, '2025-11-02 07:01:21', '2025-11-02 07:01:21'),
(92, 29, 'in', 1, 4, 'adjustment', 71.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 71, NULL, '2025-11-02 10:01:21', NULL, '2025-11-02 10:01:21', '2025-11-02 10:01:21'),
(93, 33, 'in', 1, 4, 'usage', 64.90, NULL, NULL, NULL, NULL, 'kg', 'order', 82, 'Stock correction after count', '2025-11-02 08:01:21', NULL, '2025-11-02 08:01:21', '2025-11-02 08:01:21'),
(94, 28, 'in', 1, 3, 'purchase', 3.00, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 83, 'Stock correction after count', '2025-11-03 00:02:21', NULL, '2025-11-03 00:02:21', '2025-11-03 00:02:21'),
(95, 37, 'in', 1, 3, 'waste', 83.00, NULL, NULL, NULL, NULL, 'kg', 'order', 9, 'Regular stock replenishment', '2025-11-03 05:03:21', NULL, '2025-11-03 05:03:21', '2025-11-03 05:03:21'),
(96, 15, 'in', 1, 4, 'usage', 43.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 49, NULL, '2025-11-03 14:01:21', NULL, '2025-11-03 14:01:21', '2025-11-03 14:01:21'),
(97, 39, 'in', 1, 3, 'transfer', 33.40, NULL, NULL, NULL, NULL, 'unit', 'purchase_order', 78, 'Stock correction after count', '2025-11-03 12:01:21', NULL, '2025-11-03 12:01:21', '2025-11-03 12:01:21'),
(98, 37, 'in', 1, 3, 'usage', 92.60, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 75, 'Damaged goods disposal', '2025-11-03 06:01:21', NULL, '2025-11-03 06:01:21', '2025-11-03 06:01:21'),
(99, 23, 'in', 1, 4, 'adjustment', 56.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 8, NULL, '2025-11-04 07:00:21', NULL, '2025-11-04 07:00:21', '2025-11-04 07:00:21'),
(100, 39, 'in', 1, 3, 'transfer', 64.10, NULL, NULL, NULL, NULL, 'unit', 'purchase_order', 4, NULL, '2025-11-04 11:03:21', NULL, '2025-11-04 11:03:21', '2025-11-04 11:03:21'),
(101, 34, 'in', 1, 4, 'adjustment', 44.20, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 67, 'Stock correction after count', '2025-11-04 08:02:21', NULL, '2025-11-04 08:02:21', '2025-11-04 08:02:21'),
(102, 33, 'in', 1, 4, 'adjustment', 77.70, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 35, 'Damaged goods disposal', '2025-11-04 14:00:21', NULL, '2025-11-04 14:00:21', '2025-11-04 14:00:21'),
(103, 36, 'in', 1, 4, 'transfer', 97.40, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 41, 'Transfer between locations', '2025-11-04 15:03:21', NULL, '2025-11-04 15:03:21', '2025-11-04 15:03:21'),
(104, 17, 'in', 1, 3, 'purchase', 79.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 13, 'Stock correction after count', '2025-11-04 10:01:21', NULL, '2025-11-04 10:01:21', '2025-11-04 10:01:21'),
(105, 19, 'in', 1, 4, 'waste', 24.50, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 94, 'Damaged goods disposal', '2025-11-05 10:03:21', NULL, '2025-11-05 10:03:21', '2025-11-05 10:03:21'),
(106, 11, 'in', 1, 4, 'transfer', 26.00, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 6, 'Regular stock replenishment', '2025-11-05 14:03:21', NULL, '2025-11-05 14:03:21', '2025-11-05 14:03:21'),
(107, 4, 'in', 1, 3, 'adjustment', 8.90, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 81, 'Stock correction after count', '2025-11-05 14:01:21', NULL, '2025-11-05 14:01:21', '2025-11-05 14:01:21'),
(108, 17, 'in', 1, 4, 'waste', 15.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 21, 'Transfer between locations', '2025-11-05 13:01:21', NULL, '2025-11-05 13:01:21', '2025-11-05 13:01:21'),
(109, 40, 'in', 1, 3, 'purchase', 5.20, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 41, 'Damaged goods disposal', '2025-11-05 05:02:21', NULL, '2025-11-05 05:02:21', '2025-11-05 05:02:21'),
(110, 31, 'in', 1, 4, 'waste', 14.40, NULL, NULL, NULL, NULL, 'kg', 'order', 74, 'Regular stock replenishment', '2025-11-05 10:01:21', NULL, '2025-11-05 10:01:21', '2025-11-05 10:01:21'),
(111, 34, 'in', 1, 3, 'adjustment', 36.60, NULL, NULL, NULL, NULL, 'unit', 'order', 78, 'Stock correction after count', '2025-11-05 09:02:21', NULL, '2025-11-05 09:02:21', '2025-11-05 09:02:21'),
(112, 1, 'in', 1, 3, 'usage', 34.30, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 66, 'Damaged goods disposal', '2025-11-06 08:02:21', NULL, '2025-11-06 08:02:21', '2025-11-06 08:02:21'),
(113, 40, 'in', 1, 4, 'waste', 75.80, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 64, 'Regular stock replenishment', '2025-11-06 12:00:21', NULL, '2025-11-06 12:00:21', '2025-11-06 12:00:21'),
(114, 34, 'in', 1, 3, 'waste', 42.10, NULL, NULL, NULL, NULL, 'unit', 'inventory_count', 13, 'Regular stock replenishment', '2025-11-06 07:01:21', NULL, '2025-11-06 07:01:21', '2025-11-06 07:01:21'),
(115, 41, 'in', 1, 3, 'adjustment', 9.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 23, 'Transfer between locations', '2025-11-06 15:03:21', NULL, '2025-11-06 15:03:21', '2025-11-06 15:03:21'),
(116, 32, 'in', 1, 3, 'transfer', 34.10, NULL, NULL, NULL, NULL, 'kg', 'order', 100, NULL, '2025-11-06 10:00:21', NULL, '2025-11-06 10:00:21', '2025-11-06 10:00:21'),
(117, 31, 'in', 1, 4, 'usage', 53.90, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 38, 'Transfer between locations', '2025-11-06 05:01:21', NULL, '2025-11-06 05:01:21', '2025-11-06 05:01:21'),
(118, 15, 'in', 1, 4, 'waste', 26.20, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 80, 'Regular stock replenishment', '2025-11-06 13:01:21', NULL, '2025-11-06 13:01:21', '2025-11-06 13:01:21'),
(119, 37, 'in', 1, 4, 'transfer', 45.00, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 62, NULL, '2025-11-07 00:02:21', NULL, '2025-11-07 00:02:21', '2025-11-07 00:02:21'),
(120, 2, 'in', 1, 4, 'waste', 77.00, NULL, NULL, NULL, NULL, 'kg', 'order', 52, 'Emergency order', '2025-11-07 05:00:21', NULL, '2025-11-07 05:00:21', '2025-11-07 05:00:21'),
(121, 37, 'in', 1, 3, 'usage', 80.70, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 100, NULL, '2025-11-07 10:03:21', NULL, '2025-11-07 10:03:21', '2025-11-07 10:03:21'),
(122, 7, 'in', 1, 4, 'waste', 30.30, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 90, 'Stock correction after count', '2025-11-07 09:03:21', NULL, '2025-11-07 09:03:21', '2025-11-07 09:03:21'),
(123, 31, 'in', 1, 3, 'transfer', 66.60, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 66, NULL, '2025-11-07 03:01:21', NULL, '2025-11-07 03:01:21', '2025-11-07 03:01:21'),
(124, 21, 'in', 1, 4, 'purchase', 4.40, NULL, NULL, NULL, NULL, 'kg', 'order', 73, NULL, '2025-11-07 07:00:21', NULL, '2025-11-07 07:00:21', '2025-11-07 07:00:21'),
(125, 4, 'in', 1, 3, 'adjustment', 47.90, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 50, NULL, '2025-11-08 02:03:21', NULL, '2025-11-08 02:03:21', '2025-11-08 02:03:21'),
(126, 4, 'in', 1, 3, 'usage', 59.40, NULL, NULL, NULL, NULL, 'kg', 'order', 7, NULL, '2025-11-08 04:00:21', NULL, '2025-11-08 04:00:21', '2025-11-08 04:00:21'),
(127, 19, 'in', 1, 3, 'waste', 57.10, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 9, 'Transfer between locations', '2025-11-08 10:02:21', NULL, '2025-11-08 10:02:21', '2025-11-08 10:02:21'),
(128, 25, 'in', 1, 3, 'transfer', 63.60, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 4, 'Regular stock replenishment', '2025-11-08 06:02:21', NULL, '2025-11-08 06:02:21', '2025-11-08 06:02:21'),
(129, 30, 'in', 1, 3, 'waste', 63.80, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 52, 'Stock correction after count', '2025-11-08 13:01:21', NULL, '2025-11-08 13:01:21', '2025-11-08 13:01:21'),
(130, 8, 'in', 1, 3, 'usage', 17.20, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 76, 'Regular stock replenishment', '2025-11-08 01:01:21', NULL, '2025-11-08 01:01:21', '2025-11-08 01:01:21'),
(131, 17, 'in', 1, 4, 'purchase', 74.60, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 11, 'Transfer between locations', '2025-11-09 13:00:21', NULL, '2025-11-09 13:00:21', '2025-11-09 13:00:21'),
(132, 29, 'in', 1, 3, 'adjustment', 92.80, NULL, NULL, NULL, NULL, 'kg', 'order', 21, 'Transfer between locations', '2025-11-09 15:03:21', NULL, '2025-11-09 15:03:21', '2025-11-09 15:03:21'),
(133, 40, 'in', 1, 3, 'waste', 46.00, NULL, NULL, NULL, NULL, 'l', 'inventory_count', 56, NULL, '2025-11-09 01:02:21', NULL, '2025-11-09 01:02:21', '2025-11-09 01:02:21'),
(134, 28, 'in', 1, 3, 'adjustment', 74.10, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 20, 'Stock correction after count', '2025-11-09 06:00:21', NULL, '2025-11-09 06:00:21', '2025-11-09 06:00:21'),
(135, 39, 'in', 1, 4, 'transfer', 68.90, NULL, NULL, NULL, NULL, 'unit', 'purchase_order', 49, 'Regular stock replenishment', '2025-11-09 00:01:21', NULL, '2025-11-09 00:01:21', '2025-11-09 00:01:21'),
(136, 6, 'in', 1, 3, 'purchase', 64.10, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 5, 'Damaged goods disposal', '2025-11-09 13:02:21', NULL, '2025-11-09 13:02:21', '2025-11-09 13:02:21'),
(137, 30, 'in', 1, 4, 'purchase', 57.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 81, NULL, '2025-11-09 07:03:21', NULL, '2025-11-09 07:03:21', '2025-11-09 07:03:21'),
(138, 11, 'in', 1, 3, 'waste', 67.30, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 73, 'Stock correction after count', '2025-11-09 12:01:21', NULL, '2025-11-09 12:01:21', '2025-11-09 12:01:21'),
(139, 1, 'in', 1, 4, 'purchase', 79.00, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 16, 'Emergency order', '2025-11-08 23:01:21', NULL, '2025-11-08 23:01:21', '2025-11-08 23:01:21'),
(140, 20, 'in', 1, 3, 'purchase', 39.30, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 22, NULL, '2025-11-09 02:02:21', NULL, '2025-11-09 02:02:21', '2025-11-09 02:02:21'),
(141, 16, 'in', 1, 3, 'adjustment', 25.20, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 72, 'Emergency order', '2025-11-10 02:01:21', NULL, '2025-11-10 02:01:21', '2025-11-10 02:01:21'),
(142, 5, 'in', 1, 4, 'usage', 78.40, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 62, 'Damaged goods disposal', '2025-11-10 07:03:21', NULL, '2025-11-10 07:03:21', '2025-11-10 07:03:21'),
(143, 34, 'in', 1, 4, 'waste', 27.30, NULL, NULL, NULL, NULL, 'unit', 'inventory_count', 63, 'Regular stock replenishment', '2025-11-10 01:01:21', NULL, '2025-11-10 01:01:21', '2025-11-10 01:01:21'),
(144, 14, 'in', 1, 4, 'adjustment', 40.50, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 98, 'Emergency order', '2025-11-10 06:03:21', NULL, '2025-11-10 06:03:21', '2025-11-10 06:03:21'),
(145, 11, 'in', 1, 4, 'waste', 91.10, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 46, NULL, '2025-11-10 02:00:21', NULL, '2025-11-10 02:00:21', '2025-11-10 02:00:21'),
(146, 17, 'in', 1, 3, 'waste', 5.30, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 100, 'Transfer between locations', '2025-11-11 02:01:21', NULL, '2025-11-11 02:01:21', '2025-11-11 02:01:21'),
(147, 3, 'in', 1, 4, 'usage', 10.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 38, NULL, '2025-11-11 08:00:21', NULL, '2025-11-11 08:00:21', '2025-11-11 08:00:21'),
(148, 4, 'in', 1, 4, 'usage', 14.40, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 24, 'Regular stock replenishment', '2025-11-10 23:00:21', NULL, '2025-11-10 23:00:21', '2025-11-10 23:00:21'),
(149, 2, 'in', 1, 4, 'purchase', 34.90, NULL, NULL, NULL, NULL, 'kg', 'order', 15, 'Stock correction after count', '2025-11-10 23:02:21', NULL, '2025-11-10 23:02:21', '2025-11-10 23:02:21'),
(150, 18, 'in', 1, 4, 'adjustment', 59.30, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 7, 'Emergency order', '2025-11-11 08:01:21', NULL, '2025-11-11 08:01:21', '2025-11-11 08:01:21'),
(151, 18, 'in', 1, 4, 'usage', 82.30, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 6, 'Regular stock replenishment', '2025-11-11 14:02:21', NULL, '2025-11-11 14:02:21', '2025-11-11 14:02:21'),
(152, 28, 'in', 1, 4, 'waste', 23.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 28, 'Stock correction after count', '2025-11-11 12:00:21', NULL, '2025-11-11 12:00:21', '2025-11-11 12:00:21'),
(153, 28, 'in', 1, 4, 'usage', 15.10, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 43, 'Damaged goods disposal', '2025-11-11 10:02:21', NULL, '2025-11-11 10:02:21', '2025-11-11 10:02:21'),
(154, 24, 'in', 1, 4, 'usage', 20.00, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 55, NULL, '2025-11-11 04:02:21', NULL, '2025-11-11 04:02:21', '2025-11-11 04:02:21'),
(155, 10, 'in', 1, 3, 'purchase', 82.60, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 76, 'Stock correction after count', '2025-11-11 07:00:21', NULL, '2025-11-11 07:00:21', '2025-11-11 07:00:21'),
(156, 3, 'in', 1, 3, 'adjustment', 97.60, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 100, NULL, '2025-11-11 23:03:21', NULL, '2025-11-11 23:03:21', '2025-11-11 23:03:21'),
(157, 21, 'in', 1, 4, 'usage', 60.50, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 48, 'Transfer between locations', '2025-11-12 04:01:21', NULL, '2025-11-12 04:01:21', '2025-11-12 04:01:21'),
(158, 2, 'in', 1, 4, 'purchase', 34.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 35, NULL, '2025-11-12 07:01:21', NULL, '2025-11-12 07:01:21', '2025-11-12 07:01:21'),
(159, 42, 'in', 1, 4, 'transfer', 2.80, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 100, 'Regular stock replenishment', '2025-11-11 23:01:21', NULL, '2025-11-11 23:01:21', '2025-11-11 23:01:21'),
(160, 27, 'in', 1, 3, 'waste', 9.00, NULL, NULL, NULL, NULL, 'l', 'order', 100, 'Stock correction after count', '2025-11-12 10:00:21', NULL, '2025-11-12 10:00:21', '2025-11-12 10:00:21'),
(161, 28, 'in', 1, 3, 'transfer', 91.40, NULL, NULL, NULL, NULL, 'kg', 'order', 29, NULL, '2025-11-13 13:03:21', NULL, '2025-11-13 13:03:21', '2025-11-13 13:03:21'),
(162, 21, 'in', 1, 4, 'usage', 11.20, NULL, NULL, NULL, NULL, 'kg', 'order', 18, 'Regular stock replenishment', '2025-11-13 08:03:21', NULL, '2025-11-13 08:03:21', '2025-11-13 08:03:21'),
(163, 21, 'in', 1, 3, 'waste', 70.30, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 84, 'Regular stock replenishment', '2025-11-13 07:02:21', NULL, '2025-11-13 07:02:21', '2025-11-13 07:02:21'),
(164, 41, 'in', 1, 3, 'adjustment', 56.50, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 95, NULL, '2025-11-13 01:03:21', NULL, '2025-11-13 01:03:21', '2025-11-13 01:03:21'),
(165, 16, 'in', 1, 4, 'usage', 96.00, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 12, NULL, '2025-11-13 11:02:21', NULL, '2025-11-13 11:02:21', '2025-11-13 11:02:21'),
(166, 32, 'in', 1, 3, 'transfer', 51.90, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 56, NULL, '2025-11-13 11:03:21', NULL, '2025-11-13 11:03:21', '2025-11-13 11:03:21'),
(167, 25, 'in', 1, 4, 'adjustment', 17.90, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 96, 'Damaged goods disposal', '2025-11-14 05:01:21', NULL, '2025-11-14 05:01:21', '2025-11-14 05:01:21'),
(168, 26, 'in', 1, 3, 'purchase', 98.40, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 98, NULL, '2025-11-14 04:03:21', NULL, '2025-11-14 04:03:21', '2025-11-14 04:03:21'),
(169, 21, 'in', 1, 3, 'purchase', 67.40, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 25, 'Emergency order', '2025-11-14 02:03:21', NULL, '2025-11-14 02:03:21', '2025-11-14 02:03:21'),
(170, 32, 'in', 1, 4, 'usage', 87.60, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 31, NULL, '2025-11-14 10:00:21', NULL, '2025-11-14 10:00:21', '2025-11-14 10:00:21'),
(171, 22, 'in', 1, 3, 'usage', 19.10, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 47, 'Emergency order', '2025-11-14 13:03:21', NULL, '2025-11-14 13:03:21', '2025-11-14 13:03:21'),
(172, 25, 'in', 1, 3, 'waste', 41.10, NULL, NULL, NULL, NULL, 'l', 'waste_record', 59, 'Emergency order', '2025-11-13 23:01:21', NULL, '2025-11-13 23:01:21', '2025-11-13 23:01:21'),
(173, 20, 'in', 1, 4, 'adjustment', 84.20, NULL, NULL, NULL, NULL, 'kg', 'order', 18, NULL, '2025-11-13 23:00:21', NULL, '2025-11-13 23:00:21', '2025-11-13 23:00:21'),
(174, 36, 'in', 1, 4, 'adjustment', 27.90, NULL, NULL, NULL, NULL, 'l', 'waste_record', 70, 'Damaged goods disposal', '2025-11-15 11:02:21', NULL, '2025-11-15 11:02:21', '2025-11-15 11:02:21'),
(175, 3, 'in', 1, 4, 'purchase', 3.90, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 6, NULL, '2025-11-15 11:02:21', NULL, '2025-11-15 11:02:21', '2025-11-15 11:02:21'),
(176, 30, 'in', 1, 4, 'purchase', 15.40, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 81, 'Stock correction after count', '2025-11-15 01:03:21', NULL, '2025-11-15 01:03:21', '2025-11-15 01:03:21'),
(177, 41, 'in', 1, 4, 'waste', 37.70, NULL, NULL, NULL, NULL, 'kg', 'order', 92, 'Emergency order', '2025-11-15 03:02:21', NULL, '2025-11-15 03:02:21', '2025-11-15 03:02:21'),
(178, 19, 'in', 1, 3, 'usage', 49.30, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 8, 'Damaged goods disposal', '2025-11-15 11:00:21', NULL, '2025-11-15 11:00:21', '2025-11-15 11:00:21'),
(179, 6, 'in', 1, 4, 'transfer', 9.80, NULL, NULL, NULL, NULL, 'kg', 'order', 98, 'Transfer between locations', '2025-11-15 03:00:21', NULL, '2025-11-15 03:00:21', '2025-11-15 03:00:21'),
(180, 13, 'in', 1, 4, 'adjustment', 75.50, NULL, NULL, NULL, NULL, 'unit', 'inventory_count', 21, NULL, '2025-11-16 11:00:21', NULL, '2025-11-16 11:00:21', '2025-11-16 11:00:21'),
(181, 39, 'in', 1, 4, 'waste', 90.70, NULL, NULL, NULL, NULL, 'unit', 'order', 79, 'Transfer between locations', '2025-11-16 08:01:21', NULL, '2025-11-16 08:01:21', '2025-11-16 08:01:21'),
(182, 12, 'in', 1, 3, 'transfer', 73.80, NULL, NULL, NULL, NULL, 'kg', 'order', 22, 'Damaged goods disposal', '2025-11-16 10:03:21', NULL, '2025-11-16 10:03:21', '2025-11-16 10:03:21'),
(183, 40, 'in', 1, 3, 'transfer', 97.30, NULL, NULL, NULL, NULL, 'l', 'purchase_order', 24, 'Damaged goods disposal', '2025-11-16 15:02:21', NULL, '2025-11-16 15:02:21', '2025-11-16 15:02:21'),
(184, 27, 'in', 1, 4, 'adjustment', 3.70, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 12, NULL, '2025-11-16 11:02:21', NULL, '2025-11-16 11:02:21', '2025-11-16 11:02:21'),
(185, 35, 'in', 1, 4, 'transfer', 15.00, NULL, NULL, NULL, NULL, 'l', 'waste_record', 10, NULL, '2025-11-15 23:00:21', NULL, '2025-11-15 23:00:21', '2025-11-15 23:00:21'),
(186, 12, 'in', 1, 3, 'transfer', 19.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 25, NULL, '2025-11-16 14:01:21', NULL, '2025-11-16 14:01:21', '2025-11-16 14:01:21'),
(187, 4, 'in', 1, 3, 'waste', 3.70, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 95, NULL, '2025-11-16 06:01:21', NULL, '2025-11-16 06:01:21', '2025-11-16 06:01:21'),
(188, 42, 'in', 1, 3, 'waste', 87.00, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 81, NULL, '2025-11-16 03:01:21', NULL, '2025-11-16 03:01:21', '2025-11-16 03:01:21'),
(189, 39, 'in', 1, 3, 'adjustment', 45.80, NULL, NULL, NULL, NULL, 'unit', 'order', 30, 'Regular stock replenishment', '2025-11-17 07:03:21', NULL, '2025-11-17 07:03:21', '2025-11-17 07:03:21'),
(190, 27, 'in', 1, 4, 'usage', 7.70, NULL, NULL, NULL, NULL, 'l', 'order', 27, 'Emergency order', '2025-11-17 14:00:21', NULL, '2025-11-17 14:00:21', '2025-11-17 14:00:21'),
(191, 19, 'in', 1, 4, 'transfer', 22.30, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 38, 'Damaged goods disposal', '2025-11-17 04:03:21', NULL, '2025-11-17 04:03:21', '2025-11-17 04:03:21'),
(192, 39, 'in', 1, 3, 'waste', 16.30, NULL, NULL, NULL, NULL, 'unit', 'purchase_order', 43, NULL, '2025-11-17 14:01:21', NULL, '2025-11-17 14:01:21', '2025-11-17 14:01:21'),
(193, 25, 'in', 1, 4, 'usage', 82.00, NULL, NULL, NULL, NULL, 'l', 'waste_record', 7, NULL, '2025-11-17 01:02:21', NULL, '2025-11-17 01:02:21', '2025-11-17 01:02:21'),
(194, 21, 'in', 1, 3, 'waste', 8.10, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 6, NULL, '2025-11-18 10:01:21', NULL, '2025-11-18 10:01:21', '2025-11-18 10:01:21'),
(195, 39, 'in', 1, 4, 'adjustment', 33.10, NULL, NULL, NULL, NULL, 'unit', 'purchase_order', 26, NULL, '2025-11-18 03:03:21', NULL, '2025-11-18 03:03:21', '2025-11-18 03:03:21'),
(196, 1, 'in', 1, 4, 'adjustment', 4.50, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 22, NULL, '2025-11-18 03:03:21', NULL, '2025-11-18 03:03:21', '2025-11-18 03:03:21'),
(197, 20, 'in', 1, 3, 'purchase', 50.40, NULL, NULL, NULL, NULL, 'kg', 'order', 64, NULL, '2025-11-18 15:03:21', NULL, '2025-11-18 15:03:21', '2025-11-18 15:03:21'),
(198, 27, 'in', 1, 4, 'waste', 25.60, NULL, NULL, NULL, NULL, 'l', 'waste_record', 94, NULL, '2025-11-18 01:00:21', NULL, '2025-11-18 01:00:21', '2025-11-18 01:00:21'),
(199, 12, 'in', 1, 3, 'waste', 51.60, NULL, NULL, NULL, NULL, 'kg', 'inventory_count', 54, 'Transfer between locations', '2025-11-18 02:01:21', NULL, '2025-11-18 02:01:21', '2025-11-18 02:01:21'),
(200, 32, 'in', 1, 4, 'waste', 92.20, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 95, 'Emergency order', '2025-11-18 14:01:21', NULL, '2025-11-18 14:01:21', '2025-11-18 14:01:21'),
(201, 13, 'in', 1, 4, 'waste', 71.80, NULL, NULL, NULL, NULL, 'unit', 'stock_transfer', 41, 'Stock correction after count', '2025-11-19 13:02:21', NULL, '2025-11-19 13:02:21', '2025-11-19 13:02:21'),
(202, 38, 'in', 1, 4, 'adjustment', 88.80, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 46, NULL, '2025-11-19 14:00:21', NULL, '2025-11-19 14:00:21', '2025-11-19 14:00:21'),
(203, 32, 'in', 1, 3, 'waste', 67.40, NULL, NULL, NULL, NULL, 'kg', 'waste_record', 64, 'Emergency order', '2025-11-19 03:00:21', NULL, '2025-11-19 03:00:21', '2025-11-19 03:00:21'),
(204, 1, 'in', 1, 4, 'adjustment', 39.70, NULL, NULL, NULL, NULL, 'kg', 'purchase_order', 70, 'Emergency order', '2025-11-19 09:00:21', NULL, '2025-11-19 09:00:21', '2025-11-19 09:00:21'),
(205, 40, 'in', 1, 3, 'adjustment', 63.10, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 56, 'Transfer between locations', '2025-11-19 11:03:21', NULL, '2025-11-19 11:03:21', '2025-11-19 11:03:21'),
(206, 40, 'in', 1, 4, 'purchase', 64.20, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 27, 'Damaged goods disposal', '2025-11-19 05:00:21', NULL, '2025-11-19 05:00:21', '2025-11-19 05:00:21'),
(207, 27, 'in', 1, 4, 'usage', 71.70, NULL, NULL, NULL, NULL, 'l', 'stock_transfer', 100, NULL, '2025-11-19 08:02:21', NULL, '2025-11-19 08:02:21', '2025-11-19 08:02:21'),
(208, 32, 'in', 1, 4, 'waste', 9.50, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 35, NULL, '2025-11-19 03:03:21', NULL, '2025-11-19 03:03:21', '2025-11-19 03:03:21'),
(209, 41, 'in', 1, 3, 'waste', 14.50, NULL, NULL, NULL, NULL, 'kg', 'stock_transfer', 48, NULL, '2025-11-18 23:01:21', NULL, '2025-11-18 23:01:21', '2025-11-18 23:01:21');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `invoice_number` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `amount_due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('draft','issued','paid','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `issued_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `order_id`, `location_id`, `invoice_number`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `service_charge`, `amount_paid`, `amount_due`, `status`, `currency`, `issued_at`, `due_at`, `paid_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'INV-NKH-DT-20251108-3772', 39.50, 3.95, 0.00, 43.45, 0.00, 0.00, 43.45, 'cancelled', 'USD', '2025-11-07 20:08:27', '2025-11-29 20:08:27', NULL, 'Early payment discount available', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(2, 3, 1, 'INV-NKH-DT-20251005-7222', 25.50, 2.55, 0.00, 28.05, 0.00, 28.05, 28.05, 'paid', 'USD', '2025-10-05 03:13:14', '2025-10-22 03:13:14', NULL, 'Loyalty points earned: 50', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(3, 4, 1, 'INV-NKH-DT-20251113-6279', 69.00, 6.90, 0.00, 75.90, 0.00, 75.90, 0.00, 'draft', 'USD', '2025-11-12 23:18:16', '2025-12-10 23:18:16', '2025-11-12 23:31:16', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(4, 10, 1, 'INV-NKH-DT-20250820-5551', 114.50, 11.45, 0.00, 125.95, 0.00, 0.00, 125.95, 'issued', 'USD', '2025-08-20 13:25:02', '2025-09-12 13:25:02', NULL, 'Early payment discount available', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(5, 11, 1, 'INV-NKH-DT-20251020-6372', 32.00, 3.20, 0.00, 35.20, 0.00, 35.20, 0.00, 'issued', 'USD', '2025-10-19 18:46:53', '2025-11-02 18:46:53', '2025-10-19 19:20:53', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(6, 12, 1, 'INV-NKH-DT-20251024-7450', 120.50, 12.05, 0.00, 132.55, 0.00, 132.55, 0.00, 'paid', 'USD', '2025-10-24 16:07:22', '2025-11-22 16:07:22', '2025-10-24 16:25:22', 'Group booking discount applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(7, 13, 1, 'INV-NKH-DT-20251109-4484', 18.50, 1.85, 0.00, 20.35, 0.00, 20.35, 20.35, 'paid', 'USD', '2025-11-09 02:32:40', '2025-11-30 02:32:40', NULL, 'Thank you for dining with us!', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(8, 14, 1, 'INV-NKH-DT-20250911-7964', 63.50, 6.35, 0.00, 69.85, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-09-11 04:40:54', '2025-09-13 04:40:54', NULL, 'Special event surcharge applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(9, 19, 1, 'INV-NKH-DT-20251010-3080', 32.00, 3.20, 5.93, 29.27, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-09 17:10:22', '2025-10-27 17:10:22', NULL, 'Corporate account - NET 30', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(10, 22, 1, 'INV-NKH-DT-20251009-9000', 55.00, 5.50, 0.00, 60.50, 0.00, 60.50, 0.00, 'paid', 'USD', '2025-10-08 21:43:36', '2025-10-17 21:43:36', '2025-10-08 22:12:36', 'Early payment discount available', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(11, 29, 1, 'INV-NKH-DT-20250905-5888', 27.00, 2.70, 0.00, 29.70, 0.00, 29.70, 0.00, 'issued', 'USD', '2025-09-04 21:08:50', '2025-09-22 21:08:50', '2025-09-04 21:40:50', 'Early payment discount available', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(12, 36, 1, 'INV-NKH-DT-20251004-1293', 115.00, 11.50, 5.07, 121.43, 0.00, 121.43, 121.43, 'paid', 'USD', '2025-10-04 12:49:03', '2025-10-20 12:49:03', NULL, 'Special event surcharge applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(13, 38, 1, 'INV-NKH-DT-20250911-7659', 20.00, 2.00, 0.00, 22.00, 0.00, 22.00, 22.00, 'paid', 'USD', '2025-09-11 12:14:42', '2025-09-21 12:14:42', '2025-09-11 12:29:42', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(14, 40, 1, 'INV-NKH-DT-20250829-7460', 46.50, 4.65, 6.21, 44.94, 0.00, 44.94, 0.00, 'issued', 'USD', '2025-08-29 05:17:30', '2025-09-08 05:17:30', '2025-08-29 06:02:30', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(15, 42, 1, 'INV-NKH-DT-20250903-2560', 188.00, 18.80, 0.00, 206.80, 0.00, 206.80, 0.00, 'cancelled', 'USD', '2025-09-03 03:37:07', '2025-09-30 03:37:07', '2025-09-03 04:28:07', 'Group booking discount applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(16, 43, 1, 'INV-NKH-DT-20251017-9206', 73.50, 7.35, 0.00, 80.85, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-17 11:18:03', '2025-11-05 11:18:03', '2025-10-17 11:28:03', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(17, 44, 1, 'INV-NKH-DT-20250914-5822', 90.50, 9.05, 2.98, 96.57, 0.00, 96.57, 0.00, 'issued', 'USD', '2025-09-14 09:14:44', '2025-09-22 09:14:44', '2025-09-14 09:44:44', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(18, 45, 1, 'INV-NKH-DT-20250922-7014', 24.00, 2.40, 0.00, 26.40, 0.00, 26.40, 0.00, 'paid', 'USD', '2025-09-22 17:04:13', '2025-09-27 17:04:13', NULL, 'Corporate account - NET 30', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(19, 50, 1, 'INV-NKH-DT-20251027-9783', 63.50, 6.35, 0.00, 69.85, 0.00, 69.85, 69.85, 'issued', 'USD', '2025-10-27 07:45:11', '2025-11-17 07:45:11', NULL, 'Corporate account - NET 30', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(20, 51, 1, 'INV-NKH-DT-20250917-4784', 92.50, 9.25, 0.00, 101.75, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-09-16 21:56:12', '2025-09-21 21:56:12', NULL, NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(21, 53, 1, 'INV-NKH-DT-20251029-4306', 95.50, 9.55, 0.00, 105.05, 0.00, 0.00, 105.05, 'paid', 'USD', '2025-10-28 23:20:19', '2025-11-10 23:20:19', '2025-10-29 00:17:19', 'Payment due within 30 days', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(22, 54, 1, 'INV-NKH-DT-20250904-7981', 181.00, 18.10, 4.71, 194.39, 0.00, 194.39, 194.39, 'paid', 'USD', '2025-09-04 00:55:51', '2025-09-10 00:55:51', NULL, 'Loyalty points earned: 50', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(23, 55, 1, 'INV-NKH-DT-20251005-6799', 15.00, 1.50, 7.87, 8.63, 0.00, 8.63, 0.00, 'paid', 'USD', '2025-10-04 19:30:46', '2025-10-17 19:30:46', '2025-10-04 20:00:46', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(24, 59, 1, 'INV-NKH-DT-20251030-6874', 117.00, 11.70, 0.00, 128.70, 0.00, 128.70, 128.70, 'paid', 'USD', '2025-10-30 16:32:42', '2025-11-22 16:32:42', NULL, 'Thank you for dining with us!', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(25, 66, 1, 'INV-NKH-DT-20251001-4150', 90.50, 9.05, 0.00, 99.55, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-09-30 19:11:11', '2025-10-03 19:11:11', NULL, 'Payment due within 30 days', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(26, 68, 1, 'INV-NKH-DT-20250820-8830', 25.50, 2.55, 0.00, 28.05, 0.00, 0.00, 0.00, 'draft', 'USD', '2025-08-20 11:34:21', '2025-08-21 11:34:21', NULL, NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(27, 71, 1, 'INV-NKH-DT-20250920-2660', 91.50, 9.15, 0.00, 100.65, 0.00, 0.00, 100.65, 'paid', 'USD', '2025-09-20 13:04:30', '2025-10-06 13:04:30', '2025-09-20 13:44:30', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(28, 72, 1, 'INV-NKH-DT-20250928-8256', 108.50, 10.85, 4.73, 114.62, 0.00, 114.62, 114.62, 'paid', 'USD', '2025-09-28 08:01:35', '2025-09-30 08:01:35', '2025-09-28 08:54:35', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(29, 77, 1, 'INV-NKH-DT-20251107-8073', 39.00, 3.90, 0.00, 42.90, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-11-07 15:25:38', '2025-11-27 15:25:38', '2025-11-07 16:00:38', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(30, 78, 1, 'INV-NKH-DT-20250915-6178', 61.00, 6.10, 0.00, 67.10, 0.00, 67.10, 0.00, 'paid', 'USD', '2025-09-15 02:30:22', '2025-09-28 02:30:22', NULL, 'Group booking discount applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(31, 80, 1, 'INV-NKH-DT-20251007-9521', 112.00, 11.20, 0.00, 123.20, 0.00, 0.00, 123.20, 'draft', 'USD', '2025-10-06 21:35:29', '2025-10-12 21:35:29', '2025-10-06 22:32:29', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(32, 81, 1, 'INV-NKH-DT-20251105-9281', 101.50, 10.15, 0.00, 111.65, 0.00, 111.65, 0.00, 'issued', 'USD', '2025-11-05 00:16:49', '2025-11-15 00:16:49', '2025-11-05 00:54:49', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(33, 84, 1, 'INV-NKH-DT-20251101-9723', 129.50, 12.95, 9.75, 132.70, 0.00, 132.70, 0.00, 'paid', 'USD', '2025-11-01 11:49:32', '2025-11-13 11:49:32', NULL, 'Payment due within 30 days', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(34, 85, 1, 'INV-NKH-DT-20250919-6062', 92.00, 9.20, 0.00, 101.20, 0.00, 101.20, 101.20, 'issued', 'USD', '2025-09-19 01:24:50', '2025-09-21 01:24:50', '2025-09-19 02:09:50', 'Corporate account - NET 30', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(35, 87, 1, 'INV-NKH-DT-20251104-5325', 46.50, 4.65, 7.52, 43.63, 0.00, 43.63, 0.00, 'paid', 'USD', '2025-11-04 12:44:28', '2025-11-24 12:44:28', NULL, NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(36, 91, 1, 'INV-NKH-DT-20250909-2966', 174.50, 17.45, 0.00, 191.95, 0.00, 191.95, 191.95, 'paid', 'USD', '2025-09-08 23:13:41', '2025-09-30 23:13:41', '2025-09-08 23:56:41', 'Payment due within 30 days', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(37, 94, 1, 'INV-NKH-DT-20251009-6360', 100.50, 10.05, 5.97, 104.58, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-09 00:53:49', '2025-10-10 00:53:49', '2025-10-09 01:06:49', 'Special event surcharge applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(38, 95, 1, 'INV-NKH-DT-20250929-5919', 48.50, 4.85, 0.00, 53.35, 0.00, 53.35, 53.35, 'paid', 'USD', '2025-09-29 09:52:31', '2025-10-21 09:52:31', '2025-09-29 10:13:31', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(39, 97, 1, 'INV-NKH-DT-20251116-9356', 103.50, 10.35, 0.00, 113.85, 0.00, 113.85, 113.85, 'paid', 'USD', '2025-11-16 05:11:05', '2025-11-30 05:11:05', '2025-11-16 05:25:05', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(40, 100, 1, 'INV-NKH-DT-20250901-9942', 114.50, 11.45, 0.00, 125.95, 0.00, 125.95, 125.95, 'issued', 'USD', '2025-09-01 00:54:10', '2025-09-24 00:54:10', '2025-09-01 01:46:10', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(41, 101, 1, 'INV-NKH-DT-20250929-8904', 102.50, 10.25, 0.00, 112.75, 0.00, 0.00, 112.75, 'paid', 'USD', '2025-09-28 17:52:26', '2025-10-14 17:52:26', '2025-09-28 18:23:26', 'Catering service invoice', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(42, 104, 1, 'INV-NKH-DT-20251020-9217', 74.50, 7.45, 0.00, 81.95, 0.00, 81.95, 81.95, 'paid', 'USD', '2025-10-20 10:56:41', '2025-10-24 10:56:41', NULL, NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(43, 106, 1, 'INV-NKH-DT-20251018-4182', 201.00, 20.10, 0.00, 221.10, 0.00, 221.10, 221.10, 'issued', 'USD', '2025-10-17 18:50:32', '2025-11-16 18:50:32', '2025-10-17 19:07:32', 'Loyalty points earned: 50', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(44, 107, 1, 'INV-NKH-DT-20251018-5895', 59.00, 5.90, 0.00, 64.90, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-18 07:13:25', '2025-11-06 07:13:25', '2025-10-18 07:26:25', 'Loyalty points earned: 50', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(45, 109, 1, 'INV-NKH-DT-20251031-8777', 139.50, 13.95, 0.00, 153.45, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-10-30 20:12:04', '2025-11-24 20:12:04', NULL, 'Group booking discount applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(46, 110, 1, 'INV-NKH-DT-20250905-3628', 7.00, 0.70, 3.03, 4.67, 0.00, 0.00, 4.67, 'paid', 'USD', '2025-09-04 19:00:23', '2025-09-26 19:00:23', '2025-09-04 19:41:23', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(47, 112, 1, 'INV-NKH-DT-20251006-5140', 78.00, 7.80, 0.00, 85.80, 0.00, 85.80, 85.80, 'cancelled', 'USD', '2025-10-06 10:16:37', '2025-10-17 10:16:37', NULL, 'Thank you for dining with us!', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(48, 116, 1, 'INV-NKH-DT-20251013-4920', 79.50, 7.95, 0.00, 87.45, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-10-12 17:40:23', '2025-11-03 17:40:23', '2025-10-12 17:52:23', 'Group booking discount applied', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(49, 120, 1, 'INV-NKH-DT-20250930-5508', 131.50, 13.15, 0.00, 144.65, 0.00, 144.65, 0.00, 'paid', 'USD', '2025-09-30 01:33:26', '2025-10-24 01:33:26', '2025-09-30 01:59:26', 'Early payment discount available', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(50, 121, 1, 'INV-NKH-DT-20251023-4571', 51.50, 5.15, 0.00, 56.65, 0.00, 56.65, 0.00, 'paid', 'USD', '2025-10-23 10:31:12', '2025-11-11 10:31:12', NULL, 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(51, 124, 1, 'INV-NKH-DT-20250916-3145', 126.50, 12.65, 0.00, 139.15, 0.00, 139.15, 0.00, 'issued', 'USD', '2025-09-16 09:10:24', '2025-09-20 09:10:24', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(52, 125, 1, 'INV-NKH-DT-20250829-2526', 36.00, 3.60, 0.00, 39.60, 0.00, 39.60, 0.00, 'paid', 'USD', '2025-08-29 15:59:45', '2025-09-15 15:59:45', '2025-08-29 16:41:45', 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(53, 126, 1, 'INV-NKH-DT-20251026-1881', 46.50, 4.65, 0.00, 51.15, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-25 22:51:32', '2025-11-16 22:51:32', NULL, 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(54, 127, 1, 'INV-NKH-DT-20251006-4024', 239.50, 23.95, 0.00, 263.45, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-06 09:32:20', '2025-10-24 09:32:20', '2025-10-06 10:28:20', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(55, 128, 1, 'INV-NKH-DT-20250822-7789', 154.00, 15.40, 8.21, 161.19, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-08-22 17:43:29', '2025-09-16 17:43:29', '2025-08-22 18:42:29', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(56, 132, 1, 'INV-NKH-DT-20251105-8517', 142.50, 14.25, 0.00, 156.75, 0.00, 0.00, 156.75, 'paid', 'USD', '2025-11-05 04:47:45', '2025-11-21 04:47:45', '2025-11-05 05:43:45', 'Early payment discount available', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(57, 138, 1, 'INV-NKH-DT-20251026-4438', 125.50, 12.55, 0.00, 138.05, 0.00, 138.05, 138.05, 'draft', 'USD', '2025-10-25 22:25:57', '2025-11-16 22:25:57', '2025-10-25 23:11:57', 'Catering service invoice', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(58, 142, 1, 'INV-NKH-DT-20250828-8914', 76.50, 7.65, 0.00, 84.15, 0.00, 84.15, 0.00, 'paid', 'USD', '2025-08-27 23:36:41', '2025-09-21 23:36:41', '2025-08-28 00:04:41', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(59, 145, 1, 'INV-NKH-DT-20251007-4092', 47.00, 4.70, 0.00, 51.70, 0.00, 0.00, 0.00, 'draft', 'USD', '2025-10-06 20:59:09', '2025-10-17 20:59:09', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(60, 146, 1, 'INV-NKH-DT-20251018-5153', 222.50, 22.25, 0.00, 244.75, 0.00, 244.75, 244.75, 'issued', 'USD', '2025-10-17 17:38:43', '2025-11-07 17:38:43', '2025-10-17 18:11:43', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(61, 148, 1, 'INV-NKH-DT-20250902-6109', 53.50, 5.35, 9.21, 49.64, 0.00, 49.64, 0.00, 'issued', 'USD', '2025-09-01 19:14:01', '2025-09-08 19:14:01', '2025-09-01 19:48:01', 'Thank you for dining with us!', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(62, 153, 1, 'INV-NKH-DT-20251007-8598', 58.00, 5.80, 0.00, 63.80, 0.00, 63.80, 63.80, 'draft', 'USD', '2025-10-07 02:12:15', '2025-10-15 02:12:15', NULL, 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(63, 154, 1, 'INV-NKH-DT-20250901-7673', 261.00, 26.10, 0.00, 287.10, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-09-01 10:55:38', '2025-09-14 10:55:38', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(64, 156, 1, 'INV-NKH-DT-20251025-5147', 188.00, 18.80, 0.00, 206.80, 0.00, 206.80, 0.00, 'issued', 'USD', '2025-10-25 03:50:41', '2025-11-15 03:50:41', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(65, 157, 1, 'INV-NKH-DT-20250821-3134', 50.50, 5.05, 0.00, 55.55, 0.00, 0.00, 55.55, 'paid', 'USD', '2025-08-20 19:57:58', '2025-09-08 19:57:58', NULL, 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(66, 161, 1, 'INV-NKH-DT-20251001-8061', 67.50, 6.75, 0.00, 74.25, 0.00, 74.25, 74.25, 'paid', 'USD', '2025-09-30 23:33:08', '2025-10-18 23:33:08', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(67, 164, 1, 'INV-NKH-DT-20250906-7993', 23.00, 2.30, 0.00, 25.30, 0.00, 0.00, 0.00, 'draft', 'USD', '2025-09-06 13:40:06', '2025-09-20 13:40:06', '2025-09-06 13:53:06', 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(68, 170, 1, 'INV-NKH-DT-20250910-1528', 8.50, 0.85, 0.00, 9.35, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-09-10 01:37:29', '2025-09-22 01:37:29', '2025-09-10 01:49:29', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(69, 173, 1, 'INV-NKH-DT-20251028-2431', 175.00, 17.50, 2.93, 189.57, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-10-28 03:43:14', '2025-11-06 03:43:14', '2025-10-28 04:28:14', 'Early payment discount available', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(70, 175, 1, 'INV-NKH-DT-20250917-2342', 147.00, 14.70, 0.00, 161.70, 0.00, 161.70, 161.70, 'paid', 'USD', '2025-09-16 17:58:27', '2025-10-13 17:58:27', '2025-09-16 18:43:27', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(71, 176, 1, 'INV-NKH-DT-20250918-1878', 138.00, 13.80, 0.00, 151.80, 0.00, 151.80, 0.00, 'paid', 'USD', '2025-09-17 19:41:23', '2025-10-14 19:41:23', '2025-09-17 20:36:23', 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(72, 178, 1, 'INV-NKH-DT-20251008-2877', 29.00, 2.90, 0.00, 31.90, 0.00, 31.90, 0.00, 'issued', 'USD', '2025-10-08 00:43:48', '2025-10-25 00:43:48', '2025-10-08 01:27:48', 'Thank you for dining with us!', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(73, 189, 1, 'INV-NKH-DT-20251029-1879', 36.00, 3.60, 2.35, 37.25, 0.00, 37.25, 0.00, 'cancelled', 'USD', '2025-10-29 07:37:01', '2025-11-06 07:37:01', '2025-10-29 08:36:01', 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(74, 192, 1, 'INV-NKH-DT-20251114-1341', 77.00, 7.70, 4.56, 80.14, 0.00, 0.00, 80.14, 'paid', 'USD', '2025-11-13 18:34:46', '2025-11-28 18:34:46', '2025-11-13 19:06:46', 'Corporate account - NET 30', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(75, 193, 1, 'INV-NKH-DT-20250919-7189', 112.50, 11.25, 9.54, 114.21, 0.00, 114.21, 0.00, 'paid', 'USD', '2025-09-19 01:39:14', '2025-10-13 01:39:14', '2025-09-19 02:25:14', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(76, 195, 1, 'INV-NKH-DT-20251003-1517', 181.50, 18.15, 2.42, 197.23, 0.00, 0.00, 197.23, 'paid', 'USD', '2025-10-03 02:55:01', '2025-10-27 02:55:01', '2025-10-03 03:25:01', 'Catering service invoice', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(77, 196, 1, 'INV-NKH-DT-20251104-6495', 47.00, 4.70, 0.00, 51.70, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-11-04 13:06:12', '2025-11-22 13:06:12', '2025-11-04 13:20:12', 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(78, 199, 1, 'INV-NKH-DT-20251116-1176', 130.00, 13.00, 0.00, 143.00, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-11-16 04:51:20', '2025-12-10 04:51:20', '2025-11-16 05:46:20', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(79, 203, 1, 'INV-NKH-DT-20251110-1042', 104.50, 10.45, 6.51, 108.44, 0.00, 0.00, 0.00, 'issued', 'USD', '2025-11-10 07:37:05', '2025-11-23 07:37:05', NULL, 'Corporate account - NET 30', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(80, 205, 1, 'INV-NKH-DT-20251117-2094', 31.50, 3.15, 0.00, 34.65, 0.00, 34.65, 0.00, 'paid', 'USD', '2025-11-17 11:31:18', '2025-11-24 11:31:18', NULL, 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(81, 207, 1, 'INV-NKH-DT-20250824-1184', 131.50, 13.15, 0.00, 144.65, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-08-24 05:55:12', '2025-09-08 05:55:12', '2025-08-24 06:48:12', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(82, 208, 1, 'INV-NKH-DT-20251115-8866', 147.00, 14.70, 0.00, 161.70, 0.00, 161.70, 0.00, 'paid', 'USD', '2025-11-15 11:52:31', '2025-11-18 11:52:31', '2025-11-15 12:17:31', 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(83, 211, 1, 'INV-NKH-DT-20250902-4196', 271.00, 27.10, 0.00, 298.10, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-09-02 15:43:55', '2025-09-04 15:43:55', '2025-09-02 16:27:55', 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(84, 213, 1, 'INV-NKH-DT-20251006-5985', 131.50, 13.15, 0.00, 144.65, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-06 06:11:08', '2025-11-04 06:11:08', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(85, 220, 1, 'INV-NKH-DT-20250921-8302', 42.00, 4.20, 0.00, 46.20, 0.00, 0.00, 46.20, 'paid', 'USD', '2025-09-21 15:27:03', '2025-09-22 15:27:03', '2025-09-21 15:42:03', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(86, 221, 1, 'INV-NKH-DT-20250820-9594', 96.00, 9.60, 0.00, 105.60, 0.00, 105.60, 0.00, 'paid', 'USD', '2025-08-20 05:38:46', '2025-09-01 05:38:46', '2025-08-20 06:09:46', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(87, 222, 1, 'INV-NKH-DT-20251007-9119', 9.00, 0.90, 0.00, 9.90, 0.00, 9.90, 0.00, 'paid', 'USD', '2025-10-06 23:47:45', '2025-10-19 23:47:45', NULL, 'Catering service invoice', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(88, 224, 1, 'INV-NKH-DT-20250907-1644', 183.50, 18.35, 0.00, 201.85, 0.00, 201.85, 0.00, 'issued', 'USD', '2025-09-07 02:36:12', '2025-09-25 02:36:12', '2025-09-07 03:02:12', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(89, 225, 1, 'INV-NKH-DT-20251008-3173', 129.50, 12.95, 0.00, 142.45, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-07 18:38:37', '2025-10-24 18:38:37', '2025-10-07 19:03:37', 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(90, 226, 1, 'INV-NKH-DT-20251017-6243', 152.00, 15.20, 4.86, 162.34, 0.00, 162.34, 0.00, 'paid', 'USD', '2025-10-17 11:00:45', '2025-11-09 11:00:45', '2025-10-17 11:34:45', 'Corporate account - NET 30', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(91, 229, 1, 'INV-NKH-DT-20251110-3626', 81.00, 8.10, 7.26, 81.84, 0.00, 81.84, 0.00, 'issued', 'USD', '2025-11-10 00:31:40', '2025-12-06 00:31:40', '2025-11-10 01:30:40', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(92, 236, 1, 'INV-NKH-DT-20251105-9431', 86.00, 8.60, 9.43, 85.17, 0.00, 0.00, 85.17, 'issued', 'USD', '2025-11-04 19:14:38', '2025-12-04 19:14:38', '2025-11-04 20:09:38', 'Corporate account - NET 30', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(93, 237, 1, 'INV-NKH-DT-20251009-9697', 43.00, 4.30, 0.00, 47.30, 0.00, 0.00, 0.00, 'paid', 'USD', '2025-10-09 11:28:41', '2025-10-21 11:28:41', NULL, NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(94, 239, 1, 'INV-NKH-DT-20251028-4377', 93.00, 9.30, 0.00, 102.30, 0.00, 102.30, 0.00, 'paid', 'USD', '2025-10-28 08:53:01', '2025-10-29 08:53:01', '2025-10-28 09:26:01', 'Thank you for dining with us!', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(95, 240, 1, 'INV-NKH-DT-20250824-6780', 21.00, 2.10, 0.00, 23.10, 0.00, 23.10, 0.00, 'paid', 'USD', '2025-08-24 08:20:50', '2025-09-01 08:20:50', NULL, 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(96, 245, 1, 'INV-NKH-DT-20251005-1842', 104.00, 10.40, 0.00, 114.40, 0.00, 0.00, 0.00, 'draft', 'USD', '2025-10-05 00:04:54', '2025-10-13 00:04:54', NULL, 'Special event surcharge applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(97, 247, 1, 'INV-NKH-DT-20251019-6493', 97.00, 9.70, 0.00, 106.70, 0.00, 106.70, 0.00, 'paid', 'USD', '2025-10-19 08:34:05', '2025-11-17 08:34:05', '2025-10-19 09:04:05', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(98, 248, 1, 'INV-NKH-DT-20251027-4685', 86.00, 8.60, 0.00, 94.60, 0.00, 94.60, 94.60, 'paid', 'USD', '2025-10-27 09:53:46', '2025-11-04 09:53:46', NULL, 'Group booking discount applied', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(99, 249, 1, 'INV-NKH-DT-20250904-6685', 56.50, 5.65, 0.00, 62.15, 0.00, 62.15, 0.00, 'paid', 'USD', '2025-09-04 13:15:04', '2025-10-04 13:15:04', NULL, 'Loyalty points earned: 50', '2025-11-19 01:08:20', '2025-11-19 01:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

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
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` enum('annual','sick','unpaid','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'annual',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `employee_id`, `location_id`, `start_date`, `end_date`, `type`, `reason`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2025-12-06', '2025-12-11', 'unpaid', 'Religious observance', 'approved', '2025-11-24 01:08:12', '2025-12-01 01:08:12'),
(2, 1, 1, '2025-12-10', '2025-12-12', 'sick', 'Family emergency', 'approved', '2025-12-03 01:08:12', '2025-12-06 01:08:12'),
(3, 1, 1, '2025-12-31', '2026-01-05', 'annual', 'Personal matters', 'approved', '2025-12-19 01:08:12', '2025-12-24 01:08:12'),
(4, 2, 1, '2025-12-14', '2025-12-15', 'unpaid', 'Annual vacation', 'approved', '2025-12-03 01:08:12', '2025-12-10 01:08:12'),
(5, 2, 1, '2025-12-31', '2026-01-01', 'annual', 'Religious observance', 'pending', '2025-12-17 01:08:12', '2025-12-26 01:08:12'),
(6, 3, 1, '2026-01-25', '2026-01-26', 'annual', 'Religious observance', 'pending', '2026-01-15 01:08:12', '2026-01-19 01:08:12'),
(7, 3, 1, '2025-12-04', '2025-12-05', 'sick', 'Family emergency', 'pending', '2025-11-25 01:08:12', '2025-12-03 01:08:12'),
(8, 4, 1, '2025-11-22', '2025-11-27', 'annual', 'Annual vacation', 'pending', '2025-11-11 01:08:12', '2025-11-20 01:08:12'),
(9, 5, 1, '2025-12-03', '2025-12-06', 'sick', 'Attending wedding', 'approved', '2025-11-23 01:08:12', '2025-11-26 01:08:12'),
(10, 5, 1, '2025-11-22', '2025-11-25', 'other', 'Medical appointment', 'pending', '2025-11-13 01:08:12', '2025-11-17 01:08:12'),
(11, 6, 1, '2025-12-24', '2025-12-28', 'sick', 'Annual vacation', 'pending', '2025-12-12 01:08:12', '2025-12-21 01:08:12'),
(12, 6, 1, '2025-11-27', '2025-12-01', 'unpaid', 'Annual vacation', 'pending', '2025-11-16 01:08:12', '2025-11-26 01:08:12'),
(13, 6, 1, '2026-01-14', '2026-01-18', 'unpaid', 'Religious observance', 'approved', '2026-01-06 01:08:12', '2026-01-10 01:08:12'),
(14, 7, 1, '2026-01-02', '2026-01-06', 'other', 'Religious observance', 'pending', '2025-12-26 01:08:12', '2025-12-26 01:08:12'),
(15, 8, 1, '2025-11-29', '2025-12-02', 'annual', 'Home emergency', 'pending', '2025-11-22 01:08:12', '2025-11-23 01:08:12'),
(16, 8, 1, '2026-02-08', '2026-02-11', 'annual', 'Attending wedding', 'approved', '2026-01-26 01:08:12', '2026-02-07 01:08:12'),
(17, 9, 1, '2025-12-23', '2025-12-26', 'other', 'Family celebration', 'approved', '2025-12-16 01:08:12', '2025-12-18 01:08:12'),
(18, 9, 1, '2025-12-07', '2025-12-12', 'sick', 'Family celebration', 'approved', '2025-11-25 01:08:12', '2025-12-05 01:08:12'),
(19, 9, 1, '2025-12-14', '2025-12-15', 'unpaid', 'Personal matters', 'approved', '2025-12-02 01:08:12', '2025-12-10 01:08:12'),
(20, 10, 1, '2025-12-14', '2025-12-17', 'other', 'Home emergency', 'approved', '2025-11-30 01:08:12', '2025-12-12 01:08:12'),
(21, 10, 1, '2025-11-27', '2025-11-28', 'unpaid', 'Family celebration', 'pending', '2025-11-18 01:08:12', '2025-11-23 01:08:12'),
(22, 11, 1, '2026-02-12', '2026-02-16', 'unpaid', 'Family emergency', 'pending', '2026-02-04 01:08:12', '2026-02-05 01:08:12'),
(23, 12, 1, '2026-01-07', '2026-01-12', 'unpaid', 'Religious observance', 'pending', '2025-12-31 01:08:12', '2026-01-03 01:08:12'),
(24, 13, 1, '2026-01-10', '2026-01-15', 'sick', 'Family celebration', 'pending', '2026-01-03 01:08:12', '2026-01-05 01:08:12'),
(25, 13, 1, '2025-11-26', '2025-11-29', 'unpaid', 'Medical appointment', 'approved', '2025-11-15 01:08:12', '2025-11-24 01:08:12'),
(26, 13, 1, '2026-02-11', '2026-02-14', 'unpaid', 'Family celebration', 'approved', '2026-02-03 01:08:12', '2026-02-07 01:08:12'),
(27, 14, 1, '2025-12-22', '2025-12-25', 'unpaid', 'Attending wedding', 'approved', '2025-12-13 01:08:12', '2025-12-20 01:08:12'),
(28, 14, 1, '2025-12-27', '2025-12-29', 'annual', 'Home emergency', 'approved', '2025-12-20 01:08:12', '2025-12-20 01:08:12'),
(29, 14, 1, '2025-12-20', '2025-12-23', 'unpaid', 'Home emergency', 'approved', '2025-12-12 01:08:12', '2025-12-14 01:08:12'),
(30, 15, 1, '2026-01-21', '2026-01-22', 'unpaid', 'Attending wedding', 'approved', '2026-01-12 01:08:12', '2026-01-14 01:08:12'),
(31, 15, 1, '2026-01-16', '2026-01-17', 'other', 'Medical appointment', 'pending', '2026-01-07 01:08:12', '2026-01-09 01:08:12'),
(32, 16, 1, '2025-12-23', '2025-12-24', 'sick', 'Attending wedding', 'pending', '2025-12-09 01:08:12', '2025-12-16 01:08:12'),
(33, 16, 1, '2026-02-03', '2026-02-07', 'unpaid', 'Home emergency', 'pending', '2026-01-27 01:08:12', '2026-02-01 01:08:12'),
(34, 16, 1, '2025-12-06', '2025-12-10', 'sick', 'Family celebration', 'approved', '2025-11-24 01:08:12', '2025-12-01 01:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` bigint UNSIGNED NOT NULL,
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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `code`, `name`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `phone`, `is_active`, `accepts_online_orders`, `accepts_pickup`, `accepts_delivery`, `created_at`, `updated_at`) VALUES
(1, 'NKH-DT', 'NKH Downtown Flagship', '123 Main Street', 'Downtown District', 'Phnom Penh', 'Phnom Penh', '12000', 'Cambodia', '+855-23-123-456', 1, 1, 1, 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_points`
--

CREATE TABLE `loyalty_points` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED DEFAULT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `type` enum('earn','redeem','adjust') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `balance_after` int NOT NULL,
  `occurred_at` datetime NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `prep_time` int DEFAULT NULL,
  `calories` int DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `location_id`, `category_id`, `sku`, `slug`, `price`, `cost`, `prep_time`, `calories`, `image_path`, `is_popular`, `is_active`, `display_order`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, NULL, 'spring-rolls', 8.50, 3.20, NULL, NULL, '\\images\\menu-items\\spring-rolls.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(2, 1, 1, NULL, 'chicken-satay', 12.00, 4.50, NULL, NULL, '\\images\\menu-items\\chicken-satay.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(3, 1, 1, NULL, 'fish-cakes', 10.50, 4.00, NULL, NULL, '\\images\\menu-items\\fish-cakes.jpg', 0, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(4, 1, 1, NULL, 'papaya-salad', 9.00, 2.50, NULL, NULL, '\\images\\menu-items\\papaya-salad.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(5, 1, 1, NULL, 'beef-salad', 13.50, 5.00, NULL, NULL, '\\images\\menu-items\\beef-salad.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(6, 1, 1, NULL, 'mixed-appetizer-platter', 28.00, 12.00, NULL, NULL, '\\images\\menu-items\\mixed-appetizer-platter.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(7, 1, 2, NULL, 'khmer-noodle-soup', 12.50, 4.00, NULL, NULL, '\\images\\menu-items\\khmer-noodle-soup.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(8, 1, 2, NULL, 'pad-thai', 14.00, 4.50, NULL, NULL, '\\images\\menu-items\\pad-thai.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(9, 1, 2, NULL, 'spaghetti-carbonara', 16.50, 5.50, NULL, NULL, '\\images\\menu-items\\spaghetti-carbonara.jpg', 0, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(10, 1, 3, NULL, 'sour-soup-fish', 15.00, 5.50, NULL, NULL, '\\images\\menu-items\\sour-soup-fish.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(11, 1, 3, NULL, 'chicken-coconut-soup', 13.50, 4.50, NULL, NULL, '\\images\\menu-items\\chicken-coconut-soup.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(12, 1, 3, NULL, 'lotus-stem-salad', 10.00, 3.00, NULL, NULL, '\\images\\menu-items\\lotus-stem-salad.jpg', 0, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(13, 1, 4, NULL, 'sticky-rice-mango', 7.50, 2.50, NULL, NULL, '\\images\\menu-items\\sticky-rice-mango.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(14, 1, 4, NULL, 'coconut-custard', 6.50, 2.00, NULL, NULL, '\\images\\menu-items\\coconut-custard.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(15, 1, 4, NULL, 'coconut-ice-cream', 5.50, 1.50, NULL, NULL, '\\images\\menu-items\\coconut-ice-cream.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(16, 1, 4, NULL, 'mango-ice-cream', 6.00, 1.80, NULL, NULL, '\\images\\menu-items\\mango-ice-cream.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(17, 1, 4, NULL, 'chocolate-cake', 8.50, 3.00, NULL, NULL, '\\images\\menu-items\\chocolate-cake.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(18, 1, 5, NULL, 'cambodian-coffee', 4.50, 1.00, NULL, NULL, '\\images\\menu-items\\cambodian-coffee.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(19, 1, 5, NULL, 'jasmine-tea', 3.50, 0.80, NULL, NULL, '\\images\\menu-items\\jasmine-tea.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(20, 1, 5, NULL, 'iced-coffee', 4.00, 1.20, NULL, NULL, '\\images\\menu-items\\iced-coffee.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(21, 1, 5, NULL, 'soft-drinks', 2.50, 0.80, NULL, NULL, '\\images\\menu-items\\soft-drinks.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(22, 1, 5, NULL, 'fresh-orange-juice', 5.50, 2.00, NULL, NULL, '\\images\\menu-items\\fresh-orange-juice.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(23, 1, 5, NULL, 'watermelon-juice', 4.50, 1.50, NULL, NULL, '\\images\\menu-items\\watermelon-juice.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(24, 1, 5, NULL, 'angkor-beer', 3.50, 1.50, NULL, NULL, '\\images\\menu-items\\angkor-beer.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(25, 1, 5, NULL, 'house-wine-red', 8.50, 3.50, NULL, NULL, '\\images\\menu-items\\house-wine-red.jpg', 0, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(26, 1, 11, NULL, 'grilled-fish-banana-leaf', 25.00, 10.00, NULL, NULL, '\\images\\menu-items\\grilled-fish-banana-leaf.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(27, 1, 11, NULL, 'steamed-fish-ginger', 28.00, 12.00, NULL, NULL, '\\images\\menu-items\\steamed-fish-ginger.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(28, 1, 11, NULL, 'prawns-tamarind-sauce', 32.00, 14.00, NULL, NULL, '\\images\\menu-items\\prawns-tamarind-sauce.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(29, 1, 9, NULL, 'grilled-beef-lolot', 18.50, 7.50, NULL, NULL, '\\images\\menu-items\\grilled-beef-lolot.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(30, 1, 9, NULL, 'grilled-pork-ribs', 22.00, 9.00, NULL, NULL, '\\images\\menu-items\\grilled-pork-ribs.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(31, 1, 9, NULL, 'grilled-chicken-wings', 15.00, 5.50, NULL, NULL, '\\images\\menu-items\\grilled-chicken-wings.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(32, 1, 12, NULL, 'stir-fried-morning-glory', 8.00, 2.00, NULL, NULL, '\\images\\menu-items\\stir-fried-morning-glory.jpg', 1, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(33, 1, 12, NULL, 'tofu-curry', 11.50, 3.50, NULL, NULL, '\\images\\menu-items\\tofu-curry.jpg', 0, 1, 0, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `menu_item_translations`
--

CREATE TABLE `menu_item_translations` (
  `id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_item_translations`
--

INSERT INTO `menu_item_translations` (`id`, `menu_item_id`, `locale`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'en', 'Fresh Spring Rolls', 'Crispy spring rolls filled with fresh vegetables and herbs, served with sweet chili sauce', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(2, 1, 'km', 'នំបញ្ចុំ', 'នំបញ្ចុំគ្រឿងសម្រាប់ដាក់បន្លែស្រស់ និង ស្លឹកឈូក ជាមួយទឹកជ្រលក់ផ្អែម', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(3, 2, 'en', 'Chicken Satay', 'Grilled chicken skewers marinated in aromatic spices, served with peanut sauce', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(4, 2, 'km', 'សាច់មាន់អាំង', 'សាច់មាន់អាំងជាមួយគ្រឿងទេស ផ្តល់ជាមួយទឹកជ្រលក់សណ្តែកដី', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(5, 3, 'en', 'Cambodian Fish Cakes', 'Traditional fish cakes made with fresh river fish and aromatic herbs', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(6, 3, 'km', 'អាម៉ុកត្រី', 'អាម៉ុកត្រីប្រពៃណីធ្វើពីត្រីស្រស់ និង ស្លឹកឈូក', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(7, 4, 'en', 'Green Papaya Salad', 'Fresh and tangy salad with shredded green papaya, tomatoes, and lime dressing', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(8, 4, 'km', 'បុកល្ហុង', 'សាឡាត់ល្ហុងបៃតងស្រស់ជាមួយប៉េងប៉ោះ និង ទឹកក្រូចឆ្មា', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(9, 5, 'en', 'Cambodian Beef Salad', 'Tender beef slices with fresh herbs, vegetables and tangy lime dressing', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(10, 5, 'km', 'ភ្លាសាច់គោ', 'សាច់គោជាមួយស្លឹកឈូកស្រស់ និង ទឹកក្រូចឆ្មា', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(11, 6, 'en', 'Mixed Appetizer Platter', 'A selection of our finest appetizers perfect for sharing', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(12, 6, 'km', 'ចានម្ហូបបំប៉នចម្រុះ', 'ម្ហូបបំប៉នពិសេសៗសម្រាប់ចែករំលែក', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(13, 7, 'en', 'Traditional Khmer Noodle Soup', 'Authentic Cambodian noodle soup with rich broth and fresh herbs', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(14, 7, 'km', 'គុយទាវខ្មែរ', 'គុយទាវខ្មែរប្រពៃណីជាមួយទឹកស៊ុបឈុំ និង ស្លឹកឈូក', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(15, 8, 'en', 'Pad Thai', 'Classic Thai stir-fried noodles with shrimp, tofu, and bean sprouts', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(16, 8, 'km', 'មីឆាថៃ', 'មីឆាថៃបុរាណជាមួយបង្គា តៅហ៊ូ និង សណ្តែកខ្ចី', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(17, 9, 'en', 'Spaghetti Carbonara', 'Classic Italian pasta with creamy sauce, bacon, and parmesan cheese', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(18, 9, 'km', 'ស្ប៉ាហ្គេទីកាបូណារ៉ា', 'ប៉ាស្តាអ៊ីតាលីជាមួយទឹកជ្រលក់ក្រែម និង ឈីសប៉ាម៉េសាន់', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(19, 10, 'en', 'Sour Fish Soup', 'Traditional Cambodian sour soup with fresh fish and vegetables', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(20, 10, 'km', 'សម្លម្ជូរត្រី', 'សម្លម្ជូរខ្មែរប្រពៃណីជាមួយត្រីស្រស់ និង បន្លែ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(21, 11, 'en', 'Chicken Coconut Soup', 'Creamy coconut soup with tender chicken and aromatic herbs', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(22, 11, 'km', 'សម្លដូងមាន់', 'សម្លដូងក្រែមជាមួយសាច់មាន់ទន់ និង ស្លឹកឈូក', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(23, 12, 'en', 'Lotus Stem Salad', 'Crunchy lotus stem salad with herbs and lime dressing', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(24, 12, 'km', 'ញាំងជ្រួញ', 'ញាំងជ្រួញកកេបជាមួយស្លឹកឈូក និង ទឹកក្រូចឆ្មា', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(25, 13, 'en', 'Sticky Rice with Mango', 'Sweet sticky rice served with fresh mango slices and coconut milk', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(26, 13, 'km', 'បាយដំណើបស្វាយ', 'បាយដំណើបផ្អែមជាមួយស្វាយស្រស់ និង ទឹកដូង', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(27, 14, 'en', 'Coconut Custard', 'Traditional Cambodian coconut custard dessert', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(28, 14, 'km', 'សង់ខ្យាដូង', 'បង្អែមសង់ខ្យាដូងខ្មែរប្រពៃណី', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(29, 15, 'en', 'Coconut Ice Cream', 'Creamy coconut ice cream made with fresh coconut milk', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(30, 15, 'km', 'ការ៉េមដូង', 'ការ៉េមដូងក្រែមធ្វើពីទឹកដូងស្រស់', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(31, 16, 'en', 'Mango Ice Cream', 'Rich and creamy mango ice cream made with fresh mangoes', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(32, 16, 'km', 'ការ៉េមស្វាយ', 'ការ៉េមស្វាយក្រែមធ្វើពីស្វាយស្រស់', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(33, 17, 'en', 'Chocolate Cake', 'Rich chocolate cake with smooth chocolate ganache', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(34, 17, 'km', 'នំកេកសូកូឡា', 'នំកេកសូកូឡាក្រែមជាមួយសូកូឡាហ្គាណាស', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(35, 18, 'en', 'Traditional Cambodian Coffee', 'Strong Cambodian coffee served with condensed milk', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(36, 18, 'km', 'កាហ្វេខ្មែរ', 'កាហ្វេខ្មែរខ្លាំងជាមួយទឹកដោះគោបង្រួម', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(37, 19, 'en', 'Jasmine Tea', 'Fragrant jasmine tea served hot', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(38, 19, 'km', 'តែម្លិះ', 'តែម្លិះក្រអូបក្តៅៗ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(39, 20, 'en', 'Iced Coffee', 'Refreshing iced coffee with condensed milk', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(40, 20, 'km', 'កាហ្វេទឹកកក', 'កាហ្វេទឹកកកធ្វើឱ្យស្រស់ជាមួយទឹកដោះគោបង្រួម', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(41, 21, 'en', 'Soft Drinks', 'Selection of carbonated soft drinks', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(42, 21, 'km', 'ភេសជ្ជៈបែបកាបូន', 'ជម្រើសភេសជ្ជៈបែបកាបូន', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(43, 22, 'en', 'Fresh Orange Juice', 'Freshly squeezed orange juice', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(44, 22, 'km', 'ទឹកក្រូចស្រស់', 'ទឹកក្រូចច្របាច់ស្រស់', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(45, 23, 'en', 'Watermelon Juice', 'Fresh watermelon juice, perfect for hot weather', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(46, 23, 'km', 'ទឹកឪឡឹក', 'ទឹកឪឡឹកស្រស់ល្អសម្រាប់អាកាសធាតុក្តៅ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(47, 24, 'en', 'Angkor Beer', 'Cambodia\'s premium local beer', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(48, 24, 'km', 'ស្រាបៀរអង្គរ', 'ស្រាបៀរក្នុងស្រុកពិសេសរបស់កម្ពុជា', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(49, 25, 'en', 'House Red Wine', 'Our selection of red wine by the glass', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(50, 25, 'km', 'ស្រាវ៉ាំក្រហម', 'ស្រាវ៉ាំក្រហមជម្រើសរបស់យើង', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(51, 26, 'en', 'Grilled Fish in Banana Leaf', 'Fresh fish grilled in banana leaf with traditional Khmer spices', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(52, 26, 'km', 'ត្រីអាំងស្លឹកចេក', 'ត្រីស្រស់អាំងក្នុងស្លឹកចេកជាមួយគ្រឿងទេសខ្មែរ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(53, 27, 'en', 'Steamed Fish with Ginger', 'Delicate steamed fish with fresh ginger and soy sauce', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(54, 27, 'km', 'ត្រីចំហុយខ្ញី', 'ត្រីចំហុយជាមួយខ្ញីស្រស់ និង ទឹកស៊ីអ៊ីវ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(55, 28, 'en', 'Prawns in Tamarind Sauce', 'Fresh prawns cooked in sweet and sour tamarind sauce', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(56, 28, 'km', 'បង្គាអំពិលទុំ', 'បង្គាស្រស់ចម្អិនជាមួយអំពិលទុំផ្អែមឆ្មា', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(57, 29, 'en', 'Grilled Beef in Lolot Leaves', 'Premium beef wrapped in aromatic lolot leaves and grilled to perfection', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(58, 29, 'km', 'សាច់គោអាំងស្លឹកលលត', 'សាច់គោពិសេសរុំស្លឹកលលត អាំងឱ្យបានល្អ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(59, 30, 'en', 'Grilled Pork Ribs', 'Tender pork ribs marinated in special sauce and grilled over charcoal', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(60, 30, 'km', 'ជំនីសាច់ជ្រូកអាំង', 'ជំនីសាច់ជ្រូកទន់ជាមួយទឹកជ្រលក់ពិសេស អាំងលើធ្យូង', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(61, 31, 'en', 'Grilled Chicken Wings', 'Juicy chicken wings marinated in herbs and spices, grilled to golden perfection', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(62, 31, 'km', 'ស្លាបមាន់អាំង', 'ស្លាបមាន់ជាមួយគ្រឿងទេស អាំងឱ្យបានពណ៌មាស', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(63, 32, 'en', 'Stir-fried Morning Glory', 'Fresh water spinach stir-fried with garlic and oyster sauce', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(64, 32, 'km', 'ត្រកួនឆាកតិច', 'ត្រកួនស្រស់ឆាជាមួយកតិច និង ទឹកជ្រលក់ហោយ', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(65, 33, 'en', 'Tofu Red Curry', 'Silky tofu in aromatic red curry with vegetables', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(66, 33, 'km', 'ការីក្រហមតៅហ៊ូ', 'តៅហ៊ូក្នុងការីក្រហមជាមួយបន្លែ', '2025-11-19 01:08:07', '2025-11-19 01:08:07');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_09_18_080023_create_locations_table', 1),
(5, '2025_09_18_080024_create_settings_table', 1),
(6, '2025_09_18_080025_alter_users_add_profile_fields', 1),
(7, '2025_09_18_080025_create_units_table', 1),
(8, '2025_09_18_080026_create_roles_table', 1),
(9, '2025_09_18_080027_create_permissions_table', 1),
(10, '2025_09_18_080028_create_role_permission_table', 1),
(11, '2025_09_18_080029_create_role_user_table', 1),
(12, '2025_09_18_080030_create_audit_logs_table', 1),
(13, '2025_09_18_080031_create_positions_table', 1),
(14, '2025_09_18_080032_create_employees_table', 1),
(15, '2025_09_18_080033_create_attendances_table', 1),
(16, '2025_09_18_080034_create_payrolls_table', 1),
(17, '2025_09_18_080035_create_leave_requests_table', 1),
(18, '2025_09_18_080036_create_categories_table', 1),
(19, '2025_09_18_080037_create_category_translations_table', 1),
(20, '2025_09_18_080038_create_menu_items_table', 1),
(21, '2025_09_18_080039_create_menu_item_translations_table', 1),
(22, '2025_09_18_080040_create_recipes_table', 1),
(23, '2025_09_18_080043_create_ingredients_table', 1),
(24, '2025_09_18_080044_create_purchase_orders_table', 1),
(25, '2025_09_18_080044_create_suppliers_table', 1),
(26, '2025_09_18_080045_create_purchase_order_items_table', 1),
(27, '2025_09_18_080046_create_inventory_transactions_table', 1),
(28, '2025_09_18_080048_create_floors_table', 1),
(29, '2025_09_18_080049_create_tables_table', 1),
(30, '2025_09_18_080051_create_payment_methods_table', 1),
(31, '2025_09_18_080052_create_orders_table', 1),
(32, '2025_09_18_080053_create_order_items_table', 1),
(33, '2025_09_18_080054_create_invoices_table', 1),
(34, '2025_09_18_080057_create_customers_table', 1),
(35, '2025_09_18_080058_create_feedback_table', 1),
(36, '2025_09_18_080058_create_reservations_table', 1),
(37, '2025_09_18_080059_create_promotions_table', 1),
(38, '2025_09_18_080100_create_loyalty_points_table', 1),
(39, '2025_09_18_080101_create_expense_categories_table', 1),
(40, '2025_09_18_080102_create_expenses_table', 1),
(41, '2025_09_18_102300_create_recipe_ingredients_table', 1),
(42, '2025_09_18_110000_create_customer_addresses_table', 1),
(43, '2025_09_18_110100_create_operating_hours_table', 1),
(44, '2025_09_18_110300_create_order_time_slots_table', 1),
(45, '2025_09_18_110400_add_online_ordering_fields_to_orders_table', 1),
(46, '2025_09_18_120000_update_orders_base_structure', 1),
(47, '2025_09_18_120010_update_payment_methods_structure', 1),
(48, '2025_09_18_120020_update_customers_structure', 1),
(49, '2025_09_18_130000_create_personal_access_tokens_table', 1),
(50, '2025_09_19_140500_fix_schema_relationships_phase1', 1),
(51, '2025_09_19_141000_fix_schema_relationships_phase2', 1),
(52, '2025_09_28_160000_fix_order_status_enum', 1),
(53, '2025_09_29_120000_add_order_preparation_fields', 1),
(54, '2025_09_29_120000_add_payment_method_fields', 1),
(55, '2025_10_21_000003_create_customer_requests_table', 1),
(56, '2025_10_21_093333_rename_total_column_in_orders_table', 1),
(57, '2025_10_21_093600_create_order_items_table', 1),
(58, '2025_10_21_093601_create_invoices_table', 1),
(59, '2025_10_21_093601_create_payments_table', 1),
(60, '2025_10_21_094728_add_image_to_categories_table', 1),
(61, '2025_10_21_094841_add_fields_to_menu_items_table', 1),
(62, '2025_10_21_095159_add_customer_code_to_customers_table', 1),
(63, '2025_10_21_095331_add_additional_fields_to_customers_table', 1),
(64, '2025_10_21_100100_add_fields_to_payment_methods_table', 1),
(65, '2025_10_21_100200_align_order_table_columns', 1),
(66, '2025_10_21_100300_align_order_items_columns', 1),
(67, '2025_10_21_100400_align_invoice_columns', 1),
(68, '2025_10_21_100600_recreate_payments_table', 1),
(69, '2025_10_27_000000_add_order_id_to_customer_requests_table', 1),
(70, '2025_10_27_000001_create_notifications_table', 1),
(71, '2025_10_27_114513_add_approval_workflow_to_orders_table', 1),
(72, '2025_10_27_122508_add_order_id_to_customer_requests_table', 1),
(73, '2025_11_01_000000_fix_user_password_hashing', 1),
(74, '2025_11_01_000001_fix_admin_password', 1),
(75, '2025_11_11_103757_update_user_passwords_to_bcrypt', 1),
(76, '2025_11_19_140000_add_parent_id_to_categories_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint UNSIGNED NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operating_hours`
--

CREATE TABLE `operating_hours` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `day_of_week` tinyint UNSIGNED NOT NULL,
  `service_type` enum('dine-in','pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `table_id` bigint UNSIGNED DEFAULT NULL,
  `customer_id` bigint UNSIGNED DEFAULT NULL,
  `employee_id` bigint UNSIGNED DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preparation_status` enum('pending','preparing','ready','served') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` int NOT NULL DEFAULT '0',
  `status` enum('pending','received','preparing','ready','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approval_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `ordered_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `estimated_ready_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `order_type` enum('dine-in','pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine-in',
  `customer_address_id` bigint UNSIGNED DEFAULT NULL,
  `payment_status` enum('unpaid','paid','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `kitchen_submitted_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `is_auto_approved` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `location_id`, `table_id`, `customer_id`, `employee_id`, `order_number`, `preparation_status`, `priority`, `status`, `approval_status`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `service_charge`, `currency`, `ordered_at`, `completed_at`, `special_instructions`, `estimated_ready_time`, `created_at`, `updated_at`, `order_type`, `customer_address_id`, `payment_status`, `scheduled_at`, `kitchen_submitted_at`, `approved_by`, `approved_at`, `rejection_reason`, `is_auto_approved`) VALUES
(1, 1, NULL, 10, NULL, 'NKH-DT-20251108-1821-a8c', 'pending', 0, 'ready', 'pending', 39.50, 3.95, 0.00, 43.45, 0.00, 'USD', '2025-11-07 19:39:27', NULL, 'No onions', '2025-11-07 20:12:27', '2025-11-19 01:08:12', '2025-11-19 01:08:13', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(2, 1, 11, 3, NULL, 'NKH-DT-20251027-0352-f71', 'pending', 0, 'pending', 'pending', 68.50, 6.85, 3.54, 71.81, 0.00, 'USD', '2025-10-27 03:10:17', NULL, 'Gluten free preparation', '2025-10-27 03:33:17', '2025-11-19 01:08:12', '2025-11-19 01:08:13', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(3, 1, 18, 7, NULL, 'NKH-DT-20251005-2085-9bc', 'pending', 0, 'completed', 'pending', 25.50, 2.55, 0.00, 28.05, 0.00, 'USD', '2025-10-05 03:13:14', '2025-10-05 03:13:14', 'Extra sauce', '2025-10-05 02:41:14', '2025-11-19 01:08:12', '2025-11-19 01:08:13', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(4, 1, NULL, 8, NULL, 'NKH-DT-20251113-8098-7ff', 'pending', 0, 'completed', 'pending', 69.00, 6.90, 0.00, 75.90, 0.00, 'USD', '2025-11-12 23:18:16', '2025-11-12 23:18:16', NULL, '2025-11-12 22:53:16', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(5, 1, NULL, 2, NULL, 'NKH-DT-20250905-4548-311', 'pending', 0, 'preparing', 'pending', 11.00, 1.10, 0.00, 12.10, 0.00, 'USD', '2025-09-05 05:57:07', NULL, 'Extra sauce', '2025-09-05 06:34:07', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(6, 1, NULL, 5, NULL, 'NKH-DT-20251115-8093-aa5', 'pending', 0, 'pending', 'pending', 7.50, 0.75, 0.00, 8.25, 0.00, 'USD', '2025-11-14 22:25:59', NULL, NULL, '2025-11-14 23:00:59', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(7, 1, NULL, 8, NULL, 'NKH-DT-20251021-4865-5e1', 'pending', 0, 'preparing', 'pending', 10.50, 1.05, 0.00, 11.55, 0.00, 'USD', '2025-10-20 22:19:12', NULL, 'On the side', '2025-10-20 23:01:12', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(8, 1, NULL, 6, NULL, 'NKH-DT-20251029-8999-94e', 'pending', 0, 'preparing', 'pending', 56.00, 5.60, 0.00, 61.60, 0.00, 'USD', '2025-10-29 15:09:33', NULL, 'On the side', '2025-10-29 15:29:33', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(9, 1, NULL, 1, NULL, 'NKH-DT-20250829-5385-ed3', 'pending', 0, 'preparing', 'pending', 97.00, 9.70, 0.00, 106.70, 0.00, 'USD', '2025-08-29 04:22:15', NULL, 'On the side', '2025-08-29 04:53:15', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(10, 1, NULL, 9, NULL, 'NKH-DT-20250820-4014-177', 'pending', 0, 'ready', 'pending', 114.50, 11.45, 0.00, 125.95, 0.00, 'USD', '2025-08-20 12:41:02', NULL, 'Vegetarian option', '2025-08-20 13:25:02', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(11, 1, NULL, 4, NULL, 'NKH-DT-20251020-9552-214', 'pending', 0, 'ready', 'pending', 32.00, 3.20, 0.00, 35.20, 0.00, 'USD', '2025-10-19 17:49:53', NULL, NULL, '2025-10-19 18:10:53', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(12, 1, 1, 1, NULL, 'NKH-DT-20251024-7576-efe', 'pending', 0, 'ready', 'pending', 120.50, 12.05, 0.00, 132.55, 0.00, 'USD', '2025-10-24 15:13:22', NULL, 'Extra sauce', '2025-10-24 15:43:22', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(13, 1, NULL, 9, NULL, 'NKH-DT-20251109-5085-b53', 'pending', 0, 'ready', 'pending', 18.50, 1.85, 0.00, 20.35, 0.00, 'USD', '2025-11-09 02:10:40', NULL, NULL, '2025-11-09 02:46:40', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(14, 1, 23, 7, NULL, 'NKH-DT-20250911-8376-f19', 'pending', 0, 'completed', 'pending', 63.50, 6.35, 0.00, 69.85, 0.00, 'USD', '2025-09-11 04:40:54', '2025-09-11 04:40:54', 'Vegetarian option', '2025-09-11 04:07:54', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(15, 1, NULL, 9, NULL, 'NKH-DT-20251009-6101-99b', 'pending', 0, 'pending', 'pending', 18.00, 1.80, 0.00, 19.80, 0.00, 'USD', '2025-10-09 05:03:58', NULL, 'Make it spicy', '2025-10-09 05:38:58', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(16, 1, NULL, 10, NULL, 'NKH-DT-20251011-2772-7eb', 'pending', 0, 'preparing', 'pending', 65.00, 6.50, 0.00, 71.50, 0.00, 'USD', '2025-10-11 07:28:41', NULL, 'Extra vegetables', '2025-10-11 07:52:41', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(17, 1, NULL, 10, NULL, 'NKH-DT-20250916-8060-ab7', 'pending', 0, 'pending', 'pending', 90.50, 9.05, 0.00, 99.55, 0.00, 'USD', '2025-09-16 02:42:34', NULL, 'On the side', '2025-09-16 03:09:34', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(18, 1, NULL, 10, NULL, 'NKH-DT-20250929-3369-176', 'pending', 0, 'received', 'pending', 40.50, 4.05, 0.00, 44.55, 0.00, 'USD', '2025-09-29 01:49:26', NULL, NULL, '2025-09-29 02:23:26', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(19, 1, NULL, 7, NULL, 'NKH-DT-20251009-0311-4ea', 'pending', 0, 'completed', 'pending', 32.00, 3.20, 5.93, 29.27, 0.00, 'USD', '2025-10-09 17:10:22', '2025-10-09 17:10:22', NULL, '2025-10-09 16:55:22', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(20, 1, NULL, 10, NULL, 'NKH-DT-20250827-9769-583', 'pending', 0, 'received', 'pending', 74.00, 7.40, 2.52, 78.88, 0.00, 'USD', '2025-08-27 13:46:10', NULL, 'Well done', '2025-08-27 14:31:10', '2025-11-19 01:08:12', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(21, 1, 36, 4, NULL, 'NKH-DT-20251103-1924-d3c', 'pending', 0, 'preparing', 'pending', 85.00, 8.50, 9.84, 83.66, 0.00, 'USD', '2025-11-02 19:59:32', NULL, NULL, '2025-11-02 20:23:32', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(22, 1, NULL, 11, NULL, 'NKH-DT-20251009-6111-ffb', 'pending', 0, 'completed', 'pending', 55.00, 5.50, 0.00, 60.50, 0.00, 'USD', '2025-10-08 21:43:36', '2025-10-08 21:43:36', 'On the side', '2025-10-08 22:06:36', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(23, 1, NULL, 8, NULL, 'NKH-DT-20251110-9930-699', 'pending', 0, 'pending', 'pending', 155.50, 15.55, 0.00, 171.05, 0.00, 'USD', '2025-11-10 11:31:52', NULL, 'Extra vegetables', '2025-11-10 12:06:52', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(24, 1, 16, 7, NULL, 'NKH-DT-20251111-4915-7ca', 'pending', 0, 'preparing', 'pending', 84.00, 8.40, 8.11, 84.29, 0.00, 'USD', '2025-11-11 13:39:03', NULL, 'Vegetarian option', '2025-11-11 14:05:03', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(25, 1, 31, 5, NULL, 'NKH-DT-20251106-8360-99d', 'pending', 0, 'pending', 'pending', 81.50, 8.15, 0.00, 89.65, 0.00, 'USD', '2025-11-06 01:29:55', NULL, 'On the side', '2025-11-06 01:53:55', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(26, 1, NULL, 4, NULL, 'NKH-DT-20251029-6250-535', 'pending', 0, 'received', 'pending', 87.50, 8.75, 7.82, 88.43, 0.00, 'USD', '2025-10-28 22:03:01', NULL, NULL, '2025-10-28 22:36:01', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(27, 1, NULL, 7, NULL, 'NKH-DT-20251018-0640-715', 'pending', 0, 'pending', 'pending', 102.00, 10.20, 0.00, 112.20, 0.00, 'USD', '2025-10-18 14:27:25', NULL, NULL, '2025-10-18 14:59:25', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(28, 1, 30, 10, NULL, 'NKH-DT-20251002-1551-94c', 'pending', 0, 'pending', 'pending', 91.00, 9.10, 0.00, 100.10, 0.00, 'USD', '2025-10-02 08:21:30', NULL, 'Less salt', '2025-10-02 08:50:30', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(29, 1, NULL, 3, NULL, 'NKH-DT-20250905-9780-cf0', 'pending', 0, 'ready', 'pending', 27.00, 2.70, 0.00, 29.70, 0.00, 'USD', '2025-09-04 20:21:50', NULL, 'Vegetarian option', '2025-09-04 20:47:50', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(30, 1, 27, 9, NULL, 'NKH-DT-20251112-8551-5a1', 'pending', 0, 'preparing', 'pending', 131.50, 13.15, 0.00, 144.65, 0.00, 'USD', '2025-11-12 06:56:32', NULL, NULL, '2025-11-12 07:24:32', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(31, 1, NULL, 4, NULL, 'NKH-DT-20250902-3359-eb8', 'pending', 0, 'preparing', 'pending', 44.00, 4.40, 0.00, 48.40, 0.00, 'USD', '2025-09-02 06:27:35', NULL, 'Vegetarian option', '2025-09-02 07:06:35', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(32, 1, 35, 10, NULL, 'NKH-DT-20250905-2285-d00', 'pending', 0, 'pending', 'pending', 33.00, 3.30, 0.00, 36.30, 0.00, 'USD', '2025-09-04 22:50:32', NULL, 'No spicy please', '2025-09-04 23:20:32', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(33, 1, NULL, 10, NULL, 'NKH-DT-20250915-6023-138', 'pending', 0, 'preparing', 'pending', 124.00, 12.40, 3.69, 132.71, 0.00, 'USD', '2025-09-15 14:58:12', NULL, 'Gluten free preparation', '2025-09-15 15:31:12', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(34, 1, NULL, 1, NULL, 'NKH-DT-20251113-4644-010', 'pending', 0, 'pending', 'pending', 87.00, 8.70, 0.00, 95.70, 0.00, 'USD', '2025-11-12 21:54:25', NULL, 'Vegetarian option', '2025-11-12 22:19:25', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(35, 1, NULL, 7, NULL, 'NKH-DT-20251103-8912-07e', 'pending', 0, 'pending', 'pending', 118.00, 11.80, 0.00, 129.80, 0.00, 'USD', '2025-11-03 11:42:19', NULL, 'Well done', '2025-11-03 12:04:19', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(36, 1, 19, 1, NULL, 'NKH-DT-20251004-1226-a6f', 'pending', 0, 'completed', 'pending', 115.00, 11.50, 5.07, 121.43, 0.00, 'USD', '2025-10-04 12:49:03', '2025-10-04 12:49:03', 'No spicy please', '2025-10-04 12:29:03', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(37, 1, NULL, 3, NULL, 'NKH-DT-20250916-7056-255', 'pending', 0, 'received', 'pending', 76.50, 7.65, 0.00, 84.15, 0.00, 'USD', '2025-09-16 06:06:19', NULL, 'Gluten free preparation', '2025-09-16 06:52:19', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(38, 1, 8, 10, NULL, 'NKH-DT-20250911-7493-dc0', 'pending', 0, 'completed', 'pending', 20.00, 2.00, 0.00, 22.00, 0.00, 'USD', '2025-09-11 12:14:42', '2025-09-11 12:14:42', 'No spicy please', '2025-09-11 12:09:42', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(39, 1, NULL, 2, NULL, 'NKH-DT-20251002-4371-968', 'pending', 0, 'pending', 'pending', 125.00, 12.50, 0.00, 137.50, 0.00, 'USD', '2025-10-02 16:48:48', NULL, 'Gluten free preparation', '2025-10-02 17:19:48', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(40, 1, NULL, 3, NULL, 'NKH-DT-20250829-4325-ddf', 'pending', 0, 'completed', 'pending', 46.50, 4.65, 6.21, 44.94, 0.00, 'USD', '2025-08-29 05:17:30', '2025-08-29 05:17:30', 'Extra sauce', '2025-08-29 05:21:30', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(41, 1, NULL, 8, NULL, 'NKH-DT-20251009-3456-e1c', 'pending', 0, 'preparing', 'pending', 70.50, 7.05, 0.00, 77.55, 0.00, 'USD', '2025-10-09 03:43:51', NULL, 'On the side', '2025-10-09 04:15:51', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(42, 1, NULL, 11, NULL, 'NKH-DT-20250903-7463-5b8', 'pending', 0, 'completed', 'pending', 188.00, 18.80, 0.00, 206.80, 0.00, 'USD', '2025-09-03 03:37:07', '2025-09-03 03:37:07', 'On the side', '2025-09-03 03:21:07', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(43, 1, NULL, 7, NULL, 'NKH-DT-20251017-9961-41c', 'pending', 0, 'completed', 'pending', 73.50, 7.35, 0.00, 80.85, 0.00, 'USD', '2025-10-17 11:18:03', '2025-10-17 11:18:03', NULL, '2025-10-17 11:26:03', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(44, 1, NULL, 6, NULL, 'NKH-DT-20250914-8406-5f6', 'pending', 0, 'ready', 'pending', 90.50, 9.05, 2.98, 96.57, 0.00, 'USD', '2025-09-14 08:14:44', NULL, NULL, '2025-09-14 08:55:44', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(45, 1, NULL, 11, NULL, 'NKH-DT-20250922-4807-eb9', 'pending', 0, 'ready', 'pending', 24.00, 2.40, 0.00, 26.40, 0.00, 'USD', '2025-09-22 16:09:13', NULL, NULL, '2025-09-22 16:42:13', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(46, 1, NULL, 8, NULL, 'NKH-DT-20251027-6265-e06', 'pending', 0, 'preparing', 'pending', 44.00, 4.40, 0.00, 48.40, 0.00, 'USD', '2025-10-26 22:05:00', NULL, 'Extra vegetables', '2025-10-26 22:42:00', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(47, 1, NULL, 8, NULL, 'NKH-DT-20251014-1060-f34', 'pending', 0, 'received', 'pending', 79.50, 7.95, 9.67, 77.78, 0.00, 'USD', '2025-10-14 01:33:02', NULL, NULL, '2025-10-14 02:07:02', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(48, 1, NULL, 7, NULL, 'NKH-DT-20251010-5808-2b0', 'pending', 0, 'preparing', 'pending', 156.50, 15.65, 0.00, 172.15, 0.00, 'USD', '2025-10-10 00:19:46', NULL, NULL, '2025-10-10 01:09:46', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(49, 1, 33, 7, NULL, 'NKH-DT-20251001-3337-1a1', 'pending', 0, 'pending', 'pending', 155.00, 15.50, 2.53, 167.97, 0.00, 'USD', '2025-09-30 22:50:31', NULL, 'On the side', '2025-09-30 23:16:31', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(50, 1, NULL, 4, NULL, 'NKH-DT-20251027-0038-73f', 'pending', 0, 'ready', 'pending', 63.50, 6.35, 0.00, 69.85, 0.00, 'USD', '2025-10-27 06:56:11', NULL, 'Well done', '2025-10-27 07:23:11', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(51, 1, 15, 2, NULL, 'NKH-DT-20250917-0700-403', 'pending', 0, 'completed', 'pending', 92.50, 9.25, 0.00, 101.75, 0.00, 'USD', '2025-09-16 21:56:12', '2025-09-16 21:56:12', 'Extra vegetables', '2025-09-16 22:01:12', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(52, 1, NULL, 5, NULL, 'NKH-DT-20250926-2227-e60', 'pending', 0, 'pending', 'pending', 27.00, 2.70, 9.58, 20.12, 0.00, 'USD', '2025-09-25 22:56:23', NULL, NULL, '2025-09-25 23:26:23', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(53, 1, NULL, 5, NULL, 'NKH-DT-20251029-1697-0c8', 'pending', 0, 'completed', 'pending', 95.50, 9.55, 0.00, 105.05, 0.00, 'USD', '2025-10-28 23:20:19', '2025-10-28 23:20:19', 'No onions', '2025-10-28 23:23:19', '2025-11-19 01:08:13', '2025-11-19 01:08:14', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(54, 1, NULL, 7, NULL, 'NKH-DT-20250904-0645-498', 'pending', 0, 'ready', 'pending', 181.00, 18.10, 4.71, 194.39, 0.00, 'USD', '2025-09-03 23:57:51', NULL, 'Extra vegetables', '2025-09-04 00:38:51', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(55, 1, NULL, 6, NULL, 'NKH-DT-20251005-0076-c49', 'pending', 0, 'ready', 'pending', 15.00, 1.50, 7.87, 8.63, 0.00, 'USD', '2025-10-04 19:03:46', NULL, NULL, '2025-10-04 19:30:46', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(56, 1, NULL, 9, NULL, 'NKH-DT-20250920-8283-819', 'pending', 0, 'received', 'pending', 33.00, 3.30, 0.00, 36.30, 0.00, 'USD', '2025-09-19 18:38:31', NULL, 'Well done', '2025-09-19 19:14:31', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(57, 1, 9, 10, NULL, 'NKH-DT-20250928-2833-610', 'pending', 0, 'received', 'pending', 70.50, 7.05, 0.00, 77.55, 0.00, 'USD', '2025-09-28 14:45:12', NULL, NULL, '2025-09-28 15:06:12', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(58, 1, NULL, 8, NULL, 'NKH-DT-20251026-4662-c00', 'pending', 0, 'received', 'pending', 169.00, 16.90, 0.00, 185.90, 0.00, 'USD', '2025-10-26 06:06:41', NULL, 'Gluten free preparation', '2025-10-26 06:35:41', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(59, 1, 6, 4, NULL, 'NKH-DT-20251030-5700-91f', 'pending', 0, 'completed', 'pending', 117.00, 11.70, 0.00, 128.70, 0.00, 'USD', '2025-10-30 16:32:42', '2025-10-30 16:32:42', NULL, '2025-10-30 16:19:42', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(60, 1, 12, 2, NULL, 'NKH-DT-20251005-5356-65d', 'pending', 0, 'received', 'pending', 142.00, 14.20, 0.00, 156.20, 0.00, 'USD', '2025-10-05 04:39:53', NULL, 'Extra vegetables', '2025-10-05 05:02:53', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(61, 1, NULL, 3, NULL, 'NKH-DT-20250827-0463-858', 'pending', 0, 'preparing', 'pending', 154.00, 15.40, 0.00, 169.40, 0.00, 'USD', '2025-08-26 19:55:58', NULL, 'Make it spicy', '2025-08-26 20:20:58', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(62, 1, NULL, 1, NULL, 'NKH-DT-20251005-8648-245', 'pending', 0, 'pending', 'pending', 87.00, 8.70, 7.06, 88.64, 0.00, 'USD', '2025-10-05 04:57:09', NULL, 'No onions', '2025-10-05 05:43:09', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(63, 1, NULL, 7, NULL, 'NKH-DT-20251029-0916-edf', 'pending', 0, 'received', 'pending', 95.50, 9.55, 0.00, 105.05, 0.00, 'USD', '2025-10-28 23:19:37', NULL, 'Gluten free preparation', '2025-10-28 23:56:37', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(64, 1, NULL, 1, NULL, 'NKH-DT-20251020-9112-836', 'pending', 0, 'preparing', 'pending', 109.00, 10.90, 0.00, 119.90, 0.00, 'USD', '2025-10-19 18:47:42', NULL, NULL, '2025-10-19 19:14:42', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(65, 1, NULL, 2, NULL, 'NKH-DT-20250919-5834-0d7', 'pending', 0, 'pending', 'pending', 21.50, 2.15, 0.00, 23.65, 0.00, 'USD', '2025-09-19 15:30:03', NULL, 'Extra vegetables', '2025-09-19 15:59:03', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(66, 1, 18, 4, NULL, 'NKH-DT-20251001-5845-cba', 'pending', 0, 'ready', 'pending', 90.50, 9.05, 0.00, 99.55, 0.00, 'USD', '2025-09-30 18:41:11', NULL, 'On the side', '2025-09-30 19:02:11', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(67, 1, 34, 4, NULL, 'NKH-DT-20251012-8207-707', 'pending', 0, 'preparing', 'pending', 13.50, 1.35, 0.00, 14.85, 0.00, 'USD', '2025-10-12 04:26:06', NULL, 'Well done', '2025-10-12 04:53:06', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(68, 1, NULL, 6, NULL, 'NKH-DT-20250820-0684-522', 'pending', 0, 'ready', 'pending', 25.50, 2.55, 0.00, 28.05, 0.00, 'USD', '2025-08-20 10:58:21', NULL, 'Vegetarian option', '2025-08-20 11:25:21', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(69, 1, 23, 4, NULL, 'NKH-DT-20251018-4829-941', 'pending', 0, 'received', 'pending', 112.50, 11.25, 0.00, 123.75, 0.00, 'USD', '2025-10-17 17:14:44', NULL, 'No spicy please', '2025-10-17 17:34:44', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(70, 1, NULL, 10, NULL, 'NKH-DT-20251106-5352-b7b', 'pending', 0, 'pending', 'pending', 64.00, 6.40, 0.00, 70.40, 0.00, 'USD', '2025-11-06 03:35:49', NULL, 'Extra sauce', '2025-11-06 04:15:49', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(71, 1, NULL, 4, NULL, 'NKH-DT-20250920-7479-606', 'pending', 0, 'ready', 'pending', 91.50, 9.15, 0.00, 100.65, 0.00, 'USD', '2025-09-20 12:43:30', NULL, 'No onions', '2025-09-20 13:14:30', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(72, 1, 28, 6, NULL, 'NKH-DT-20250928-4026-c00', 'pending', 0, 'ready', 'pending', 108.50, 10.85, 4.73, 114.62, 0.00, 'USD', '2025-09-28 07:16:35', NULL, NULL, '2025-09-28 07:37:35', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(73, 1, NULL, 2, NULL, 'NKH-DT-20251028-0088-762', 'pending', 0, 'pending', 'pending', 113.50, 11.35, 2.35, 122.50, 0.00, 'USD', '2025-10-28 10:31:41', NULL, NULL, '2025-10-28 11:00:41', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(74, 1, NULL, 7, NULL, 'NKH-DT-20250921-2778-bd2', 'pending', 0, 'preparing', 'pending', 66.00, 6.60, 0.00, 72.60, 0.00, 'USD', '2025-09-21 09:17:01', NULL, NULL, '2025-09-21 09:51:01', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(75, 1, 15, 9, NULL, 'NKH-DT-20251031-3644-8d7', 'pending', 0, 'received', 'pending', 135.00, 13.50, 0.00, 148.50, 0.00, 'USD', '2025-10-31 00:43:27', NULL, 'Extra sauce', '2025-10-31 01:06:27', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(76, 1, 13, 1, NULL, 'NKH-DT-20251011-2837-67a', 'pending', 0, 'pending', 'pending', 125.50, 12.55, 0.00, 138.05, 0.00, 'USD', '2025-10-11 01:26:36', NULL, 'No spicy please', '2025-10-11 01:51:36', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(77, 1, NULL, 8, NULL, 'NKH-DT-20251107-2666-8d0', 'pending', 0, 'completed', 'pending', 39.00, 3.90, 0.00, 42.90, 0.00, 'USD', '2025-11-07 15:25:38', '2025-11-07 15:25:38', 'Extra vegetables', '2025-11-07 15:02:38', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(78, 1, 25, 1, NULL, 'NKH-DT-20250915-0275-198', 'pending', 0, 'completed', 'pending', 61.00, 6.10, 0.00, 67.10, 0.00, 'USD', '2025-09-15 02:30:22', '2025-09-15 02:30:22', 'Vegetarian option', '2025-09-15 02:00:22', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(79, 1, 10, 2, NULL, 'NKH-DT-20251110-6387-d2d', 'pending', 0, 'received', 'pending', 168.00, 16.80, 0.00, 184.80, 0.00, 'USD', '2025-11-10 08:21:00', NULL, NULL, '2025-11-10 08:44:00', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(80, 1, NULL, 4, NULL, 'NKH-DT-20251007-7757-374', 'pending', 0, 'completed', 'pending', 112.00, 11.20, 0.00, 123.20, 0.00, 'USD', '2025-10-06 21:35:29', '2025-10-06 21:35:29', 'No spicy please', '2025-10-06 21:24:29', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(81, 1, NULL, 7, NULL, 'NKH-DT-20251105-1998-c7f', 'pending', 0, 'completed', 'pending', 101.50, 10.15, 0.00, 111.65, 0.00, 'USD', '2025-11-05 00:16:49', '2025-11-05 00:16:49', 'Make it spicy', '2025-11-05 00:16:49', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(82, 1, NULL, 1, NULL, 'NKH-DT-20250927-1690-b5c', 'pending', 0, 'pending', 'pending', 84.00, 8.40, 0.00, 92.40, 0.00, 'USD', '2025-09-26 23:37:30', NULL, 'Extra vegetables', '2025-09-27 00:12:30', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(83, 1, 26, 11, NULL, 'NKH-DT-20250906-0653-c92', 'pending', 0, 'pending', 'pending', 27.00, 2.70, 0.00, 29.70, 0.00, 'USD', '2025-09-06 16:57:51', NULL, 'Extra vegetables', '2025-09-06 17:19:51', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(84, 1, NULL, 4, NULL, 'NKH-DT-20251101-0518-b8a', 'pending', 0, 'ready', 'pending', 129.50, 12.95, 9.75, 132.70, 0.00, 'USD', '2025-11-01 10:49:32', NULL, NULL, '2025-11-01 11:16:32', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(85, 1, NULL, 6, NULL, 'NKH-DT-20250919-7781-361', 'pending', 0, 'ready', 'pending', 92.00, 9.20, 0.00, 101.20, 0.00, 'USD', '2025-09-19 00:35:50', NULL, 'Extra sauce', '2025-09-19 01:10:50', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(86, 1, NULL, 8, NULL, 'NKH-DT-20250826-3811-56f', 'pending', 0, 'pending', 'pending', 41.50, 4.15, 0.00, 45.65, 0.00, 'USD', '2025-08-25 19:22:32', NULL, NULL, '2025-08-25 19:56:32', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(87, 1, 28, 10, NULL, 'NKH-DT-20251104-7179-843', 'pending', 0, 'completed', 'pending', 46.50, 4.65, 7.52, 43.63, 0.00, 'USD', '2025-11-04 12:44:28', '2025-11-04 12:44:28', 'Well done', '2025-11-04 12:30:28', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(88, 1, NULL, 4, NULL, 'NKH-DT-20250922-9213-b7b', 'pending', 0, 'received', 'pending', 40.00, 4.00, 0.00, 44.00, 0.00, 'USD', '2025-09-22 09:34:19', NULL, 'Vegetarian option', '2025-09-22 09:59:19', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(89, 1, 14, 4, NULL, 'NKH-DT-20250902-8960-0d8', 'pending', 0, 'pending', 'pending', 66.00, 6.60, 6.98, 65.62, 0.00, 'USD', '2025-09-02 08:50:25', NULL, NULL, '2025-09-02 09:10:25', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(90, 1, NULL, 7, NULL, 'NKH-DT-20250901-3713-50f', 'pending', 0, 'received', 'pending', 25.50, 2.55, 0.00, 28.05, 0.00, 'USD', '2025-09-01 00:35:34', NULL, 'No onions', '2025-09-01 01:06:34', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(91, 1, 25, 6, NULL, 'NKH-DT-20250909-3878-455', 'pending', 0, 'ready', 'pending', 174.50, 17.45, 0.00, 191.95, 0.00, 'USD', '2025-09-08 22:21:41', NULL, 'No spicy please', '2025-09-08 22:49:41', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(92, 1, 7, 3, NULL, 'NKH-DT-20251003-2892-7aa', 'pending', 0, 'pending', 'pending', 164.50, 16.45, 0.00, 180.95, 0.00, 'USD', '2025-10-03 02:23:04', NULL, NULL, '2025-10-03 02:45:04', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(93, 1, NULL, 3, NULL, 'NKH-DT-20251009-7855-ab8', 'pending', 0, 'preparing', 'pending', 164.00, 16.40, 0.00, 180.40, 0.00, 'USD', '2025-10-09 15:28:16', NULL, 'No onions', '2025-10-09 16:00:16', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(94, 1, NULL, 3, NULL, 'NKH-DT-20251009-2107-543', 'pending', 0, 'ready', 'pending', 100.50, 10.05, 5.97, 104.58, 0.00, 'USD', '2025-10-09 00:31:49', NULL, 'Well done', '2025-10-09 01:04:49', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(95, 1, NULL, 4, NULL, 'NKH-DT-20250929-4414-653', 'pending', 0, 'ready', 'pending', 48.50, 4.85, 0.00, 53.35, 0.00, 'USD', '2025-09-29 09:06:31', NULL, 'No onions', '2025-09-29 09:37:31', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(96, 1, NULL, 9, NULL, 'NKH-DT-20250926-0354-3e9', 'pending', 0, 'received', 'pending', 95.50, 9.55, 0.00, 105.05, 0.00, 'USD', '2025-09-26 13:04:12', NULL, 'No onions', '2025-09-26 13:39:12', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(97, 1, NULL, 9, NULL, 'NKH-DT-20251116-0887-64b', 'pending', 0, 'completed', 'pending', 103.50, 10.35, 0.00, 113.85, 0.00, 'USD', '2025-11-16 05:11:05', '2025-11-16 05:11:05', 'No spicy please', '2025-11-16 04:44:05', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(98, 1, NULL, 11, NULL, 'NKH-DT-20250822-8236-afb', 'pending', 0, 'preparing', 'pending', 11.00, 1.10, 0.00, 12.10, 0.00, 'USD', '2025-08-22 07:05:52', NULL, 'No spicy please', '2025-08-22 07:52:52', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(99, 1, NULL, 9, NULL, 'NKH-DT-20250925-0620-e06', 'pending', 0, 'preparing', 'pending', 22.00, 2.20, 0.00, 24.20, 0.00, 'USD', '2025-09-25 01:14:02', NULL, 'Extra sauce', '2025-09-25 02:00:02', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(100, 1, 36, 9, NULL, 'NKH-DT-20250901-5412-c96', 'pending', 0, 'completed', 'pending', 114.50, 11.45, 0.00, 125.95, 0.00, 'USD', '2025-09-01 00:54:10', '2025-09-01 00:54:10', 'Make it spicy', '2025-09-01 00:21:10', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(101, 1, 36, 11, NULL, 'NKH-DT-20250929-1718-1e1', 'pending', 0, 'ready', 'pending', 102.50, 10.25, 0.00, 112.75, 0.00, 'USD', '2025-09-28 17:25:26', NULL, 'Gluten free preparation', '2025-09-28 17:45:26', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(102, 1, 34, 5, NULL, 'NKH-DT-20250826-3576-ac1', 'pending', 0, 'received', 'pending', 121.50, 12.15, 7.85, 125.80, 0.00, 'USD', '2025-08-26 00:08:38', NULL, 'Extra vegetables', '2025-08-26 00:35:38', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(103, 1, 10, 9, NULL, 'NKH-DT-20250824-8679-216', 'pending', 0, 'received', 'pending', 35.00, 3.50, 0.00, 38.50, 0.00, 'USD', '2025-08-23 19:01:21', NULL, 'Well done', '2025-08-23 19:24:21', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(104, 1, 13, 7, NULL, 'NKH-DT-20251020-0113-b32', 'pending', 0, 'completed', 'pending', 74.50, 7.45, 0.00, 81.95, 0.00, 'USD', '2025-10-20 10:56:41', '2025-10-20 10:56:41', NULL, '2025-10-20 10:30:41', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(105, 1, NULL, 5, NULL, 'NKH-DT-20251003-2750-f9c', 'pending', 0, 'preparing', 'pending', 40.50, 4.05, 0.00, 44.55, 0.00, 'USD', '2025-10-03 11:29:37', NULL, 'Extra vegetables', '2025-10-03 12:08:37', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(106, 1, NULL, 2, NULL, 'NKH-DT-20251018-9823-2a0', 'pending', 0, 'completed', 'pending', 201.00, 20.10, 0.00, 221.10, 0.00, 'USD', '2025-10-17 18:50:32', '2025-10-17 18:50:32', 'Make it spicy', '2025-10-17 18:19:32', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(107, 1, 4, 5, NULL, 'NKH-DT-20251018-1183-7b2', 'pending', 0, 'ready', 'pending', 59.00, 5.90, 0.00, 64.90, 0.00, 'USD', '2025-10-18 06:36:25', NULL, 'Gluten free preparation', '2025-10-18 07:01:25', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(108, 1, NULL, 11, NULL, 'NKH-DT-20251009-5451-0cc', 'pending', 0, 'pending', 'pending', 11.00, 1.10, 0.00, 12.10, 0.00, 'USD', '2025-10-09 13:18:08', NULL, 'No onions', '2025-10-09 13:48:08', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(109, 1, NULL, 3, NULL, 'NKH-DT-20251031-0445-077', 'pending', 0, 'ready', 'pending', 139.50, 13.95, 0.00, 153.45, 0.00, 'USD', '2025-10-30 19:27:04', NULL, NULL, '2025-10-30 20:05:04', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(110, 1, NULL, 1, NULL, 'NKH-DT-20250905-4058-e3c', 'pending', 0, 'ready', 'pending', 7.00, 0.70, 3.03, 4.67, 0.00, 'USD', '2025-09-04 18:28:23', NULL, 'Extra sauce', '2025-09-04 18:58:23', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(111, 1, NULL, 6, NULL, 'NKH-DT-20250914-5217-5ae', 'pending', 0, 'preparing', 'pending', 62.00, 6.20, 7.66, 60.54, 0.00, 'USD', '2025-09-14 07:30:22', NULL, 'Extra vegetables', '2025-09-14 08:14:22', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(112, 1, NULL, 4, NULL, 'NKH-DT-20251006-5261-bb6', 'pending', 0, 'ready', 'pending', 78.00, 7.80, 0.00, 85.80, 0.00, 'USD', '2025-10-06 09:16:37', NULL, 'No spicy please', '2025-10-06 09:55:37', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(113, 1, 24, 3, NULL, 'NKH-DT-20251111-4592-b29', 'pending', 0, 'pending', 'pending', 193.00, 19.30, 4.91, 207.39, 0.00, 'USD', '2025-11-10 17:57:15', NULL, NULL, '2025-11-10 18:20:15', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(114, 1, NULL, 3, NULL, 'NKH-DT-20250820-3334-fb5', 'pending', 0, 'pending', 'pending', 57.00, 5.70, 0.00, 62.70, 0.00, 'USD', '2025-08-20 15:11:35', NULL, 'Gluten free preparation', '2025-08-20 15:56:35', '2025-11-19 01:08:13', '2025-11-19 01:08:15', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(115, 1, 13, 2, NULL, 'NKH-DT-20251015-7477-f53', 'pending', 0, 'received', 'pending', 59.00, 5.90, 0.00, 64.90, 0.00, 'USD', '2025-10-15 06:10:21', NULL, 'Extra vegetables', '2025-10-15 06:31:21', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(116, 1, NULL, 7, NULL, 'NKH-DT-20251013-1281-81b', 'pending', 0, 'completed', 'pending', 79.50, 7.95, 0.00, 87.45, 0.00, 'USD', '2025-10-12 17:40:23', '2025-10-12 17:40:23', NULL, '2025-10-12 17:52:23', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(117, 1, NULL, 10, NULL, 'NKH-DT-20250927-3487-bcd', 'pending', 0, 'preparing', 'pending', 215.50, 21.55, 4.38, 232.67, 0.00, 'USD', '2025-09-27 10:48:53', NULL, NULL, '2025-09-27 11:18:53', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(118, 1, NULL, 2, NULL, 'NKH-DT-20250923-0778-26c', 'pending', 0, 'pending', 'pending', 136.00, 13.60, 0.00, 149.60, 0.00, 'USD', '2025-09-22 23:43:16', NULL, 'Make it spicy', '2025-09-23 00:10:16', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(119, 1, 28, 6, NULL, 'NKH-DT-20250901-8286-a20', 'pending', 0, 'preparing', 'pending', 25.00, 2.50, 0.00, 27.50, 0.00, 'USD', '2025-09-01 13:32:04', NULL, 'Extra vegetables', '2025-09-01 13:53:04', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(120, 1, NULL, 4, NULL, 'NKH-DT-20250930-4073-e28', 'pending', 0, 'ready', 'pending', 131.50, 13.15, 0.00, 144.65, 0.00, 'USD', '2025-09-30 00:57:26', NULL, 'Well done', '2025-09-30 01:31:26', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(121, 1, NULL, 9, NULL, 'NKH-DT-20251023-0384-f70', 'pending', 0, 'completed', 'pending', 51.50, 5.15, 0.00, 56.65, 0.00, 'USD', '2025-10-23 10:31:12', '2025-10-23 10:31:12', 'Make it spicy', '2025-10-23 10:17:12', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(122, 1, NULL, 8, NULL, 'NKH-DT-20250826-0236-556', 'pending', 0, 'pending', 'pending', 120.50, 12.05, 0.00, 132.55, 0.00, 'USD', '2025-08-25 21:33:46', NULL, 'On the side', '2025-08-25 22:07:46', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(123, 1, 6, 2, NULL, 'NKH-DT-20250901-8374-bbe', 'pending', 0, 'received', 'pending', 157.00, 15.70, 0.00, 172.70, 0.00, 'USD', '2025-09-01 08:27:23', NULL, NULL, '2025-09-01 08:52:23', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(124, 1, 15, 3, NULL, 'NKH-DT-20250916-0418-116', 'pending', 0, 'completed', 'pending', 126.50, 12.65, 0.00, 139.15, 0.00, 'USD', '2025-09-16 09:10:24', '2025-09-16 09:10:24', NULL, '2025-09-16 09:03:24', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(125, 1, NULL, 9, NULL, 'NKH-DT-20250829-4554-f25', 'pending', 0, 'completed', 'pending', 36.00, 3.60, 0.00, 39.60, 0.00, 'USD', '2025-08-29 15:59:45', '2025-08-29 15:59:45', 'Gluten free preparation', '2025-08-29 15:38:45', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(126, 1, NULL, 1, NULL, 'NKH-DT-20251026-6321-d2e', 'pending', 0, 'ready', 'pending', 46.50, 4.65, 0.00, 51.15, 0.00, 'USD', '2025-10-25 21:52:32', NULL, 'Extra sauce', '2025-10-25 22:21:32', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(127, 1, NULL, 3, NULL, 'NKH-DT-20251006-6606-1d5', 'pending', 0, 'completed', 'pending', 239.50, 23.95, 0.00, 263.45, 0.00, 'USD', '2025-10-06 09:32:20', '2025-10-06 09:32:20', 'Well done', '2025-10-06 10:01:20', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(128, 1, NULL, 5, NULL, 'NKH-DT-20250822-4488-84d', 'pending', 0, 'ready', 'pending', 154.00, 15.40, 8.21, 161.19, 0.00, 'USD', '2025-08-22 16:55:29', NULL, 'Gluten free preparation', '2025-08-22 17:29:29', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(129, 1, NULL, 5, NULL, 'NKH-DT-20250926-0689-f07', 'pending', 0, 'received', 'pending', 131.00, 13.10, 9.12, 134.98, 0.00, 'USD', '2025-09-26 15:31:51', NULL, 'Gluten free preparation', '2025-09-26 16:05:51', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(130, 1, NULL, 3, NULL, 'NKH-DT-20251119-7445-a22', 'pending', 0, 'preparing', 'pending', 191.00, 19.10, 0.00, 210.10, 0.00, 'USD', '2025-11-18 23:51:29', NULL, 'Gluten free preparation', '2025-11-19 00:24:29', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(131, 1, 30, 5, NULL, 'NKH-DT-20250903-1024-0b1', 'pending', 0, 'preparing', 'pending', 10.50, 1.05, 0.00, 11.55, 0.00, 'USD', '2025-09-03 14:52:03', NULL, 'Less salt', '2025-09-03 15:14:03', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(132, 1, NULL, 8, NULL, 'NKH-DT-20251105-9702-740', 'pending', 0, 'ready', 'pending', 142.50, 14.25, 0.00, 156.75, 0.00, 'USD', '2025-11-05 03:53:45', NULL, 'Well done', '2025-11-05 04:23:45', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(133, 1, 33, 4, NULL, 'NKH-DT-20251117-7091-b70', 'pending', 0, 'preparing', 'pending', 173.50, 17.35, 0.00, 190.85, 0.00, 'USD', '2025-11-17 02:20:57', NULL, 'Well done', '2025-11-17 02:40:57', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(134, 1, 3, 5, NULL, 'NKH-DT-20251022-5179-409', 'pending', 0, 'pending', 'pending', 16.50, 1.65, 9.55, 8.60, 0.00, 'USD', '2025-10-21 17:42:34', NULL, NULL, '2025-10-21 18:08:34', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(135, 1, 18, 6, NULL, 'NKH-DT-20251003-9561-e71', 'pending', 0, 'preparing', 'pending', 47.50, 4.75, 5.02, 47.23, 0.00, 'USD', '2025-10-03 15:19:55', NULL, 'Make it spicy', '2025-10-03 15:44:55', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(136, 1, 15, 9, NULL, 'NKH-DT-20250819-3345-eb5', 'pending', 0, 'received', 'pending', 58.00, 5.80, 0.00, 63.80, 0.00, 'USD', '2025-08-19 10:43:42', NULL, 'Vegetarian option', '2025-08-19 11:08:42', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(137, 1, NULL, 9, NULL, 'NKH-DT-20250830-1266-fc0', 'pending', 0, 'received', 'pending', 190.50, 19.05, 0.00, 209.55, 0.00, 'USD', '2025-08-30 02:32:26', NULL, 'On the side', '2025-08-30 03:10:26', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(138, 1, NULL, 9, NULL, 'NKH-DT-20251026-6395-3d8', 'pending', 0, 'ready', 'pending', 125.50, 12.55, 0.00, 138.05, 0.00, 'USD', '2025-10-25 21:25:57', NULL, NULL, '2025-10-25 21:46:57', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(139, 1, NULL, 10, NULL, 'NKH-DT-20251110-4384-1f5', 'pending', 0, 'pending', 'pending', 20.50, 2.05, 0.00, 22.55, 0.00, 'USD', '2025-11-10 00:42:38', NULL, 'Less salt', '2025-11-10 01:06:38', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(140, 1, NULL, 3, NULL, 'NKH-DT-20251023-1010-46d', 'pending', 0, 'pending', 'pending', 107.00, 10.70, 0.00, 117.70, 0.00, 'USD', '2025-10-23 05:54:10', NULL, NULL, '2025-10-23 06:29:10', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(141, 1, NULL, 10, NULL, 'NKH-DT-20251106-1425-19f', 'pending', 0, 'pending', 'pending', 24.50, 2.45, 0.00, 26.95, 0.00, 'USD', '2025-11-06 13:44:38', NULL, NULL, '2025-11-06 14:15:38', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(142, 1, NULL, 4, NULL, 'NKH-DT-20250828-2321-72b', 'pending', 0, 'completed', 'pending', 76.50, 7.65, 0.00, 84.15, 0.00, 'USD', '2025-08-27 23:36:41', '2025-08-27 23:36:41', NULL, '2025-08-27 23:12:41', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(143, 1, 3, 1, NULL, 'NKH-DT-20250820-4183-fcf', 'pending', 0, 'preparing', 'pending', 6.00, 0.60, 0.00, 6.60, 0.00, 'USD', '2025-08-19 20:22:18', NULL, 'Gluten free preparation', '2025-08-19 20:46:18', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(144, 1, NULL, 7, NULL, 'NKH-DT-20251102-8453-081', 'pending', 0, 'pending', 'pending', 67.50, 6.75, 0.00, 74.25, 0.00, 'USD', '2025-11-02 05:53:12', NULL, 'No onions', '2025-11-02 06:21:12', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(145, 1, 14, 4, NULL, 'NKH-DT-20251007-8782-b43', 'pending', 0, 'ready', 'pending', 47.00, 4.70, 0.00, 51.70, 0.00, 'USD', '2025-10-06 19:59:09', NULL, 'Vegetarian option', '2025-10-06 20:25:09', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(146, 1, NULL, 1, NULL, 'NKH-DT-20251018-9135-92e', 'pending', 0, 'ready', 'pending', 222.50, 22.25, 0.00, 244.75, 0.00, 'USD', '2025-10-17 17:09:43', NULL, 'No spicy please', '2025-10-17 17:42:43', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(147, 1, NULL, 5, NULL, 'NKH-DT-20251113-8389-038', 'pending', 0, 'pending', 'pending', 42.00, 4.20, 0.00, 46.20, 0.00, 'USD', '2025-11-12 23:23:15', NULL, NULL, '2025-11-12 23:47:15', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(148, 1, 14, 11, NULL, 'NKH-DT-20250902-8730-233', 'pending', 0, 'completed', 'pending', 53.50, 5.35, 9.21, 49.64, 0.00, 'USD', '2025-09-01 19:14:01', '2025-09-01 19:14:01', 'No onions', '2025-09-01 19:09:01', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(149, 1, 28, 10, NULL, 'NKH-DT-20250914-9799-613', 'pending', 0, 'preparing', 'pending', 55.50, 5.55, 0.00, 61.05, 0.00, 'USD', '2025-09-14 00:38:00', NULL, NULL, '2025-09-14 01:02:00', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(150, 1, NULL, 1, NULL, 'NKH-DT-20251104-0120-2d0', 'pending', 0, 'preparing', 'pending', 8.00, 0.80, 0.00, 8.80, 0.00, 'USD', '2025-11-04 00:42:24', NULL, NULL, '2025-11-04 01:29:24', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(151, 1, NULL, 1, NULL, 'NKH-DT-20250917-0970-2a7', 'pending', 0, 'received', 'pending', 26.50, 2.65, 0.00, 29.15, 0.00, 'USD', '2025-09-16 21:50:37', NULL, 'Make it spicy', '2025-09-16 22:18:37', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(152, 1, NULL, 9, NULL, 'NKH-DT-20250920-9732-b59', 'pending', 0, 'received', 'pending', 108.00, 10.80, 0.00, 118.80, 0.00, 'USD', '2025-09-20 07:40:51', NULL, 'Gluten free preparation', '2025-09-20 08:14:51', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(153, 1, NULL, 1, NULL, 'NKH-DT-20251007-2786-8f4', 'pending', 0, 'completed', 'pending', 58.00, 5.80, 0.00, 63.80, 0.00, 'USD', '2025-10-07 02:12:15', '2025-10-07 02:12:15', 'Extra sauce', '2025-10-07 02:11:15', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(154, 1, 27, 10, NULL, 'NKH-DT-20250901-4920-4d8', 'pending', 0, 'completed', 'pending', 261.00, 26.10, 0.00, 287.10, 0.00, 'USD', '2025-09-01 10:55:38', '2025-09-01 10:55:38', 'Make it spicy', '2025-09-01 10:19:38', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(155, 1, 10, 9, NULL, 'NKH-DT-20251017-2940-5f3', 'pending', 0, 'preparing', 'pending', 85.00, 8.50, 0.00, 93.50, 0.00, 'USD', '2025-10-16 21:21:23', NULL, 'Extra vegetables', '2025-10-16 21:50:23', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(156, 1, 10, 1, NULL, 'NKH-DT-20251025-8276-726', 'pending', 0, 'ready', 'pending', 188.00, 18.80, 0.00, 206.80, 0.00, 'USD', '2025-10-25 03:17:41', NULL, NULL, '2025-10-25 03:46:41', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(157, 1, NULL, 3, NULL, 'NKH-DT-20250821-6625-526', 'pending', 0, 'completed', 'pending', 50.50, 5.05, 0.00, 55.55, 0.00, 'USD', '2025-08-20 19:57:58', '2025-08-20 19:57:58', 'On the side', '2025-08-20 19:37:58', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(158, 1, NULL, 6, NULL, 'NKH-DT-20250821-5933-6de', 'pending', 0, 'received', 'pending', 208.50, 20.85, 0.00, 229.35, 0.00, 'USD', '2025-08-21 00:17:50', NULL, 'On the side', '2025-08-21 00:50:50', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(159, 1, NULL, 10, NULL, 'NKH-DT-20251101-7510-980', 'pending', 0, 'received', 'pending', 27.00, 2.70, 0.00, 29.70, 0.00, 'USD', '2025-11-01 04:14:50', NULL, NULL, '2025-11-01 04:37:50', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(160, 1, NULL, 9, NULL, 'NKH-DT-20251002-7550-c27', 'pending', 0, 'received', 'pending', 149.00, 14.90, 0.00, 163.90, 0.00, 'USD', '2025-10-02 10:04:02', NULL, 'Gluten free preparation', '2025-10-02 10:34:02', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(161, 1, 36, 8, NULL, 'NKH-DT-20251001-2124-111', 'pending', 0, 'ready', 'pending', 67.50, 6.75, 0.00, 74.25, 0.00, 'USD', '2025-09-30 22:53:08', NULL, NULL, '2025-09-30 23:15:08', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(162, 1, NULL, 2, NULL, 'NKH-DT-20250905-4995-3ff', 'pending', 0, 'pending', 'pending', 36.50, 3.65, 6.40, 33.75, 0.00, 'USD', '2025-09-04 19:47:24', NULL, 'Vegetarian option', '2025-09-04 20:08:24', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(163, 1, 3, 2, NULL, 'NKH-DT-20251027-7010-f60', 'pending', 0, 'received', 'pending', 73.50, 7.35, 0.00, 80.85, 0.00, 'USD', '2025-10-27 13:45:10', NULL, 'Gluten free preparation', '2025-10-27 14:07:10', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0);
INSERT INTO `orders` (`id`, `location_id`, `table_id`, `customer_id`, `employee_id`, `order_number`, `preparation_status`, `priority`, `status`, `approval_status`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `service_charge`, `currency`, `ordered_at`, `completed_at`, `special_instructions`, `estimated_ready_time`, `created_at`, `updated_at`, `order_type`, `customer_address_id`, `payment_status`, `scheduled_at`, `kitchen_submitted_at`, `approved_by`, `approved_at`, `rejection_reason`, `is_auto_approved`) VALUES
(164, 1, NULL, 8, NULL, 'NKH-DT-20250906-8092-8cd', 'pending', 0, 'ready', 'pending', 23.00, 2.30, 0.00, 25.30, 0.00, 'USD', '2025-09-06 13:03:06', NULL, 'Less salt', '2025-09-06 13:35:06', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(165, 1, NULL, 3, NULL, 'NKH-DT-20250901-6264-1ec', 'pending', 0, 'received', 'pending', 195.00, 19.50, 8.57, 205.93, 0.00, 'USD', '2025-09-01 13:14:08', NULL, NULL, '2025-09-01 13:54:08', '2025-11-19 01:08:13', '2025-11-19 01:08:16', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(166, 1, NULL, 1, NULL, 'NKH-DT-20251026-7297-bfc', 'pending', 0, 'received', 'pending', 156.00, 15.60, 0.00, 171.60, 0.00, 'USD', '2025-10-26 14:08:51', NULL, NULL, '2025-10-26 14:31:51', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(167, 1, NULL, 9, NULL, 'NKH-DT-20250922-2605-a2c', 'pending', 0, 'preparing', 'pending', 78.50, 7.85, 0.00, 86.35, 0.00, 'USD', '2025-09-21 18:08:50', NULL, 'No onions', '2025-09-21 18:45:50', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(168, 1, 26, 3, NULL, 'NKH-DT-20251108-1967-81b', 'pending', 0, 'received', 'pending', 168.50, 16.85, 0.00, 185.35, 0.00, 'USD', '2025-11-08 12:37:03', NULL, NULL, '2025-11-08 13:02:03', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(169, 1, NULL, 2, NULL, 'NKH-DT-20250829-9247-860', 'pending', 0, 'preparing', 'pending', 23.00, 2.30, 0.00, 25.30, 0.00, 'USD', '2025-08-28 21:48:50', NULL, 'Extra sauce', '2025-08-28 22:09:50', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(170, 1, NULL, 9, NULL, 'NKH-DT-20250910-2179-d6e', 'pending', 0, 'ready', 'pending', 8.50, 0.85, 0.00, 9.35, 0.00, 'USD', '2025-09-10 00:52:29', NULL, NULL, '2025-09-10 01:18:29', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(171, 1, 33, 1, NULL, 'NKH-DT-20250916-4379-967', 'pending', 0, 'pending', 'pending', 62.00, 6.20, 9.18, 59.02, 0.00, 'USD', '2025-09-16 09:32:52', NULL, 'Well done', '2025-09-16 09:57:52', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(172, 1, 30, 10, NULL, 'NKH-DT-20251014-8236-369', 'pending', 0, 'received', 'pending', 218.00, 21.80, 5.60, 234.20, 0.00, 'USD', '2025-10-13 17:21:54', NULL, 'Well done', '2025-10-13 17:51:54', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(173, 1, NULL, 8, NULL, 'NKH-DT-20251028-9537-b3a', 'pending', 0, 'completed', 'pending', 175.00, 17.50, 2.93, 189.57, 0.00, 'USD', '2025-10-28 03:43:14', '2025-10-28 03:43:14', NULL, '2025-10-28 03:50:14', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(174, 1, 23, 10, NULL, 'NKH-DT-20251015-4675-c39', 'pending', 0, 'preparing', 'pending', 63.50, 6.35, 4.45, 65.40, 0.00, 'USD', '2025-10-14 18:31:26', NULL, 'Gluten free preparation', '2025-10-14 18:53:26', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(175, 1, 2, 9, NULL, 'NKH-DT-20250917-4086-a58', 'pending', 0, 'completed', 'pending', 147.00, 14.70, 0.00, 161.70, 0.00, 'USD', '2025-09-16 17:58:27', '2025-09-16 17:58:27', 'Extra sauce', '2025-09-16 17:44:27', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(176, 1, NULL, 3, NULL, 'NKH-DT-20250918-6076-252', 'pending', 0, 'completed', 'pending', 138.00, 13.80, 0.00, 151.80, 0.00, 'USD', '2025-09-17 19:41:23', '2025-09-17 19:41:23', 'No spicy please', '2025-09-17 19:44:23', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(177, 1, 3, 4, NULL, 'NKH-DT-20251116-2297-75a', 'pending', 0, 'pending', 'pending', 150.00, 15.00, 0.00, 165.00, 0.00, 'USD', '2025-11-15 22:50:44', NULL, 'Less salt', '2025-11-15 23:16:44', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(178, 1, NULL, 9, NULL, 'NKH-DT-20251008-7052-90c', 'pending', 0, 'ready', 'pending', 29.00, 2.90, 0.00, 31.90, 0.00, 'USD', '2025-10-07 23:55:48', NULL, 'No spicy please', '2025-10-08 00:17:48', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(179, 1, NULL, 2, NULL, 'NKH-DT-20251115-6162-da4', 'pending', 0, 'pending', 'pending', 101.00, 10.10, 0.00, 111.10, 0.00, 'USD', '2025-11-14 23:59:30', NULL, 'Extra sauce', '2025-11-15 00:48:30', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(180, 1, NULL, 4, NULL, 'NKH-DT-20251117-2527-882', 'pending', 0, 'received', 'pending', 24.00, 2.40, 9.17, 17.23, 0.00, 'USD', '2025-11-17 02:35:36', NULL, NULL, '2025-11-17 02:55:36', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(181, 1, NULL, 8, NULL, 'NKH-DT-20250928-8180-b5b', 'pending', 0, 'received', 'pending', 134.00, 13.40, 0.00, 147.40, 0.00, 'USD', '2025-09-28 04:38:37', NULL, 'On the side', '2025-09-28 05:19:37', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(182, 1, NULL, 8, NULL, 'NKH-DT-20250902-1637-8b7', 'pending', 0, 'preparing', 'pending', 179.50, 17.95, 0.00, 197.45, 0.00, 'USD', '2025-09-02 09:38:22', NULL, 'Less salt', '2025-09-02 10:11:22', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(183, 1, 17, 10, NULL, 'NKH-DT-20250907-5466-cf4', 'pending', 0, 'preparing', 'pending', 104.00, 10.40, 0.00, 114.40, 0.00, 'USD', '2025-09-07 00:13:45', NULL, 'Gluten free preparation', '2025-09-07 00:41:45', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(184, 1, NULL, 3, NULL, 'NKH-DT-20250910-6459-ffb', 'pending', 0, 'pending', 'pending', 93.00, 9.30, 0.00, 102.30, 0.00, 'USD', '2025-09-10 06:34:57', NULL, 'Extra sauce', '2025-09-10 07:01:57', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(185, 1, 4, 8, NULL, 'NKH-DT-20250822-5474-a79', 'pending', 0, 'pending', 'pending', 115.50, 11.55, 0.00, 127.05, 0.00, 'USD', '2025-08-22 15:32:38', NULL, 'No spicy please', '2025-08-22 15:52:38', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(186, 1, NULL, 4, NULL, 'NKH-DT-20251019-7408-e2f', 'pending', 0, 'received', 'pending', 60.00, 6.00, 8.40, 57.60, 0.00, 'USD', '2025-10-19 16:04:11', NULL, NULL, '2025-10-19 16:29:11', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(187, 1, NULL, 6, NULL, 'NKH-DT-20251013-7846-90d', 'pending', 0, 'received', 'pending', 139.50, 13.95, 0.00, 153.45, 0.00, 'USD', '2025-10-13 14:05:28', NULL, 'No onions', '2025-10-13 14:29:28', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(188, 1, NULL, 8, NULL, 'NKH-DT-20251102-2928-5dc', 'pending', 0, 'preparing', 'pending', 93.00, 9.30, 0.00, 102.30, 0.00, 'USD', '2025-11-01 22:34:20', NULL, NULL, '2025-11-01 23:02:20', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(189, 1, 25, 11, NULL, 'NKH-DT-20251029-8831-055', 'pending', 0, 'completed', 'pending', 36.00, 3.60, 2.35, 37.25, 0.00, 'USD', '2025-10-29 07:37:01', '2025-10-29 07:37:01', 'Extra sauce', '2025-10-29 07:39:01', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(190, 1, 8, 4, NULL, 'NKH-DT-20251112-7355-7be', 'pending', 0, 'received', 'pending', 134.50, 13.45, 0.00, 147.95, 0.00, 'USD', '2025-11-11 23:26:02', NULL, NULL, '2025-11-11 23:56:02', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(191, 1, 16, 10, NULL, 'NKH-DT-20250925-7810-3f0', 'pending', 0, 'pending', 'pending', 156.50, 15.65, 0.00, 172.15, 0.00, 'USD', '2025-09-24 22:32:44', NULL, 'Well done', '2025-09-24 23:00:44', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(192, 1, NULL, 2, NULL, 'NKH-DT-20251114-3870-ecb', 'pending', 0, 'completed', 'pending', 77.00, 7.70, 4.56, 80.14, 0.00, 'USD', '2025-11-13 18:34:46', '2025-11-13 18:34:46', 'Gluten free preparation', '2025-11-13 18:35:46', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(193, 1, NULL, 7, NULL, 'NKH-DT-20250919-2982-1e4', 'pending', 0, 'completed', 'pending', 112.50, 11.25, 9.54, 114.21, 0.00, 'USD', '2025-09-19 01:39:14', '2025-09-19 01:39:14', NULL, '2025-09-19 01:27:14', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(194, 1, NULL, 1, NULL, 'NKH-DT-20251016-9125-6d8', 'pending', 0, 'preparing', 'pending', 100.50, 10.05, 0.00, 110.55, 0.00, 'USD', '2025-10-16 08:47:58', NULL, NULL, '2025-10-16 09:31:58', '2025-11-19 01:08:13', '2025-11-19 01:08:17', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(195, 1, 20, 11, NULL, 'NKH-DT-20251003-5101-39a', 'pending', 0, 'completed', 'pending', 181.50, 18.15, 2.42, 197.23, 0.00, 'USD', '2025-10-03 02:55:01', '2025-10-03 02:55:01', 'No onions', '2025-10-03 02:18:01', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(196, 1, 26, 7, NULL, 'NKH-DT-20251104-8065-100', 'pending', 0, 'ready', 'pending', 47.00, 4.70, 0.00, 51.70, 0.00, 'USD', '2025-11-04 12:32:12', NULL, 'Make it spicy', '2025-11-04 12:54:12', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(197, 1, NULL, 2, NULL, 'NKH-DT-20251114-9608-ea3', 'pending', 0, 'received', 'pending', 155.00, 15.50, 0.00, 170.50, 0.00, 'USD', '2025-11-13 20:06:23', NULL, 'Make it spicy', '2025-11-13 20:46:23', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(198, 1, NULL, 5, NULL, 'NKH-DT-20250917-6771-39b', 'pending', 0, 'pending', 'pending', 34.00, 3.40, 0.00, 37.40, 0.00, 'USD', '2025-09-16 20:11:00', NULL, 'Vegetarian option', '2025-09-16 20:32:00', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(199, 1, NULL, 4, NULL, 'NKH-DT-20251116-5539-4c5', 'pending', 0, 'ready', 'pending', 130.00, 13.00, 0.00, 143.00, 0.00, 'USD', '2025-11-16 04:10:20', NULL, 'Gluten free preparation', '2025-11-16 04:45:20', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(200, 1, NULL, 10, NULL, 'NKH-DT-20250921-9591-54c', 'pending', 0, 'received', 'pending', 107.50, 10.75, 0.00, 118.25, 0.00, 'USD', '2025-09-21 02:11:40', NULL, NULL, '2025-09-21 02:36:40', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(201, 1, NULL, 11, NULL, 'NKH-DT-20251107-8925-1b1', 'pending', 0, 'preparing', 'pending', 142.50, 14.25, 8.88, 147.87, 0.00, 'USD', '2025-11-07 03:53:32', NULL, 'Gluten free preparation', '2025-11-07 04:29:32', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(202, 1, NULL, 4, NULL, 'NKH-DT-20251009-5597-180', 'pending', 0, 'received', 'pending', 170.00, 17.00, 8.70, 178.30, 0.00, 'USD', '2025-10-09 13:24:19', NULL, 'Vegetarian option', '2025-10-09 13:57:19', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(203, 1, NULL, 10, NULL, 'NKH-DT-20251110-5616-9bf', 'pending', 0, 'completed', 'pending', 104.50, 10.45, 6.51, 108.44, 0.00, 'USD', '2025-11-10 07:37:05', '2025-11-10 07:37:05', 'Less salt', '2025-11-10 07:16:05', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(204, 1, NULL, 9, NULL, 'NKH-DT-20250825-7361-c34', 'pending', 0, 'received', 'pending', 93.50, 9.35, 0.00, 102.85, 0.00, 'USD', '2025-08-24 23:00:09', NULL, 'On the side', '2025-08-24 23:34:09', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(205, 1, NULL, 5, NULL, 'NKH-DT-20251117-1191-bb3', 'pending', 0, 'completed', 'pending', 31.50, 3.15, 0.00, 34.65, 0.00, 'USD', '2025-11-17 11:31:18', '2025-11-17 11:31:18', 'On the side', '2025-11-17 11:20:18', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(206, 1, 25, 11, NULL, 'NKH-DT-20251028-1858-6eb', 'pending', 0, 'received', 'pending', 162.00, 16.20, 9.34, 168.86, 0.00, 'USD', '2025-10-28 01:04:53', NULL, 'Less salt', '2025-10-28 01:34:53', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(207, 1, 36, 1, NULL, 'NKH-DT-20250824-6178-c5a', 'pending', 0, 'ready', 'pending', 131.50, 13.15, 0.00, 144.65, 0.00, 'USD', '2025-08-24 05:34:12', NULL, NULL, '2025-08-24 05:54:12', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(208, 1, 20, 7, NULL, 'NKH-DT-20251115-9343-779', 'pending', 0, 'ready', 'pending', 147.00, 14.70, 0.00, 161.70, 0.00, 'USD', '2025-11-15 11:07:31', NULL, 'No onions', '2025-11-15 11:27:31', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(209, 1, 10, 11, NULL, 'NKH-DT-20251001-9662-bc4', 'pending', 0, 'received', 'pending', 8.00, 0.80, 0.00, 8.80, 0.00, 'USD', '2025-09-30 22:42:41', NULL, 'Gluten free preparation', '2025-09-30 23:11:41', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(210, 1, 31, 7, NULL, 'NKH-DT-20251115-2158-b2a', 'pending', 0, 'preparing', 'pending', 165.50, 16.55, 0.00, 182.05, 0.00, 'USD', '2025-11-15 08:31:49', NULL, 'Less salt', '2025-11-15 08:55:49', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(211, 1, NULL, 3, NULL, 'NKH-DT-20250902-4816-c3c', 'pending', 0, 'ready', 'pending', 271.00, 27.10, 0.00, 298.10, 0.00, 'USD', '2025-09-02 14:57:55', NULL, NULL, '2025-09-02 15:22:55', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(212, 1, NULL, 5, NULL, 'NKH-DT-20251018-1927-a2e', 'pending', 0, 'preparing', 'pending', 70.50, 7.05, 0.00, 77.55, 0.00, 'USD', '2025-10-18 05:42:20', NULL, 'Less salt', '2025-10-18 06:13:20', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(213, 1, NULL, 11, NULL, 'NKH-DT-20251006-0714-ee0', 'pending', 0, 'completed', 'pending', 131.50, 13.15, 0.00, 144.65, 0.00, 'USD', '2025-10-06 06:11:08', '2025-10-06 06:11:08', NULL, '2025-10-06 06:14:08', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(214, 1, NULL, 2, NULL, 'NKH-DT-20251009-5123-360', 'pending', 0, 'pending', 'pending', 3.50, 0.35, 5.86, -2.01, 0.00, 'USD', '2025-10-09 05:21:51', NULL, 'Extra vegetables', '2025-10-09 05:46:51', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(215, 1, NULL, 3, NULL, 'NKH-DT-20250925-7247-b19', 'pending', 0, 'received', 'pending', 47.50, 4.75, 0.00, 52.25, 0.00, 'USD', '2025-09-25 11:25:40', NULL, 'Well done', '2025-09-25 12:10:40', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(216, 1, NULL, 8, NULL, 'NKH-DT-20250918-2192-2f4', 'pending', 0, 'pending', 'pending', 97.50, 9.75, 0.00, 107.25, 0.00, 'USD', '2025-09-18 06:05:39', NULL, 'Vegetarian option', '2025-09-18 06:49:39', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(217, 1, 13, 6, NULL, 'NKH-DT-20251002-4074-27e', 'pending', 0, 'received', 'pending', 135.50, 13.55, 0.00, 149.05, 0.00, 'USD', '2025-10-01 18:45:32', NULL, 'Extra sauce', '2025-10-01 19:07:32', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(218, 1, NULL, 9, NULL, 'NKH-DT-20251103-8302-1ee', 'pending', 0, 'pending', 'pending', 62.00, 6.20, 0.00, 68.20, 0.00, 'USD', '2025-11-02 21:56:34', NULL, 'No spicy please', '2025-11-02 22:27:34', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(219, 1, 16, 7, NULL, 'NKH-DT-20251117-9456-982', 'pending', 0, 'pending', 'pending', 118.00, 11.80, 0.00, 129.80, 0.00, 'USD', '2025-11-17 07:14:54', NULL, 'Gluten free preparation', '2025-11-17 07:43:54', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(220, 1, NULL, 8, NULL, 'NKH-DT-20250921-7830-313', 'pending', 0, 'ready', 'pending', 42.00, 4.20, 0.00, 46.20, 0.00, 'USD', '2025-09-21 14:42:03', NULL, 'Less salt', '2025-09-21 15:18:03', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(221, 1, NULL, 7, NULL, 'NKH-DT-20250820-2738-4d7', 'pending', 0, 'completed', 'pending', 96.00, 9.60, 0.00, 105.60, 0.00, 'USD', '2025-08-20 05:38:46', '2025-08-20 05:38:46', NULL, '2025-08-20 05:33:46', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(222, 1, NULL, 5, NULL, 'NKH-DT-20251007-7812-129', 'pending', 0, 'ready', 'pending', 9.00, 0.90, 0.00, 9.90, 0.00, 'USD', '2025-10-06 23:21:45', NULL, 'Extra vegetables', '2025-10-06 23:54:45', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(223, 1, NULL, 10, NULL, 'NKH-DT-20251019-0498-0e3', 'pending', 0, 'pending', 'pending', 66.00, 6.60, 3.15, 69.45, 0.00, 'USD', '2025-10-19 08:34:50', NULL, 'Extra vegetables', '2025-10-19 09:06:50', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(224, 1, NULL, 9, NULL, 'NKH-DT-20250907-7543-5d1', 'pending', 0, 'completed', 'pending', 183.50, 18.35, 0.00, 201.85, 0.00, 'USD', '2025-09-07 02:36:12', '2025-09-07 02:36:12', NULL, '2025-09-07 02:33:12', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(225, 1, NULL, 2, NULL, 'NKH-DT-20251008-9024-0f8', 'pending', 0, 'ready', 'pending', 129.50, 12.95, 0.00, 142.45, 0.00, 'USD', '2025-10-07 18:02:37', NULL, 'Gluten free preparation', '2025-10-07 18:36:37', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(226, 1, NULL, 5, NULL, 'NKH-DT-20251017-7902-d9c', 'pending', 0, 'completed', 'pending', 152.00, 15.20, 4.86, 162.34, 0.00, 'USD', '2025-10-17 11:00:45', '2025-10-17 11:00:45', NULL, '2025-10-17 10:45:45', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(227, 1, 3, 4, NULL, 'NKH-DT-20251110-6724-393', 'pending', 0, 'preparing', 'pending', 138.00, 13.80, 0.00, 151.80, 0.00, 'USD', '2025-11-09 22:56:13', NULL, 'Vegetarian option', '2025-11-09 23:20:13', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(228, 1, NULL, 11, NULL, 'NKH-DT-20250922-5292-829', 'pending', 0, 'preparing', 'pending', 16.00, 1.60, 0.00, 17.60, 0.00, 'USD', '2025-09-22 12:08:20', NULL, NULL, '2025-09-22 12:40:20', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(229, 1, 28, 6, NULL, 'NKH-DT-20251110-6607-494', 'pending', 0, 'ready', 'pending', 81.00, 8.10, 7.26, 81.84, 0.00, 'USD', '2025-11-09 23:44:40', NULL, 'Make it spicy', '2025-11-10 00:12:40', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(230, 1, NULL, 1, NULL, 'NKH-DT-20251003-5095-9d7', 'pending', 0, 'received', 'pending', 65.50, 6.55, 0.00, 72.05, 0.00, 'USD', '2025-10-02 20:16:51', NULL, 'Extra vegetables', '2025-10-02 21:05:51', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(231, 1, NULL, 8, NULL, 'NKH-DT-20251118-2959-024', 'pending', 0, 'received', 'pending', 105.50, 10.55, 0.00, 116.05, 0.00, 'USD', '2025-11-18 13:38:12', NULL, 'No spicy please', '2025-11-18 13:59:12', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(232, 1, 13, 3, NULL, 'NKH-DT-20251023-3991-057', 'pending', 0, 'received', 'pending', 145.00, 14.50, 0.00, 159.50, 0.00, 'USD', '2025-10-23 07:44:21', NULL, NULL, '2025-10-23 08:10:21', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(233, 1, NULL, 4, NULL, 'NKH-DT-20250918-8674-aee', 'pending', 0, 'pending', 'pending', 155.00, 15.50, 0.00, 170.50, 0.00, 'USD', '2025-09-17 19:01:21', NULL, 'Less salt', '2025-09-17 19:35:21', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(234, 1, NULL, 6, NULL, 'NKH-DT-20250909-2723-fac', 'pending', 0, 'received', 'pending', 124.50, 12.45, 0.00, 136.95, 0.00, 'USD', '2025-09-09 13:12:15', NULL, 'Make it spicy', '2025-09-09 13:49:15', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(235, 1, NULL, 11, NULL, 'NKH-DT-20250829-1579-098', 'pending', 0, 'pending', 'pending', 19.50, 1.95, 6.75, 14.70, 0.00, 'USD', '2025-08-29 03:17:15', NULL, NULL, '2025-08-29 04:02:15', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(236, 1, NULL, 8, NULL, 'NKH-DT-20251105-7803-cd7', 'pending', 0, 'ready', 'pending', 86.00, 8.60, 9.43, 85.17, 0.00, 'USD', '2025-11-04 18:28:38', NULL, 'Extra sauce', '2025-11-04 19:01:38', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(237, 1, NULL, 10, NULL, 'NKH-DT-20251009-2909-9ac', 'pending', 0, 'ready', 'pending', 43.00, 4.30, 0.00, 47.30, 0.00, 'USD', '2025-10-09 10:57:41', NULL, 'Vegetarian option', '2025-10-09 11:39:41', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(238, 1, NULL, 9, NULL, 'NKH-DT-20250911-3750-9d1', 'pending', 0, 'preparing', 'pending', 72.00, 7.20, 0.00, 79.20, 0.00, 'USD', '2025-09-11 06:12:41', NULL, NULL, '2025-09-11 06:38:41', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(239, 1, 29, 9, NULL, 'NKH-DT-20251028-9420-3ee', 'pending', 0, 'ready', 'pending', 93.00, 9.30, 0.00, 102.30, 0.00, 'USD', '2025-10-28 08:07:01', NULL, NULL, '2025-10-28 08:36:01', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(240, 1, 15, 1, NULL, 'NKH-DT-20250824-7688-a83', 'pending', 0, 'completed', 'pending', 21.00, 2.10, 0.00, 23.10, 0.00, 'USD', '2025-08-24 08:20:50', '2025-08-24 08:20:50', 'On the side', '2025-08-24 08:02:50', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(241, 1, 32, 6, NULL, 'NKH-DT-20251031-8691-aeb', 'pending', 0, 'pending', 'pending', 13.00, 1.30, 0.00, 14.30, 0.00, 'USD', '2025-10-31 07:24:34', NULL, 'Vegetarian option', '2025-10-31 07:45:34', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(242, 1, NULL, 7, NULL, 'NKH-DT-20251102-4059-771', 'pending', 0, 'received', 'pending', 26.50, 2.65, 0.00, 29.15, 0.00, 'USD', '2025-11-01 19:15:51', NULL, NULL, '2025-11-01 19:49:51', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(243, 1, NULL, 6, NULL, 'NKH-DT-20251010-4255-90d', 'pending', 0, 'received', 'pending', 78.00, 7.80, 0.00, 85.80, 0.00, 'USD', '2025-10-09 22:06:29', NULL, NULL, '2025-10-09 22:33:29', '2025-11-19 01:08:13', '2025-11-19 01:08:18', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(244, 1, NULL, 7, NULL, 'NKH-DT-20250821-3096-911', 'pending', 0, 'pending', 'pending', 171.50, 17.15, 5.29, 183.36, 0.00, 'USD', '2025-08-20 23:19:12', NULL, 'No spicy please', '2025-08-20 23:41:12', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(245, 1, NULL, 3, NULL, 'NKH-DT-20251005-9673-227', 'pending', 0, 'ready', 'pending', 104.00, 10.40, 0.00, 114.40, 0.00, 'USD', '2025-10-04 23:17:54', NULL, NULL, '2025-10-04 23:54:54', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'delivery', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(246, 1, 1, 6, NULL, 'NKH-DT-20251111-0848-9d9', 'pending', 0, 'preparing', 'pending', 21.00, 2.10, 0.00, 23.10, 0.00, 'USD', '2025-11-10 21:27:07', NULL, 'No onions', '2025-11-10 21:50:07', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(247, 1, NULL, 9, NULL, 'NKH-DT-20251019-3975-42a', 'pending', 0, 'ready', 'pending', 97.00, 9.70, 0.00, 106.70, 0.00, 'USD', '2025-10-19 08:02:05', NULL, NULL, '2025-10-19 08:23:05', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(248, 1, 11, 10, NULL, 'NKH-DT-20251027-4458-28d', 'pending', 0, 'ready', 'pending', 86.00, 8.60, 0.00, 94.60, 0.00, 'USD', '2025-10-27 09:22:46', NULL, NULL, '2025-10-27 09:44:46', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'dine-in', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(249, 1, NULL, 8, NULL, 'NKH-DT-20250904-0336-463', 'pending', 0, 'ready', 'pending', 56.50, 5.65, 0.00, 62.15, 0.00, 'USD', '2025-09-04 12:22:04', NULL, 'Well done', '2025-09-04 12:42:04', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0),
(250, 1, NULL, 8, NULL, 'NKH-DT-20250927-2615-8fa', 'pending', 0, 'pending', 'pending', 53.00, 5.30, 0.00, 58.30, 0.00, 'USD', '2025-09-27 12:35:17', NULL, 'Extra sauce', '2025-09-27 13:06:17', '2025-11-19 01:08:13', '2025-11-19 01:08:19', 'pickup', NULL, 'unpaid', NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `quantity` smallint UNSIGNED NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_price` decimal(12,2) NOT NULL,
  `status` enum('pending','preparing','ready','served','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `special_instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `total_price`, `status`, `special_instructions`, `created_at`, `updated_at`) VALUES
(1, 1, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', 'No onions', '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(2, 1, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(3, 2, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', 'No onions', '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(4, 2, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(5, 3, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'Extra spicy', '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(6, 3, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Extra herbs', '2025-11-19 01:08:13', '2025-11-19 01:08:13'),
(7, 4, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(8, 4, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(9, 4, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(10, 5, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(11, 5, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(12, 6, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(13, 7, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(14, 8, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(15, 8, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(16, 8, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(17, 8, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(18, 9, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(19, 9, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(20, 9, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(21, 9, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(22, 10, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(23, 10, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(24, 10, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(25, 10, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(26, 10, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(27, 10, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(28, 11, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(29, 11, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(30, 11, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(31, 12, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(32, 12, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(33, 12, 33, 3, 11.50, 0.00, 0.00, 34.50, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(34, 13, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(35, 13, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(36, 14, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(37, 14, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(38, 14, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(39, 14, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(40, 14, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(41, 14, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(42, 15, 16, 3, 6.00, 0.00, 0.00, 18.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(43, 16, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(44, 16, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(45, 17, 1, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(46, 17, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(47, 17, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(48, 17, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(49, 17, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(50, 17, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(51, 18, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(52, 18, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(53, 19, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(54, 19, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(55, 20, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(56, 20, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(57, 20, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(58, 20, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(59, 21, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(60, 21, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(61, 21, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(62, 21, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(63, 21, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(64, 22, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(65, 22, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(66, 22, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(67, 22, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(68, 23, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(69, 23, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(70, 23, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(71, 23, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(72, 23, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(73, 24, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(74, 25, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(75, 25, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(76, 25, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(77, 26, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(78, 26, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(79, 26, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(80, 26, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(81, 26, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(82, 27, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(83, 27, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(84, 27, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(85, 28, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(86, 28, 10, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(87, 28, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(88, 29, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(89, 30, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(90, 30, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(91, 30, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(92, 30, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(93, 30, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(94, 30, 32, 3, 8.00, 0.00, 0.00, 24.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(95, 31, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(96, 31, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(97, 31, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(98, 32, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(99, 33, 8, 2, 14.00, 0.00, 0.00, 28.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(100, 33, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(101, 34, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(102, 34, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(103, 34, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(104, 34, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(105, 35, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(106, 35, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(107, 35, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(108, 35, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(109, 36, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(110, 36, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(111, 36, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(112, 36, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(113, 36, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(114, 37, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(115, 37, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(116, 37, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(117, 37, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(118, 37, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(119, 37, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(120, 38, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(121, 39, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(122, 39, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(123, 39, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(124, 39, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(125, 39, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(126, 40, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(127, 40, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(128, 41, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(129, 41, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(130, 41, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(131, 41, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(132, 42, 1, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(133, 42, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(134, 42, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(135, 42, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(136, 42, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(137, 43, 9, 3, 16.50, 0.00, 0.00, 49.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(138, 43, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(139, 43, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(140, 43, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(141, 43, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(142, 44, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(143, 44, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(144, 44, 8, 2, 14.00, 0.00, 0.00, 28.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(145, 44, 32, 3, 8.00, 0.00, 0.00, 24.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(146, 45, 32, 3, 8.00, 0.00, 0.00, 24.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(147, 46, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(148, 47, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(149, 47, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(150, 47, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(151, 47, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(152, 47, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(153, 47, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(154, 48, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(155, 48, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(156, 48, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(157, 48, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(158, 48, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Extra spicy', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(159, 48, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(160, 49, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(161, 49, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(162, 49, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(163, 49, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(164, 49, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Extra herbs', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(165, 50, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Medium rare', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(166, 50, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(167, 50, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(168, 50, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(169, 51, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'Well done', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(170, 51, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', 'On the side', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(171, 51, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(172, 51, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(173, 51, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'Extra cheese', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(174, 52, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(175, 53, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(176, 53, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(177, 53, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(178, 53, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'No vegetables', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(179, 53, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(180, 54, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(181, 54, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'No onions', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(182, 54, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Extra sauce', '2025-11-19 01:08:14', '2025-11-19 01:08:14'),
(183, 54, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(184, 54, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(185, 55, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(186, 56, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(187, 57, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(188, 57, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(189, 57, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(190, 58, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(191, 58, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(192, 58, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(193, 58, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(194, 58, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(195, 59, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(196, 59, 10, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(197, 59, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(198, 59, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(199, 59, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(200, 60, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(201, 60, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(202, 60, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(203, 60, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(204, 60, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(205, 60, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(206, 61, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(207, 61, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(208, 61, 13, 3, 7.50, 0.00, 0.00, 22.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(209, 61, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(210, 61, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(211, 62, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(212, 62, 3, 2, 10.50, 0.00, 0.00, 21.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(213, 62, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(214, 62, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(215, 63, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(216, 63, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(217, 63, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(218, 63, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(219, 63, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(220, 64, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(221, 64, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(222, 64, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(223, 64, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(224, 65, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(225, 65, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(226, 66, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(227, 66, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(228, 66, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(229, 66, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(230, 67, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(231, 68, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(232, 69, 9, 3, 16.50, 0.00, 0.00, 49.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(233, 69, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(234, 69, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(235, 69, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(236, 70, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(237, 70, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(238, 70, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(239, 71, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(240, 71, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(241, 71, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(242, 71, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(243, 71, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(244, 72, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(245, 72, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(246, 72, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(247, 72, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(248, 72, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(249, 73, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(250, 73, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(251, 73, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(252, 73, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(253, 74, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(254, 74, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(255, 74, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(256, 74, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(257, 75, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(258, 75, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(259, 75, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(260, 75, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(261, 75, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(262, 75, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(263, 76, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(264, 76, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(265, 76, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(266, 76, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(267, 76, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(268, 77, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(269, 77, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(270, 78, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(271, 78, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(272, 79, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(273, 79, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(274, 79, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(275, 79, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(276, 79, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(277, 79, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(278, 80, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(279, 80, 13, 3, 7.50, 0.00, 0.00, 22.50, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(280, 80, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(281, 80, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(282, 80, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(283, 81, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(284, 81, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(285, 81, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(286, 81, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(287, 82, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(288, 83, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(289, 83, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(290, 84, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(291, 84, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(292, 84, 13, 3, 7.50, 0.00, 0.00, 22.50, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(293, 84, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(294, 85, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(295, 85, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(296, 85, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(297, 85, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(298, 85, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(299, 86, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(300, 86, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(301, 86, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(302, 87, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(303, 87, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(304, 88, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(305, 88, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(306, 89, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(307, 90, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(308, 90, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(309, 90, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(310, 91, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(311, 91, 13, 3, 7.50, 0.00, 0.00, 22.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(312, 91, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(313, 91, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(314, 91, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(315, 91, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(316, 92, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(317, 92, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(318, 92, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(319, 92, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(320, 92, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(321, 93, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(322, 93, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(323, 93, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(324, 93, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(325, 93, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(326, 93, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(327, 94, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(328, 94, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(329, 94, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(330, 94, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(331, 95, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(332, 95, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(333, 95, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(334, 96, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(335, 96, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(336, 96, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(337, 96, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(338, 96, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(339, 97, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(340, 97, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(341, 97, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(342, 97, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(343, 97, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(344, 97, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(345, 98, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(346, 99, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(347, 99, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(348, 100, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(349, 100, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(350, 100, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(351, 100, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(352, 100, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(353, 101, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(354, 101, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(355, 101, 19, 1, 3.50, 0.00, 0.00, 3.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(356, 101, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(357, 101, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(358, 101, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(359, 102, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(360, 102, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(361, 102, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(362, 102, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(363, 102, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(364, 102, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(365, 103, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(366, 103, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(367, 104, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(368, 104, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(369, 104, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(370, 105, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(371, 106, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(372, 106, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(373, 106, 8, 1, 14.00, 0.00, 0.00, 14.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(374, 106, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(375, 106, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(376, 106, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(377, 107, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(378, 107, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(379, 108, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(380, 109, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(381, 109, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(382, 109, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(383, 109, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(384, 109, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'On the side', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(385, 109, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(386, 110, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(387, 111, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'No onions', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(388, 111, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(389, 111, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(390, 112, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(391, 112, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(392, 112, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra herbs', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(393, 112, 33, 3, 11.50, 0.00, 0.00, 34.50, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(394, 113, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra cheese', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(395, 113, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Mild spice', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(396, 113, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(397, 113, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No vegetables', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(398, 113, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra spicy', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(399, 113, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Well done', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(400, 114, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'Extra sauce', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(401, 114, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Medium rare', '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(402, 114, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:15', '2025-11-19 01:08:15'),
(403, 115, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(404, 115, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(405, 115, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(406, 116, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(407, 116, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(408, 116, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(409, 116, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(410, 117, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(411, 117, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(412, 117, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(413, 117, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(414, 117, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(415, 118, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(416, 118, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(417, 118, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(418, 118, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(419, 119, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(420, 120, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(421, 120, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(422, 120, 16, 3, 6.00, 0.00, 0.00, 18.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(423, 120, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(424, 120, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(425, 120, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(426, 121, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(427, 121, 33, 3, 11.50, 0.00, 0.00, 34.50, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(428, 122, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(429, 122, 8, 2, 14.00, 0.00, 0.00, 28.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(430, 122, 13, 3, 7.50, 0.00, 0.00, 22.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(431, 122, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(432, 122, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(433, 122, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(434, 123, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(435, 123, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(436, 123, 16, 3, 6.00, 0.00, 0.00, 18.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(437, 123, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(438, 123, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(439, 124, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(440, 124, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(441, 124, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(442, 124, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(443, 124, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(444, 125, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(445, 125, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(446, 125, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(447, 125, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(448, 126, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(449, 126, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(450, 126, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(451, 127, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(452, 127, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16');
INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `total_price`, `status`, `special_instructions`, `created_at`, `updated_at`) VALUES
(453, 127, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(454, 127, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(455, 127, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(456, 127, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(457, 128, 3, 2, 10.50, 0.00, 0.00, 21.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(458, 128, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(459, 128, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(460, 128, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(461, 128, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(462, 129, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(463, 129, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(464, 129, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(465, 129, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(466, 130, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(467, 130, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(468, 130, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(469, 130, 16, 3, 6.00, 0.00, 0.00, 18.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(470, 130, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(471, 130, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(472, 131, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(473, 132, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(474, 132, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(475, 132, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(476, 132, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(477, 132, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(478, 132, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(479, 133, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(480, 133, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(481, 133, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(482, 133, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(483, 133, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(484, 134, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(485, 135, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(486, 135, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(487, 136, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(488, 136, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(489, 136, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(490, 137, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(491, 137, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(492, 137, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(493, 137, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(494, 137, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(495, 138, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(496, 138, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(497, 138, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(498, 139, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(499, 139, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(500, 140, 1, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(501, 140, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(502, 140, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(503, 140, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(504, 140, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(505, 140, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(506, 141, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(507, 141, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(508, 142, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(509, 142, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(510, 142, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(511, 142, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(512, 143, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(513, 144, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(514, 144, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(515, 145, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(516, 145, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(517, 145, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(518, 145, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(519, 145, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(520, 146, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(521, 146, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(522, 146, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(523, 146, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(524, 146, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(525, 147, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(526, 147, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(527, 147, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(528, 147, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(529, 148, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(530, 148, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(531, 149, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(532, 149, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(533, 150, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(534, 151, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(535, 151, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(536, 152, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(537, 152, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(538, 152, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(539, 152, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(540, 152, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(541, 152, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(542, 153, 8, 2, 14.00, 0.00, 0.00, 28.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(543, 153, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(544, 154, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(545, 154, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(546, 154, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(547, 154, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(548, 154, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(549, 154, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(550, 155, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(551, 155, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(552, 155, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(553, 155, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(554, 156, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(555, 156, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(556, 156, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(557, 156, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(558, 156, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(559, 157, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(560, 157, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(561, 157, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Well done', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(562, 158, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(563, 158, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(564, 158, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(565, 158, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(566, 158, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(567, 158, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(568, 159, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(569, 160, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(570, 160, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(571, 160, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(572, 160, 17, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(573, 160, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(574, 160, 33, 3, 11.50, 0.00, 0.00, 34.50, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(575, 161, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(576, 161, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(577, 161, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Medium rare', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(578, 162, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Mild spice', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(579, 162, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(580, 162, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'No onions', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(581, 163, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(582, 163, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra sauce', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(583, 163, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(584, 164, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(585, 164, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(586, 165, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(587, 165, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(588, 165, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(589, 165, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', NULL, '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(590, 165, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(591, 166, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Extra herbs', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(592, 166, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', 'Extra spicy', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(593, 166, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', 'On the side', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(594, 166, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'No vegetables', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(595, 166, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Extra cheese', '2025-11-19 01:08:16', '2025-11-19 01:08:16'),
(596, 166, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(597, 167, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(598, 167, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(599, 168, 1, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Extra sauce', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(600, 168, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(601, 168, 8, 1, 14.00, 0.00, 0.00, 14.00, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(602, 168, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(603, 168, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(604, 169, 1, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(605, 169, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(606, 170, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(607, 171, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(608, 171, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(609, 171, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(610, 171, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(611, 171, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(612, 172, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'No vegetables', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(613, 172, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'Extra sauce', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(614, 172, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(615, 172, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'No onions', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(616, 172, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(617, 172, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(618, 173, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(619, 173, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(620, 173, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(621, 173, 29, 3, 18.50, 0.00, 0.00, 55.50, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(622, 174, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(623, 174, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(624, 174, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(625, 175, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(626, 175, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(627, 175, 15, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(628, 175, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(629, 175, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(630, 175, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(631, 176, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(632, 176, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'No vegetables', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(633, 176, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(634, 176, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(635, 176, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(636, 176, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(637, 177, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(638, 177, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(639, 177, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(640, 177, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(641, 177, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(642, 178, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(643, 178, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(644, 179, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(645, 179, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(646, 179, 9, 3, 16.50, 0.00, 0.00, 49.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(647, 179, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(648, 179, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(649, 180, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'No onions', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(650, 180, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(651, 181, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(652, 181, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(653, 181, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(654, 181, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(655, 181, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(656, 181, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'No onions', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(657, 182, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'No onions', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(658, 182, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(659, 182, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(660, 182, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(661, 182, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(662, 182, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(663, 183, 8, 1, 14.00, 0.00, 0.00, 14.00, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(664, 183, 13, 1, 7.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(665, 183, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(666, 183, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(667, 183, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(668, 183, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(669, 184, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra sauce', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(670, 184, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(671, 184, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(672, 184, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(673, 184, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(674, 184, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(675, 185, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(676, 185, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(677, 185, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(678, 185, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'No vegetables', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(679, 185, 26, 1, 25.00, 0.00, 0.00, 25.00, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(680, 185, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(681, 186, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(682, 186, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(683, 186, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(684, 186, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(685, 187, 9, 3, 16.50, 0.00, 0.00, 49.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(686, 187, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(687, 187, 32, 3, 8.00, 0.00, 0.00, 24.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(688, 188, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(689, 188, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'No onions', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(690, 189, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'No vegetables', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(691, 190, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Mild spice', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(692, 190, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(693, 190, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(694, 190, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(695, 190, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(696, 190, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(697, 191, 10, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Extra sauce', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(698, 191, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(699, 191, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(700, 191, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(701, 191, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(702, 191, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(703, 192, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(704, 192, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'Well done', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(705, 192, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(706, 193, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(707, 193, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(708, 193, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(709, 193, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(710, 193, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(711, 193, 32, 3, 8.00, 0.00, 0.00, 24.00, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(712, 194, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra spicy', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(713, 194, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(714, 194, 21, 1, 2.50, 0.00, 0.00, 2.50, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(715, 194, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(716, 194, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Medium rare', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(717, 194, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(718, 195, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'On the side', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(719, 195, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', NULL, '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(720, 195, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', 'Extra herbs', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(721, 195, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra cheese', '2025-11-19 01:08:17', '2025-11-19 01:08:17'),
(722, 196, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(723, 196, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(724, 197, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(725, 197, 10, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(726, 197, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(727, 197, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(728, 197, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(729, 197, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(730, 198, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(731, 198, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(732, 199, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(733, 199, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(734, 200, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(735, 200, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(736, 200, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(737, 200, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(738, 201, 5, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(739, 201, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(740, 201, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(741, 201, 26, 3, 25.00, 0.00, 0.00, 75.00, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(742, 202, 5, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(743, 202, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(744, 202, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(745, 202, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(746, 202, 24, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(747, 202, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(748, 203, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(749, 203, 4, 3, 9.00, 0.00, 0.00, 27.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(750, 203, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(751, 203, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(752, 203, 19, 3, 3.50, 0.00, 0.00, 10.50, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(753, 203, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(754, 204, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(755, 204, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(756, 205, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(757, 206, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(758, 206, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(759, 206, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(760, 206, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(761, 207, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(762, 207, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(763, 207, 8, 3, 14.00, 0.00, 0.00, 42.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(764, 207, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(765, 208, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(766, 208, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(767, 208, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(768, 208, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(769, 208, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(770, 209, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(771, 210, 3, 2, 10.50, 0.00, 0.00, 21.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(772, 210, 15, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(773, 210, 18, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(774, 210, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(775, 210, 27, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(776, 210, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(777, 211, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(778, 211, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(779, 211, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(780, 211, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(781, 211, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(782, 212, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(783, 212, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(784, 212, 26, 2, 25.00, 0.00, 0.00, 50.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(785, 213, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(786, 213, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(787, 213, 9, 3, 16.50, 0.00, 0.00, 49.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(788, 213, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(789, 213, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(790, 213, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(791, 214, 24, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(792, 215, 14, 2, 6.50, 0.00, 0.00, 13.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(793, 215, 19, 2, 3.50, 0.00, 0.00, 7.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(794, 215, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(795, 215, 33, 1, 11.50, 0.00, 0.00, 11.50, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(796, 216, 1, 3, 8.50, 0.00, 0.00, 25.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(797, 216, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(798, 216, 30, 2, 22.00, 0.00, 0.00, 44.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(799, 217, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(800, 217, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(801, 217, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(802, 217, 33, 3, 11.50, 0.00, 0.00, 34.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(803, 218, 4, 2, 9.00, 0.00, 0.00, 18.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(804, 218, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(805, 218, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(806, 218, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(807, 219, 6, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(808, 219, 10, 3, 15.00, 0.00, 0.00, 45.00, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(809, 219, 11, 3, 13.50, 0.00, 0.00, 40.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(810, 219, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(811, 220, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(812, 220, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(813, 221, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(814, 222, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(815, 223, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(816, 224, 3, 2, 10.50, 0.00, 0.00, 21.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(817, 224, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(818, 224, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(819, 224, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(820, 224, 23, 2, 4.50, 0.00, 0.00, 9.00, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(821, 224, 29, 2, 18.50, 0.00, 0.00, 37.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(822, 225, 2, 3, 12.00, 0.00, 0.00, 36.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(823, 225, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(824, 225, 23, 3, 4.50, 0.00, 0.00, 13.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(825, 225, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(826, 225, 30, 1, 22.00, 0.00, 0.00, 22.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(827, 226, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(828, 226, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(829, 226, 12, 1, 10.00, 0.00, 0.00, 10.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(830, 226, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(831, 226, 22, 3, 5.50, 0.00, 0.00, 16.50, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(832, 226, 30, 3, 22.00, 0.00, 0.00, 66.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(833, 227, 2, 2, 12.00, 0.00, 0.00, 24.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(834, 227, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(835, 227, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(836, 228, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(837, 229, 3, 1, 10.50, 0.00, 0.00, 10.50, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(838, 229, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(839, 229, 19, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(840, 229, 22, 2, 5.50, 0.00, 0.00, 11.00, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(841, 229, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(842, 229, 32, 2, 8.00, 0.00, 0.00, 16.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(843, 230, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(844, 230, 16, 3, 6.00, 0.00, 0.00, 18.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(845, 230, 18, 2, 4.50, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(846, 230, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(847, 231, 6, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(848, 231, 14, 1, 6.50, 0.00, 0.00, 6.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(849, 231, 31, 1, 15.00, 0.00, 0.00, 15.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(850, 232, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(851, 232, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(852, 232, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(853, 232, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(854, 233, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(855, 233, 13, 2, 7.50, 0.00, 0.00, 15.00, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(856, 233, 27, 3, 28.00, 0.00, 0.00, 84.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(857, 234, 1, 1, 8.50, 0.00, 0.00, 8.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(858, 234, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(859, 234, 28, 3, 32.00, 0.00, 0.00, 96.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(860, 235, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(861, 236, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(862, 236, 11, 2, 13.50, 0.00, 0.00, 27.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(863, 236, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(864, 236, 19, 1, 3.50, 0.00, 0.00, 3.50, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(865, 236, 25, 2, 8.50, 0.00, 0.00, 17.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(866, 237, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(867, 237, 21, 2, 2.50, 0.00, 0.00, 5.00, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(868, 237, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(869, 238, 28, 2, 32.00, 0.00, 0.00, 64.00, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(870, 238, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(871, 239, 2, 1, 12.00, 0.00, 0.00, 12.00, 'pending', 'Extra sauce', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(872, 239, 9, 2, 16.50, 0.00, 0.00, 33.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(873, 239, 17, 2, 8.50, 0.00, 0.00, 17.00, 'pending', 'On the side', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(874, 239, 20, 2, 4.00, 0.00, 0.00, 8.00, 'pending', 'Medium rare', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(875, 239, 23, 1, 4.50, 0.00, 0.00, 4.50, 'pending', 'Extra cheese', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(876, 239, 29, 1, 18.50, 0.00, 0.00, 18.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(877, 240, 9, 1, 16.50, 0.00, 0.00, 16.50, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(878, 240, 18, 1, 4.50, 0.00, 0.00, 4.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(879, 241, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(880, 241, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', 'Mild spice', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(881, 242, 11, 1, 13.50, 0.00, 0.00, 13.50, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(882, 242, 16, 1, 6.00, 0.00, 0.00, 6.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(883, 242, 24, 2, 3.50, 0.00, 0.00, 7.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(884, 243, 12, 3, 10.00, 0.00, 0.00, 30.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(885, 243, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(886, 243, 20, 3, 4.00, 0.00, 0.00, 12.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(887, 243, 21, 3, 2.50, 0.00, 0.00, 7.50, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(888, 243, 25, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'No vegetables', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(889, 243, 32, 1, 8.00, 0.00, 0.00, 8.00, 'pending', 'Extra spicy', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(890, 244, 6, 2, 28.00, 0.00, 0.00, 56.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(891, 244, 7, 3, 12.50, 0.00, 0.00, 37.50, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(892, 244, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'Well done', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(893, 244, 22, 1, 5.50, 0.00, 0.00, 5.50, 'pending', 'No onions', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(894, 244, 31, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'Extra herbs', '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(895, 244, 33, 2, 11.50, 0.00, 0.00, 23.00, 'pending', NULL, '2025-11-19 01:08:18', '2025-11-19 01:08:18'),
(896, 245, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', 'Extra cheese', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(897, 245, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(898, 245, 20, 1, 4.00, 0.00, 0.00, 4.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(899, 245, 25, 3, 8.50, 0.00, 0.00, 25.50, 'pending', 'On the side', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(900, 245, 28, 1, 32.00, 0.00, 0.00, 32.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(901, 246, 3, 2, 10.50, 0.00, 0.00, 21.00, 'pending', 'Extra sauce', '2025-11-19 01:08:19', '2025-11-19 01:08:19');
INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `total_price`, `status`, `special_instructions`, `created_at`, `updated_at`) VALUES
(902, 247, 3, 3, 10.50, 0.00, 0.00, 31.50, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(903, 247, 5, 3, 13.50, 0.00, 0.00, 40.50, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(904, 247, 7, 2, 12.50, 0.00, 0.00, 25.00, 'pending', 'Extra cheese', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(905, 248, 10, 2, 15.00, 0.00, 0.00, 30.00, 'pending', 'No onions', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(906, 248, 15, 2, 5.50, 0.00, 0.00, 11.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(907, 248, 31, 3, 15.00, 0.00, 0.00, 45.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(908, 249, 12, 2, 10.00, 0.00, 0.00, 20.00, 'pending', 'No vegetables', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(909, 249, 17, 1, 8.50, 0.00, 0.00, 8.50, 'pending', 'Medium rare', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(910, 249, 27, 1, 28.00, 0.00, 0.00, 28.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(911, 250, 4, 1, 9.00, 0.00, 0.00, 9.00, 'pending', 'Extra cheese', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(912, 250, 7, 1, 12.50, 0.00, 0.00, 12.50, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(913, 250, 14, 3, 6.50, 0.00, 0.00, 19.50, 'pending', 'No onions', '2025-11-19 01:08:19', '2025-11-19 01:08:19'),
(914, 250, 16, 2, 6.00, 0.00, 0.00, 12.00, 'pending', NULL, '2025-11-19 01:08:19', '2025-11-19 01:08:19');

-- --------------------------------------------------------

--
-- Table structure for table `order_time_slots`
--

CREATE TABLE `order_time_slots` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `slot_date` date NOT NULL,
  `slot_start_time` time NOT NULL,
  `slot_type` enum('pickup','delivery') COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_orders` int UNSIGNED NOT NULL,
  `current_orders` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint UNSIGNED NOT NULL,
  `invoice_id` bigint UNSIGNED NOT NULL,
  `payment_method_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `processed_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `invoice_id`, `payment_method_id`, `amount`, `transaction_id`, `reference_number`, `status`, `processed_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 3, 28.05, 'CARD-691D7AF48D04C', 'REF-20251119-6641-R01', 'completed', '2025-11-04 12:33:59', 'Refund processed', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(2, 6, 1, 132.55, 'CASH-691D7AF48E1BB', 'REF-20251119-4157-STC', 'completed', '2025-10-24 16:25:22', 'Tips included', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(3, 7, 2, 20.35, 'CARD-691D7AF48F66A', 'REF-20251119-2746-R04', 'completed', '2025-11-10 13:31:21', 'Corporate payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(4, 10, 5, 60.50, 'BANK-691D7AF4905FD', 'REF-20251119-7539-BCO', 'completed', '2025-10-08 22:12:36', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(5, 12, 2, 121.43, 'CARD-691D7AF491539', 'REF-20251119-1450-RXF', 'completed', '2025-10-26 21:50:50', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(6, 13, 5, 22.00, 'BANK-691D7AF492C65', 'REF-20251119-4005-QIN', 'completed', '2025-09-11 12:29:42', 'Gift card redemption', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(7, 18, 5, 26.40, 'BANK-691D7AF4940E0', 'REF-20251119-0896-LC0', 'completed', '2025-10-22 03:56:11', 'Refund processed', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(8, 22, 3, 194.39, 'CARD-691D7AF495E51', 'REF-20251119-3796-SGD', 'completed', '2025-09-11 05:00:09', 'Payment processed successfully', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(9, 23, 3, 8.63, 'CARD-691D7AF496FC2', 'REF-20251119-4016-LQB', 'pending', '2025-10-04 20:00:46', 'Payment processed successfully', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(10, 24, 6, 128.70, 'GIFT-691D7AF4980C6', 'REF-20251119-2821-XQ5', 'completed', '2025-11-10 12:31:47', 'Gift card redemption', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(11, 28, 6, 114.62, 'GIFT-691D7AF498D8A', 'REF-20251119-8628-OFM', 'completed', '2025-09-28 08:54:35', 'Payment verification required', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(12, 30, 5, 67.10, 'BANK-691D7AF49A2FB', 'REF-20251119-8348-H7Z', 'completed', '2025-10-24 13:27:27', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(13, 33, 6, 132.70, 'GIFT-691D7AF49BDCC', 'REF-20251119-4229-FJB', 'completed', '2025-11-02 14:34:12', 'Manual entry by cashier', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(14, 35, 3, 43.63, 'CARD-691D7AF49E310', 'REF-20251119-0199-IYP', 'completed', '2025-11-13 02:03:40', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(15, 36, 2, 191.95, 'CARD-691D7AF49FF0D', 'REF-20251119-1023-MQ6', 'completed', '2025-09-08 23:56:41', 'Payment verification required', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(16, 38, 6, 53.35, 'GIFT-691D7AF4A2E9E', 'REF-20251119-1636-FHJ', 'completed', '2025-09-29 10:13:31', 'Automatic payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(17, 39, 5, 113.85, 'BANK-691D7AF4A428D', 'REF-20251119-4236-CZN', 'pending', '2025-11-16 05:25:05', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(18, 42, 5, 81.95, 'BANK-691D7AF4A537A', 'REF-20251119-6769-XIM', 'completed', '2025-10-25 01:35:23', 'Payment verification required', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(19, 49, 5, 144.65, 'BANK-691D7AF4A6553', 'REF-20251119-6045-GUS', 'pending', '2025-09-30 01:59:26', 'Automatic payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(20, 50, 1, 56.65, 'CASH-691D7AF4A7676', 'REF-20251119-7115-NJ4', 'pending', '2025-10-24 04:59:19', 'Exact change', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(21, 52, 3, 39.60, 'CARD-691D7AF4A8A88', 'REF-20251119-3249-WAG', 'completed', '2025-08-29 16:41:45', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(22, 58, 5, 84.15, 'BANK-691D7AF4AA12F', 'REF-20251119-2267-UNX', 'completed', '2025-08-28 00:04:41', 'Manual entry by cashier', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(23, 66, 3, 74.25, 'CARD-691D7AF4AC394', 'REF-20251119-0881-QH9', 'completed', '2025-10-11 17:53:36', 'Payment processed successfully', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(24, 70, 4, 161.70, 'DIGI-691D7AF4AEBC9', 'REF-20251119-1840-XOY', 'completed', '2025-09-16 18:43:27', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(25, 71, 2, 151.80, 'CARD-691D7AF4B07E9', 'REF-20251119-0529-7PF', 'completed', '2025-09-17 20:36:23', 'Gift card redemption', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(26, 75, 3, 114.21, 'CARD-691D7AF4B2B03', 'REF-20251119-3247-ONZ', 'completed', '2025-09-19 02:25:14', 'Refund processed', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(27, 80, 2, 34.65, 'CARD-691D7AF4B57CA', 'REF-20251119-1830-WIB', 'pending', '2025-11-17 19:19:26', 'Manual entry by cashier', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(28, 82, 6, 161.70, 'GIFT-691D7AF4B7F39', 'REF-20251119-9650-4SN', 'completed', '2025-11-15 12:17:31', 'Split payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(29, 86, 5, 105.60, 'BANK-691D7AF4BACDE', 'REF-20251119-4507-HAO', 'completed', '2025-08-20 06:09:46', 'Refund processed', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(30, 87, 4, 9.90, 'DIGI-691D7AF4BDF47', 'REF-20251119-9902-RCL', 'failed', '2025-10-27 18:25:04', 'Split payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(31, 90, 4, 162.34, 'DIGI-691D7AF4C0266', 'REF-20251119-5265-TLY', 'failed', '2025-10-17 11:34:45', 'Corporate payment', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(32, 94, 2, 102.30, 'CARD-691D7AF4C21E1', 'REF-20251119-3892-VQ1', 'completed', '2025-10-28 09:26:01', NULL, '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(33, 95, 1, 23.10, 'CASH-691D7AF4C3F20', 'REF-20251119-6875-RE4', 'completed', '2025-11-02 22:41:09', 'Tips included', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(34, 97, 6, 106.70, 'GIFT-691D7AF4C5957', 'REF-20251119-8398-CDW', 'completed', '2025-10-19 09:04:05', 'Manual entry by cashier', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(35, 98, 1, 94.60, 'CASH-691D7AF4C6E34', 'REF-20251119-1729-WPS', 'pending', '2025-10-30 14:17:03', 'Tips included', '2025-11-19 01:08:20', '2025-11-19 01:08:20'),
(36, 99, 3, 62.15, 'CARD-691D7AF4C80B7', 'REF-20251119-4202-43U', 'completed', '2025-11-15 04:41:50', 'Gift card redemption', '2025-11-19 01:08:20', '2025-11-19 01:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `processing_fee` decimal(5,2) NOT NULL DEFAULT '0.00',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int UNSIGNED NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `name`, `code`, `type`, `processing_fee`, `description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Cash', 'CASH', 'cash', 0.00, 'Cash payment', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(2, 'Credit Card', 'CREDIT', 'card', 2.50, 'Visa, MasterCard, American Express', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(3, 'Debit Card', 'DEBIT', 'card', 1.50, 'Bank debit cards', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(4, 'Mobile Payment', 'MOBILE', 'digital', 1.00, 'ABA Mobile, Wing, Pi Pay', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(5, 'Bank Transfer', 'TRANSFER', 'transfer', 0.50, 'Direct bank transfer', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12'),
(6, 'Gift Card', 'GIFT', 'voucher', 0.00, 'Restaurant gift cards', 0, 1, '2025-11-19 01:08:12', '2025-11-19 01:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` bigint UNSIGNED NOT NULL,
  `employee_id` bigint UNSIGNED NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `gross_pay` decimal(12,2) NOT NULL,
  `bonuses` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(12,2) NOT NULL,
  `status` enum('draft','paid','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Manage Users', 'users.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(2, 'Manage Roles', 'roles.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(3, 'Manage Permissions', 'permissions.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(4, 'Manage Locations', 'locations.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(5, 'Manage Settings', 'settings.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(6, 'View Employees', 'employees.view', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(7, 'Create Employees', 'employees.create', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(8, 'Update Employees', 'employees.update', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(9, 'Delete Employees', 'employees.delete', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(10, 'View Menu Items', 'menu_items.view', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(11, 'Create Menu Items', 'menu_items.create', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(12, 'Update Menu Items', 'menu_items.update', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(13, 'Delete Menu Items', 'menu_items.delete', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(14, 'View Orders', 'orders.view', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(15, 'Create Orders', 'orders.create', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(16, 'Update Orders', 'orders.update', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(17, 'Delete Orders', 'orders.delete', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(18, 'View Inventory', 'inventory.view', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(19, 'Update Inventory', 'inventory.update', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(20, 'Process Payments', 'payments.process', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(21, 'Process Refunds', 'refunds.process', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(22, 'Manage Promotions', 'promotions.manage', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(23, 'View Reports', 'reports.view', NULL, '2025-11-19 01:07:57', '2025-11-19 01:07:57');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` bigint UNSIGNED NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`id`, `title`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'General Manager', 'Overall restaurant operations management', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(2, 'Assistant Manager', 'Assists in daily operations and staff supervision', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(3, 'Head Chef', 'Kitchen operations and menu development', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(4, 'Sous Chef', 'Assists head chef and manages kitchen staff', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(5, 'Line Cook', 'Food preparation and cooking', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(6, 'Prep Cook', 'Food preparation and ingredient prep', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(7, 'Head Waiter', 'Supervises wait staff and ensures service quality', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(8, 'Waiter', 'Customer service and order taking', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(9, 'Bartender', 'Beverage preparation and bar service', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(10, 'Cashier', 'Payment processing and customer checkout', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(11, 'Host/Hostess', 'Guest greeting and seating coordination', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(12, 'Dishwasher', 'Kitchen cleaning and dishware maintenance', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(13, 'Cleaner', 'Restaurant cleaning and maintenance', 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `supplier_id` bigint UNSIGNED NOT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` bigint UNSIGNED NOT NULL,
  `purchase_order_id` bigint UNSIGNED NOT NULL,
  `ingredient_id` bigint UNSIGNED NOT NULL,
  `quantity_ordered` decimal(12,3) NOT NULL,
  `quantity_received` decimal(12,3) NOT NULL DEFAULT '0.000',
  `unit_price` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `status` enum('open','partial','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recipes`
--

CREATE TABLE `recipes` (
  `id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `yield_portions` int UNSIGNED NOT NULL DEFAULT '1',
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recipes`
--

INSERT INTO `recipes` (`id`, `menu_item_id`, `yield_portions`, `instructions`, `created_at`, `updated_at`) VALUES
(1, 1, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(2, 2, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(3, 3, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(4, 4, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(5, 5, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(6, 6, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(7, 7, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(8, 8, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(9, 9, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(10, 10, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(11, 11, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(12, 12, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(13, 13, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(14, 14, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(15, 15, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(16, 16, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(17, 17, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(18, 18, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(19, 19, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(20, 20, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(21, 21, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(22, 22, 4, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(23, 23, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(24, 24, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(25, 25, 4, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(26, 26, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(27, 27, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(28, 28, 1, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(29, 29, 4, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(30, 30, 4, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(31, 31, 2, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(32, 32, 4, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(33, 33, 3, '1. Prepare all ingredients\n2. Heat oil in a large pan/wok\n3. Cook main ingredients\n4. Add seasonings and spices\n5. Combine with remaining ingredients\n6. Simmer until done\n7. Check seasoning and adjust if needed\n8. Plate and garnish', '2025-11-19 01:08:08', '2025-11-19 01:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `recipe_ingredients`
--

CREATE TABLE `recipe_ingredients` (
  `id` bigint UNSIGNED NOT NULL,
  `recipe_id` bigint UNSIGNED NOT NULL,
  `ingredient_id` bigint UNSIGNED NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recipe_ingredients`
--

INSERT INTO `recipe_ingredients` (`id`, `recipe_id`, `ingredient_id`, `quantity`, `unit`, `created_at`, `updated_at`) VALUES
(1, 1, 15, 425.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(2, 1, 16, 389.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(3, 1, 27, 411.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(4, 1, 41, 251.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(5, 1, 42, 166.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(6, 2, 13, 178.000, 'unit', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(7, 2, 27, 115.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(8, 2, 32, 92.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(9, 2, 42, 349.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(10, 3, 26, 485.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(11, 3, 30, 497.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(12, 3, 35, 201.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(13, 4, 2, 239.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(14, 4, 6, 252.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(15, 4, 11, 99.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(16, 4, 41, 88.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(17, 5, 2, 184.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(18, 5, 5, 306.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(19, 5, 7, 351.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(20, 5, 32, 208.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(21, 6, 4, 179.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(22, 6, 5, 147.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(23, 6, 11, 252.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(24, 6, 20, 74.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(25, 6, 26, 394.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(26, 6, 33, 500.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(27, 6, 40, 274.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(28, 7, 9, 163.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(29, 7, 11, 491.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(30, 7, 25, 173.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(31, 7, 35, 54.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(32, 7, 37, 153.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(33, 8, 6, 444.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(34, 8, 12, 245.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(35, 8, 14, 363.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(36, 9, 20, 226.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(37, 9, 23, 459.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(38, 9, 37, 458.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(39, 10, 10, 383.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(40, 10, 11, 403.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(41, 10, 19, 97.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(42, 10, 21, 359.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(43, 10, 40, 244.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(44, 11, 3, 189.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(45, 11, 11, 271.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(46, 11, 32, 182.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(47, 12, 16, 323.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(48, 12, 21, 292.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(49, 12, 23, 277.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(50, 12, 35, 328.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(51, 13, 7, 396.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(52, 13, 17, 378.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(53, 13, 26, 472.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(54, 13, 33, 348.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(55, 14, 18, 89.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(56, 14, 21, 283.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(57, 14, 26, 397.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(58, 14, 28, 229.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(59, 14, 29, 419.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(60, 14, 30, 235.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(61, 14, 40, 415.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(62, 15, 2, 410.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(63, 15, 3, 229.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(64, 15, 4, 343.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(65, 15, 30, 300.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(66, 16, 9, 498.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(67, 16, 11, 102.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(68, 16, 24, 75.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(69, 16, 40, 243.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(70, 17, 17, 200.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(71, 17, 28, 415.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(72, 17, 32, 164.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(73, 17, 36, 407.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(74, 18, 4, 111.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(75, 18, 9, 280.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(76, 18, 13, 53.000, 'unit', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(77, 18, 27, 188.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(78, 19, 22, 491.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(79, 19, 27, 495.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(80, 19, 30, 376.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(81, 19, 37, 117.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(82, 20, 1, 196.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(83, 20, 6, 224.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(84, 20, 8, 320.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(85, 20, 24, 210.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(86, 20, 25, 320.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(87, 21, 7, 173.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(88, 21, 23, 107.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(89, 21, 36, 144.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(90, 22, 1, 280.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(91, 22, 3, 163.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(92, 22, 26, 445.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(93, 22, 33, 68.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(94, 22, 37, 94.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(95, 23, 9, 237.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(96, 23, 15, 481.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(97, 23, 22, 311.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(98, 23, 30, 480.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(99, 24, 2, 468.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(100, 24, 21, 261.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(101, 24, 31, 93.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(102, 24, 37, 107.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(103, 24, 39, 289.000, 'unit', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(104, 25, 3, 73.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(105, 25, 11, 124.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(106, 25, 27, 493.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(107, 25, 30, 299.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(108, 25, 33, 142.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(109, 25, 41, 57.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(110, 26, 2, 130.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(111, 26, 16, 185.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(112, 26, 18, 100.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(113, 26, 21, 165.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(114, 26, 26, 369.000, 'l', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(115, 26, 28, 373.000, 'kg', '2025-11-19 01:08:07', '2025-11-19 01:08:07'),
(116, 26, 31, 225.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(117, 27, 4, 73.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(118, 27, 7, 254.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(119, 27, 14, 218.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(120, 27, 22, 107.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(121, 27, 26, 121.000, 'l', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(122, 28, 22, 243.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(123, 28, 29, 96.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(124, 28, 42, 403.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(125, 29, 7, 404.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(126, 29, 9, 95.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(127, 29, 10, 361.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(128, 29, 14, 477.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(129, 29, 22, 148.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(130, 29, 34, 56.000, 'unit', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(131, 29, 41, 205.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(132, 30, 2, 360.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(133, 30, 4, 153.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(134, 30, 17, 204.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(135, 30, 19, 350.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(136, 30, 28, 335.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(137, 30, 34, 474.000, 'unit', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(138, 30, 36, 464.000, 'l', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(139, 31, 6, 301.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(140, 31, 14, 248.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(141, 31, 21, 197.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(142, 31, 36, 429.000, 'l', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(143, 31, 37, 81.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(144, 31, 38, 261.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(145, 31, 41, 461.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(146, 32, 7, 259.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(147, 32, 14, 256.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(148, 32, 17, 58.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(149, 32, 28, 457.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(150, 33, 2, 54.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(151, 33, 15, 341.000, 'kg', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(152, 33, 39, 327.000, 'unit', '2025-11-19 01:08:08', '2025-11-19 01:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `table_id` bigint UNSIGNED DEFAULT NULL,
  `reservation_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reserved_for` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int UNSIGNED NOT NULL DEFAULT '60',
  `guest_count` int UNSIGNED NOT NULL DEFAULT '2',
  `party_size` int NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `status` enum('pending','confirmed','seated','completed','cancelled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `special_requests` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `code`, `location_id`, `customer_id`, `table_id`, `reservation_number`, `reserved_for`, `duration_minutes`, `guest_count`, `party_size`, `reservation_date`, `reservation_time`, `status`, `special_requests`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'b04a06a83e3d34b1ad15', 1, 7, 26, 'RES-NKH-DT-20251018-4686', '2025-11-19 08:08:20', 60, 2, 3, '2025-10-18', '20:30:00', 'completed', NULL, 'Confirmed by phone', '2025-10-06 00:06:04', '2025-10-18 03:06:04'),
(2, '24758fc2676bb0bd35bd', 1, 7, 23, 'RES-NKH-DT-20251107-4217', '2025-11-19 08:08:20', 60, 2, 2, '2025-11-07', '11:30:00', 'completed', 'Surprise dessert', 'Special occasion', '2025-10-30 08:31:14', '2025-11-07 09:31:14'),
(3, 'd8adee001b249e960a38', 1, 7, 11, 'RES-NKH-DT-20251105-0593', '2025-11-19 08:08:20', 60, 2, 3, '2025-11-05', '12:30:00', 'cancelled', 'Surprise dessert', NULL, '2025-10-25 09:30:23', '2025-11-05 10:30:23'),
(4, '16acf5ab83b59238736b', 1, 4, 9, 'RES-NKH-DT-20251115-1967', '2025-11-19 08:08:20', 60, 2, 2, '2025-11-15', '12:00:00', 'cancelled', 'Window seat preferred', 'Corporate booking', '2025-11-14 06:27:02', '2025-11-15 11:27:02'),
(5, '19eaa1d7740c93511dd1', 1, 7, 36, 'RES-NKH-DT-20251112-3565', '2025-11-19 08:08:20', 60, 2, 2, '2025-11-12', '19:00:00', 'completed', NULL, 'Group reservation', '2025-10-30 23:01:40', '2025-11-12 01:01:40'),
(6, 'b4d6d5809c6814da4b6c', 1, 9, 16, 'RES-NKH-DT-20251102-4727', '2025-11-19 08:08:20', 60, 2, 6, '2025-11-02', '18:30:00', 'completed', 'Quiet table please', 'Corporate booking', '2025-10-21 06:47:10', '2025-11-02 11:47:10'),
(7, '1928fd4d41a7eb169d0e', 1, 2, 18, 'RES-NKH-DT-20250923-6446', '2025-11-19 08:08:20', 60, 2, 2, '2025-09-23', '12:00:00', 'completed', 'No allergens please', NULL, '2025-09-12 09:48:31', '2025-09-23 14:48:31'),
(8, 'fc4144b2d47fcdbf4ee4', 1, 2, 4, 'RES-NKH-DT-20251106-1654', '2025-11-19 08:08:20', 60, 2, 2, '2025-11-06', '18:30:00', 'completed', NULL, 'Special occasion', '2025-11-04 03:14:55', '2025-11-06 06:14:55'),
(9, '3f6d565c67c8ac695bb5', 1, 4, 11, 'RES-NKH-DT-20250920-4852', '2025-11-19 08:08:20', 60, 2, 2, '2025-09-20', '12:00:00', 'no_show', 'Vegetarian menu', 'Online booking', '2025-09-13 14:45:14', '2025-09-20 19:45:14'),
(10, 'cf240997feed24fdf99f', 1, 9, 18, 'RES-NKH-DT-20251021-5823', '2025-11-19 08:08:20', 60, 2, 2, '2025-10-21', '12:00:00', 'no_show', 'Quiet table please', NULL, '2025-10-13 07:40:04', '2025-10-21 09:40:04'),
(11, '2b4586c0f18e1d3f12d7', 1, 4, 22, 'RES-NKH-DT-20251025-8906', '2025-11-19 08:08:20', 60, 2, 5, '2025-10-25', '11:30:00', 'completed', NULL, 'Walk-in converted to reservation', '2025-10-11 20:25:14', '2025-10-24 23:25:14'),
(12, '9954fcb805a2db6952c6', 1, 10, 31, 'RES-NKH-DT-20251102-0366', '2025-11-19 08:08:20', 60, 2, 2, '2025-11-02', '11:30:00', 'completed', 'Birthday celebration', 'Confirmed by phone', '2025-10-25 10:40:38', '2025-11-02 13:40:38'),
(13, '33a5cda08efa6af969af', 1, 3, 2, 'RES-NKH-DT-20251020-0276', '2025-11-19 08:08:20', 60, 2, 6, '2025-10-20', '19:00:00', 'no_show', NULL, 'Walk-in converted to reservation', '2025-10-08 20:01:31', '2025-10-20 01:01:31'),
(14, 'f5a46bced5c51416e9c8', 1, 5, 5, 'RES-NKH-DT-20250928-6966', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-28', '20:30:00', 'completed', 'Surprise dessert', 'Confirmed by phone', '2025-09-23 08:39:54', '2025-09-28 12:39:54'),
(15, '6aaa78eec447afd60602', 1, 3, 33, 'RES-NKH-DT-20251018-9988', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-18', '19:30:00', 'completed', 'Private dining area', 'Corporate booking', '2025-10-14 13:28:07', '2025-10-18 17:28:07'),
(16, 'b64a9472bca254fc6cd5', 1, 6, 27, 'RES-NKH-DT-20250919-8807', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-19', '12:00:00', 'completed', NULL, 'Regular customer', '2025-09-15 13:51:04', '2025-09-19 14:51:04'),
(17, '6f13bee4242e32596137', 1, 9, 28, 'RES-NKH-DT-20251031-8663', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-31', '20:30:00', 'completed', NULL, 'Dietary restrictions noted', '2025-10-16 20:49:22', '2025-10-31 01:49:22'),
(18, '73a5e18e352fffdcf207', 1, 10, 16, 'RES-NKH-DT-20250921-8952', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-21', '11:30:00', 'completed', 'Vegetarian menu', NULL, '2025-09-08 21:49:14', '2025-09-20 23:49:14'),
(19, '728ad5cb3644d13f65bb', 1, 8, 27, 'RES-NKH-DT-20251014-1820', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-14', '18:00:00', 'completed', 'Anniversary dinner', 'Confirmed by phone', '2025-10-11 22:28:06', '2025-10-14 04:28:06'),
(20, '617d9da7207bebd9a1d1', 1, 2, 34, 'RES-NKH-DT-20251021-2924', '2025-11-19 08:08:21', 60, 2, 5, '2025-10-21', '12:30:00', 'completed', 'Quiet table please', 'Dietary restrictions noted', '2025-10-13 04:46:01', '2025-10-21 08:46:01'),
(21, '948d4808492b078bbd96', 1, 5, 14, 'RES-NKH-DT-20251105-7714', '2025-11-19 08:08:21', 60, 2, 8, '2025-11-05', '13:00:00', 'no_show', 'Quiet table please', NULL, '2025-10-30 06:37:53', '2025-11-05 07:37:53'),
(22, '2c2b68674814cfe4742d', 1, 6, 11, 'RES-NKH-DT-20251029-2550', '2025-11-19 08:08:21', 60, 2, 3, '2025-10-29', '19:30:00', 'cancelled', 'Vegetarian menu', 'Confirmed by phone', '2025-10-19 09:25:06', '2025-10-29 15:25:06'),
(23, 'a2fbf7014ceb6886fe84', 1, 1, 19, 'RES-NKH-DT-20251014-0079', '2025-11-19 08:08:21', 60, 2, 6, '2025-10-14', '19:30:00', 'completed', 'Quiet table please', 'Walk-in converted to reservation', '2025-10-11 18:28:43', '2025-10-13 21:28:43'),
(24, 'a904a802027f066285c9', 1, 2, 32, 'RES-NKH-DT-20250925-9274', '2025-11-19 08:08:21', 60, 2, 5, '2025-09-25', '18:00:00', 'cancelled', 'Wheelchair accessible table', 'Corporate booking', '2025-09-17 23:23:11', '2025-09-25 02:23:11'),
(25, '8c9aea7eb6e81097cc1d', 1, 9, 9, 'RES-NKH-DT-20251002-6283', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-02', '12:30:00', 'completed', 'Window seat preferred', NULL, '2025-09-25 12:09:45', '2025-10-02 14:09:45'),
(26, '70e1ed62f690891af853', 1, 3, 14, 'RES-NKH-DT-20251013-0881', '2025-11-19 08:08:21', 60, 2, 5, '2025-10-13', '11:30:00', 'cancelled', NULL, 'Special occasion', '2025-10-01 20:27:59', '2025-10-12 21:27:59'),
(27, 'dd6183fdf509cc735789', 1, 10, 23, 'RES-NKH-DT-20250921-7333', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-21', '18:00:00', 'completed', 'Anniversary dinner', NULL, '2025-09-12 22:55:07', '2025-09-21 03:55:07'),
(28, 'a6a78ce086ca7028b680', 1, 8, 26, 'RES-NKH-DT-20250921-0205', '2025-11-19 08:08:21', 60, 2, 8, '2025-09-21', '13:00:00', 'cancelled', 'Wheelchair accessible table', 'Regular customer', '2025-09-09 11:48:54', '2025-09-21 12:48:54'),
(29, '9659213998e27ccba8b4', 1, 11, 30, 'RES-NKH-DT-20251029-3000', '2025-11-19 08:08:21', 60, 2, 7, '2025-10-29', '13:00:00', 'completed', NULL, 'Special occasion', '2025-10-19 22:37:43', '2025-10-29 03:37:43'),
(30, 'a5213d6b9efc7ff148aa', 1, 7, 14, 'RES-NKH-DT-20251007-0201', '2025-11-19 08:08:21', 60, 2, 3, '2025-10-07', '20:00:00', 'completed', 'Business meeting', 'Regular customer', '2025-10-04 20:16:14', '2025-10-06 22:16:14'),
(31, '6acc6a15438945ac0c1b', 1, 10, 35, 'RES-NKH-DT-20251105-1230', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-05', '20:30:00', 'no_show', 'Private dining area', NULL, '2025-10-23 10:34:31', '2025-11-05 16:34:31'),
(32, '9b83a6c8a1adc893e559', 1, 1, 14, 'RES-NKH-DT-20251003-3100', '2025-11-19 08:08:21', 60, 2, 6, '2025-10-03', '12:30:00', 'completed', 'Wheelchair accessible table', 'Special occasion', '2025-09-23 16:30:30', '2025-10-03 17:30:30'),
(33, 'f385695801c51f9cf92c', 1, 3, 5, 'RES-NKH-DT-20251105-7913', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-05', '12:30:00', 'completed', 'Early arrival possible', 'Regular customer', '2025-10-27 10:18:32', '2025-11-05 13:18:32'),
(34, 'f804832339764e23d4f9', 1, 6, 13, 'RES-NKH-DT-20250923-5948', '2025-11-19 08:08:21', 60, 2, 4, '2025-09-23', '13:30:00', 'completed', 'Window seat preferred', 'Corporate booking', '2025-09-17 03:28:15', '2025-09-23 09:28:15'),
(35, '0cb388d37b7382731ae3', 1, 2, 6, 'RES-NKH-DT-20250925-4389', '2025-11-19 08:08:21', 60, 2, 3, '2025-09-25', '12:30:00', 'completed', 'Early arrival possible', NULL, '2025-09-21 16:59:01', '2025-09-25 22:59:01'),
(36, '05e4cb6e851100de4567', 1, 10, 6, 'RES-NKH-DT-20251022-8687', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-22', '20:30:00', 'no_show', 'No allergens please', NULL, '2025-10-14 21:19:05', '2025-10-21 23:19:05'),
(37, 'c753a31c631527640b56', 1, 7, 17, 'RES-NKH-DT-20250921-1793', '2025-11-19 08:08:21', 60, 2, 6, '2025-09-21', '13:00:00', 'completed', 'Wheelchair accessible table', NULL, '2025-09-16 16:48:01', '2025-09-21 17:48:01'),
(38, 'f3ca8f092e1a5d8894de', 1, 6, 34, 'RES-NKH-DT-20251101-6795', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-01', '18:00:00', 'no_show', 'Birthday celebration', NULL, '2025-10-23 20:13:36', '2025-10-31 21:13:36'),
(39, '815cdd842d0fd46535ce', 1, 4, 19, 'RES-NKH-DT-20251010-2351', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-10', '13:30:00', 'completed', NULL, 'Confirmed by phone', '2025-10-01 09:08:57', '2025-10-10 11:08:57'),
(40, 'ad05d002d6b7d6d0ac68', 1, 3, 36, 'RES-NKH-DT-20251010-7373', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-10', '12:00:00', 'no_show', 'Wheelchair accessible table', NULL, '2025-10-08 15:02:12', '2025-10-10 19:02:12'),
(41, '5296e59e9c1c7ed129a6', 1, 1, 3, 'RES-NKH-DT-20251003-5899', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-03', '18:00:00', 'completed', 'Quiet table please', 'Group reservation', '2025-09-19 21:47:02', '2025-10-03 00:47:02'),
(42, '7903b47d5fc8ed081d63', 1, 6, 11, 'RES-NKH-DT-20251003-7259', '2025-11-19 08:08:21', 60, 2, 8, '2025-10-03', '20:30:00', 'no_show', 'Anniversary dinner', 'VIP guest', '2025-09-21 05:43:16', '2025-10-03 10:43:16'),
(43, '47a33965922cfe7c69eb', 1, 5, 35, 'RES-NKH-DT-20251106-5458', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-06', '13:00:00', 'completed', 'Early arrival possible', NULL, '2025-10-25 23:48:43', '2025-11-06 02:48:43'),
(44, '9c2372dead90ba2ac824', 1, 4, 23, 'RES-NKH-DT-20251002-4569', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-02', '11:30:00', 'completed', 'Anniversary dinner', NULL, '2025-09-23 04:50:37', '2025-10-02 10:50:37'),
(45, '7f66369d26e709e25d78', 1, 6, 32, 'RES-NKH-DT-20251107-1839', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-07', '20:00:00', 'completed', 'Early arrival possible', NULL, '2025-10-31 10:53:13', '2025-11-07 15:53:13'),
(46, '8a0d4389e2d4a683c917', 1, 5, 32, 'RES-NKH-DT-20250925-5900', '2025-11-19 08:08:21', 60, 2, 4, '2025-09-25', '20:00:00', 'completed', NULL, NULL, '2025-09-18 22:25:45', '2025-09-25 03:25:45'),
(47, '405d19e5626535a04194', 1, 4, 23, 'RES-NKH-DT-20251005-2585', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-05', '20:30:00', 'completed', 'Window seat preferred', 'Walk-in converted to reservation', '2025-10-01 00:40:55', '2025-10-05 04:40:55'),
(48, 'f1245329ff1cd6937b9a', 1, 8, 23, 'RES-NKH-DT-20251104-2389', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-04', '13:30:00', 'completed', 'Wheelchair accessible table', NULL, '2025-10-27 07:07:25', '2025-11-04 08:07:25'),
(49, '5502febb726fa0cf0d69', 1, 3, 33, 'RES-NKH-DT-20250930-1581', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-30', '20:00:00', 'cancelled', 'Vegetarian menu', 'VIP guest', '2025-09-27 10:05:21', '2025-09-30 14:05:21'),
(50, '4378d852d8075e458534', 1, 7, 15, 'RES-NKH-DT-20251111-9250', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-11', '19:00:00', 'cancelled', 'Quiet table please', 'Online booking', '2025-11-09 13:11:42', '2025-11-11 19:11:42'),
(51, '4909e26d5674ac5794cf', 1, 10, 4, 'RES-NKH-DT-20251004-0257', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-04', '12:30:00', 'completed', NULL, 'Regular customer', '2025-09-28 05:32:55', '2025-10-04 08:32:55'),
(52, '14c51256d42e18de0382', 1, 6, 23, 'RES-NKH-DT-20251116-3577', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-16', '20:00:00', 'completed', 'Birthday celebration', 'Online booking', '2025-11-14 21:36:02', '2025-11-16 02:36:02'),
(53, '8af9786ef3b6805a971a', 1, 4, 29, 'RES-NKH-DT-20251110-5484', '2025-11-19 08:08:21', 60, 2, 7, '2025-11-10', '20:00:00', 'no_show', 'Quiet table please', 'Walk-in converted to reservation', '2025-11-07 20:42:48', '2025-11-10 00:42:48'),
(54, '01a2bdc0f920b51cb882', 1, 5, 16, 'RES-NKH-DT-20250923-7869', '2025-11-19 08:08:21', 60, 2, 3, '2025-09-23', '18:00:00', 'completed', 'Surprise dessert', 'Corporate booking', '2025-09-12 15:15:26', '2025-09-23 19:15:26'),
(55, '38fcc728dd389da13bb9', 1, 5, 1, 'RES-NKH-DT-20251102-0408', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-02', '13:30:00', 'no_show', 'Private dining area', NULL, '2025-10-28 03:57:06', '2025-11-02 06:57:06'),
(56, '0a609bd003f76313380a', 1, 3, 6, 'RES-NKH-DT-20251026-4361', '2025-11-19 08:08:21', 60, 2, 3, '2025-10-26', '13:30:00', 'completed', 'High chair needed', NULL, '2025-10-12 22:11:12', '2025-10-26 04:11:12'),
(57, '401c59ab5731d8aa9994', 1, 7, 23, 'RES-NKH-DT-20251025-3219', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-25', '12:30:00', 'completed', NULL, 'Regular customer', '2025-10-19 14:23:46', '2025-10-25 16:23:46'),
(58, '99d833c0346790ef5931', 1, 5, 14, 'RES-NKH-DT-20251101-4398', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-01', '20:30:00', 'no_show', 'Birthday celebration', 'Dietary restrictions noted', '2025-10-28 11:31:33', '2025-11-01 12:31:33'),
(59, 'e69ac2db4aaf5721c7ab', 1, 9, 29, 'RES-NKH-DT-20251015-2640', '2025-11-19 08:08:21', 60, 2, 8, '2025-10-15', '20:00:00', 'completed', 'Business meeting', 'Online booking', '2025-10-12 15:19:49', '2025-10-15 17:19:49'),
(60, 'e53de3d61ff48196cd18', 1, 10, 17, 'RES-NKH-DT-20251027-4507', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-27', '11:30:00', 'completed', 'Wheelchair accessible table', 'Walk-in converted to reservation', '2025-10-16 06:16:54', '2025-10-27 11:16:54'),
(61, '78024b19f241762bffaa', 1, 6, 36, 'RES-NKH-DT-20251026-1818', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-26', '19:00:00', 'no_show', NULL, NULL, '2025-10-22 11:37:24', '2025-10-26 13:37:24'),
(62, '21894185cc4965a73340', 1, 2, 23, 'RES-NKH-DT-20250929-8170', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-29', '13:00:00', 'completed', 'Early arrival possible', NULL, '2025-09-26 00:36:22', '2025-09-29 01:36:22'),
(63, '7dfbfce37c1ed437a9a6', 1, 7, 25, 'RES-NKH-DT-20251031-0912', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-31', '13:30:00', 'completed', 'Business meeting', 'Online booking', '2025-10-18 06:47:43', '2025-10-31 08:47:43'),
(64, 'c092ee7877f1631cfe07', 1, 7, 9, 'RES-NKH-DT-20251115-8523', '2025-11-19 08:08:21', 60, 2, 6, '2025-11-15', '13:30:00', 'completed', NULL, 'Corporate booking', '2025-11-10 14:49:39', '2025-11-15 20:49:39'),
(65, '9c235c3a931dcae22fd9', 1, 10, 16, 'RES-NKH-DT-20251117-3357', '2025-11-19 08:08:21', 60, 2, 6, '2025-11-17', '12:30:00', 'cancelled', 'Private dining area', NULL, '2025-11-15 20:48:38', '2025-11-17 00:48:38'),
(66, 'b6218fcef2607e0c2144', 1, 4, 30, 'RES-NKH-DT-20251017-0259', '2025-11-19 08:08:21', 60, 2, 5, '2025-10-17', '19:00:00', 'completed', NULL, 'VIP guest', '2025-10-10 20:30:08', '2025-10-17 02:30:08'),
(67, '4e15712ffa4464b2b87e', 1, 5, 5, 'RES-NKH-DT-20251114-7693', '2025-11-19 08:08:21', 60, 2, 6, '2025-11-14', '13:30:00', 'completed', NULL, 'Dietary restrictions noted', '2025-11-07 11:30:21', '2025-11-14 12:30:21'),
(68, '088026107b8b3655a556', 1, 6, 23, 'RES-NKH-DT-20251003-4727', '2025-11-19 08:08:21', 60, 2, 2, '2025-10-03', '11:30:00', 'completed', 'Quiet table please', NULL, '2025-10-02 08:15:48', '2025-10-03 09:15:48'),
(69, 'cec93b2c1980b7ffb55e', 1, 8, 34, 'RES-NKH-DT-20251112-3794', '2025-11-19 08:08:21', 60, 2, 4, '2025-11-12', '13:00:00', 'completed', NULL, 'VIP guest', '2025-10-31 10:12:45', '2025-11-12 12:12:45'),
(70, '14b80eb861e91c74c661', 1, 9, 22, 'RES-NKH-DT-20250920-0928', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-20', '18:00:00', 'cancelled', NULL, 'VIP guest', '2025-09-16 22:16:04', '2025-09-20 01:16:04'),
(71, 'bcc6c85ece0078273bda', 1, 4, 21, 'RES-NKH-DT-20250925-2638', '2025-11-19 08:08:21', 60, 2, 7, '2025-09-25', '18:00:00', 'completed', 'Vegetarian menu', 'VIP guest', '2025-09-18 04:23:37', '2025-09-25 06:23:37'),
(72, '05d4ead4569bee2dbb5a', 1, 1, 20, 'RES-NKH-DT-20251108-1990', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-08', '20:30:00', 'completed', 'Business meeting', 'Dietary restrictions noted', '2025-10-30 20:52:26', '2025-11-07 22:52:26'),
(73, 'ad125da69138e5becb87', 1, 6, 32, 'RES-NKH-DT-20251006-8874', '2025-11-19 08:08:21', 60, 2, 6, '2025-10-06', '12:00:00', 'completed', 'Business meeting', NULL, '2025-09-22 10:57:22', '2025-10-06 14:57:22'),
(74, 'c57274abafbf07cc767d', 1, 9, 10, 'RES-NKH-DT-20250924-1016', '2025-11-19 08:08:21', 60, 2, 2, '2025-09-24', '11:30:00', 'completed', 'Window seat preferred', NULL, '2025-09-19 08:46:47', '2025-09-24 11:46:47'),
(75, 'd2d7c27ddbc9ff3df526', 1, 6, 29, 'RES-NKH-DT-20251029-9571', '2025-11-19 08:08:21', 60, 2, 3, '2025-10-29', '12:00:00', 'cancelled', NULL, 'Regular customer', '2025-10-17 13:51:47', '2025-10-29 17:51:47'),
(76, 'b96a31c325b04b20811d', 1, 2, 16, 'RES-NKH-DT-20251012-1381', '2025-11-19 08:08:21', 60, 2, 6, '2025-10-12', '12:00:00', 'completed', NULL, NULL, '2025-10-05 04:02:27', '2025-10-12 10:02:27'),
(77, '5b9b65f7cf0bbdf1c677', 1, 7, 27, 'RES-NKH-DT-20251111-2413', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-11', '18:30:00', 'no_show', 'Window seat preferred', 'Dietary restrictions noted', '2025-11-06 13:31:20', '2025-11-11 19:31:20'),
(78, '2fd3a808a498f9b21b5f', 1, 5, 2, 'RES-NKH-DT-20250922-9625', '2025-11-19 08:08:21', 60, 2, 5, '2025-09-22', '20:30:00', 'cancelled', 'No allergens please', 'Regular customer', '2025-09-18 23:43:40', '2025-09-22 05:43:40'),
(79, '0a82c24ebf398b1c2555', 1, 11, 19, 'RES-NKH-DT-20251106-6660', '2025-11-19 08:08:21', 60, 2, 7, '2025-11-06', '20:00:00', 'no_show', 'Wheelchair accessible table', 'Group reservation', '2025-11-03 05:26:40', '2025-11-06 08:26:40'),
(80, '1ccca9cd5f516591485e', 1, 2, 24, 'RES-NKH-DT-20251013-8691', '2025-11-19 08:08:21', 60, 2, 4, '2025-10-13', '12:00:00', 'completed', 'Early arrival possible', 'Special occasion', '2025-10-07 09:25:12', '2025-10-13 11:25:12'),
(81, '4e2b78aee3dea121e9af', 1, 6, 13, 'RES-NKH-DT-20251230-4891', '2025-11-19 08:08:21', 60, 2, 5, '2025-12-30', '19:30:00', 'confirmed', 'Surprise dessert', 'VIP guest', '2025-11-17 01:08:21', '2025-11-16 01:08:21'),
(82, 'ff70780847339f6cecd8', 1, 3, 6, 'RES-NKH-DT-20251203-8333', '2025-11-19 08:08:21', 60, 2, 4, '2025-12-03', '13:00:00', 'confirmed', 'Private dining area', 'Walk-in converted to reservation', '2025-11-14 01:08:21', '2025-11-16 01:08:21'),
(83, '6acc59658941105ba2b7', 1, 3, 28, 'RES-NKH-DT-20251218-7434', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-18', '11:30:00', 'cancelled', NULL, 'VIP guest', '2025-11-18 01:08:21', '2025-11-17 01:08:21'),
(84, 'b67ab4d44486fb2bd232', 1, 10, 23, 'RES-NKH-DT-20251122-9525', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-22', '13:30:00', 'confirmed', 'Anniversary dinner', 'Corporate booking', '2025-11-19 01:08:21', '2025-11-17 01:08:21'),
(85, '93d0c3ae5cce212b1e1f', 1, 9, 3, 'RES-NKH-DT-20260107-1160', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-07', '11:30:00', 'confirmed', 'Vegetarian menu', 'Regular customer', '2025-11-14 01:08:21', '2025-11-19 01:08:21'),
(86, '85663927d71ca80d6e3d', 1, 2, 26, 'RES-NKH-DT-20251206-1728', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-06', '12:30:00', 'confirmed', 'Early arrival possible', NULL, '2025-11-17 01:08:21', '2025-11-19 01:08:21'),
(87, '97bddee1d1327b2f747d', 1, 9, 24, 'RES-NKH-DT-20251217-9581', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-17', '18:30:00', 'confirmed', 'Early arrival possible', 'Dietary restrictions noted', '2025-11-16 01:08:21', '2025-11-16 01:08:21'),
(88, 'ffcaee2be0ad860b016f', 1, 2, 15, 'RES-NKH-DT-20251208-1736', '2025-11-19 08:08:21', 60, 2, 3, '2025-12-08', '12:00:00', 'pending', NULL, 'Confirmed by phone', '2025-11-16 01:08:21', '2025-11-18 01:08:21'),
(89, '2e73827cff95b7ff8ca5', 1, 2, 36, 'RES-NKH-DT-20251124-4126', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-24', '20:00:00', 'cancelled', 'Vegetarian menu', 'Corporate booking', '2025-11-19 01:08:21', '2025-11-17 01:08:21'),
(90, '557113c3399e8f99f61d', 1, 1, 21, 'RES-NKH-DT-20251215-8316', '2025-11-19 08:08:21', 60, 2, 4, '2025-12-15', '12:00:00', 'confirmed', NULL, NULL, '2025-11-16 01:08:21', '2025-11-17 01:08:21'),
(91, '654b902eeaf68aa3d666', 1, 9, 11, 'RES-NKH-DT-20251208-9048', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-08', '19:30:00', 'confirmed', 'Window seat preferred', 'Dietary restrictions noted', '2025-11-13 01:08:21', '2025-11-18 01:08:21'),
(92, '034389cf574c021a0ab4', 1, 8, 24, 'RES-NKH-DT-20251212-2396', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-12', '18:30:00', 'confirmed', NULL, NULL, '2025-11-17 01:08:21', '2025-11-19 01:08:21'),
(93, '8b620dceab866f57596b', 1, 4, 21, 'RES-NKH-DT-20251205-3247', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-05', '13:30:00', 'cancelled', 'Surprise dessert', 'Special occasion', '2025-11-14 01:08:21', '2025-11-17 01:08:21'),
(94, 'b3662cbaefef81984599', 1, 3, 22, 'RES-NKH-DT-20251203-5330', '2025-11-19 08:08:21', 60, 2, 3, '2025-12-03', '18:30:00', 'confirmed', 'Window seat preferred', 'VIP guest', '2025-11-15 01:08:21', '2025-11-18 01:08:21'),
(95, 'b9945ac881ecb1fdbf50', 1, 2, 36, 'RES-NKH-DT-20260114-8879', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-14', '19:30:00', 'pending', 'Business meeting', NULL, '2025-11-17 01:08:21', '2025-11-16 01:08:21'),
(96, 'b5cb8343fbb418e5881a', 1, 7, 33, 'RES-NKH-DT-20251129-1080', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-29', '19:30:00', 'cancelled', 'High chair needed', 'VIP guest', '2025-11-12 01:08:21', '2025-11-18 01:08:21'),
(97, '2d1538a08aac584634b1', 1, 3, 17, 'RES-NKH-DT-20251129-4263', '2025-11-19 08:08:21', 60, 2, 7, '2025-11-29', '20:30:00', 'confirmed', NULL, 'Regular customer', '2025-11-17 01:08:21', '2025-11-18 01:08:21'),
(98, 'dbfda31aae8ecddad7af', 1, 7, 18, 'RES-NKH-DT-20260103-1780', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-03', '19:00:00', 'pending', NULL, 'Special occasion', '2025-11-17 01:08:21', '2025-11-16 01:08:21'),
(99, '62c07d996b9f2bbb0364', 1, 2, 32, 'RES-NKH-DT-20251223-3772', '2025-11-19 08:08:21', 60, 2, 3, '2025-12-23', '13:30:00', 'pending', 'Window seat preferred', 'First time visitor', '2025-11-16 01:08:21', '2025-11-19 01:08:21'),
(100, '4289fa4a072c1ff7b0d8', 1, 1, 3, 'RES-NKH-DT-20251231-3092', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-31', '18:30:00', 'confirmed', NULL, NULL, '2025-11-13 01:08:21', '2025-11-16 01:08:21'),
(101, 'cb981432654e823dd01d', 1, 1, 36, 'RES-NKH-DT-20251209-7904', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-09', '18:00:00', 'confirmed', NULL, 'Walk-in converted to reservation', '2025-11-13 01:08:21', '2025-11-17 01:08:21'),
(102, '371442432b23158c6323', 1, 8, 2, 'RES-NKH-DT-20251215-2207', '2025-11-19 08:08:21', 60, 2, 3, '2025-12-15', '19:00:00', 'confirmed', NULL, NULL, '2025-11-19 01:08:21', '2025-11-18 01:08:21'),
(103, '682ddbc2d637f36fb3d1', 1, 2, 32, 'RES-NKH-DT-20251231-3436', '2025-11-19 08:08:21', 60, 2, 4, '2025-12-31', '13:30:00', 'confirmed', 'Wheelchair accessible table', 'Walk-in converted to reservation', '2025-11-16 01:08:21', '2025-11-16 01:08:21'),
(104, 'dde4c38ea5ef2b4392bb', 1, 4, 18, 'RES-NKH-DT-20251125-1986', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-25', '19:30:00', 'confirmed', 'Birthday celebration', 'First time visitor', '2025-11-14 01:08:21', '2025-11-16 01:08:21'),
(105, '3104fd01caca41e31d2d', 1, 4, 7, 'RES-NKH-DT-20251212-2720', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-12', '12:30:00', 'confirmed', NULL, 'Confirmed by phone', '2025-11-15 01:08:21', '2025-11-16 01:08:21'),
(106, 'd6b26a1a544a505ff2ac', 1, 2, 24, 'RES-NKH-DT-20251124-6115', '2025-11-19 08:08:21', 60, 2, 3, '2025-11-24', '11:30:00', 'pending', NULL, 'First time visitor', '2025-11-13 01:08:21', '2025-11-19 01:08:21'),
(107, 'f3ffad1255e74789f5c3', 1, 4, 33, 'RES-NKH-DT-20251215-1031', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-15', '13:30:00', 'confirmed', 'No allergens please', 'Corporate booking', '2025-11-19 01:08:21', '2025-11-17 01:08:21'),
(108, '335f13b6834da0c89f34', 1, 9, 25, 'RES-NKH-DT-20260108-5799', '2025-11-19 08:08:21', 60, 2, 3, '2026-01-08', '19:30:00', 'pending', NULL, NULL, '2025-11-13 01:08:21', '2025-11-19 01:08:21'),
(109, '993cac07c9809a2431b2', 1, 5, 23, 'RES-NKH-DT-20251216-5673', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-16', '13:00:00', 'confirmed', 'Early arrival possible', 'Confirmed by phone', '2025-11-18 01:08:21', '2025-11-17 01:08:21'),
(110, 'f2d70d8cbdb02359982a', 1, 4, 8, 'RES-NKH-DT-20251127-6734', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-27', '12:30:00', 'pending', 'Early arrival possible', 'Walk-in converted to reservation', '2025-11-13 01:08:21', '2025-11-17 01:08:21'),
(111, 'f39c7aee64e41b7ed4ea', 1, 10, 24, 'RES-NKH-DT-20251127-6688', '2025-11-19 08:08:21', 60, 2, 6, '2025-11-27', '20:30:00', 'confirmed', NULL, NULL, '2025-11-19 01:08:21', '2025-11-17 01:08:21'),
(112, '7fb8c142502205bc346e', 1, 2, 9, 'RES-NKH-DT-20251206-5784', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-06', '19:00:00', 'cancelled', 'Business meeting', NULL, '2025-11-13 01:08:21', '2025-11-16 01:08:21'),
(113, 'b3c7c0be7e31f6c0f9c3', 1, 11, 11, 'RES-NKH-DT-20251222-3002', '2025-11-19 08:08:21', 60, 2, 6, '2025-12-22', '18:30:00', 'cancelled', 'Wheelchair accessible table', NULL, '2025-11-17 01:08:21', '2025-11-19 01:08:21'),
(114, 'a440a49b2b13c1a481db', 1, 8, 29, 'RES-NKH-DT-20251229-4718', '2025-11-19 08:08:21', 60, 2, 7, '2025-12-29', '20:00:00', 'confirmed', 'Business meeting', 'Dietary restrictions noted', '2025-11-15 01:08:21', '2025-11-17 01:08:21'),
(115, '91dde41280738ed09eff', 1, 7, 16, 'RES-NKH-DT-20260116-4122', '2025-11-19 08:08:21', 60, 2, 3, '2026-01-16', '19:00:00', 'confirmed', 'Window seat preferred', NULL, '2025-11-18 01:08:21', '2025-11-18 01:08:21'),
(116, 'edb5bd9a26c8d6ab58d7', 1, 4, 36, 'RES-NKH-DT-20260108-3911', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-08', '20:00:00', 'cancelled', 'Early arrival possible', NULL, '2025-11-12 01:08:21', '2025-11-17 01:08:21'),
(117, 'a6b06aeb9409203015af', 1, 6, 20, 'RES-NKH-DT-20260111-2271', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-11', '20:00:00', 'confirmed', 'High chair needed', NULL, '2025-11-19 01:08:21', '2025-11-17 01:08:21'),
(118, '59a4cf9af453497eca2f', 1, 10, 15, 'RES-NKH-DT-20260106-6858', '2025-11-19 08:08:21', 60, 2, 4, '2026-01-06', '13:00:00', 'confirmed', NULL, NULL, '2025-11-13 01:08:21', '2025-11-18 01:08:21'),
(119, '049a893f2b4fe898288b', 1, 10, 1, 'RES-NKH-DT-20251127-3044', '2025-11-19 08:08:21', 60, 2, 6, '2025-11-27', '20:00:00', 'pending', 'Surprise dessert', NULL, '2025-11-12 01:08:21', '2025-11-18 01:08:21'),
(120, 'd22a4534487f84bf62b2', 1, 1, 12, 'RES-NKH-DT-20260114-0045', '2025-11-19 08:08:21', 60, 2, 4, '2026-01-14', '13:30:00', 'cancelled', NULL, NULL, '2025-11-17 01:08:21', '2025-11-18 01:08:21'),
(121, 'e37bbc515c332ef34fec', 1, 6, 27, 'RES-NKH-DT-20260115-7252', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-15', '12:00:00', 'confirmed', NULL, NULL, '2025-11-12 01:08:21', '2025-11-16 01:08:21'),
(122, 'af987bb2777246773b8e', 1, 6, 1, 'RES-NKH-DT-20251122-3205', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-22', '13:30:00', 'pending', NULL, 'Corporate booking', '2025-11-16 01:08:21', '2025-11-18 01:08:21'),
(123, 'dfbb3ce7b0161dcd9cfe', 1, 5, 25, 'RES-NKH-DT-20260109-2352', '2025-11-19 08:08:21', 60, 2, 4, '2026-01-09', '19:00:00', 'cancelled', 'Vegetarian menu', 'Corporate booking', '2025-11-19 01:08:21', '2025-11-16 01:08:21'),
(124, 'f96645d2441c174568c7', 1, 9, 29, 'RES-NKH-DT-20251217-8423', '2025-11-19 08:08:21', 60, 2, 5, '2025-12-17', '12:00:00', 'confirmed', NULL, NULL, '2025-11-17 01:08:21', '2025-11-19 01:08:21'),
(125, '2bba64a3f4a5894ecd10', 1, 10, 36, 'RES-NKH-DT-20251218-8289', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-18', '12:30:00', 'confirmed', 'Anniversary dinner', 'First time visitor', '2025-11-12 01:08:21', '2025-11-19 01:08:21'),
(126, '8f70298528185382fd79', 1, 8, 23, 'RES-NKH-DT-20251224-5082', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-24', '11:30:00', 'confirmed', 'Surprise dessert', NULL, '2025-11-18 01:08:21', '2025-11-17 01:08:21'),
(127, '3b9d26b94db6756c1bc7', 1, 9, 8, 'RES-NKH-DT-20251209-3205', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-09', '20:00:00', 'confirmed', 'Vegetarian menu', 'Walk-in converted to reservation', '2025-11-12 01:08:21', '2025-11-18 01:08:21'),
(128, '66a94266df4453b378b8', 1, 5, 2, 'RES-NKH-DT-20260116-5202', '2025-11-19 08:08:21', 60, 2, 6, '2026-01-16', '20:00:00', 'cancelled', 'Wheelchair accessible table', 'Dietary restrictions noted', '2025-11-16 01:08:21', '2025-11-19 01:08:21'),
(129, '0feb185e27256b870640', 1, 6, 35, 'RES-NKH-DT-20260101-0972', '2025-11-19 08:08:21', 60, 2, 5, '2026-01-01', '12:30:00', 'confirmed', NULL, 'Confirmed by phone', '2025-11-12 01:08:21', '2025-11-19 01:08:21'),
(130, '5563197033af4c182c04', 1, 5, 3, 'RES-NKH-DT-20251130-8493', '2025-11-19 08:08:21', 60, 2, 2, '2025-11-30', '20:30:00', 'confirmed', 'Window seat preferred', 'Confirmed by phone', '2025-11-19 01:08:21', '2025-11-18 01:08:21'),
(131, 'b75c5d91561ebdd9f7d4', 1, 8, 12, 'RES-NKH-DT-20260110-5114', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-10', '13:30:00', 'confirmed', 'No allergens please', 'First time visitor', '2025-11-17 01:08:21', '2025-11-18 01:08:21'),
(132, '1d1b4b1b78fbd3b6dcba', 1, 1, 3, 'RES-NKH-DT-20251218-7909', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-18', '18:00:00', 'pending', 'No allergens please', NULL, '2025-11-18 01:08:21', '2025-11-17 01:08:21'),
(133, 'd54464bf0120e3ff93d1', 1, 4, 7, 'RES-NKH-DT-20251225-5186', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-25', '20:30:00', 'pending', 'Private dining area', 'Special occasion', '2025-11-17 01:08:21', '2025-11-19 01:08:21'),
(134, '341a095546ce9d131869', 1, 5, 15, 'RES-NKH-DT-20260108-9714', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-08', '12:30:00', 'cancelled', 'Business meeting', NULL, '2025-11-16 01:08:21', '2025-11-16 01:08:21'),
(135, '73fd92a8e02b3a3066af', 1, 3, 36, 'RES-NKH-DT-20260113-7322', '2025-11-19 08:08:21', 60, 2, 2, '2026-01-13', '20:00:00', 'pending', 'Business meeting', 'Confirmed by phone', '2025-11-13 01:08:21', '2025-11-17 01:08:21'),
(136, 'f6de1dbe694902945cbc', 1, 9, 28, 'RES-NKH-DT-20251222-2056', '2025-11-19 08:08:21', 60, 2, 2, '2025-12-22', '12:30:00', 'cancelled', 'No allergens please', NULL, '2025-11-13 01:08:21', '2025-11-19 01:08:21'),
(137, '2e69b288ba3fbb4770b0', 1, 1, 4, 'RES-NKH-DT-20251209-3816', '2025-11-19 08:08:21', 60, 2, 4, '2025-12-09', '18:30:00', 'pending', NULL, 'Dietary restrictions noted', '2025-11-18 01:08:21', '2025-11-19 01:08:21'),
(138, '6ebe962965766990356b', 1, 11, 19, 'RES-NKH-DT-20251124-8831', '2025-11-19 08:08:21', 60, 2, 5, '2025-11-24', '11:30:00', 'confirmed', 'Window seat preferred', 'Regular customer', '2025-11-15 01:08:21', '2025-11-17 01:08:21'),
(139, 'dba802a967da605e93ac', 1, 6, 9, 'RES-NKH-DT-20251221-1882', '2025-11-19 08:08:21', 60, 2, 3, '2025-12-21', '20:00:00', 'confirmed', 'Surprise dessert', 'Group reservation', '2025-11-16 01:08:21', '2025-11-17 01:08:21'),
(140, '9987391150c29d6cf24b', 1, 6, 2, 'RES-NKH-DT-20251207-1294', '2025-11-19 08:08:21', 60, 2, 4, '2025-12-07', '11:30:00', 'confirmed', 'Private dining area', 'Online booking', '2025-11-15 01:08:21', '2025-11-17 01:08:21');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin', 'Full system access with all permissions', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(2, 'Manager', 'manager', 'Restaurant management access', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(3, 'Cashier', 'cashier', 'Handles payments and orders', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(4, 'Waiter', 'waiter', 'Manages orders and service', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(5, 'Chef', 'chef', 'Kitchen management access', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(6, 'Employee', 'employee', 'General employee access', '2025-11-19 01:07:57', '2025-11-19 01:07:57'),
(7, 'Customer', 'customer', 'Regular customer access', '2025-11-19 01:07:57', '2025-11-19 01:07:57');

-- --------------------------------------------------------

--
-- Table structure for table `role_permission`
--

CREATE TABLE `role_permission` (
  `role_id` bigint UNSIGNED NOT NULL,
  `permission_id` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permission`
--

INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(2, 6),
(1, 7),
(1, 8),
(2, 8),
(1, 9),
(1, 10),
(2, 10),
(5, 10),
(1, 11),
(2, 11),
(1, 12),
(2, 12),
(1, 13),
(1, 14),
(2, 14),
(4, 14),
(5, 14),
(7, 14),
(1, 15),
(2, 15),
(4, 15),
(7, 15),
(1, 16),
(2, 16),
(4, 16),
(5, 16),
(1, 17),
(1, 18),
(2, 18),
(1, 19),
(2, 19),
(1, 20),
(2, 20),
(4, 20),
(1, 21),
(1, 22),
(2, 22),
(1, 23),
(2, 23);

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `role_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_user`
--

INSERT INTO `role_user` (`role_id`, `user_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(6, 5),
(6, 6),
(6, 7),
(6, 8),
(6, 9),
(6, 10),
(6, 11),
(6, 12),
(6, 13),
(6, 14),
(6, 15),
(6, 16),
(6, 17),
(6, 18),
(6, 19),
(6, 20),
(7, 21),
(7, 22),
(7, 23),
(7, 24),
(7, 25),
(7, 26),
(7, 27),
(7, 28),
(7, 29),
(7, 30),
(6, 32);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('AwsrSPyX3bur9q4i2TsV2f0lY0yuzdAfd3bi49bf', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'YTo2OntzOjY6Il90b2tlbiI7czo0MDoiZmN6U1QydXpmZU9WZ0RpdmNEcFVScnJkRlVHSHZXcDlJMVJtQXB0biI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzY6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9pbnZvaWNlcyI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6MzoidXJsIjthOjE6e3M6ODoiaW50ZW5kZWQiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9kYXNoYm9hcmQiO31zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxO3M6MjI6IlBIUERFQlVHQkFSX1NUQUNLX0RBVEEiO2E6MDp7fX0=', 1763544085);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED DEFAULT NULL,
  `key` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint UNSIGNED NOT NULL,
  `location_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_terms` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `tax_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `location_id`, `code`, `name`, `contact_name`, `contact_phone`, `email`, `phone`, `address`, `type`, `payment_terms`, `notes`, `tax_id`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, NULL, 'SUP-001', 'Phnom Penh Produce Co.', 'Sokha Chen', '+855-12-345-678', 'orders@phnompenhproduce.com', NULL, '123 Norodom Blvd, Phnom Penh', 'produce', 'net_30', 'Local fresh produce supplier', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(2, NULL, 'SUP-002', 'Mekong Seafood Supply', 'Dara Meas', '+855-12-456-789', 'sales@mekongseafood.com', NULL, '456 Sisowath Quay, Phnom Penh', 'seafood', 'net_15', 'Fresh seafood daily delivery', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(3, NULL, 'SUP-003', 'Kampot Spice Traders', 'Kunthea Pich', '+855-12-567-890', 'info@kampotspices.com', NULL, '789 Street 13, Kampot', 'spices', 'net_30', 'Premium Kampot pepper and spices', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(4, NULL, 'SUP-004', 'Asian Food Solutions', 'Sovann Kim', '+855-12-678-901', 'orders@asianfoodsolutions.com', NULL, '101 Street 271, Phnom Penh', 'dry_goods', 'net_45', 'Bulk dry goods supplier', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(5, NULL, 'SUP-005', 'Battambang Rice Co.', 'Chanthy Roth', '+855-12-789-012', 'sales@battambangrice.com', NULL, '202 National Road 5, Battambang', 'rice', 'net_30', 'Premium jasmine rice supplier', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(6, NULL, 'SUP-006', 'Siem Reap Organic Farms', 'Bopha Prak', '+855-12-890-123', 'contact@srorganics.com', NULL, '303 Charles de Gaulle, Siem Reap', 'produce', 'net_15', 'Organic vegetables and herbs', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(7, NULL, 'SUP-007', 'Cambodia Beverage Co.', 'Vibol Tep', '+855-12-901-234', 'orders@cambev.com', NULL, '404 Mao Tse Toung Blvd, Phnom Penh', 'beverages', 'net_30', 'Beverages and drink supplies', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL),
(8, NULL, 'SUP-008', 'Kandal Poultry Farms', 'Sophal Nget', '+855-12-012-345', 'orders@kandalpoultry.com', NULL, '505 National Road 4, Kandal', 'poultry', 'cod', 'Fresh chicken and eggs', NULL, 1, '2025-11-19 01:08:07', '2025-11-19 01:08:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `id` bigint UNSIGNED NOT NULL,
  `floor_id` bigint UNSIGNED NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int UNSIGNED NOT NULL DEFAULT '2',
  `status` enum('available','reserved','occupied','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`id`, `floor_id`, `code`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'GF-01', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(2, 1, 'GF-02', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(3, 1, 'GF-03', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(4, 1, 'GF-04', 4, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(5, 1, 'GF-05', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(6, 1, 'GF-06', 4, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(7, 1, 'GF-07', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(8, 1, 'GF-08', 6, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(9, 1, 'GF-09', 6, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(10, 1, 'GF-10', 2, 'reserved', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(11, 1, 'GF-11', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(12, 1, 'GF-12', 4, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(13, 2, '2F-01', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(14, 2, '2F-02', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(15, 2, '2F-03', 4, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(16, 2, '2F-04', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(17, 2, '2F-05', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(18, 2, '2F-06', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(19, 2, '2F-07', 8, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(20, 2, '2F-08', 2, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(21, 2, '2F-09', 8, 'reserved', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(22, 2, '2F-10', 6, 'unavailable', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(23, 3, 'TR-01', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(24, 3, 'TR-02', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(25, 3, 'TR-03', 4, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(26, 3, 'TR-04', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(27, 3, 'TR-05', 4, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(28, 3, 'TR-06', 2, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(29, 3, 'TR-07', 8, 'reserved', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(30, 3, 'TR-08', 8, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(31, 4, 'VIP-01', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(32, 4, 'VIP-02', 6, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(33, 4, 'VIP-03', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(34, 4, 'VIP-04', 6, 'occupied', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(35, 4, 'VIP-05', 6, 'reserved', '2025-11-19 01:08:08', '2025-11-19 01:08:08'),
(36, 4, 'VIP-06', 2, 'available', '2025-11-19 01:08:08', '2025-11-19 01:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` bigint UNSIGNED NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_unit` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversion_factor` decimal(10,3) DEFAULT NULL,
  `is_base_unit` tinyint(1) NOT NULL DEFAULT '0',
  `for_weight` tinyint(1) NOT NULL DEFAULT '0',
  `for_volume` tinyint(1) NOT NULL DEFAULT '0',
  `for_quantity` tinyint(1) NOT NULL DEFAULT '0',
  `for_packaging` tinyint(1) NOT NULL DEFAULT '0',
  `for_produce` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `code`, `name`, `display_name`, `base_unit`, `conversion_factor`, `is_base_unit`, `for_weight`, `for_volume`, `for_quantity`, `for_packaging`, `for_produce`, `created_at`, `updated_at`) VALUES
(1, 'kg', 'Kilogram', 'kg', NULL, NULL, 1, 1, 0, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(2, 'g', 'Gram', 'g', 'kg', 0.001, 0, 1, 0, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(3, 'l', 'Liter', 'L', NULL, NULL, 1, 0, 1, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(4, 'ml', 'Milliliter', 'mL', 'l', 0.001, 0, 0, 1, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(5, 'pcs', 'Piece', 'pc', NULL, NULL, 1, 0, 0, 1, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(6, 'dz', 'Dozen', 'dz', 'pcs', 12.000, 0, 0, 0, 1, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(7, 'box', 'Box', 'box', NULL, NULL, 1, 0, 0, 0, 1, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(8, 'case', 'Case', 'case', NULL, NULL, 1, 0, 0, 0, 1, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(9, 'pack', 'Pack', 'pack', NULL, NULL, 1, 0, 0, 0, 1, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(10, 'bag', 'Bag', 'bag', NULL, NULL, 1, 0, 0, 0, 1, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(11, 'bunch', 'Bunch', 'bunch', NULL, NULL, 1, 0, 0, 0, 0, 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(12, 'tsp', 'Teaspoon', 'tsp', 'ml', 5.000, 0, 0, 1, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(13, 'tbsp', 'Tablespoon', 'tbsp', 'ml', 15.000, 0, 0, 1, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(14, 'cup', 'Cup', 'cup', 'ml', 250.000, 0, 0, 1, 0, 0, 0, '2025-11-19 01:07:58', '2025-11-19 01:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_location_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `email_verified_at`, `password`, `is_active`, `remember_token`, `default_location_id`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'demo@admin.com', '+855-12-345-678', '2025-11-19 01:07:58', '$2y$12$G1zjqaT/TTnWqsodlzWU4uIQTScgRA2IWS/gvM7XH2UIgE6A29FSC', 1, NULL, 1, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(2, 'Secondary Admin', 'admin2@nkhrestaurant.com', '+855-12-987-654', '2025-11-19 01:07:58', '$2y$12$8SS5bvdqtiG7c85O5YWrruTGGcVVbu21JaV9a9QOvnX8E2mzF0i3S', 1, NULL, 2, '2025-11-19 01:07:58', '2025-11-19 01:07:58'),
(3, 'Sophea Chen', 'sophea.chen@nkhrestaurant.com', '+855-12-456-789', '2025-11-19 01:07:59', '$2y$12$UXL9EqaCy.Asl3AnejHOV.XnEX4wtoQFUnTad5U0hUh5.gUnvZZUG', 1, NULL, 1, '2025-11-19 01:07:59', '2025-11-19 01:07:59'),
(4, 'Pisach Lim', 'pisach.lim@nkhrestaurant.com', '+855-12-456-790', '2025-11-19 01:07:59', '$2y$12$TmlPeVTLvSqjVSbV6thHuuZZFNIfg067D4w76Pd/l.8htE/D/8/Qm', 1, NULL, 2, '2025-11-19 01:07:59', '2025-11-19 01:07:59'),
(5, 'Ratha Meng', 'demo@employee.com', '+855-40-425-837', '2025-11-19 01:07:59', '$2y$12$rN.89M2uAkW70DCf1SFJ6uha8QQCxr30bLpAbC9JWKKOLgb9hp2GW', 1, NULL, 1, '2025-11-19 01:07:59', '2025-11-19 01:07:59'),
(6, 'Maria Santos', 'maria.santos@nkhrestaurant.com', '+855-33-568-858', '2025-11-19 01:07:59', '$2y$12$2vYcWt7hGQWsB6ag6fMOyOr07rp9yGU9RWzNVIebYuY11ZkLrZo42', 1, NULL, 2, '2025-11-19 01:07:59', '2025-11-19 01:07:59'),
(7, 'Bopha Keo', 'bopha.keo@nkhrestaurant.com', '+855-91-957-138', '2025-11-19 01:08:00', '$2y$12$FOKZS6WO90L0KAaF7FLWt.e/AoDW/kRl77BM1ksJT1PPGd.JnU7b.', 1, NULL, 1, '2025-11-19 01:08:00', '2025-11-19 01:08:00'),
(8, 'Sovannak Pich', 'sovannak.pich@nkhrestaurant.com', '+855-89-953-776', '2025-11-19 01:08:00', '$2y$12$p4YvKgdf5D2OCfl.D/nd6urKrrRt1kKGuRe07F5L.seK.OvYZA7/W', 1, NULL, 3, '2025-11-19 01:08:00', '2025-11-19 01:08:00'),
(9, 'Sokha Rath', 'sokha.rath@nkhrestaurant.com', '+855-18-144-318', '2025-11-19 01:08:00', '$2y$12$GadYc0HXVPwYKHGg5qmSWebvExFPF.PdM0bcYOEwp8NiowPAvKdKS', 1, NULL, 1, '2025-11-19 01:08:00', '2025-11-19 01:08:00'),
(10, 'Dara Chea', 'dara.chea@nkhrestaurant.com', '+855-43-226-149', '2025-11-19 01:08:01', '$2y$12$koP/16GLP/fV30uMHm8dMuwm9QRWU6D2g7zSxq1FwS2u4gHIS9B4u', 1, NULL, 2, '2025-11-19 01:08:01', '2025-11-19 01:08:01'),
(11, 'Sreypov Noun', 'sreypov.noun@nkhrestaurant.com', '+855-47-769-755', '2025-11-19 01:08:01', '$2y$12$x1H.96EsSNyXP7SEYqVx.u0wla3Q3mhfvSvT2/mpJagRJSO.QIYqC', 1, NULL, 1, '2025-11-19 01:08:01', '2025-11-19 01:08:01'),
(12, 'Kimheng Ly', 'kimheng.ly@nkhrestaurant.com', '+855-59-190-337', '2025-11-19 01:08:01', '$2y$12$SO3rPPcr0xw1s99MhXfQKung62O2Ie.kF3oHSA.DBt1aOCb8l/0eu', 1, NULL, 2, '2025-11-19 01:08:01', '2025-11-19 01:08:01'),
(13, 'Pheaktra Ouk', 'pheaktra.ouk@nkhrestaurant.com', '+855-56-191-357', '2025-11-19 01:08:01', '$2y$12$..t.DS04nccpLUxX3qOZQOjLvgqsbtDlFXKKcvlRVtsaWeHnnkfxe', 1, NULL, 3, '2025-11-19 01:08:01', '2025-11-19 01:08:01'),
(14, 'Veasna Chhay', 'veasna.chhay@nkhrestaurant.com', '+855-78-655-918', '2025-11-19 01:08:02', '$2y$12$fvynhHALNoVhdvIrJSUWs.WZC0Eqy2X/IWxzk.CoNVi0F2rVoxpa6', 1, NULL, 4, '2025-11-19 01:08:02', '2025-11-19 01:08:02'),
(15, 'Bunthoeun Sao', 'bunthoeun.sao@nkhrestaurant.com', '+855-78-923-513', '2025-11-19 01:08:02', '$2y$12$8y8wIaCpINY0OGsVFkv41ei4u0l.4naAduQxLi8B/I/durQGyKgfa', 1, NULL, 1, '2025-11-19 01:08:02', '2025-11-19 01:08:02'),
(16, 'Chenda Ros', 'chenda.ros@nkhrestaurant.com', '+855-63-113-627', '2025-11-19 01:08:02', '$2y$12$JdW1cpxusvGpGucrh0H7CebGjDBR97BxpTipn0Y4tzCmpYRsgrupG', 1, NULL, 2, '2025-11-19 01:08:02', '2025-11-19 01:08:02'),
(17, 'Sopheak Mao', 'sopheak.mao@nkhrestaurant.com', '+855-70-814-545', '2025-11-19 01:08:03', '$2y$12$ptnBRq.kX0edLmojvZwrzOwH1SoI0jyOGUBEa4tK9PPHAE2sem53q', 1, NULL, 1, '2025-11-19 01:08:03', '2025-11-19 01:08:03'),
(18, 'Rachana Heng', 'rachana.heng@nkhrestaurant.com', '+855-63-804-796', '2025-11-19 01:08:03', '$2y$12$ZbUK06jM8gdtnivg2rqzYuaonEtVK852kiONl3/IS938jyPCuug2i', 1, NULL, 2, '2025-11-19 01:08:03', '2025-11-19 01:08:03'),
(19, 'Sreyleak Kong', 'sreyleak.kong@nkhrestaurant.com', '+855-34-128-552', '2025-11-19 01:08:03', '$2y$12$a9SsVJ38p7fcSeprm6FGAey2YllfFqOrqaH1tCweqsqdAI01x5hx2', 1, NULL, 3, '2025-11-19 01:08:03', '2025-11-19 01:08:03'),
(20, 'Pisey Nhem', 'pisey.nhem@nkhrestaurant.com', '+855-24-442-972', '2025-11-19 01:08:03', '$2y$12$KTLXJNMKl4kxw2A.9G/UK.5h4A9782f1A/DYICqT8T7LobBxDMiwe', 1, NULL, 4, '2025-11-19 01:08:03', '2025-11-19 01:08:03'),
(21, 'Chantha Lim', 'demo@customer.com', '+855-89-326-589', '2025-11-19 01:08:04', '$2y$12$ETSj4jLgW.KzifKRefeTruDzrhqP118dZ3i5DkD3d43UOI0lvgJ0a', 1, NULL, 1, '2025-11-19 01:08:04', '2025-11-19 01:08:04'),
(22, 'David Kim', 'david.kim@yahoo.com', '+855-62-301-401', '2025-11-19 01:08:04', '$2y$12$GsmS3lc9xnYfx4848SS2ROoTO/Hcru4pyT/vDWI1oU1pqICoLejE2', 1, NULL, 2, '2025-11-19 01:08:04', '2025-11-19 01:08:04'),
(23, 'Sophea Chhun', 'sophea.chhun@hotmail.com', '+855-22-310-988', '2025-11-19 01:08:04', '$2y$12$ov0BGaSljxiFdKqiY5B/nu3sXi3vW.Vv20.kcKW7JoAo416RK7l66', 1, NULL, 1, '2025-11-19 01:08:04', '2025-11-19 01:08:04'),
(24, 'Linda Martinez', 'linda.martinez@gmail.com', '+855-33-273-348', '2025-11-19 01:08:04', '$2y$12$oMjfJlhVOb85app0hzjzi.D.ROoScYz3i7l1zHzvZz.uhBbfXBvGi', 1, NULL, 3, '2025-11-19 01:08:04', '2025-11-19 01:08:04'),
(25, 'Narong Sok', 'narong.sok@gmail.com', '+855-52-871-893', '2025-11-19 01:08:05', '$2y$12$K8Mkq6ABYM9aWzZ4WcU6r.FbOcKTpYHFk2jK5/W0uKOQGNBE/0do6', 1, NULL, 2, '2025-11-19 01:08:05', '2025-11-19 01:08:05'),
(26, 'Sokny Phan', 'sokny.phan@gmail.com', '+855-75-152-422', '2025-11-19 01:08:05', '$2y$12$GUGiPADjdwtZzFlUx72WlOcH55wygDJ2F3PWLuXqVUjBLyni/uEwO', 1, NULL, 1, '2025-11-19 01:08:05', '2025-11-19 01:08:05'),
(27, 'Sothy Chan', 'sothy.chan@gmail.com', '+855-73-953-680', '2025-11-19 01:08:05', '$2y$12$XSROXD13g9jjBzS71u.ig.PYsqxCUnJZrbzc1mrEGWOoBvn9mC8I.', 1, NULL, 3, '2025-11-19 01:08:05', '2025-11-19 01:08:05'),
(28, 'Nita Heng', 'nita.heng@gmail.com', '+855-76-405-335', '2025-11-19 01:08:06', '$2y$12$pmiXFgZA2/ySNLnWrnRwgOOVCAqzIcMwfShC2Sd.KnPMptO9LFcAy', 1, NULL, 4, '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(29, 'Alex Johnson', 'alex.johnson@gmail.com', '+855-43-850-289', '2025-11-19 01:08:06', '$2y$12$KySsve6QwfX83So6UEaEh.mvb041HLWfeFcxT9bNPGcMiIQ5/NsgW', 1, NULL, 2, '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(30, 'Vanna Oum', 'vanna.oum@gmail.com', '+855-40-731-718', '2025-11-19 01:08:06', '$2y$12$6MZAjx4K1LXG3uAJ6wWw/.BTWH9PHhlxAiKf2Bg2jP9ULiYWQKS6O', 1, NULL, 1, '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(31, 'Sample Customer', 'customer@example.com', '+855 98 765 432', NULL, '$2y$12$3f2GYYJpc4GZKraST1UvcOdlbsfwHw/IccVdwd7g4HYWiI5nugZwy', 1, NULL, 1, '2025-11-19 01:08:06', '2025-11-19 01:08:06'),
(32, 'Ratha Meng', 'ratha.meng@nkhrestaurant.com', '+855-82-287-387', '2025-11-19 01:08:08', '$2y$12$SgFdyLmihgS.M2PSdfTpceo354BGT51VxxfLSneuiWTFLopO8co3q', 1, NULL, 1, '2025-11-19 01:08:08', '2025-11-19 01:08:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendances_location_id_foreign` (`location_id`),
  ADD KEY `attendances_employee_id_clock_in_at_index` (`employee_id`,`clock_in_at`),
  ADD KEY `attendances_clock_in_at_index` (`clock_in_at`),
  ADD KEY `attendances_clock_out_at_index` (`clock_out_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id_foreign` (`user_id`),
  ADD KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  ADD KEY `audit_logs_created_at_index` (`created_at`),
  ADD KEY `audit_logs_action_index` (`action`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_location_id_slug_unique` (`location_id`,`slug`),
  ADD KEY `categories_slug_index` (`slug`),
  ADD KEY `categories_is_active_index` (`is_active`),
  ADD KEY `categories_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `category_translations`
--
ALTER TABLE `category_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_translations_category_id_locale_unique` (`category_id`,`locale`),
  ADD KEY `category_translations_locale_index` (`locale`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customers_user_id_unique` (`user_id`),
  ADD UNIQUE KEY `customers_customer_code_unique` (`customer_code`),
  ADD KEY `customers_preferred_location_id_index` (`preferred_location_id`);

--
-- Indexes for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_addresses_customer_id_label_index` (`customer_id`,`label`);

--
-- Indexes for table `customer_requests`
--
ALTER TABLE `customer_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_requests_customer_id_foreign` (`customer_id`),
  ADD KEY `customer_requests_order_id_foreign` (`order_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employees_location_id_employee_code_unique` (`location_id`,`employee_code`),
  ADD UNIQUE KEY `employees_user_id_unique` (`user_id`),
  ADD KEY `employees_position_id_foreign` (`position_id`),
  ADD KEY `employees_status_index` (`status`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_location_id_foreign` (`location_id`),
  ADD KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  ADD KEY `expenses_created_by_foreign` (`created_by`),
  ADD KEY `expenses_status_index` (`status`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expense_categories_location_id_foreign` (`location_id`),
  ADD KEY `expense_categories_is_active_index` (`is_active`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feedback_location_id_foreign` (`location_id`),
  ADD KEY `feedback_customer_id_index` (`customer_id`),
  ADD KEY `feedback_order_id_index` (`order_id`);

--
-- Indexes for table `floors`
--
ALTER TABLE `floors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `floors_location_id_foreign` (`location_id`),
  ADD KEY `floors_is_active_index` (`is_active`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ingredients_location_id_sku_unique` (`location_id`,`sku`),
  ADD KEY `ingredients_location_id_name_index` (`location_id`,`name`),
  ADD KEY `ingredients_is_active_index` (`is_active`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_transactions_ingredient_id_foreign` (`ingredient_id`),
  ADD KEY `inventory_transactions_location_id_foreign` (`location_id`),
  ADD KEY `inventory_transactions_user_id_foreign` (`user_id`),
  ADD KEY `inventory_transactions_movement_type_index` (`movement_type`),
  ADD KEY `inventory_transactions_reference_type_index` (`reference_type`),
  ADD KEY `inventory_transactions_reference_id_index` (`reference_id`),
  ADD KEY `inventory_transactions_created_by_foreign` (`created_by`),
  ADD KEY `inventory_transactions_sourceable_type_index` (`sourceable_type`),
  ADD KEY `inventory_transactions_sourceable_id_index` (`sourceable_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `invoices_location_id_foreign` (`location_id`),
  ADD KEY `invoices_order_id_index` (`order_id`),
  ADD KEY `invoices_issued_at_index` (`issued_at`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_requests_location_id_foreign` (`location_id`),
  ADD KEY `leave_requests_employee_id_start_date_index` (`employee_id`,`start_date`),
  ADD KEY `leave_requests_start_date_index` (`start_date`),
  ADD KEY `leave_requests_end_date_index` (`end_date`),
  ADD KEY `leave_requests_status_index` (`status`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `locations_code_unique` (`code`),
  ADD KEY `locations_is_active_index` (`is_active`);

--
-- Indexes for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `loyalty_points_order_id_foreign` (`order_id`),
  ADD KEY `loyalty_points_location_id_foreign` (`location_id`),
  ADD KEY `idx_loyalty_customer_time` (`customer_id`,`occurred_at`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `menu_items_location_id_slug_unique` (`location_id`,`slug`),
  ADD UNIQUE KEY `menu_items_location_id_sku_unique` (`location_id`,`sku`),
  ADD KEY `menu_items_category_id_foreign` (`category_id`),
  ADD KEY `menu_items_slug_index` (`slug`),
  ADD KEY `menu_items_is_popular_index` (`is_popular`),
  ADD KEY `menu_items_is_active_index` (`is_active`);

--
-- Indexes for table `menu_item_translations`
--
ALTER TABLE `menu_item_translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `menu_item_translations_menu_item_id_locale_unique` (`menu_item_id`,`locale`),
  ADD KEY `menu_item_translations_locale_index` (`locale`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `operating_hours_location_id_day_of_week_service_type_unique` (`location_id`,`day_of_week`,`service_type`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_location_order_unique` (`location_id`,`order_number`),
  ADD UNIQUE KEY `orders_location_id_order_number_unique` (`location_id`,`order_number`),
  ADD KEY `orders_table_id_foreign` (`table_id`),
  ADD KEY `orders_employee_id_foreign` (`employee_id`),
  ADD KEY `orders_customer_id_index` (`customer_id`),
  ADD KEY `orders_status_index` (`status`),
  ADD KEY `orders_placed_at_index` (`ordered_at`),
  ADD KEY `orders_closed_at_index` (`completed_at`),
  ADD KEY `orders_customer_address_id_foreign` (`customer_address_id`),
  ADD KEY `orders_order_type_index` (`order_type`),
  ADD KEY `orders_payment_status_index` (`payment_status`),
  ADD KEY `orders_scheduled_at_index` (`scheduled_at`),
  ADD KEY `orders_preparation_status_index` (`preparation_status`),
  ADD KEY `orders_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_menu_item_id_index` (`menu_item_id`),
  ADD KEY `order_items_kitchen_status_index` (`status`),
  ADD KEY `idx_order_item_menu` (`order_id`,`menu_item_id`);

--
-- Indexes for table `order_time_slots`
--
ALTER TABLE `order_time_slots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_time_slots_unique` (`location_id`,`slot_date`,`slot_start_time`,`slot_type`),
  ADD KEY `order_time_slots_slot_date_slot_type_index` (`slot_date`,`slot_type`),
  ADD KEY `order_time_slots_slot_type_index` (`slot_type`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_transaction_id_unique` (`transaction_id`),
  ADD UNIQUE KEY `payments_reference_number_unique` (`reference_number`),
  ADD KEY `payments_invoice_id_foreign` (`invoice_id`),
  ADD KEY `payments_payment_method_id_foreign` (`payment_method_id`),
  ADD KEY `payments_status_processed_at_index` (`status`,`processed_at`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_methods_name_unique` (`name`),
  ADD UNIQUE KEY `payment_methods_code_unique` (`code`),
  ADD KEY `payment_methods_is_active_index` (`is_active`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payrolls_employee_id_period_start_period_end_index` (`employee_id`,`period_start`,`period_end`),
  ADD KEY `payrolls_period_start_index` (`period_start`),
  ADD KEY `payrolls_period_end_index` (`period_end`),
  ADD KEY `payrolls_status_index` (`status`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`),
  ADD UNIQUE KEY `permissions_slug_unique` (`slug`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `positions_title_unique` (`title`),
  ADD KEY `positions_is_active_index` (`is_active`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_orders_location_id_foreign` (`location_id`),
  ADD KEY `purchase_orders_supplier_id_foreign` (`supplier_id`),
  ADD KEY `purchase_orders_created_by_foreign` (`created_by`),
  ADD KEY `purchase_orders_status_index` (`status`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_order_items_purchase_order_id_foreign` (`purchase_order_id`),
  ADD KEY `purchase_order_items_ingredient_id_foreign` (`ingredient_id`),
  ADD KEY `purchase_order_items_status_index` (`status`);

--
-- Indexes for table `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `recipes_menu_item_id_unique` (`menu_item_id`);

--
-- Indexes for table `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `recipe_ingredients_recipe_id_ingredient_id_unique` (`recipe_id`,`ingredient_id`),
  ADD KEY `recipe_ingredients_ingredient_id_foreign` (`ingredient_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reservations_code_unique` (`code`),
  ADD UNIQUE KEY `reservations_reservation_number_unique` (`reservation_number`),
  ADD UNIQUE KEY `unique_reservation_slot` (`location_id`,`reservation_date`,`reservation_time`,`table_id`),
  ADD KEY `reservations_customer_id_foreign` (`customer_id`),
  ADD KEY `reservations_table_id_foreign` (`table_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Indexes for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `role_permission_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`role_id`,`user_id`),
  ADD KEY `role_user_user_id_foreign` (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_location_id_key_unique` (`location_id`,`key`),
  ADD KEY `settings_key_index` (`key`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `suppliers_code_unique` (`code`),
  ADD KEY `suppliers_location_id_foreign` (`location_id`),
  ADD KEY `suppliers_type_index` (`type`),
  ADD KEY `suppliers_is_active_index` (`is_active`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tables_floor_id_code_unique` (`floor_id`,`code`),
  ADD KEY `tables_status_index` (`status`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `units_code_unique` (`code`),
  ADD KEY `units_base_unit_foreign` (`base_unit`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `ux_users_phone` (`phone`),
  ADD KEY `users_default_location_id_foreign` (`default_location_id`),
  ADD KEY `users_is_active_index` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `category_translations`
--
ALTER TABLE `category_translations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customer_requests`
--
ALTER TABLE `customer_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `floors`
--
ALTER TABLE `floors`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `menu_item_translations`
--
ALTER TABLE `menu_item_translations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `operating_hours`
--
ALTER TABLE `operating_hours`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=251;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=915;

--
-- AUTO_INCREMENT for table `order_time_slots`
--
ALTER TABLE `order_time_slots`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recipes`
--
ALTER TABLE `recipes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=141;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tables`
--
ALTER TABLE `tables`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `category_translations`
--
ALTER TABLE `category_translations`
  ADD CONSTRAINT `category_translations_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_preferred_location_id_foreign` FOREIGN KEY (`preferred_location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `customers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `customer_addresses_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_requests`
--
ALTER TABLE `customer_requests`
  ADD CONSTRAINT `customer_requests_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_requests_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `employees_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `feedback_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `feedback_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `floors`
--
ALTER TABLE `floors`
  ADD CONSTRAINT `floors_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD CONSTRAINT `ingredients_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `leave_requests_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD CONSTRAINT `loyalty_points_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `loyalty_points_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `loyalty_points_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `menu_items_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `menu_item_translations`
--
ALTER TABLE `menu_item_translations`
  ADD CONSTRAINT `menu_item_translations_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD CONSTRAINT `operating_hours_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_customer_address_id_foreign` FOREIGN KEY (`customer_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_time_slots`
--
ALTER TABLE `order_time_slots`
  ADD CONSTRAINT `order_time_slots_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_order_items_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `recipe_ingredients`
--
ALTER TABLE `recipe_ingredients`
  ADD CONSTRAINT `recipe_ingredients_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `recipe_ingredients_recipe_id_foreign` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permission`
--
ALTER TABLE `role_permission`
  ADD CONSTRAINT `role_permission_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permission_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tables`
--
ALTER TABLE `tables`
  ADD CONSTRAINT `tables_floor_id_foreign` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_base_unit_foreign` FOREIGN KEY (`base_unit`) REFERENCES `units` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_default_location_id_foreign` FOREIGN KEY (`default_location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
