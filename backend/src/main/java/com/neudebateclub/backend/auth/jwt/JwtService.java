package com.neudebateclub.backend.auth.jwt;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service @Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes;

        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (IllegalArgumentException | DecodingException ex) {
            // Not Base64 (e.g. contains '-'): use the raw secret text.
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            try {
                keyBytes = MessageDigest.getInstance("SHA-256").digest(keyBytes);
            } catch (NoSuchAlgorithmException ex) {
                throw new IllegalStateException("Unable to derive JWT signing key", ex);
            }
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserPrincipal principal) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", principal.getRole().name().toLowerCase());
        claims.put("department", principal.getDepartment() != null
            ? principal.getDepartment().name().toLowerCase() : null);

        return Jwts.builder()
            .id(UUID.randomUUID().toString())
            .subject(principal.getId().toString())
            .claims(claims)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    private static final String OAUTH_STATE_TYPE = "oauth_state";

    /** Signed OAuth {@code state}: carries a browser nonce and return path, no subject. */
    public String generateOAuthState(String nonce, String returnPath, Duration ttl) {
        return Jwts.builder()
            .claim("typ", OAUTH_STATE_TYPE)
            .claim("nonce", nonce)
            .claim("ret", returnPath)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + ttl.toMillis()))
            .signWith(getSigningKey())
            .compact();
    }

    public Optional<Claims> parseOAuthState(String state) {
        try {
            Claims claims = extractAllClaims(state);
            return OAUTH_STATE_TYPE.equals(claims.get("typ", String.class))
                ? Optional.of(claims) : Optional.empty();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid OAuth state: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static final String GUEST_TYPE = "guest";

    /**
     * Phiên khách cho tài khoản Google ngoài CLB. Không có subject nên {@link #isTokenValid} luôn từ chối:
     * khách không bao giờ thành người dùng đã đăng nhập, token chỉ dùng để đăng ký sự kiện.
     */
    public String generateGuestToken(String email, String name) {
        return Jwts.builder()
            .claim("typ", GUEST_TYPE)
            .claim("email", email)
            .claim("name", name)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public Optional<Claims> parseGuest(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return GUEST_TYPE.equals(claims.get("typ", String.class)) ? Optional.of(claims) : Optional.empty();
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractAllClaims(token).getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            // OAuth state values share the signing key but are never access tokens.
            return claims.getSubject() != null
                && !OAUTH_STATE_TYPE.equals(claims.get("typ", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}