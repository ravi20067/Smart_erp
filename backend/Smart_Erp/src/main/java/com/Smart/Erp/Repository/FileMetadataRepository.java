package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FileMetadataRepository
        extends JpaRepository<FileMetadata, UUID> {

}
