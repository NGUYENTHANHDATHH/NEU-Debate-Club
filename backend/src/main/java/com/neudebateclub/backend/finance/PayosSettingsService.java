package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

/**
 * Tài khoản PayOS nhận tiền do BCN đổi trên web (bảng payos_settings), ưu tiên hơn PAYOS_* trong env.
 * Khoá bí mật mã hoá AES-GCM bằng khoá suy ra từ JWT_SECRET.
 * shortcut: đổi JWT_SECRET thì không giải mã được nữa → quay về env, BCN nhập lại; tách khoá riêng nếu hay đổi JWT_SECRET.
 */
@Slf4j
@Service
public class PayosSettingsService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final PayosClient payos;
    private final TransactionRepository transactionRepository;
    private final MemberPaymentService memberPaymentService;
    private final ActivityLogService activityLogService;
    private final SecretKeySpec key;

    public PayosSettingsService(JdbcTemplate jdbc, PayosClient payos, TransactionRepository transactionRepository,
                                MemberPaymentService memberPaymentService, ActivityLogService activityLogService,
                                @Value("${app.jwt.secret}") String jwtSecret) {
        this.jdbc = jdbc;
        this.payos = payos;
        this.transactionRepository = transactionRepository;
        this.memberPaymentService = memberPaymentService;
        this.activityLogService = activityLogService;
        this.key = deriveKey(jwtSecret);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void load() {
        jdbc.query("SELECT client_id, api_key, checksum_key FROM payos_settings WHERE id = 1", (RowCallbackHandler) row -> {
            try {
                payos.use(row.getString(1), decrypt(row.getString(2), key), decrypt(row.getString(3), key));
                log.info("PayOS dùng tài khoản BCN cấu hình trên web (client id {})", row.getString(1));
            } catch (GeneralSecurityException | IllegalArgumentException exception) {
                log.warn("Không giải mã được khoá PayOS trong DB (JWT_SECRET đã đổi?): dùng PAYOS_* trong env");
            }
        });
    }

    @Transactional
    public void update(UUID actorId, String clientId, String apiKey, String checksumKey) {
        // Link đang mở thuộc tài khoản cũ: huỷ bằng khoá cũ rồi bỏ, thành viên mở QR lại sẽ nhận link của tài khoản mới.
        for (Transaction transaction : transactionRepository.findAllByPaidFalseAndPayosOrderCodeIsNotNull()) {
            memberPaymentService.cancelLinkQuietly(transaction, "Doi tai khoan nhan");
            transaction.setPayosOrderCode(null);
            transaction.setPayosCheckoutUrl(null);
            transaction.setPayosQrCode(null);
        }
        jdbc.update("""
                INSERT INTO payos_settings (id, client_id, api_key, checksum_key, updated_by, updated_at)
                VALUES (1, ?, ?, ?, ?, now())
                ON CONFLICT (id) DO UPDATE SET client_id = EXCLUDED.client_id, api_key = EXCLUDED.api_key,
                  checksum_key = EXCLUDED.checksum_key, updated_by = EXCLUDED.updated_by, updated_at = now()""",
                clientId.trim(), encrypt(apiKey.trim(), key), encrypt(checksumKey.trim(), key), actorId);
        activityLogService.record(actorId, "UPDATE", "PAYOS_ACCOUNT", actorId,
                ActivityLogService.metadata("clientId", clientId.trim()));
        payos.use(clientId, apiKey, checksumKey);
    }

    static SecretKeySpec deriveKey(String secret) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(("payos-settings:" + secret).getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(hash, "AES");
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(exception);
        }
    }

    /** base64(iv 12 byte + bản mã kèm tag). */
    static String encrypt(String plain, SecretKeySpec key) {
        try {
            byte[] iv = new byte[12];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] sealed = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + sealed.length).put(iv).put(sealed).array());
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Không mã hoá được khoá PayOS", exception);
        }
    }

    static String decrypt(String stored, SecretKeySpec key) throws GeneralSecurityException {
        byte[] bytes = Base64.getDecoder().decode(stored);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, bytes, 0, 12));
        return new String(cipher.doFinal(bytes, 12, bytes.length - 12), StandardCharsets.UTF_8);
    }
}
