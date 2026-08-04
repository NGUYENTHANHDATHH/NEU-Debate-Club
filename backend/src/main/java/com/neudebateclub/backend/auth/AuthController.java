package com.neudebateclub.backend.auth;

import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.dto.GoogleLoginRequest;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

import org.springframework.web.servlet.view.RedirectView;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    private String getFrontendBaseUrl(HttpServletRequest request) {
    String origin = request.getHeader("Origin");
    String referer = request.getHeader("Referer");

    // Ưu tiên dùng Origin hoặc Referer gửi từ Client nếu nằm trong danh sách CORS cho phép
    if (origin != null && !origin.isBlank()) {
        return origin;
    }
    if (referer != null && !referer.isBlank()) {
        // Cắt bớt path chỉ lấy scheme://host:port
        try {
            java.net.URI uri = new java.net.URI(referer);
            return uri.getScheme() + "://" + uri.getAuthority();
        } catch (Exception ignored) {}
    }

    // Fallback về cấu hình mặc định
    if (allowedOrigins != null && !allowedOrigins.isBlank()) {
        return allowedOrigins.split(",")[0].trim();
    }
    return "http://localhost:3000";
}

    private String getCallbackUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String contextPath = request.getContextPath();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);
        if (("http".equals(scheme) && serverPort != 80) || ("https".equals(scheme) && serverPort != 443)) {
            url.append(":").append(serverPort);
        }
        url.append(contextPath).append("/auth/google/callback");
        return url.toString();
    }

    @GetMapping("/google/authorize")
    public RedirectView authorizeGoogle(
            @RequestParam(value = "returnUrl", required = false, defaultValue = "/") String returnUrl,
            HttpServletRequest request) {

        String callbackUrl = getCallbackUrl(request);
        String googleAuthUrl = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", callbackUrl)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("prompt", "select_account")
                .queryParam("state", returnUrl)
                .build()
                .toUriString();

        return new RedirectView(googleAuthUrl);
    }

    @GetMapping("/google/callback")
    public RedirectView googleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "state", required = false, defaultValue = "/") String state,
            HttpServletRequest request) {

        String frontendBase = getFrontendBaseUrl();
        String targetReturnUrl = (state != null && !state.isBlank()) ? state : "/";

        if (error != null || code == null || code.isBlank()) {
            String redirectUrl = UriComponentsBuilder.fromUriString(frontendBase + targetReturnUrl)
                    .queryParam("googleError", error != null ? error : "Missing authorization code")
                    .build()
                    .toUriString();
            return new RedirectView(redirectUrl);
        }

        try {
            String callbackUrl = getCallbackUrl(request);
            AuthResponse authResponse = authService.processGoogleCallback(code, callbackUrl);

            String redirectUrl = UriComponentsBuilder.fromUriString(frontendBase + targetReturnUrl)
                    .queryParam("token", authResponse.getToken())
                    .queryParam("loginSuccess", "true")
                    .build()
                    .toUriString();

            return new RedirectView(redirectUrl);
        } catch (Exception e) {
            String redirectUrl = UriComponentsBuilder.fromUriString(frontendBase + targetReturnUrl)
                    .queryParam("googleError", e.getMessage())
                    .build()
                    .toUriString();
            return new RedirectView(redirectUrl);
        }
    }

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
