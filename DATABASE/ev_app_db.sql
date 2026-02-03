-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 03, 2026 at 09:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ev_app_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
  `alert_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `alert_type` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_acknowledged` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_otps`
--

CREATE TABLE `auth_otps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `purpose` varchar(50) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_otps`
--

INSERT INTO `auth_otps` (`id`, `user_id`, `purpose`, `otp_hash`, `expires_at`, `attempts`, `created_at`) VALUES
(3, 1, 'reset_token', '$2y$10$4DP3hQSobccufVgB38apcO6RMR0BN43aUWBK.l/6qbfRP2Q5JTeYi', '2026-01-20 14:03:09', 0, '2026-01-20 12:58:09'),
(6, 7, 'reset_token', '$2y$10$IcJVUwZYyWdqZl1SSmHspu11Gnbse2Tqoe08gTAoou8iG85CRwA2G', '2026-01-21 06:11:15', 0, '2026-01-21 05:06:16'),
(31, 7, 'reset_password', '$2y$10$LU1sQtndbaXC3kqqYUGDMupDiaMu.l3LIsK6x/aA8B1qKuRjQvuZC', '2026-02-01 12:33:13', 0, '2026-02-01 04:23:13'),
(33, 12, 'reset_password', '$2y$10$GIna2e8BmPbc7kcmNU8Dpu49NNEbXWxjgU1I8vrWY0tEPz.48YQHW', '2026-02-01 12:35:00', 0, '2026-02-01 04:25:00'),
(34, 14, 'register', '$2y$10$nvzqPabN7CiC8wnRoTkV6OtDgoytQs2YUSIw4m1H/dN/2cUt4wzAC', '2026-02-01 12:36:49', 0, '2026-02-01 04:26:49');

-- --------------------------------------------------------

--
-- Table structure for table `auth_sessions`
--

CREATE TABLE `auth_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_sessions`
--

INSERT INTO `auth_sessions` (`id`, `user_id`, `session_token_hash`, `expires_at`, `created_at`) VALUES
(1, 1, '3850344d34a05dadfd6e27c592abd93fb8ab406598428661411bca5cf90b82cc', '2026-01-21 13:42:16', '2026-01-20 20:42:16'),
(2, 7, '1d2909b70a96ec8ae2991911f09272c39b6b71a4870dc4b4492ddc6fe6b8e837', '2026-01-22 06:28:11', '2026-01-21 13:28:11'),
(3, 12, '8a01b3bc413eff4b8ed1ff7225e24587fb4080f50d066a8bf9ea74344adad65d', '2026-01-22 06:30:40', '2026-01-21 13:30:40'),
(4, 13, '9c34d8e23dfa916ccd01d1dd19a9c139818eb657a18cc6a43396ec3d3abe9de5', '2026-01-23 13:42:18', '2026-01-22 20:42:18');

-- --------------------------------------------------------

--
-- Table structure for table `battery_logs`
--

CREATE TABLE `battery_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `garage_id` int(11) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `battery_level_pct` int(11) NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `charging_stations`
--

