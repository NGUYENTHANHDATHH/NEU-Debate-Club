package com.neudebateclub.backend.auth.security;

import lombok.Builder;
import lombok.Data;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.Department;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class UserPrincipal implements UserDetails {
    private UUID id;
    private String email;
    private String googleId;
    private Role role;
    private Department department;
    private boolean active;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public String getPassword()                  { return null; }
    @Override public String getUsername()                  { return email; }
    @Override public boolean isEnabled()                   { return active; }
    @Override public boolean isAccountNonExpired()         { return true; }
    @Override public boolean isAccountNonLocked()          { return true; }
    @Override public boolean isCredentialsNonExpired()     { return true; }

    public boolean hasRole(Role requiredRole) {
        return switch (requiredRole) {
            case GUEST      -> true;
            case MEMBER     -> role == Role.MEMBER;
            case TRUONG_BAN -> role == Role.TRUONG_BAN;
            case BCN        -> role == Role.BCN;
        };
    }

    public boolean isInDepartment(Department dept) {
        return dept.equals(this.department);
    }
}
