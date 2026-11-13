package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleGuardTest {
    private final RoleGuard roleGuard = TestRoleGuards.withMatrix(
            Map.of(AdminModule.LANDING_CMS, Set.of(Department.TRUYEN_THONG)));

    @Test
    void bcnCanManageEveryModuleEvenWithEmptyMatrix() {
        UserPrincipal bcn = principal(Role.BCN, Department.BCN);
        RoleGuard emptyMatrix = TestRoleGuards.withMatrix(Map.of());

        assertEquals(EnumSet.allOf(AdminModule.class), emptyMatrix.modulesOf(bcn));
        for (AdminModule module : AdminModule.values()) {
            assertDoesNotThrow(() -> emptyMatrix.requireModuleManager(bcn, module));
        }
    }

    @Test
    void onlyTheLeadOfATickedDepartmentGetsTheModule() {
        assertDoesNotThrow(() -> roleGuard.requireModuleManager(
                principal(Role.TRUONG_BAN, Department.TRUYEN_THONG), AdminModule.LANDING_CMS));
        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                principal(Role.TRUONG_BAN, Department.TRUYEN_THONG), AdminModule.FINANCE));
        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                principal(Role.MEMBER, Department.TRUYEN_THONG), AdminModule.LANDING_CMS));
    }

    @Test
    void untickedDepartmentGuestAndInactiveGetNothing() {
        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                principal(Role.TRUONG_BAN, Department.DOI_NGOAI), AdminModule.LANDING_CMS));
        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                principal(Role.GUEST, Department.TRUYEN_THONG), AdminModule.LANDING_CMS));

        UserPrincipal inactive = UserPrincipal.builder()
                .email("inactive@test").role(Role.TRUONG_BAN).department(Department.TRUYEN_THONG).active(false).build();
        assertTrue(roleGuard.modulesOf(inactive).isEmpty());
    }

    private UserPrincipal principal(Role role, Department department) {
        return UserPrincipal.builder()
                .email("test@ndc.neu@gmail.com")
                .role(role)
                .department(department)
                .active(true)
                .build();
    }
}
