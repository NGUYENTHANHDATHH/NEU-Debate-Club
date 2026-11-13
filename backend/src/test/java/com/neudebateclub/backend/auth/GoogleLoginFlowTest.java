package com.neudebateclub.backend.auth;

import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GoogleLoginFlowTest {

    private JwtService jwtService;
    private MutableClock clock;
    private GoogleLoginFlow flow;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "unit-test-secret-unit-test-secret-123");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 60_000L);
        clock = new MutableClock(Instant.parse("2026-11-13T00:00:00Z"));
        flow = new GoogleLoginFlow(jwtService, clock);
    }

    @Test
    void returnPathMustBeSameSiteRelativePath() {
        assertEquals("/dashboard?tab=1#top", GoogleLoginFlow.safeReturnPath("/dashboard?tab=1#top"));
        assertEquals("/", GoogleLoginFlow.safeReturnPath(null));
        assertEquals("/", GoogleLoginFlow.safeReturnPath(""));
        assertEquals("/", GoogleLoginFlow.safeReturnPath("@attacker.example/x"));
        assertEquals("/", GoogleLoginFlow.safeReturnPath("https://attacker.example"));
        assertEquals("/", GoogleLoginFlow.safeReturnPath("//attacker.example"));
        assertEquals("/", GoogleLoginFlow.safeReturnPath("/\\attacker.example"));
        assertEquals("/", GoogleLoginFlow.safeReturnPath("/\t/attacker.example"));
    }

    @Test
    void stateRoundTripsOnlyWithMatchingNonce() {
        String nonce = flow.newNonce();
        String state = flow.createState(nonce, "/dashboard");

        assertEquals(Optional.of("/dashboard"), flow.verifyState(state, nonce));
        assertTrue(flow.verifyState(state, flow.newNonce()).isEmpty());
        assertTrue(flow.verifyState(state, null).isEmpty());
        assertTrue(flow.verifyState(state + "x", nonce).isEmpty());
        assertTrue(flow.verifyState("/dashboard", nonce).isEmpty());
    }

    @Test
    void unsafeReturnUrlIsNeutralisedInsideState() {
        String nonce = flow.newNonce();
        String state = flow.createState(nonce, "@attacker.example/steal");

        assertEquals(Optional.of("/"), flow.verifyState(state, nonce));
    }

    @Test
    void stateIsNeverAcceptedAsAccessToken() {
        String state = flow.createState(flow.newNonce(), "/");

        assertFalse(jwtService.isTokenValid(state));
    }

    @Test
    void loginCodeIsSingleUse() {
        AuthResponse auth = AuthResponse.builder().token("jwt").build();
        String code = flow.issueLoginCode(auth);

        assertSame(auth, flow.redeemLoginCode(code).orElseThrow());
        assertTrue(flow.redeemLoginCode(code).isEmpty());
        assertTrue(flow.redeemLoginCode("unknown").isEmpty());
    }

    @Test
    void loginCodeExpires() {
        String code = flow.issueLoginCode(AuthResponse.builder().token("jwt").build());

        clock.advance(GoogleLoginFlow.CODE_TTL.plusSeconds(1));

        assertTrue(flow.redeemLoginCode(code).isEmpty());
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        private MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
