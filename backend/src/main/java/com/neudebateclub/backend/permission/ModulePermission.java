package com.neudebateclub.backend.permission;

import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Một ô được tick trong ma trận phân quyền: Trưởng/Phó ban {@code department} dùng được {@code module} (V23). */
@Entity
@Table(name = "module_permissions")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ModulePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AdminModule module;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Department department;
}
