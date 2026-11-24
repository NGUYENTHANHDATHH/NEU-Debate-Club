package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.permission.ModulePermission;
import com.neudebateclub.backend.permission.ModulePermissionRepository;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** RoleGuard cho unit test, với ma trận phân quyền cũ (trước khi BCN tự tick). Chỉ dùng trong test. */
public final class TestRoleGuards {

    private static final Set<Department> EVERY_DEPARTMENT = EnumSet.complementOf(EnumSet.of(Department.BCN));

    static final Map<AdminModule, Set<Department>> DEFAULTS = Map.ofEntries(
            Map.entry(AdminModule.TASK_ASSIGNMENT, EVERY_DEPARTMENT),
            Map.entry(AdminModule.NOTIFICATION_MANAGEMENT, EVERY_DEPARTMENT),
            Map.entry(AdminModule.DEPARTMENT_OPERATIONS, EVERY_DEPARTMENT),
            Map.entry(AdminModule.ANALYTICS, EVERY_DEPARTMENT),
            Map.entry(AdminModule.PUBLICATIONS, EnumSet.of(Department.TRUYEN_THONG, Department.NOI_DUNG)),
            Map.entry(AdminModule.ASSET_LIBRARY, EnumSet.of(Department.KY_THUAT)),
            Map.entry(AdminModule.LANDING_CMS, EnumSet.of(Department.TRUYEN_THONG)),
            Map.entry(AdminModule.FINANCE, EnumSet.of(Department.DOI_NGOAI)),
            Map.entry(AdminModule.SPONSORS, EnumSet.of(Department.DOI_NGOAI)),
            Map.entry(AdminModule.EVENT_MANAGEMENT, EnumSet.of(Department.SU_KIEN)),
            Map.entry(AdminModule.MEMBERSHIP, EnumSet.of(Department.NHAN_SU)),
            Map.entry(AdminModule.TENURE, EnumSet.of(Department.NHAN_SU)));

    private TestRoleGuards() {
    }

    public static RoleGuard withDefaults() {
        return withMatrix(DEFAULTS);
    }

    public static RoleGuard withMatrix(Map<AdminModule, Set<Department>> matrix) {
        ModulePermissionRepository repository = mock(ModulePermissionRepository.class);
        when(repository.findByDepartment(any())).thenAnswer(invocation -> {
            Department department = invocation.getArgument(0);
            List<ModulePermission> rows = matrix.entrySet().stream()
                    .filter(entry -> entry.getValue().contains(department))
                    .map(entry -> new ModulePermission(null, entry.getKey(), department))
                    .toList();
            return rows;
        });
        return new RoleGuard(repository);
    }
}
