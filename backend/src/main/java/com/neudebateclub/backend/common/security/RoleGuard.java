package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import org.springframework.stereotype.Component;

@Component
public class RoleGuard {

    public void requireRole(UserPrincipal user, Role minimumRole) {
        if (!user.hasRole(minimumRole)) {
            throw new ForbiddenException(
                "Required role: " + minimumRole + ", current: " + user.getRole());
        }
    }

    public void requireBCN(UserPrincipal user)                { requireRole(user, Role.BCN); }
    public void requireTruongBanOrAbove(UserPrincipal user)   { requireRole(user, Role.TRUONG_BAN); }
    public void requireMemberOrAbove(UserPrincipal user)      { requireRole(user, Role.MEMBER); }
    public void requireCmsEditor(UserPrincipal user)          { requireTruongBanOrAbove(user); }

    public boolean canManageModule(UserPrincipal user, AdminModule module) {
        return user != null
                && user.isActive()
                && (user.getRole() == Role.BCN
                    || (user.getRole() == Role.TRUONG_BAN
                        && module.isManagedBy(user.getDepartment())));
    }

    public void requireModuleManager(UserPrincipal user, AdminModule module) {
        if (!canManageModule(user, module)) {
            throw new ForbiddenException("Access restricted to module: " + module);
        }
    }

    public void requireSameDepartmentOrBCN(UserPrincipal user, Department department) {
        if (user.getRole() != Role.BCN && !user.isInDepartment(department)) {
            throw new ForbiddenException("Access restricted to department: " + department);
        }
    }
}
