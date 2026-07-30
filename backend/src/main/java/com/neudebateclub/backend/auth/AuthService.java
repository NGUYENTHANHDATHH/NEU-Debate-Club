package com.neudebateclub.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.common.enums.Role;
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

    @Value("${app.allowed-domain}")
    private String allowedDomain;

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

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        String googleId  = payload.getSubject();
        String email     = payload.getEmail();
        String fullName  = (String) payload.get("name");
        String avatarUrl = (String) payload.get("picture");

        // 2. Xác định role dựa vào email domain
        Role role = email.contains(allowedDomain) ? Role.MEMBER : Role.GUEST;

        // 3. Upsert user
        User user = userRepository.findByGoogleId(googleId)
            .map(existing -> {
                existing.setLastLoginAt(Instant.now());
                existing.setAvatarUrl(avatarUrl);
                existing.setFullName(fullName);
                existing.setActive(true);
                // Không downgrade role đã được BCN set
                if (existing.getRole() == Role.GUEST && role == Role.MEMBER) {
                    existing.setRole(Role.MEMBER);
                }
                return userRepository.save(existing);
            })
            .orElseGet(() -> userRepository.save(User.builder()
                .googleId(googleId)
                .email(email)
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .role(role)
                .active(true)
                .lastLoginAt(Instant.now())
                .build()));

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
