package com.neudebateclub.backend.notification;

import com.neudebateclub.backend.common.exception.ValidationException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigInteger;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPrivateKeySpec;
import java.security.spec.ECPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.nio.charset.StandardCharsets.US_ASCII;

/**
 * Web Push (RFC 8030) với mã hoá aes128gcm (RFC 8291) và xác thực VAPID (RFC 8292), chỉ dùng JDK + jjwt.
 * Không cấu hình khoá VAPID thì push tắt: thông báo trong app vẫn chạy bình thường.
 */
@Slf4j
@Service
public class PushService {

    private static final int RECORD_SIZE = 4096;
    /** Bản mã phải vừa một bản ghi 4 KB; tiếng Việt tối đa 3 byte/ký tự. */
    private static final int MAX_BODY_CHARS = 500;
    /** Chỉ gửi tới dịch vụ push thật của trình duyệt, tránh biến máy chủ thành công cụ gọi URL tuỳ ý (SSRF). */
    private static final List<String> PUSH_HOSTS = List.of(
            "fcm.googleapis.com", "push.services.mozilla.com", "notify.windows.com", "push.apple.com");
    private static final ECParameterSpec P256 = p256();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PushSubscriptionRepository repository;
    private final ObjectMapper objectMapper;
    private final String publicKey;
    private final PrivateKey privateKey;
    private final String subject;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public PushService(PushSubscriptionRepository repository, ObjectMapper objectMapper,
                       @Value("${app.push.public-key:}") String publicKey,
                       @Value("${app.push.private-key:}") String privateKey,
                       @Value("${app.push.subject:mailto:admin@example.com}") String subject) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.subject = subject;
        boolean enabled = !publicKey.isBlank() && !privateKey.isBlank();
        this.publicKey = enabled ? publicKey.trim() : null;
        try {
            this.privateKey = enabled ? privateKey(decode(privateKey.trim())) : null;
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("VAPID_PRIVATE_KEY không hợp lệ", exception);
        }
        if (!enabled) {
            log.info("Web Push đang tắt: chưa cấu hình VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY");
        }
    }

    /** Khoá công khai VAPID cho trình duyệt; null khi push đang tắt. */
    public String publicKey() {
        return publicKey;
    }

    /** Lưu thiết bị, hoặc cập nhật khoá và người dùng nếu endpoint đã có (đăng nhập/đăng xuất trên cùng máy). */
    public void subscribe(String endpoint, String p256dh, String auth, UUID userId) {
        if (!isPushServiceEndpoint(endpoint)) {
            throw new ValidationException("Endpoint không thuộc dịch vụ thông báo đẩy hợp lệ");
        }
        try {
            publicKey(decode(p256dh));
            if (decode(auth).length != 16) {
                throw new InvalidKeyException("auth must be 16 bytes");
            }
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new ValidationException("Khoá thông báo của thiết bị không hợp lệ");
        }
        PushSubscription subscription = repository.findByEndpoint(endpoint).orElseGet(PushSubscription::new);
        subscription.setEndpoint(endpoint);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        subscription.setUserId(userId);
        repository.save(subscription);
    }

    /** Đẩy các thông báo dashboard vừa lưu tới mọi thiết bị của người nhận, sau khi transaction commit. */
    public void push(List<Notification> notifications) {
        if (privateKey == null || notifications.isEmpty()) {
            return;
        }
        Map<UUID, List<PushSubscription>> byUser = repository.findByUserIdIn(notifications.stream()
                        .map(notification -> notification.getUser().getId())
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.groupingBy(PushSubscription::getUserId));
        List<Map.Entry<PushSubscription, byte[]>> deliveries = new ArrayList<>();
        for (Notification notification : notifications) {
            byte[] payload = payload(notification.getTitle(), notification.getBody(), url(notification));
            byUser.getOrDefault(notification.getUser().getId(), List.of())
                    .forEach(subscription -> deliveries.add(Map.entry(subscription, payload)));
        }
        deliverAfterCommit(deliveries);
    }

    /** Đẩy tới mọi thiết bị đã bật thông báo, kể cả khách. @return số thiết bị */
    public int broadcast(String title, String body, String url) {
        if (privateKey == null) {
            throw new ValidationException("Máy chủ chưa cấu hình khoá VAPID nên chưa gửi được thông báo đẩy");
        }
        byte[] payload = payload(title, body, url);
        List<PushSubscription> subscriptions = repository.findAll();
        deliverAfterCommit(subscriptions.stream().map(subscription -> Map.entry(subscription, payload)).toList());
        return subscriptions.size();
    }

    // Khớp notificationHref ở frontend (src/lib/notifications.ts).
    private static String url(Notification notification) {
        return notification.getType() == NotificationType.TASK_ASSIGNED && notification.getEntityId() != null
                ? "/dashboard/tasks/todo-list?task=" + notification.getEntityId()
                : "/dashboard/notifications/read?id=" + notification.getId();
    }

    private byte[] payload(String title, String body, String url) {
        String shortBody = body.length() > MAX_BODY_CHARS ? body.substring(0, MAX_BODY_CHARS) + "…" : body;
        return objectMapper.writeValueAsBytes(Map.of("title", title, "body", shortBody, "url", url));
    }

    /** Gửi sau commit (không báo điều chưa lưu) và trên virtual thread (không giữ request chờ dịch vụ push). */
    private void deliverAfterCommit(List<Map.Entry<PushSubscription, byte[]>> deliveries) {
        Runnable send = () -> deliveries.forEach(delivery ->
                Thread.ofVirtual().start(() -> deliver(delivery.getKey(), delivery.getValue())));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    private void deliver(PushSubscription subscription, byte[] payload) {
        try {
            URI endpoint = URI.create(subscription.getEndpoint());
            byte[] body = encrypt(payload, decode(subscription.getP256dh()), decode(subscription.getAuth()),
                    newKeyPair(), randomBytes(16));
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofSeconds(15))
                    .header("TTL", "86400")
                    .header("Content-Encoding", "aes128gcm")
                    .header("Content-Type", "application/octet-stream")
                    .header("Authorization", "vapid t=" + vapidJwt(endpoint) + ", k=" + publicKey)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            int status = http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (status == 404 || status == 410) {
                repository.deleteByEndpoint(subscription.getEndpoint()); // thiết bị đã huỷ/thu hồi quyền
            } else if (status >= 400) {
                log.warn("Push tới {} thất bại: HTTP {}", endpoint.getHost(), status);
            }
        } catch (Exception exception) {
            log.warn("Push tới {} thất bại: {}", subscription.getEndpoint(), exception.getMessage());
        }
    }

    String vapidJwt(URI endpoint) {
        return Jwts.builder()
                .audience().single(endpoint.getScheme() + "://" + endpoint.getAuthority())
                .expiration(Date.from(Instant.now().plus(Duration.ofHours(12))))
                .subject(subject)
                .signWith(privateKey, Jwts.SIG.ES256)
                .compact();
    }

    static boolean isPushServiceEndpoint(String endpoint) {
        try {
            URI uri = new URI(endpoint);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && host != null && uri.getPort() == -1
                    && PUSH_HOSTS.stream().anyMatch(allowed -> host.equals(allowed) || host.endsWith("." + allowed));
        } catch (URISyntaxException exception) {
            return false;
        }
    }

    /** RFC 8291 §3.4: một bản ghi aes128gcm duy nhất, khoá công khai của máy chủ nằm trong header. */
    static byte[] encrypt(byte[] plaintext, byte[] uaPublic, byte[] authSecret, KeyPair serverKeys, byte[] salt)
            throws GeneralSecurityException {
        byte[] serverPublic = rawPublicKey((ECPublicKey) serverKeys.getPublic());
        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(serverKeys.getPrivate());
        agreement.doPhase(publicKey(uaPublic), true);
        byte[] ecdhSecret = agreement.generateSecret();

        byte[] keyInfo = concat("WebPush: info\0".getBytes(US_ASCII), uaPublic, serverPublic);
        byte[] ikm = hkdf(authSecret, ecdhSecret, keyInfo, 32);
        byte[] cek = hkdf(salt, ikm, "Content-Encoding: aes128gcm\0".getBytes(US_ASCII), 16);
        byte[] nonce = hkdf(salt, ikm, "Content-Encoding: nonce\0".getBytes(US_ASCII), 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] ciphertext = cipher.doFinal(concat(plaintext, new byte[]{2})); // 0x02 = bản ghi cuối, không đệm

        byte[] header = ByteBuffer.allocate(16 + 4 + 1 + serverPublic.length)
                .put(salt).putInt(RECORD_SIZE).put((byte) serverPublic.length).put(serverPublic)
                .array();
        return concat(header, ciphertext);
    }

    /** HKDF-SHA256; length ≤ 32 nên Expand chỉ cần một vòng. */
    private static byte[] hkdf(byte[] salt, byte[] ikm, byte[] info, int length) throws GeneralSecurityException {
        byte[] prk = hmac(salt, ikm);
        return Arrays.copyOf(hmac(prk, concat(info, new byte[]{1})), length);
    }

    private static byte[] hmac(byte[] key, byte[] data) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    static PublicKey publicKey(byte[] raw) throws GeneralSecurityException {
        if (raw.length != 65 || raw[0] != 4) {
            throw new InvalidKeyException("Expected an uncompressed P-256 point");
        }
        ECPoint point = new ECPoint(new BigInteger(1, Arrays.copyOfRange(raw, 1, 33)),
                new BigInteger(1, Arrays.copyOfRange(raw, 33, 65)));
        return KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, P256));
    }

    static PrivateKey privateKey(byte[] raw) throws GeneralSecurityException {
        return KeyFactory.getInstance("EC").generatePrivate(new ECPrivateKeySpec(new BigInteger(1, raw), P256));
    }

    private static byte[] rawPublicKey(ECPublicKey key) {
        byte[] raw = new byte[65];
        raw[0] = 4;
        copyUnsigned(key.getW().getAffineX(), raw, 1);
        copyUnsigned(key.getW().getAffineY(), raw, 33);
        return raw;
    }

    /** Ghi số nguyên không dấu vào đúng 32 byte (BigInteger có thể thừa byte dấu hoặc thiếu số 0 đầu). */
    private static void copyUnsigned(BigInteger value, byte[] target, int offset) {
        byte[] bytes = value.toByteArray();
        int length = Math.min(bytes.length, 32);
        System.arraycopy(bytes, bytes.length - length, target, offset + 32 - length, length);
    }

    private static KeyPair newKeyPair() throws GeneralSecurityException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(P256);
        return generator.generateKeyPair();
    }

    private static ECParameterSpec p256() {
        try {
            AlgorithmParameters parameters = AlgorithmParameters.getInstance("EC");
            parameters.init(new ECGenParameterSpec("secp256r1"));
            return parameters.getParameterSpec(ECParameterSpec.class);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        RANDOM.nextBytes(bytes);
        return bytes;
    }

    private static byte[] decode(String base64Url) {
        return Base64.getUrlDecoder().decode(base64Url);
    }

    private static byte[] concat(byte[]... parts) {
        ByteBuffer buffer = ByteBuffer.allocate(Arrays.stream(parts).mapToInt(part -> part.length).sum());
        for (byte[] part : parts) {
            buffer.put(part);
        }
        return buffer.array();
    }
}
