package com.neudebateclub.backend.finance;

import org.junit.jupiter.api.Test;

import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PayosSettingsServiceTest {

    @Test
    void encryptedKeyRoundTripsAndNeedsSameSecret() throws GeneralSecurityException {
        SecretKeySpec key = PayosSettingsService.deriveKey("jwt-secret");
        String stored = PayosSettingsService.encrypt("checksum-key-123", key);

        assertNotEquals("checksum-key-123", stored);
        assertEquals("checksum-key-123", PayosSettingsService.decrypt(stored, key));
        assertThrows(GeneralSecurityException.class,
                () -> PayosSettingsService.decrypt(stored, PayosSettingsService.deriveKey("other-secret")));
    }
}