CREATE TABLE `charging_stations` (
  `station_id` int(11) NOT NULL,
  `station_name` varchar(255) NOT NULL,
  `operator_name` varchar(100) DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `is_free` tinyint(1) DEFAULT 0,
  `connector_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `charging_stations`
--

INSERT INTO `charging_stations` (`station_id`, `station_name`, `operator_name`, `lat`, `lng`, `is_free`, `connector_type`, `created_at`, `updated_at`) VALUES
(1, 'SM Mall of Asia (Tesla)', 'Tesla', 14.53525000, 120.98220000, 0, 'Tesla Supercharger', '2026-01-18 06:53:47', '2026-01-18 06:53:47'),
(2, 'Shell Recharge SLEX', 'Shell', 14.32050000, 121.08510000, 0, 'Type 2', '2026-01-18 06:53:47', '2026-01-18 06:53:47'),
(3, 'Robinson\'s Galleria', 'Robinsons Land', 14.59360000, 121.05830000, 1, 'Type 2', '2026-01-18 06:53:47', '2026-01-18 06:53:47'),
(4, 'SM North EDSA', 'SM Supermalls', 14.65630000, 121.02850000, 1, 'Type 2', '2026-01-18 06:53:47', '2026-01-18 06:53:47'),
(5, 'Unioil Congressional', 'Unioil', 14.66750000, 121.05580000, 0, 'CCS2', '2026-01-18 06:53:47', '2026-01-18 06:53:47'),
(6, 'UP Town Center', 'Ayala Malls', 14.65150000, 121.07520000, 1, 'Type 2', '2026-01-18 06:53:47', '2026-01-18 06:53:47');

-- --------------------------------------------------------

--
-- Table structure for table `ev_brands`
--

CREATE TABLE `ev_brands` (
  `brand_id` int(11) NOT NULL,
  `brand_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ev_brands`
--

INSERT INTO `ev_brands` (`brand_id`, `brand_name`, `created_at`) VALUES
(1, 'Tesla', '2026-01-16 17:02:54'),
(3, 'BYD', '2026-01-16 18:36:34'),
(4, 'Toyota', '2026-01-17 07:07:55');

-- --------------------------------------------------------

--
-- Table structure for table `ev_models`
--

CREATE TABLE `ev_models` (
  `model_id` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL,
  `model_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ev_models`
--

INSERT INTO `ev_models` (`model_id`, `brand_id`, `model_name`, `created_at`) VALUES
(1, 1, 'Model 3', '2026-01-16 17:02:54'),
(2, 1, 'Model S', '2026-01-16 17:15:36'),
(3, 3, 'TANG', '2026-01-16 18:36:34'),
(4, 1, 'Model S 85D', '2026-01-17 07:07:32'),
(5, 4, 'bZ4X FWD', '2026-01-17 07:07:55');

-- --------------------------------------------------------

--
-- Table structure for table `ev_variants`
--

CREATE TABLE `ev_variants` (
  `variant_id` int(11) NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year` int(11) NOT NULL DEFAULT 2024,
  `battery_capacity_kwh` decimal(5,1) NOT NULL,
  `efficiency_wh_per_km` int(11) NOT NULL,
  `plug_type` varchar(50) DEFAULT 'Type 2',
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ev_variants`
--

INSERT INTO `ev_variants` (`variant_id`, `make`, `model`, `year`, `battery_capacity_kwh`, `efficiency_wh_per_km`, `plug_type`, `image_url`, `created_at`) VALUES
(1, 'Tesla', 'Model 3 RWD', 2024, 60.0, 132, 'Type 2 / CCS2', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_Tesla_Model_3_Performance_AWD_Front.jpg/800px-2019_Tesla_Model_3_Performance_AWD_Front.jpg', '2026-01-20 13:36:19'),
(2, 'BYD', 'Atto 3', 2024, 60.5, 156, 'Type 2 / CCS2', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/2022_BYD_Atto_3_Standard_Range_%28Australia%29_front_view.jpg/800px-2022_BYD_Atto_3_Standard_Range_%28Australia%29_front_view.jpg', '2026-01-20 13:36:30'),
(3, 'Nissan', 'LEAF', 2024, 40.0, 171, 'Type 1 / CHAdeMO', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Nissan_Leaf_ZE1_2018.jpg/800px-Nissan_Leaf_ZE1_2018.jpg', '2026-01-20 13:36:44'),
(4, 'BYD', 'Seagull', 2024, 30.0, 105, 'Type 2 / CCS2', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/BYD_Seagull_001.jpg/1280px-BYD_Seagull_001.jpg', '2026-01-20 13:36:48'),
(5, 'Tesla', 'Model Y RWD', 2024, 60.0, 157, 'Type 2 / CCS2', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Tesla_Model_Y_Austin_Made.jpg/800px-Tesla_Model_Y_Austin_Made.jpg', '2026-01-21 05:28:25');

-- --------------------------------------------------------

--
-- Table structure for table `forecasts`
--

CREATE TABLE `forecasts` (
  `forecast_id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `base_energy_kwh` float DEFAULT NULL,
  `traffic_adjust_kwh` float DEFAULT NULL,
  `weather_adjust_kwh` float DEFAULT NULL,
  `predicted_arrival_battery_pct` int(11) DEFAULT NULL,
  `predicted_arrival_energy_kwh` float DEFAULT NULL,
  `confidence_score` float DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friendships`
--

CREATE TABLE `friendships` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `status` enum('pending','accepted') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `friendships`
--

INSERT INTO `friendships` (`id`, `requester_id`, `receiver_id`, `status`, `created_at`) VALUES
(1, 12, 7, 'accepted', '2026-01-21 08:32:34');

-- --------------------------------------------------------

--
-- Table structure for table `live_location_updates`
--

CREATE TABLE `live_location_updates` (
  `location_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `speed_kph` float DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `report_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `summary_id` int(11) DEFAULT NULL,
  `report_type` varchar(50) DEFAULT NULL,
  `file_path_or_blob_ref` varchar(255) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

CREATE TABLE `routes` (
  `route_id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `distance_km` float DEFAULT NULL,
  `duration_min` int(11) DEFAULT NULL,
  `traffic_level` varchar(50) DEFAULT NULL,
  `elevation_gain_m` float DEFAULT NULL,
  `is_recommended` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_sessions`
--

CREATE TABLE `share_sessions` (
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `share_code` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_session_viewers`
--

CREATE TABLE `share_session_viewers` (
  `viewer_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `viewer_ip` varchar(45) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sustainability_summaries`
--

CREATE TABLE `sustainability_summaries` (
  `summary_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `distance_km` float DEFAULT NULL,
  `energy_used_kwh` float DEFAULT NULL,
  `battery_saved_kwh` float DEFAULT NULL,
  `co2_reduced_kg` float DEFAULT NULL,
  `time_saved_min` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `trip_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `garage_id` int(11) NOT NULL,
  `origin_label` varchar(255) DEFAULT NULL,
  `origin_lat` decimal(10,8) DEFAULT NULL,
  `origin_lng` decimal(11,8) DEFAULT NULL,
  `destination_label` varchar(255) DEFAULT NULL,
  `destination_lat` decimal(10,8) DEFAULT NULL,
  `destination_lng` decimal(11,8) DEFAULT NULL,
  `start_battery_pct` int(11) DEFAULT NULL,
  `end_battery_pct` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'planned',
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_charging_stops`
--

CREATE TABLE `trip_charging_stops` (
  `stop_id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `station_id` int(11) NOT NULL,
  `arrival_battery_pct` int(11) DEFAULT NULL,
  `departure_battery_pct` int(11) DEFAULT NULL,
  `energy_added_kwh` float DEFAULT NULL,
  `duration_min` int(11) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_logs`
--

CREATE TABLE `trip_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `battery_drained` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trip_logs`
--

INSERT INTO `trip_logs` (`id`, `user_id`, `origin`, `destination`, `distance_km`, `battery_drained`, `created_at`) VALUES
(1, 1, '14.80050, 121.00145 (My Location)', 'SM City Fairview, Quirino Highway, 5th District, Quezon City, Eastern Manila District', 17.90, 7.60, '2026-01-20 16:50:18'),
(2, 1, '14.80041, 121.00152 (My Location)', 'SM North EDSA IMAX Theatre, North Avenue, Bago Bantay, Quezon City, Eastern Manila District', 22.10, 9.40, '2026-01-20 16:53:01'),
(3, 12, '14.73325, 121.06022 (My Location)', 'Jollibee, Carriedo Street, Muzon, San Jose del Monte', 11.20, 3.00, '2026-01-21 05:35:27'),
(4, 12, '14.73325, 121.06022 (My Location)', 'Muzon Harmony Hills High School, Australia Street, Muzon, San Jose del Monte', 10.20, 2.20, '2026-01-21 06:12:09'),
(5, 7, '14.80045, 121.00151 (My Location)', 'National University - Fairview, Quirino Highway, SM City Fairview Complex, Quezon City', 18.60, 4.10, '2026-01-21 22:59:25'),
(6, 7, '14.80047, 121.00154 (My Location)', 'SM Pampanga Annex 4 Parking Front, SM City Pampanga Driveway, Mexico', 48.60, 10.70, '2026-01-21 23:00:35'),
(7, 7, '14.80044, 121.00153 (My Location)', 'Jollibee, Carriedo Street, Muzon, San Jose del Monte', 5.40, 1.20, '2026-01-22 02:02:12'),
(8, 7, '14.80037, 121.00166 (My Location)', 'Muzon Jollibee', 5.40, 1.20, '2026-01-22 02:04:18'),
(9, 7, 'Emergency Location', 'Galaxy Charge - BMK E-Commerce Park', 0.81, 0.20, '2026-01-24 08:02:55'),
(10, 7, 'Emergency Location', 'Galaxy Charge - BMK E-Commerce Park', 0.81, 0.20, '2026-01-24 08:03:42'),
(11, 7, 'SM City Fairview', 'Makati SM Felicidad SY Center for the Elderly', 25.80, 5.70, '2026-01-24 08:43:56'),
(12, 7, 'SM City Fairview', 'Makati SM Felicidad SY Center for the Elderly', 25.80, 5.70, '2026-01-24 08:47:08'),
(13, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:47:34'),
(14, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:48:22'),
(15, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:50:07'),
(16, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:53:58'),
(17, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:54:14'),
(18, 7, 'SM Megamall', 'SM Mall of Asia', 13.20, 2.90, '2026-01-24 08:55:43'),
(19, 7, 'SM Megamall', 'SM Mall of Asia', 15.00, 3.30, '2026-01-24 08:56:11'),
(20, 7, 'SM Megamall', 'SM Mall of Asia', 15.00, 3.30, '2026-01-24 08:56:22'),
(21, 7, 'SM City Fairview', 'Makati SM Felicidad SY Center for the Elderly', 25.80, 5.70, '2026-01-24 08:58:07'),
(22, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Mall of Asia', 7.80, 1.70, '2026-01-24 09:00:46'),
(23, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:04:32'),
(24, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:04:43'),
(25, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:07:23'),
(26, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:07:34'),
(27, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:07:46'),
(28, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:07:57'),
(29, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:08:14'),
(30, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:08:28'),
(31, 7, 'Makati SM Felicidad SY Center for the Elderly', 'SM Megamall', 9.40, 2.10, '2026-01-24 09:11:19'),
(32, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-24 15:22:22'),
(33, 7, 'Emergency Location', 'SM City Manila e-Vehicle Charging Station', 1.16, 0.30, '2026-01-24 15:23:16'),
(34, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-25 02:16:55'),
(35, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-25 03:07:50'),
(36, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-25 03:10:23'),
(37, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-25 03:12:06'),
(38, 7, 'SM Mall of Asia', 'National University', 11.90, 2.60, '2026-01-25 03:12:17'),
(39, 7, 'San Jose del Monte', 'National University', 31.40, 6.90, '2026-01-25 06:03:51'),
(40, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-01-25 11:18:16'),
(41, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 5.57, 1.20, '2026-01-25 11:26:42'),
(42, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-25 11:29:53'),
(43, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 5.57, 1.20, '2026-01-25 11:33:09'),
(44, 7, 'Emergency Location', 'Ayala Malls Fairveiw Terraces ', 5.19, 1.10, '2026-01-25 11:35:22'),
(45, 7, 'Emergency Location', 'SM City Novaliches e-Vehicle Charging Station', 8.36, 1.80, '2026-01-25 11:37:39'),
(46, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-01-25 11:40:10'),
(47, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-25 11:43:28'),
(48, 7, 'Emergency Location', 'BYD Balintawak', 14.47, 3.20, '2026-01-25 11:47:30'),
(49, 7, 'Emergency Location', 'Ayala Malls Fairveiw Terraces ', 5.19, 1.10, '2026-01-25 12:00:30'),
(50, 7, 'Emergency Location', 'Ayala Malls Fairveiw Terraces ', 5.19, 1.10, '2026-01-25 12:26:39'),
(51, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 12:37:56'),
(52, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 12:39:40'),
(53, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-01-25 12:49:20'),
(54, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 13:15:00'),
(55, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 13:19:14'),
(56, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 13:22:09'),
(57, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 13:22:50'),
(58, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-25 13:23:29'),
(59, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-25 14:11:25'),
(60, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-01-25 15:14:58'),
(61, 7, 'My Location', 'SM Megamall', 21.90, 4.80, '2026-01-26 02:01:10'),
(62, 7, 'Emergency Location', 'BPI Commonwealth', 6.58, 1.80, '2026-01-26 02:03:21'),
(63, 7, 'My Location', 'SM Megamall', 21.90, 4.80, '2026-01-26 02:28:23'),
(64, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.41, 0.10, '2026-01-26 02:29:50'),
(65, 7, 'My Location', 'SM Megamall', 21.90, 4.80, '2026-01-26 02:34:39'),
(66, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.41, 0.10, '2026-01-26 02:36:10'),
(67, 7, 'My Location', 'SM Megamall', 21.90, 4.80, '2026-01-26 02:45:37'),
(68, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.41, 0.10, '2026-01-26 02:46:28'),
(69, 7, 'My Location', 'SM Megamall', 21.90, 4.80, '2026-01-26 03:04:45'),
(70, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.41, 0.10, '2026-01-26 03:05:53'),
(71, 7, 'My Location', 'SM Megamall Building B', 22.00, 4.80, '2026-01-26 03:08:52'),
(72, 7, 'Emergency Location', 'Ayala Malls Fairveiw Terraces ', 0.50, 0.10, '2026-01-26 03:09:52'),
(73, 7, 'BF Homes Caloocan', 'Quezon Avenue', 13.30, 2.90, '2026-01-26 04:05:00'),
(74, 7, 'My Location', 'sm fairview', 14.90, 3.30, '2026-01-26 10:58:46'),
(75, 7, 'My Location', 'sm fairview', 14.90, 3.30, '2026-01-26 10:58:47'),
(76, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-26 11:15:56'),
(77, 7, 'My Location', 'Muzon-Sta. Maria Jeepney Terminal', 15.80, 3.50, '2026-01-27 02:01:40'),
(78, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.41, 0.10, '2026-01-27 02:02:55'),
(79, 7, 'My Location', 'SM City Fairview e-Vehicle Charging Station', 0.40, 0.10, '2026-01-27 02:04:03'),
(80, 7, 'fairview', 'commonwealth', 2.60, 0.60, '2026-01-27 05:57:37'),
(81, 7, 'My Location', 'Fairview', 5.80, 1.30, '2026-01-27 06:00:00'),
(82, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-27 12:19:24'),
(83, 7, 'My Location', 'SM City Fairview', 9.20, 2.00, '2026-01-28 07:56:12'),
(84, 7, 'Emergency Location', 'Ayala Malls The 30th', 22.52, 5.00, '2026-01-28 07:59:27'),
(85, 7, 'My Location', 'SM Megamall', 26.10, 5.70, '2026-01-28 12:51:22'),
(86, 7, 'My Location', 'SM City Fairview', 14.90, 3.30, '2026-01-28 14:04:02'),
(87, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-01-28 14:06:33'),
(88, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-28 14:07:14'),
(89, 7, 'My Location', 'SM City Fairview', 9.20, 2.00, '2026-01-29 06:01:17'),
(90, 7, 'Ilang-Ilang Street', 'SM City Fairview', 9.40, 2.10, '2026-01-29 06:02:03'),
(91, 7, 'My Location', 'Baguio Road', 21.50, 4.70, '2026-01-29 06:03:00'),
(92, 7, 'My Location', 'Baguio Road', 18.80, 4.10, '2026-01-29 06:10:25'),
(93, 7, 'My Location', 'SM City Fairview', 9.20, 2.00, '2026-01-29 06:25:05'),
(94, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-29 09:10:58'),
(95, 7, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 5.56, 1.20, '2026-01-29 09:17:37'),
(96, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-01-30 01:47:21'),
(97, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:13:47'),
(98, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:17:03'),
(99, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:19:28'),
(100, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:23:01'),
(101, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:23:35'),
(102, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:25:46'),
(103, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:27:44'),
(104, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-01-31 06:53:37'),
(105, 7, 'My Location', 'Baguio Street', 11.80, 2.60, '2026-01-31 07:06:46'),
(106, 7, 'My Location', 'SM City Fairview', 9.20, 2.00, '2026-01-31 08:04:49'),
(107, 7, 'My Location', 'SM City Marilao e-Vehicle Charging Station', 16.90, 3.70, '2026-02-01 09:53:33'),
(108, 7, 'My Location', 'Ayala Malls Fairveiw Terraces ', 7.10, 1.60, '2026-02-01 10:11:05'),
(109, 7, 'My Location', 'SM City Fairview', 9.20, 2.00, '2026-02-01 10:11:52'),
(110, 7, 'My Location', 'Ayala Malls Fairveiw Terraces ', 7.10, 1.60, '2026-02-01 10:12:14'),
(111, 7, 'My Location', 'SM City Fairview e-Vehicle Charging Station', 9.50, 2.10, '2026-02-01 10:13:31'),
(112, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 11:35:15'),
(113, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-02-01 12:38:24'),
(114, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-02-01 13:20:56'),
(115, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-02-01 13:24:13'),
(116, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 13:25:43'),
(117, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-02-01 13:26:52'),
(118, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 13:44:04'),
(119, 7, 'Emergency Location', 'Galaxy Charge - RHC Builders Warehouse', 3.24, 0.70, '2026-02-01 14:01:02'),
(120, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 14:01:37'),
(121, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 14:16:38'),
(122, 7, 'My Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 6.20, 1.40, '2026-02-01 14:17:45'),
(123, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 14:19:47'),
(124, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 14:21:26'),
(125, 7, 'Emergency Location', 'SM City San Jose del Monte e-Vehicle Charging Station', 3.19, 0.70, '2026-02-01 14:22:35'),
(126, 12, 'Emergency Location', 'SM City Fairview e-Vehicle Charging Station', 0.40, 0.20, '2026-02-01 23:51:15'),
(127, 7, 'My Location', 'SM City Fairview e-Vehicle Charging Station', 0.40, 0.10, '2026-02-02 00:14:57');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `pref_dark` tinyint(1) DEFAULT 0,
  `pref_units` varchar(5) DEFAULT 'km',
  `is_verified` tinyint(1) DEFAULT 0,
  `mfa_enabled` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `name`, `email`, `password_hash`, `created_at`, `updated_at`, `phone`, `pref_dark`, `pref_units`, `is_verified`, `mfa_enabled`) VALUES
(1, '@dash', 'Dash Dish', 'stephanieesparrago759@gmail.com', '$2y$10$DIys3v3AIjNYnqcyamDTnOsZ6AIFwC1XymA9eqX44PxCnlKSWNYNy', '2026-01-20 12:41:51', '2026-01-20 12:42:16', NULL, 0, 'km', 1, 1),
(7, 'harumxi', 'Alexa Baldueza', 'alexadigitalsph@gmail.com', '$2y$10$6GT18QrIIxqJQl16zo1yNOgwNKvD7dnPecoIjNsCksD.kGTr/YQW.', '2026-01-21 05:04:39', '2026-01-21 05:28:11', NULL, 0, 'km', 1, 1),
(12, 'otepp', 'Stephanie Esparrago', 'ksalisa86@gmail.com', '$2y$10$svpT6Xhmo8GjMFmauTbvquUVJTaApUXX5NQ3on0JRhm6jPAmFp.fm', '2026-01-21 05:29:52', '2026-01-21 05:30:40', NULL, 0, 'km', 1, 1),
(13, 'Steph', 'Stephanie Regio', 'znemo972@gmail.com', '$2y$10$cWhDV1kOZED4XkaOzMdgQO2BJiue/smCyy4jpwsSbAFE7jqF7tSpe', '2026-01-22 12:41:26', '2026-01-22 12:42:18', NULL, 0, 'km', 1, 1),
(14, 'burikak', 'Alexa Nicolas', 'nicolas.alexaven@gmail.com', '$2y$10$R1kRu3GovdAuQvVa3wEjlOTJk70foNJekXTtwXGpEQ.VhDW8ijl52', '2026-01-23 05:58:59', '2026-02-01 11:26:49', NULL, 0, 'km', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_favorites`
--

CREATE TABLE `user_favorites` (
  `fav_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `station_id` varchar(100) NOT NULL,
  `station_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_favorites`
--

INSERT INTO `user_favorites` (`fav_id`, `user_id`, `station_id`, `station_name`, `address`, `created_at`) VALUES
(2, 1, 'OCM_308237', 'Petron NLEX Marilao Northbound', 'Marilao', '2026-01-20 14:01:57'),
(3, 12, 'OCM-469590', 'SM City Fairview e-Vehicle Charging Station', 'Quezon City', '2026-01-21 05:31:55'),
(8, 7, 'OCM-470238', 'SM City Molino e-Vehicle Charging Station', 'Bacoor', '2026-01-25 15:28:44'),
(9, 7, 'OCM-470234', 'SM City San Jose del Monte e-Vehicle Charging Station', 'San Jose Del Monte', '2026-01-25 15:29:12'),
(15, 7, 'OCM-469590', 'SM City Fairview e-Vehicle Charging Station', 'Quezon City', '2026-01-26 03:10:18');

-- --------------------------------------------------------

--
-- Table structure for table `user_garage`
--

CREATE TABLE `user_garage` (
  `garage_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_garage`
--

INSERT INTO `user_garage` (`garage_id`, `user_id`, `variant_id`, `nickname`, `is_active`, `added_at`) VALUES
(3, 1, 3, 'Nissan LEAF', 1, '2026-01-20 13:36:44'),
(4, 1, 4, 'BYD Seagull', 0, '2026-01-20 13:36:48'),
(7, 12, 1, 'Tesla Model 3 RWD', 0, '2026-01-21 05:38:49'),
(8, 12, 3, 'Nissan LEAF', 1, '2026-01-21 07:02:57'),
(10, 7, 1, 'Tesla Model 3 RWD', 1, '2026-01-21 22:36:53'),
(12, 7, 5, 'Tesla Model Y RWD', 0, '2026-01-26 10:33:47');

-- --------------------------------------------------------

--
-- Table structure for table `weather_snapshots`
--

CREATE TABLE `weather_snapshots` (
  `weather_id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `temperature_c` float DEFAULT NULL,
  `humidity_pct` float DEFAULT NULL,
  `wind_speed_mps` float DEFAULT NULL,
  `captured_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `source` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_otps`
--
ALTER TABLE `auth_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_otp` (`user_id`);

--
-- Indexes for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `battery_logs`
--
ALTER TABLE `battery_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `garage_id` (`garage_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `charging_stations`
--
ALTER TABLE `charging_stations`
  ADD PRIMARY KEY (`station_id`);

--
-- Indexes for table `ev_brands`
--
ALTER TABLE `ev_brands`
  ADD PRIMARY KEY (`brand_id`),
  ADD UNIQUE KEY `brand_name` (`brand_name`);

--
-- Indexes for table `ev_models`
--
ALTER TABLE `ev_models`
  ADD PRIMARY KEY (`model_id`),
  ADD KEY `brand_id` (`brand_id`);

--
-- Indexes for table `ev_variants`
--
ALTER TABLE `ev_variants`
  ADD PRIMARY KEY (`variant_id`),
  ADD UNIQUE KEY `unique_variant` (`make`,`model`,`year`);

--
-- Indexes for table `forecasts`
--
ALTER TABLE `forecasts`
  ADD PRIMARY KEY (`forecast_id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `route_id` (`route_id`);

--
-- Indexes for table `friendships`
--
ALTER TABLE `friendships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `live_location_updates`
--
ALTER TABLE `live_location_updates`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `summary_id` (`summary_id`);

--
-- Indexes for table `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`route_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `share_sessions`
--
ALTER TABLE `share_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `share_code` (`share_code`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `share_session_viewers`
--
ALTER TABLE `share_session_viewers`
  ADD PRIMARY KEY (`viewer_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `sustainability_summaries`
--
ALTER TABLE `sustainability_summaries`
  ADD PRIMARY KEY (`summary_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`trip_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `garage_id` (`garage_id`);

--
-- Indexes for table `trip_charging_stops`
--
ALTER TABLE `trip_charging_stops`
  ADD PRIMARY KEY (`stop_id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `station_id` (`station_id`);

--
-- Indexes for table `trip_logs`
--
ALTER TABLE `trip_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD PRIMARY KEY (`fav_id`),
  ADD UNIQUE KEY `unique_fav` (`user_id`,`station_id`);

--
-- Indexes for table `user_garage`
--
ALTER TABLE `user_garage`
  ADD PRIMARY KEY (`garage_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `weather_snapshots`
--
ALTER TABLE `weather_snapshots`
  ADD PRIMARY KEY (`weather_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alerts`
--
ALTER TABLE `alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_otps`
--
ALTER TABLE `auth_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `battery_logs`
--
ALTER TABLE `battery_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `charging_stations`
--
ALTER TABLE `charging_stations`
  MODIFY `station_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ev_brands`
--
ALTER TABLE `ev_brands`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ev_models`
--
ALTER TABLE `ev_models`
  MODIFY `model_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `ev_variants`
--
ALTER TABLE `ev_variants`
  MODIFY `variant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `forecasts`
--
ALTER TABLE `forecasts`
  MODIFY `forecast_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friendships`
--
ALTER TABLE `friendships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `live_location_updates`
--
ALTER TABLE `live_location_updates`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `route_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_sessions`
--
ALTER TABLE `share_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_session_viewers`
--
ALTER TABLE `share_session_viewers`
  MODIFY `viewer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sustainability_summaries`
--
ALTER TABLE `sustainability_summaries`
  MODIFY `summary_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `trip_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_charging_stops`
--
ALTER TABLE `trip_charging_stops`
  MODIFY `stop_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_logs`
--
ALTER TABLE `trip_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=128;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `user_favorites`
--
ALTER TABLE `user_favorites`
  MODIFY `fav_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `user_garage`
--
ALTER TABLE `user_garage`
  MODIFY `garage_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `weather_snapshots`
--
ALTER TABLE `weather_snapshots`
  MODIFY `weather_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alerts`
--
ALTER TABLE `alerts`
  ADD CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_otps`
--
ALTER TABLE `auth_otps`
  ADD CONSTRAINT `fk_user_otp` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD CONSTRAINT `auth_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `battery_logs`
--
ALTER TABLE `battery_logs`
  ADD CONSTRAINT `battery_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `battery_logs_ibfk_2` FOREIGN KEY (`garage_id`) REFERENCES `user_garage` (`garage_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `battery_logs_ibfk_3` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE SET NULL;

--
-- Constraints for table `ev_models`
--
ALTER TABLE `ev_models`
  ADD CONSTRAINT `ev_models_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `ev_brands` (`brand_id`) ON DELETE CASCADE;

--
-- Constraints for table `forecasts`
--
ALTER TABLE `forecasts`
  ADD CONSTRAINT `forecasts_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forecasts_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`route_id`) ON DELETE CASCADE;

--
-- Constraints for table `friendships`
--
ALTER TABLE `friendships`
  ADD CONSTRAINT `friendships_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `friendships_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_location_updates`
--
ALTER TABLE `live_location_updates`
  ADD CONSTRAINT `live_location_updates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`summary_id`) REFERENCES `sustainability_summaries` (`summary_id`) ON DELETE SET NULL;

--
-- Constraints for table `routes`
--
ALTER TABLE `routes`
  ADD CONSTRAINT `routes_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE;

--
-- Constraints for table `share_sessions`
--
ALTER TABLE `share_sessions`
  ADD CONSTRAINT `share_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `share_session_viewers`
--
ALTER TABLE `share_session_viewers`
  ADD CONSTRAINT `share_session_viewers_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `share_sessions` (`session_id`) ON DELETE CASCADE;

--
-- Constraints for table `sustainability_summaries`
--
ALTER TABLE `sustainability_summaries`
  ADD CONSTRAINT `sustainability_summaries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`garage_id`) REFERENCES `user_garage` (`garage_id`) ON DELETE CASCADE;

--
-- Constraints for table `trip_charging_stops`
--
ALTER TABLE `trip_charging_stops`
  ADD CONSTRAINT `trip_charging_stops_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trip_charging_stops_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `charging_stations` (`station_id`) ON DELETE CASCADE;

--
-- Constraints for table `trip_logs`
--
ALTER TABLE `trip_logs`
  ADD CONSTRAINT `trip_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_garage`
--
ALTER TABLE `user_garage`
  ADD CONSTRAINT `user_garage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_garage_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `ev_variants` (`variant_id`) ON DELETE CASCADE;

--
-- Constraints for table `weather_snapshots`
--
ALTER TABLE `weather_snapshots`
  ADD CONSTRAINT `weather_snapshots_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
