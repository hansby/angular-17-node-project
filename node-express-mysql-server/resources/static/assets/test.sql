-- --------------------------------------------------------
-- Table structure for table `people`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `people`;

CREATE TABLE `people` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `id_number` VARCHAR(50) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Dumping data for table `people`
-- --------------------------------------------------------

INSERT INTO `people` (`first_name`, `last_name`, `id_number`, `createdAt`) VALUES
('John', 'Miller', '9001015802082', NOW()),
('Sarah', 'Daniels', '8107230098081', NOW()),
('Michael', 'Collins', '7505125017087', NOW()),
('Emily', 'Roberts', '9203140058084', NOW()),
('David', 'Ngwenya', '8609215812080', NOW()),
('Jessica', 'Hughes', '9402050181087', NOW()),
('Sean', 'Pillay', '8311165091085', NOW()),
('Alicia', 'Morgan', '9802240085083', NOW()),
('Brandon', 'Jacobs', '9906025039082', NOW()),
('Thabo', 'Mokoena', '7801055879081', NOW());
