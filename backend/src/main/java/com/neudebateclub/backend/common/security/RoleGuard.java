package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.Department;
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

    public void requireSameDepartmentOrBCN(UserPrincipal user, Department department) {
        if (!user.isInDepartment(department)) {
            throw new ForbiddenException("Access restricted to department: " + department);
        }
    }
}
