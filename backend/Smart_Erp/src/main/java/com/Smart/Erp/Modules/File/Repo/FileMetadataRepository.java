package com.Smart.Erp.Modules.File.Repo;

import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FileMetadataRepository
        extends JpaRepository<FileMetadata, UUID> {

}
