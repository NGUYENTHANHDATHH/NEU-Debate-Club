package com.neudebateclub.backend.permission;

import com.neudebateclub.backend.common.enums.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModulePermissionRepository extends JpaRepository<ModulePermission, UUID> {

    List<ModulePermission> findByDepartment(Department department);
}
