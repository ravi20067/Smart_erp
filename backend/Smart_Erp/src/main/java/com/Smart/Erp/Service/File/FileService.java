package com.Smart.Erp.Service.File;

import com.Smart.Erp.Config.FileStorageProperties;
import com.Smart.Erp.DTO.File.FileResponse;
import com.Smart.Erp.Entity.FileMetadata;
import com.Smart.Erp.Enum.FileType;
import com.Smart.Erp.Exception.FileNotFoundException;
import com.Smart.Erp.Exception.FileStorageException;
import com.Smart.Erp.Exception.InvalidFileException;
import com.Smart.Erp.Repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileStorageProperties properties;
    private final Tika tika = new Tika();

    public FileMetadata upload(MultipartFile file, FileType fileCategory) {
        validateFile(file, fileCategory);

        String originalFilename = sanitizeOriginalFilename(
                file.getOriginalFilename()
        );

        String extension = extractExtension(originalFilename);

        validateExtension(extension);

        Path root = getStorageRoot();

        Path categoryDirectory = resolveCategoryDirectory(
                root,
                fileCategory
        );

        createDirectory(categoryDirectory);

        UUID fileId = UUID.randomUUID();

        String storedFilename = buildStoredFilename(
                fileId,
                extension
        );

        Path target = categoryDirectory
                .resolve(storedFilename)
                .normalize();

        ensureInsideRoot(target, root);

        Path temporaryFile = null;

        try {
            temporaryFile = Files.createTempFile(
                    categoryDirectory,
                    ".upload-",
                    ".tmp"
            );

            copyMultipartFile(
                    file,
                    temporaryFile
            );

            long actualFileSize = Files.size(
                    temporaryFile
            );

            validateStoredFileSize(
                    actualFileSize
            );

            String contentType = detectContentType(
                    temporaryFile
            );

            validateContentType(
                    contentType
            );

            moveToFinalLocation(
                    temporaryFile,
                    target
            );

            temporaryFile = null;

            String relativePath = root
                    .relativize(target)
                    .toString()
                    .replace(
                            File.separator,
                            "/"
                    );

            FileMetadata metadata = FileMetadata.builder()
                    .id(fileId)
                    .originalFilename(originalFilename)
                    .storedFilename(storedFilename)
                    .storedPath(relativePath)
                    .contentType(contentType)
                    .fileSize(actualFileSize)
                    .fileCategory(fileCategory)
                    .build();

            try {
                return fileMetadataRepository.save(
                        metadata
                );
            } catch (RuntimeException ex) {
                deleteQuietly(target);
                throw ex;
            }

        } catch (InvalidFileException ex) {
            deleteQuietly(temporaryFile);
            deleteQuietly(target);
            throw ex;

        } catch (IOException ex) {
            deleteQuietly(temporaryFile);
            deleteQuietly(target);

            throw new FileStorageException(
                    "Unable to process uploaded file",
                    ex
            );
        }
    }

    public FileResponse getFile(UUID fileId) {
        FileMetadata metadata = fileMetadataRepository
                .findById(fileId)
                .orElseThrow(() ->
                        new FileNotFoundException(
                                "File not found"
                        )
                );

        Path root = getStorageRoot();

        Path filePath = root
                .resolve(metadata.getStoredPath())
                .normalize();

        ensureInsideRoot(
                filePath,
                root
        );

        validateStoredPath(
                filePath
        );

        try {
            Resource resource = new UrlResource(
                    filePath.toUri()
            );

            if (!resource.exists()
                    || !resource.isReadable()) {

                throw new FileNotFoundException(
                        "File cannot be read"
                );
            }

            return new FileResponse(
                    resource,
                    metadata.getContentType(),
                    metadata.getOriginalFilename(),
                    metadata.getFileSize()
            );

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Unable to read stored file",
                    ex
            );
        }
    }

    public void deleteFile(UUID fileId) {
        FileMetadata metadata = fileMetadataRepository
                .findById(fileId)
                .orElseThrow(() ->
                        new FileNotFoundException(
                                "File not found"
                        )
                );

        Path root = getStorageRoot();

        Path filePath = root
                .resolve(metadata.getStoredPath())
                .normalize();

        ensureInsideRoot(
                filePath,
                root
        );

        validateStoredPath(
                filePath
        );

        try {
            if (Files.exists(
                    filePath,
                    LinkOption.NOFOLLOW_LINKS
            )) {
                Files.delete(filePath);
            }

            fileMetadataRepository.delete(
                    metadata
            );

        } catch (NoSuchFileException ex) {
            fileMetadataRepository.delete(
                    metadata
            );

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Unable to delete file",
                    ex
            );
        }
    }

    private void validateFile(
            MultipartFile file,
            FileType fileCategory
    ) {
        if (file == null) {
            throw new InvalidFileException(
                    "File is required"
            );
        }

        if (file.isEmpty()) {
            throw new InvalidFileException(
                    "File is empty"
            );
        }

        if (fileCategory == null) {
            throw new InvalidFileException(
                    "File category is required"
            );
        }

        if (file.getSize() <= 0) {
            throw new InvalidFileException(
                    "File size must be greater than zero"
            );
        }

        if (file.getSize() > properties.getMaxFileSize()) {
            throw new InvalidFileException(
                    "File exceeds maximum allowed size"
            );
        }

        if (!StringUtils.hasText(
                file.getOriginalFilename()
        )) {
            throw new InvalidFileException(
                    "Original filename is missing"
            );
        }
    }

    private String sanitizeOriginalFilename(
            String originalFilename
    ) {
        String filename = StringUtils.cleanPath(
                originalFilename
        );

        if (filename.contains("..")) {
            throw new InvalidFileException(
                    "Invalid filename"
            );
        }

        try {
            filename = Paths.get(filename)
                    .getFileName()
                    .toString();

        } catch (InvalidPathException ex) {
            throw new InvalidFileException(
                    "Invalid filename"
            );
        }

        if (!StringUtils.hasText(filename)) {
            throw new InvalidFileException(
                    "Invalid filename"
            );
        }

        for (char c : filename.toCharArray()) {
            if (Character.isISOControl(c)) {
                throw new InvalidFileException(
                        "Filename contains invalid characters"
                );
            }
        }

        return filename;
    }

    private String extractExtension(
            String filename
    ) {
        String extension =
                StringUtils.getFilenameExtension(
                        filename
                );

        if (!StringUtils.hasText(extension)) {
            return "";
        }

        return extension.toLowerCase(
                Locale.ROOT
        );
    }

    private void validateExtension(
            String extension
    ) {
        if (!StringUtils.hasText(extension)) {
            return;
        }

        if (properties.getAllowedExtensions().isEmpty()) {
            return;
        }

        if (!properties.getAllowedExtensions()
                .contains(extension)) {

            throw new InvalidFileException(
                    "File extension is not allowed: "
                            + extension
            );
        }
    }

    private String detectContentType(
            Path file
    ) throws IOException {

        try (InputStream inputStream =
                     Files.newInputStream(file)) {

            String contentType =
                    tika.detect(inputStream);

            if (!StringUtils.hasText(
                    contentType
            )) {
                return "application/octet-stream";
            }

            return contentType.toLowerCase(
                    Locale.ROOT
            );
        }
    }

    private void validateContentType(
            String contentType
    ) {
        if (properties.getAllowedTypes().isEmpty()) {
            return;
        }

        if (!properties.getAllowedTypes()
                .contains(contentType)) {

            throw new InvalidFileException(
                    "Content type is not allowed: "
                            + contentType
            );
        }
    }

    private void validateStoredFileSize(
            long fileSize
    ) {
        if (fileSize <= 0) {
            throw new InvalidFileException(
                    "File is empty"
            );
        }

        if (fileSize > properties.getMaxFileSize()) {
            throw new InvalidFileException(
                    "File exceeds maximum allowed size"
            );
        }
    }

    private String buildStoredFilename(
            UUID fileId,
            String extension
    ) {
        if (!StringUtils.hasText(extension)) {
            return fileId.toString();
        }

        return fileId + "." + extension;
    }

    private void copyMultipartFile(
            MultipartFile file,
            Path target
    ) throws IOException {

        try (InputStream inputStream =
                     file.getInputStream()) {

            Files.copy(
                    inputStream,
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );
        }
    }

    private Path getStorageRoot() {
        if (!StringUtils.hasText(
                properties.getRoot()
        )) {
            throw new FileStorageException(
                    "File storage root is not configured"
            );
        }

        Path root = Paths.get(
                        properties.getRoot()
                )
                .toAbsolutePath()
                .normalize();

        createDirectory(root);

        return root;
    }

    private Path resolveCategoryDirectory(
            Path root,
            FileType fileCategory
    ) {
        String directory =
                fileCategory.getCode();

        if (!StringUtils.hasText(directory)) {
            throw new InvalidFileException(
                    "Invalid file category"
            );
        }

        Path categoryDirectory = root
                .resolve(directory)
                .normalize();

        ensureInsideRoot(
                categoryDirectory,
                root
        );

        return categoryDirectory;
    }

    private void moveToFinalLocation(
            Path source,
            Path target
    ) throws IOException {

        try {
            Files.move(
                    source,
                    target,
                    StandardCopyOption.ATOMIC_MOVE
            );

        } catch (AtomicMoveNotSupportedException ex) {
            Files.move(
                    source,
                    target
            );
        }
    }

    private void validateStoredPath(
            Path filePath
    ) {
        if (Files.isSymbolicLink(filePath)) {
            throw new FileStorageException(
                    "Stored file is a symbolic link"
            );
        }

        if (!Files.exists(
                filePath,
                LinkOption.NOFOLLOW_LINKS
        )) {
            throw new FileNotFoundException(
                    "Stored file not found"
            );
        }

        if (!Files.isRegularFile(
                filePath,
                LinkOption.NOFOLLOW_LINKS
        )) {
            throw new FileNotFoundException(
                    "Stored path is not a regular file"
            );
        }
    }

    private void createDirectory(
            Path path
    ) {
        try {
            Files.createDirectories(path);

        } catch (IOException ex) {
            throw new FileStorageException(
                    "Unable to create storage directory",
                    ex
            );
        }
    }

    private void ensureInsideRoot(
            Path target,
            Path root
    ) {
        Path normalizedRoot =
                root.toAbsolutePath()
                        .normalize();

        Path normalizedTarget =
                target.toAbsolutePath()
                        .normalize();

        if (!normalizedTarget.startsWith(
                normalizedRoot
        )) {
            throw new InvalidFileException(
                    "Invalid storage path"
            );
        }
    }

    private void deleteQuietly(
            Path path
    ) {
        if (path == null) {
            return;
        }

        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
    }
}