package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RoleGuardTest {
    private final RoleGuard roleGuard = new RoleGuard();

    @Test
    void bcnCanManageEveryModule() {
        UserPrincipal bcn = principal(Role.BCN, Department.BCN);

        for (AdminModule module : AdminModule.values()) {
            assertDoesNotThrow(() -> roleGuard.requireModuleManager(bcn, module));
        }
    }

    @Test
    void departmentLeaderCanManageOnlyItsAssignedModules() {
        UserPrincipal communicationsLead = principal(Role.TRUONG_BAN, Department.TRUYEN_THONG);

        assertDoesNotThrow(() -> roleGuard.requireModuleManager(
                communicationsLead, AdminModule.LANDING_CMS));
        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                communicationsLead, AdminModule.FINANCE));
    }

    @Test
    void memberCannotManageDepartmentModules() {
        UserPrincipal member = principal(Role.MEMBER, Department.TRUYEN_THONG);

        assertThrows(ForbiddenException.class, () -> roleGuard.requireModuleManager(
                member, AdminModule.LANDING_CMS));
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
