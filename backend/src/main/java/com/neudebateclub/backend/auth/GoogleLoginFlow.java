package com.neudebateclub.backend.auth;

import com.neudebateclub.backend.auth.dto.AuthResponse;
import com.neudebateclub.backend.auth.jwt.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Hardening for the browser-redirect Google login:
 * <ul>
 *   <li>{@code returnUrl} is restricted to a same-site relative path (no open redirect);</li>
 *   <li>OAuth {@code state} is a signed, short-lived value bound to a browser nonce cookie (login CSRF);</li>
 *   <li>the callback hands the browser a single-use login code instead of the JWT.</li>
 * </ul>
 * Login codes live in memory, so this assumes a single backend instance.
 */
@Component
public class GoogleLoginFlow {

    public static final String NONCE_COOKIE = "ndc_oauth_nonce";
    static final Duration STATE_TTL = Duration.ofMinutes(10);
    static final Duration CODE_TTL = Duration.ofSeconds(60);

    private final JwtService jwtService;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, PendingLogin> pendingLogins = new ConcurrentHashMap<>();

    @Autowired
    public GoogleLoginFlow(JwtService jwtService) {
        this(jwtService, Clock.systemUTC());
    }

    GoogleLoginFlow(JwtService jwtService, Clock clock) {
        this.jwtService = jwtService;
        this.clock = clock;
    }

    /** Returns {@code value} if it is a safe same-site path, otherwise {@code "/"}. */
    public static String safeReturnPath(String value) {
        if (value == null || value.isBlank()
                || !value.startsWith("/")
                || value.startsWith("//")
                || value.indexOf('\\') >= 0
                || value.chars().anyMatch(Character::isISOControl)) {
            return "/";
        }
        return value;
    }

    public String newNonce() {
        return randomToken();
    }

    public String createState(String nonce, String returnUrl) {
        return jwtService.generateOAuthState(nonce, safeReturnPath(returnUrl), STATE_TTL);
    }

    /**
     * Validates the signed state against the nonce cookie and returns the safe return path,
     * or empty when the state is missing, expired, tampered with, or from another browser.
     */
    public Optional<String> verifyState(String state, String nonceCookie) {
        if (state == null || nonceCookie == null || nonceCookie.isBlank()) {
            return Optional.empty();
        }
        Optional<Claims> claims = jwtService.parseOAuthState(state);
        if (claims.isEmpty()) {
            return Optional.empty();
        }
        String expectedNonce = claims.get().get("nonce", String.class);
        if (expectedNonce == null || !MessageDigest.isEqual(
                expectedNonce.getBytes(StandardCharsets.UTF_8),
                nonceCookie.getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }
        return Optional.of(safeReturnPath(claims.get().get("ret", String.class)));
    }

    /** Stores a completed login and returns a single-use code for the browser. */
    public String issueLoginCode(AuthResponse authResponse) {
        Instant now = clock.instant();
        pendingLogins.values().removeIf(pending -> pending.expiresAt().isBefore(now));
        String code = randomToken();
        pendingLogins.put(code, new PendingLogin(authResponse, now.plus(CODE_TTL)));
        return code;
    }

    /** Redeems a login code once; expired or unknown codes yield empty. */
    public Optional<AuthResponse> redeemLoginCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        PendingLogin pending = pendingLogins.remove(code);
        if (pending == null || pending.expiresAt().isBefore(clock.instant())) {
            return Optional.empty();
        }
        return Optional.of(pending.authResponse());
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record PendingLogin(AuthResponse authResponse, Instant expiresAt) {
    }
}
