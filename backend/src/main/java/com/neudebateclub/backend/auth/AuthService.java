package com.neudebateclub.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.UnauthorizedException;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Collections;

@Service @RequiredArgsConstructor @Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Value("${app.google.client-secret:}")
    private String googleClientSecret;

    public AuthResponse processGoogleCallback(String code, String redirectUri) {
        try {
            GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                new GsonFactory(),
                "https://oauth2.googleapis.com/token",
                googleClientId,
                googleClientSecret,
                code,
                redirectUri
            ).execute();

            String idToken = tokenResponse.getIdToken();
            if (idToken == null) {
                throw new UnauthorizedException("No ID token returned from Google token exchange");
            }
            return loginWithGoogle(idToken);
        } catch (Exception e) {
            log.error("Failed to exchange Google code for token: ", e);
            throw new UnauthorizedException("Google code exchange failed: " + e.getMessage());
        }
    }

    public AuthResponse loginWithGoogle(String idToken) {
        // 1. Verify Google ID Token
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
            new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList(googleClientId))
            .build();

        GoogleIdToken googleIdToken;
        try {
            googleIdToken = verifier.verify(idToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid Google ID token");
        }
        if (googleIdToken == null) throw new UnauthorizedException("Token verification failed");

        return loginVerifiedGoogleAccount(googleIdToken.getPayload());
    }

    AuthResponse loginVerifiedGoogleAccount(GoogleIdToken.Payload payload) {
        String googleId  = payload.getSubject();
        String email     = payload.getEmail();
        String fullName  = (String) payload.get("name");
        String avatarUrl = (String) payload.get("picture");

        // 2. Chỉ tài khoản đã có trong database mới được đăng nhập
        if (email == null || !Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new UnauthorizedException("Google account email is not verified");
        }

        // 3. Đồng bộ Google identity với tài khoản đã được quản lý trong database
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UnauthorizedException(
                "Google account is not registered in the database"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is inactive");
        }

        user.setGoogleId(googleId);
        user.setLastLoginAt(Instant.now());
        user.setAvatarUrl(avatarUrl);
        user.setFullName(fullName);
        user = userRepository.save(user);

        // 4. Generate JWT
        UserPrincipal principal = UserPrincipal.builder()
            .id(user.getId())
            .email(user.getEmail())
            .googleId(user.getGoogleId())
            .role(user.getRole())
            .department(user.getDepartment())
            .active(user.isActive())
            .build();

        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .expiresIn(604800000L)
            .user(AuthResponse.UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name().toLowerCase())
                .department(user.getDepartment() != null
                    ? user.getDepartment().name().toLowerCase() : null)
                .build())
            .build();
    }

    public AuthResponse.UserDTO getMe(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId().toString()));
        return AuthResponse.UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole().name().toLowerCase())
            .department(user.getDepartment() != null
                ? user.getDepartment().name().toLowerCase() : null)
            .build();
    }
}
