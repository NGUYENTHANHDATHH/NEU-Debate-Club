package com.neudebateclub.backend.auth.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data @Builder
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserDTO user;

    @Data @Builder
    public static class UserDTO {
        private UUID id;
        private String email;
        private String fullName;
        private String avatarUrl;
        private String role;
        private String department;  // nullable
    }
}
