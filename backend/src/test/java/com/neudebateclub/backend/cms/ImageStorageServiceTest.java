package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.common.exception.ValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageStorageServiceTest {

    @Test
    void acceptsRasterImagesOnly() {
        assertEquals("jpg", ImageStorageService.extension("image/jpeg"));
        assertEquals("png", ImageStorageService.extension("IMAGE/PNG"));
        assertThrows(ValidationException.class, () -> ImageStorageService.extension("image/svg+xml"));
        assertThrows(ValidationException.class, () -> ImageStorageService.extension("text/html"));
        assertThrows(ValidationException.class, () -> ImageStorageService.extension(null));
    }

    @Test
    void uploadFailsClearlyWhenMinioIsNotConfigured() {
        var service = new ImageStorageService("http://localhost:9000", "", "");
        var file = new MockMultipartFile("file", "a.png", "image/png", new byte[] {1});
        assertThrows(ValidationException.class, () -> service.upload(file, UUID.randomUUID()));
    }
}
