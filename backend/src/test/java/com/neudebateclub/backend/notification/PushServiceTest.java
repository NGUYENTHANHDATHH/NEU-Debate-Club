package com.neudebateclub.backend.notification;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.security.KeyPair;
import java.util.Base64;
import java.util.Set;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class PushServiceTest {

    // RFC 8291 Appendix A.
    private static final String SERVER_PUBLIC =
            "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8";
    private static final String SERVER_PRIVATE = "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw";

    @Test
    void encryptMatchesRfc8291Example() throws Exception {
        KeyPair server = new KeyPair(PushService.publicKey(b64(SERVER_PUBLIC)), PushService.privateKey(b64(SERVER_PRIVATE)));

        byte[] body = PushService.encrypt(
                "When I grow up, I want to be a watermelon".getBytes(UTF_8),
                b64("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
                b64("BTBZMqHH6r4Tts7J_aSIgg"),
                server,
                b64("DGv6ra1nlYgDCS1FRnbzlw"));

        assertEquals("DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
                Base64.getUrlEncoder().withoutPadding().encodeToString(body));
    }

    @Test
    void vapidJwtIsSignedForThePushServiceOrigin() throws Exception {
        PushService service = new PushService(mock(PushSubscriptionRepository.class), mock(ObjectMapper.class),
                SERVER_PUBLIC, SERVER_PRIVATE, "mailto:test@example.com");

        String jwt = service.vapidJwt(URI.create("https://fcm.googleapis.com/fcm/send/abc"));

        Claims claims = Jwts.parser().verifyWith(PushService.publicKey(b64(SERVER_PUBLIC))).build()
                .parseSignedClaims(jwt).getPayload();
        assertEquals(Set.of("https://fcm.googleapis.com"), claims.getAudience());
        assertEquals("mailto:test@example.com", claims.getSubject());
        // Một số dịch vụ push không chấp nhận "aud" dạng mảng.
        String payload = new String(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]), UTF_8);
        assertTrue(payload.contains("\"aud\":\"https://fcm.googleapis.com\""), payload);
    }

    @Test
    void onlyRealPushServicesAreAccepted() {
        assertTrue(PushService.isPushServiceEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
        assertTrue(PushService.isPushServiceEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"));
        assertTrue(PushService.isPushServiceEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc"));
        assertTrue(PushService.isPushServiceEndpoint("https://web.push.apple.com/abc"));

        assertFalse(PushService.isPushServiceEndpoint("http://fcm.googleapis.com/fcm/send/abc"));
        assertFalse(PushService.isPushServiceEndpoint("https://fcm.googleapis.com:8443/abc"));
        assertFalse(PushService.isPushServiceEndpoint("https://fcm.googleapis.com.evil.com/abc"));
        assertFalse(PushService.isPushServiceEndpoint("https://evilfcm.googleapis.com/abc"));
        assertFalse(PushService.isPushServiceEndpoint("https://localhost/api/admin"));
        assertFalse(PushService.isPushServiceEndpoint("not a url"));
    }

    private static byte[] b64(String value) {
        return Base64.getUrlDecoder().decode(value);
    }
}
