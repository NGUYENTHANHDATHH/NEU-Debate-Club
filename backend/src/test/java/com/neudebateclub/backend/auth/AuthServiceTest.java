package com.neudebateclub.backend.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.UnauthorizedException;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository repository;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(repository, jwtService);
    }

    @Test
    void logsInActiveDatabaseUserWithoutRequiringClubEmailSuffix() {
        GoogleIdToken.Payload payload = payload("MEMBER@GMAIL.COM");
        User member = User.builder()
                .id(UUID.randomUUID())
                .email("member@gmail.com")
                .role(Role.MEMBER)
                .active(true)
                .build();
        when(repository.findByEmailIgnoreCase("MEMBER@GMAIL.COM")).thenReturn(Optional.of(member));
        when(repository.save(member)).thenReturn(member);
        when(jwtService.generateToken(any())).thenReturn("token");

        var response = authService.loginVerifiedGoogleAccount(payload);

        assertEquals("token", response.getToken());
        assertEquals("member@gmail.com", response.getUser().getEmail());
        verify(repository).save(member);
    }

    @Test
    void rejectsAccountMissingFromDatabase() {
        GoogleIdToken.Payload payload = payload("outsider@gmail.com");
        when(repository.findByEmailIgnoreCase("outsider@gmail.com")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class,
                () -> authService.loginVerifiedGoogleAccount(payload));

        verify(repository, never()).save(any());
    }

    private GoogleIdToken.Payload payload(String email) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setSubject("google-id");
        payload.setEmail(email);
        payload.setEmailVerified(true);
        payload.set("name", "Member");
        return payload;
    }
}
