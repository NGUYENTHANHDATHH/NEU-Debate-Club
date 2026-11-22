package com.neudebateclub.backend.finance;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * PayOS gọi khi có tiền vào. Khai báo URL https://&lt;domain&gt;/api/public/payos/webhook trong my.payos.vn
 * (Kênh thanh toán → Webhook). Không cần đăng nhập; an toàn nhờ chữ ký HMAC bằng checksum key.
 */
@RestController
@RequiredArgsConstructor
public class PayosWebhookController {

    private final MemberPaymentService memberPaymentService;

    @PostMapping("/public/payos/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String body) {
        return memberPaymentService.handleWebhook(body) ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }
}
