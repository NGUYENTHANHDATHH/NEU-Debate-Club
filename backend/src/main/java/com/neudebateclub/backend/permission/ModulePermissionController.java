package com.neudebateclub.backend.permission;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Ma trận phân quyền: module → các ban có Trưởng/Phó ban được dùng. BCN luôn có mọi module. */
@RestController
@RequestMapping("/module-permissions")
@RequiredArgsConstructor
public class ModulePermissionController {

    // Ma trận không có id hàng; activity_logs.entity_id bắt buộc nên dùng UUID toàn 0.
    static final UUID MATRIX_ENTITY_ID = new UUID(0, 0);

    private final ModulePermissionRepository modulePermissionRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<AdminModule, List<Department>>>> get(
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.MEMBERSHIP);
        return ResponseEntity.ok(ApiResponse.success(currentMatrix()));
    }

    /** Thay toàn bộ ma trận. Module không có trong body = không ban nào được dùng. */
    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<AdminModule, List<Department>>>> replace(
            @RequestBody Map<AdminModule, List<Department>> matrix,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireBCN(currentUser);
        List<ModulePermission> rows = new ArrayList<>();
        matrix.forEach((module, departments) -> {
            if (module == null || departments == null) return;
            departments.stream().distinct().forEach(department -> {
                if (department == null || department == Department.BCN) {
                    throw new ValidationException("Ban không hợp lệ: " + department);
                }
                rows.add(new ModulePermission(null, module, department));
            });
        });

        modulePermissionRepository.deleteAllInBatch();
        modulePermissionRepository.saveAll(rows);
        Map<AdminModule, List<Department>> saved = currentMatrix();
        activityLogService.record(currentUser.getId(), "UPDATE", "MODULE_PERMISSIONS", MATRIX_ENTITY_ID,
                ActivityLogService.metadata("permissions", saved));
        return ResponseEntity.ok(ApiResponse.success("Đã lưu phân quyền", saved));
    }

    private Map<AdminModule, List<Department>> currentMatrix() {
        Map<AdminModule, List<Department>> matrix = new EnumMap<>(AdminModule.class);
        for (AdminModule module : AdminModule.values()) matrix.put(module, new ArrayList<>());
        for (ModulePermission row : modulePermissionRepository.findAll()) {
            matrix.get(row.getModule()).add(row.getDepartment());
        }
        matrix.values().forEach(departments -> departments.sort(null));
        return matrix;
    }
}
