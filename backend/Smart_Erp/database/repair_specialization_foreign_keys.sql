-- Keep the legacy `specializations` table and its data intact, but remove
-- application foreign keys that still point to it instead of `specialization`.

SET @fk_drops = (
    SELECT GROUP_CONCAT(
        CONCAT('DROP FOREIGN KEY `', constraint_name, '`')
        SEPARATOR ', '
    )
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'section_group'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specializations'
);
SET @ddl = IF(
    @fk_drops IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE `section_group` ', @fk_drops)
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;

SET @fk_drops = (
    SELECT GROUP_CONCAT(
        CONCAT('DROP FOREIGN KEY `', constraint_name, '`')
        SEPARATOR ', '
    )
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'subject_specializations'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specializations'
);
SET @ddl = IF(
    @fk_drops IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE `subject_specializations` ', @fk_drops)
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;

SET @fk_drops = (
    SELECT GROUP_CONCAT(
        CONCAT('DROP FOREIGN KEY `', constraint_name, '`')
        SEPARATOR ', '
    )
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'fee_structure_specializations'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specializations'
);
SET @ddl = IF(
    @fk_drops IS NULL,
    'SELECT 1',
    CONCAT('ALTER TABLE `fee_structure_specializations` ', @fk_drops)
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;

SET @has_canonical_fk = (
    SELECT COUNT(*)
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'section_group'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specialization'
);
SET @ddl = IF(
    @has_canonical_fk > 0,
    'SELECT 1',
    'ALTER TABLE `section_group` ADD CONSTRAINT `fk_section_group_specialization_canonical` FOREIGN KEY (`specialization_id`) REFERENCES `specialization` (`id`)'
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;

SET @has_canonical_fk = (
    SELECT COUNT(*)
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'subject_specializations'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specialization'
);
SET @ddl = IF(
    @has_canonical_fk > 0,
    'SELECT 1',
    'ALTER TABLE `subject_specializations` ADD CONSTRAINT `fk_subject_specializations_specialization_canonical` FOREIGN KEY (`specialization_id`) REFERENCES `specialization` (`id`)'
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;

SET @has_canonical_fk = (
    SELECT COUNT(*)
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE()
      AND table_name = 'fee_structure_specializations'
      AND column_name = 'specialization_id'
      AND referenced_table_name = 'specialization'
);
SET @ddl = IF(
    @has_canonical_fk > 0,
    'SELECT 1',
    'ALTER TABLE `fee_structure_specializations` ADD CONSTRAINT `fk_fee_structure_specializations_specialization_canonical` FOREIGN KEY (`specialization_id`) REFERENCES `specialization` (`id`)'
);
PREPARE specialization_fk_stmt FROM @ddl;
EXECUTE specialization_fk_stmt;
DEALLOCATE PREPARE specialization_fk_stmt;
