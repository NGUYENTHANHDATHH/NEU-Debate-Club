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
import static org.junit.jupiter.api.Assertions.assertNull;
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
    void signsInAccountMissingFromDatabaseAsGuestWithoutCreatingUser() {
        GoogleIdToken.Payload payload = payload("Outsider@gmail.com");
        when(repository.findByEmailIgnoreCase("Outsider@gmail.com")).thenReturn(Optional.empty());
        when(jwtService.generateGuestToken("outsider@gmail.com", "Member")).thenReturn("guest-token");

        var response = authService.loginVerifiedGoogleAccount(payload);

        assertEquals("guest-token", response.getToken());
        assertEquals("guest", response.getUser().getRole());
        assertEquals("outsider@gmail.com", response.getUser().getEmail());
        assertNull(response.getUser().getId());
        verify(repository, never()).save(any());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void rejectsInactiveMember() {
        GoogleIdToken.Payload payload = payload("old@gmail.com");
        when(repository.findByEmailIgnoreCase("old@gmail.com")).thenReturn(Optional.of(
                User.builder().id(UUID.randomUUID()).email("old@gmail.com").role(Role.MEMBER).active(false).build()));

        assertThrows(UnauthorizedException.class,
                () -> authService.loginVerifiedGoogleAccount(payload));
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
