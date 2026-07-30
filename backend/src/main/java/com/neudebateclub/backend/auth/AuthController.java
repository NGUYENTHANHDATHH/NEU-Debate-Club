package com.neudebateclub.backend.auth;

import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.dto.GoogleLoginRequest;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(
        @Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful",
            authService.loginWithGoogle(request.getIdToken())));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDTO>> getMe(
        @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(authService.getMe(currentUser)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Stateless — client tự xóa token
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
