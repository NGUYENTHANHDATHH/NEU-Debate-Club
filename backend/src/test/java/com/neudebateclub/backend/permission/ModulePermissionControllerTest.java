package com.neudebateclub.backend.permission;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ModulePermissionControllerTest {

    private ModulePermissionRepository repository;
    private ActivityLogService activityLogService;
    private ModulePermissionController controller;

    @BeforeEach
    void setUp() {
        repository = mock(ModulePermissionRepository.class);
        activityLogService = mock(ActivityLogService.class);
        controller = new ModulePermissionController(repository,
                TestRoleGuards.withMatrix(Map.of(AdminModule.MEMBERSHIP, Set.of(Department.NHAN_SU))),
                activityLogService);
    }

    @Test
    void getReturnsEveryModuleIncludingUnticked() {
        when(repository.findAll()).thenReturn(List.of(
                new ModulePermission(null, AdminModule.FINANCE, Department.DOI_NGOAI)));

        Map<AdminModule, List<Department>> matrix =
                controller.get(principal(Role.TRUONG_BAN, Department.NHAN_SU)).getBody().getData();

        assertEquals(AdminModule.values().length, matrix.size());
        assertEquals(List.of(Department.DOI_NGOAI), matrix.get(AdminModule.FINANCE));
        assertEquals(List.of(), matrix.get(AdminModule.LANDING_CMS));
    }

    @Test
    void onlyMembershipManagersCanReadAndOnlyBcnCanSave() {
        assertThrows(ForbiddenException.class, () -> controller.get(principal(Role.TRUONG_BAN, Department.SU_KIEN)));
        assertThrows(ForbiddenException.class, () -> controller.get(principal(Role.MEMBER, Department.NHAN_SU)));
        assertThrows(ForbiddenException.class, () -> controller.replace(
                Map.of(AdminModule.FINANCE, List.of(Department.NHAN_SU)), principal(Role.TRUONG_BAN, Department.NHAN_SU)));
        verify(repository, never()).deleteAllInBatch();
    }

    @Test
    void bcnDepartmentCannotBeTicked() {
        assertThrows(ValidationException.class, () -> controller.replace(
                Map.of(AdminModule.FINANCE, List.of(Department.BCN)), principal(Role.BCN, Department.BCN)));
        verify(repository, never()).deleteAllInBatch();
    }

    @SuppressWarnings("unchecked")
    @Test
    void saveReplacesWholeMatrixAndLogs() {
        UserPrincipal bcn = principal(Role.BCN, Department.BCN);

        controller.replace(Map.of(
                AdminModule.LANDING_CMS, List.of(Department.TRUYEN_THONG, Department.TRUYEN_THONG),
                AdminModule.FINANCE, List.of()), bcn);

        ArgumentCaptor<List<ModulePermission>> saved = ArgumentCaptor.forClass(List.class);
        verify(repository).deleteAllInBatch();
        verify(repository).saveAll(saved.capture());
        assertEquals(1, saved.getValue().size());
        assertEquals(AdminModule.LANDING_CMS, saved.getValue().getFirst().getModule());
        assertEquals(Department.TRUYEN_THONG, saved.getValue().getFirst().getDepartment());
        verify(activityLogService).record(eq(bcn.getId()), eq("UPDATE"), eq("MODULE_PERMISSIONS"),
                eq(ModulePermissionController.MATRIX_ENTITY_ID), anyMap());
    }

    private UserPrincipal principal(Role role, Department department) {
        return UserPrincipal.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .role(role)
                .department(department)
                .active(true)
                .build();
    }
}
