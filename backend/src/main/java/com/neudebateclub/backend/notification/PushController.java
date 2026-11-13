package com.neudebateclub.backend.notification;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Đăng ký thiết bị nhận thông báo đẩy. Mở cho cả khách để nhận thông báo sự kiện của landing page. */
@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
public class PushController {

    private final PushService pushService;

    /** Khoá công khai VAPID; {@code null} = máy chủ chưa bật thông báo đẩy. */
    @GetMapping("/public-key")
    public ResponseEntity<ApiResponse<String>> publicKey() {
        return ResponseEntity.ok(ApiResponse.success(pushService.publicKey()));
    }

    /** Body = {@code PushSubscription.toJSON()} của trình duyệt. Gắn với người đang đăng nhập, không có token = khách. */
    @PostMapping("/subscriptions")
    public ResponseEntity<ApiResponse<Void>> subscribe(
            @Valid @RequestBody SubscriptionRequest request,
            @CurrentUser UserPrincipal currentUser) {
        pushService.subscribe(request.endpoint(), request.keys().p256dh(), request.keys().auth(),
                currentUser == null ? null : currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã bật thông báo", null));
    }

    public record SubscriptionRequest(@NotBlank @Size(max = 1000) String endpoint, @NotNull @Valid Keys keys) {}

    public record Keys(@NotBlank @Size(max = 200) String p256dh, @NotBlank @Size(max = 100) String auth) {}
}
