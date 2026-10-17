package com.neudebateclub.backend.common.enums;

import java.util.EnumSet;
import java.util.Set;

public enum AdminModule {
    TASK_ASSIGNMENT(allDepartments()),
    NOTIFICATION_MANAGEMENT(allDepartments()),
    DEPARTMENT_OPERATIONS(allDepartments()),
    ANALYTICS(allDepartments()),
    PUBLICATIONS(EnumSet.of(Department.TRUYEN_THONG, Department.NOI_DUNG)),
    ASSET_LIBRARY(EnumSet.of(Department.KY_THUAT)),
    LANDING_CMS(EnumSet.of(Department.TRUYEN_THONG)),
    FINANCE(EnumSet.of(Department.DOI_NGOAI)),
    MEMBERSHIP(EnumSet.of(Department.NHAN_SU)),
    TENURE(EnumSet.of(Department.NHAN_SU)),
    CROSS_DEPARTMENT_TASKS(EnumSet.noneOf(Department.class)),
    ACTIVITY_LOG(EnumSet.noneOf(Department.class)),
    HEALTH_DASHBOARD(EnumSet.noneOf(Department.class));

    private final Set<Department> departments;

    AdminModule(Set<Department> departments) {
        this.departments = departments;
    }

    public boolean isManagedBy(Department department) {
        return department != null && departments.contains(department);
    }

    private static Set<Department> allDepartments() {
        return EnumSet.complementOf(EnumSet.of(Department.BCN));
    }
}
