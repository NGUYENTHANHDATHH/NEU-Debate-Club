package com.neudebateclub.backend.auth;

import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.dto.GoogleLoginRequest;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.exception.UnauthorizedException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import java.time.Duration;
import java.util.Optional;
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
import java.util.Arrays;
import java.util.List;

import org.springframework.web.servlet.view.RedirectView;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RoleGuard roleGuard;
    private final GoogleLoginFlow googleLoginFlow;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    private String getFrontendBaseUrl(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");

        java.util.List<String> allowedList = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toList();

        if (origin != null && !origin.isBlank() && allowedList.contains(origin)) {
            return origin;
        }
        if (referer != null && !referer.isBlank()) {
            try {
                java.net.URI uri = new java.net.URI(referer);
                String refererOrigin = uri.getScheme() + "://" + uri.getAuthority();
                if (allowedList.contains(refererOrigin)) {
                    return refererOrigin;
                }
            } catch (Exception ignored) {}
        }

        // Fallback về cấu hình mặc định
        if (!allowedList.isEmpty()) {
            return allowedList.get(0);
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

    private void writeNonceCookie(HttpServletRequest request, HttpServletResponse response,
                                  String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(GoogleLoginFlow.NONCE_COOKIE, value)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path(request.getContextPath() + "/auth/google")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static String readNonceCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (GoogleLoginFlow.NONCE_COOKIE.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private static RedirectView errorRedirect(String frontendBase, String returnPath, String message) {
        return new RedirectView(UriComponentsBuilder.fromUriString(frontendBase + returnPath)
                .queryParam("googleError", message)
                .build()
                .toUriString());
    }

    @GetMapping("/google/authorize")
    public RedirectView authorizeGoogle(
            @RequestParam(value = "returnUrl", required = false, defaultValue = "/") String returnUrl,
            HttpServletRequest request,
            HttpServletResponse response) {

        String nonce = googleLoginFlow.newNonce();
        writeNonceCookie(request, response, nonce, GoogleLoginFlow.STATE_TTL);
        String state = googleLoginFlow.createState(nonce, returnUrl);

        String callbackUrl = getCallbackUrl(request);
        String googleAuthUrl = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", callbackUrl)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("prompt", "select_account")
                .queryParam("state", state)
                .build()
                .toUriString();

        return new RedirectView(googleAuthUrl);
    }

    @GetMapping("/google/callback")
    public RedirectView googleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "state", required = false) String state,
            HttpServletRequest request,
            HttpServletResponse response) {

        String frontendBase = getFrontendBaseUrl(request);
        Optional<String> verifiedReturnPath = googleLoginFlow.verifyState(state, readNonceCookie(request));
        writeNonceCookie(request, response, "", Duration.ZERO);

        if (verifiedReturnPath.isEmpty()) {
            return errorRedirect(frontendBase, "/", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
        }
        String returnPath = verifiedReturnPath.get();

        if (error != null || code == null || code.isBlank()) {
            return errorRedirect(frontendBase, returnPath,
                    error != null ? error : "Missing authorization code");
        }

        try {
            String callbackUrl = getCallbackUrl(request);
            AuthResponse authResponse = authService.processGoogleCallback(code, callbackUrl);
            // The JWT never appears in the URL; the browser redeems this single-use code.
            String loginCode = googleLoginFlow.issueLoginCode(authResponse);

            return new RedirectView(UriComponentsBuilder.fromUriString(frontendBase + returnPath)
                    .queryParam("authCode", loginCode)
                    .queryParam("loginSuccess", "true")
                    .build()
                    .toUriString());
        } catch (Exception e) {
            String errorMessage = e.getMessage() == null
                ? "Google authentication failed"
                : e.getMessage().replaceAll("[\\r\\n]+", " ").trim();
            return errorRedirect(frontendBase, returnPath, errorMessage);
        }
    }

    @PostMapping("/google/exchange")
    public ResponseEntity<ApiResponse<AuthResponse>> exchangeLoginCode(
        @Valid @RequestBody LoginCodeRequest request) {
        AuthResponse authResponse = googleLoginFlow.redeemLoginCode(request.code())
            .orElseThrow(() -> new UnauthorizedException("Mã đăng nhập không hợp lệ hoặc đã hết hạn"));
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    public record LoginCodeRequest(@NotBlank String code) {
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

    @GetMapping("/modules")
    public ResponseEntity<ApiResponse<List<String>>> getAccessibleModules(
        @CurrentUser UserPrincipal currentUser) {
        List<String> modules = Arrays.stream(AdminModule.values())
            .filter(module -> roleGuard.canManageModule(currentUser, module))
            .map(Enum::name)
            .toList();
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Stateless — client tự xóa token
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
