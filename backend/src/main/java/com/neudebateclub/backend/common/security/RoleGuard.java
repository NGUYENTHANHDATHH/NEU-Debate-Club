package com.neudebateclub.backend.common.security;

import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.permission.ModulePermission;
import com.neudebateclub.backend.permission.ModulePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RoleGuard {

    private final ModulePermissionRepository modulePermissionRepository;

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

    /** BCN: mọi module. Trưởng/Phó ban: các module ban mình được tick ở trang Phân quyền. Thành viên: không có. */
    public Set<AdminModule> modulesOf(UserPrincipal user) {
        if (user == null || !user.isActive()) return EnumSet.noneOf(AdminModule.class);
        if (user.getRole() == Role.BCN) return EnumSet.allOf(AdminModule.class);
        if (user.getRole() != Role.TRUONG_BAN || user.getDepartment() == null) return EnumSet.noneOf(AdminModule.class);
        return modulePermissionRepository.findByDepartment(user.getDepartment()).stream()
                .map(ModulePermission::getModule)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(AdminModule.class)));
    }

    public boolean canManageModule(UserPrincipal user, AdminModule module) {
        return modulesOf(user).contains(module);
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
