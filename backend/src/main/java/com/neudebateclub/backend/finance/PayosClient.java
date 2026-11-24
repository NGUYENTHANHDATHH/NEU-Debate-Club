package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.common.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * Gọi API link thanh toán PayOS và kiểm tra chữ ký webhook (https://payos.vn/docs/api/).
 * Tự viết thay vì SDK payos-java vì SDK kéo Jackson 2 vào dự án đang dùng Jackson 3.
 */
@Slf4j
@Component
public class PayosClient {

    private static final String PAYMENT_REQUESTS = "https://api-merchant.payos.vn/v2/payment-requests";

    private final ObjectMapper objectMapper;
    private record Keys(String clientId, String apiKey, String checksumKey) {
        Keys {
            clientId = clientId.trim();
            apiKey = apiKey.trim();
            checksumKey = checksumKey.trim();
        }
    }

    /** Đọc một lần mỗi lệnh gọi; BCN đổi tài khoản lúc đang chạy qua {@link #use}. */
    private volatile Keys keys;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public PayosClient(ObjectMapper objectMapper,
                       @Value("${app.payos.client-id:}") String clientId,
                       @Value("${app.payos.api-key:}") String apiKey,
                       @Value("${app.payos.checksum-key:}") String checksumKey) {
        this.objectMapper = objectMapper;
        this.keys = new Keys(clientId, apiKey, checksumKey);
        if (!enabled()) {
            log.info("Thanh toán PayOS đang tắt: chưa cấu hình PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY");
        }
    }

    public boolean enabled() {
        Keys current = keys;
        return !current.clientId().isEmpty() && !current.apiKey().isEmpty() && !current.checksumKey().isEmpty();
    }

    /** Chuyển sang tài khoản PayOS khác (PayosSettingsService). */
    public void use(String clientId, String apiKey, String checksumKey) {
        keys = new Keys(clientId, apiKey, checksumKey);
    }

    public String clientId() {
        return keys.clientId();
    }

    /** Tạo link thanh toán; trả `data` của PayOS (qrCode, checkoutUrl, status...). */
    public JsonNode create(long orderCode, long amount, String description, String returnUrl, String cancelUrl) {
        // Chữ ký tạo link: đúng 5 trường này, theo thứ tự chữ cái.
        String signature = hmac("amount=" + amount + "&cancelUrl=" + cancelUrl + "&description=" + description
                + "&orderCode=" + orderCode + "&returnUrl=" + returnUrl);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("returnUrl", returnUrl);
        body.put("cancelUrl", cancelUrl);
        body.put("signature", signature);
        return call("POST", PAYMENT_REQUESTS, body);
    }

    /** Thông tin link; `status` là PENDING, PAID, CANCELLED, EXPIRED... */
    public JsonNode get(long orderCode) {
        return call("GET", PAYMENT_REQUESTS + "/" + orderCode, null);
    }

    public void cancel(long orderCode, String reason) {
        call("POST", PAYMENT_REQUESTS + "/" + orderCode + "/cancel", Map.of("cancellationReason", reason));
    }

    /** `data` của webhook nếu chữ ký đúng; null nếu sai, thiếu, hoặc body không phải JSON. */
    public JsonNode verifiedWebhookData(String rawBody) {
        if (!enabled()) return null;
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            JsonNode data = root.path("data");
            if (!data.isObject()) return null;
            byte[] expected = sign(data).getBytes(StandardCharsets.UTF_8);
            byte[] actual = root.path("signature").asString("").getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, actual) ? data : null;
        } catch (JacksonException exception) {
            return null;
        }
    }

    /**
     * Chữ ký dữ liệu webhook: key=value nối bằng &amp;, key theo thứ tự chữ cái, null thành chuỗi rỗng
     * (https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature).
     */
    String sign(JsonNode data) {
        TreeMap<String, String> sorted = new TreeMap<>();
        data.properties().forEach(field -> {
            JsonNode value = field.getValue();
            sorted.put(field.getKey(), value.isNull() ? "" : value.isValueNode() ? value.asString() : value.toString());
        });
        StringBuilder query = new StringBuilder();
        sorted.forEach((key, value) -> query.append(query.isEmpty() ? "" : "&").append(key).append('=').append(value));
        return hmac(query.toString());
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keys.checksumKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Không tạo được chữ ký PayOS", exception);
        }
    }

    private JsonNode call(String method, String url, Object body) {
        if (!enabled()) {
            throw new ValidationException("CLB chưa cấu hình PayOS nên chưa thanh toán online được");
        }
        Keys current = keys;
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("x-client-id", current.clientId())
                .header("x-api-key", current.apiKey())
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();
        HttpResponse<String> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException exception) {
            log.warn("Không gọi được PayOS {} {}", method, url, exception);
            throw new ValidationException("Không kết nối được PayOS, thử lại sau ít phút");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ValidationException("Yêu cầu tới PayOS bị gián đoạn");
        }
        JsonNode json;
        try {
            json = objectMapper.readTree(response.body());
        } catch (JacksonException exception) {
            json = objectMapper.createObjectNode();
        }
        if (response.statusCode() / 100 != 2 || !"00".equals(json.path("code").asString())) {
            log.warn("PayOS {} {} → HTTP {} {}", method, url, response.statusCode(), response.body());
            throw new ValidationException("PayOS từ chối yêu cầu: " + json.path("desc").asString("lỗi không rõ"));
        }
        return json.path("data");
    }
}
