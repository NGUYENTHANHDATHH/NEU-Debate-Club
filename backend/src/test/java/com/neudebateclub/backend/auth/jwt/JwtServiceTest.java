package com.neudebateclub.backend.auth.jwt;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "unit-test-secret-unit-test-secret-123");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 60_000L);
    }

    @Test
    void guestTokenCarriesIdentityButNeverAuthenticatesAsUser() {
        String token = jwtService.generateGuestToken("guest@gmail.com", "Khách Mời");

        // Bộ lọc JWT chỉ nhận token qua isTokenValid: khách không bao giờ thành người dùng đã đăng nhập.
        assertFalse(jwtService.isTokenValid(token));
        var claims = jwtService.parseGuest(token).orElseThrow();
        assertEquals("guest@gmail.com", claims.get("email", String.class));
        assertEquals("Khách Mời", claims.get("name", String.class));
    }

    @Test
    void memberTokenAndGarbageAreNotGuestTokens() {
        String memberToken = jwtService.generateToken(
                UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER).active(true).build());

        assertTrue(jwtService.isTokenValid(memberToken));
        assertTrue(jwtService.parseGuest(memberToken).isEmpty());
        assertTrue(jwtService.parseGuest("").isEmpty());
        assertTrue(jwtService.parseGuest("not-a-token").isEmpty());
        assertTrue(jwtService.parseGuest(jwtService.generateOAuthState("n", "/", java.time.Duration.ofMinutes(1))).isEmpty());
    }
}
