package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/cms/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final ImageStorageService imageStorageService;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        UUID id = UUID.randomUUID();
        String url = imageStorageService.upload(file, id);
        activityLogService.record(user.getId(), "UPLOAD", "CMS_IMAGE", id,
                ActivityLogService.metadata("url", url, "size", file.getSize()));
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }
}
