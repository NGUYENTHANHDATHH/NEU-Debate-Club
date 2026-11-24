package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tài khoản PayOS nhận tiền QR. Chỉ BCN: đổi tài khoản là đổi nơi tiền quỹ chảy về. Không bao giờ trả khoá bí mật. */
@RestController
@RequestMapping("/finance/payos-account")
@RequiredArgsConstructor
public class PayosSettingsController {

    private final PayosClient payos;
    private final PayosSettingsService payosSettingsService;
    private final RoleGuard roleGuard;

    public record PayosAccount(boolean enabled, String clientId) {}

    public record PayosAccountRequest(
            @NotBlank @Size(max = 200) String clientId,
            @NotBlank @Size(max = 200) String apiKey,
            @NotBlank @Size(max = 200) String checksumKey) {}

    @GetMapping
    public ResponseEntity<ApiResponse<PayosAccount>> get(@CurrentUser UserPrincipal currentUser) {
        roleGuard.requireBCN(currentUser);
        return ResponseEntity.ok(ApiResponse.success(new PayosAccount(payos.enabled(), payos.clientId())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<PayosAccount>> update(@CurrentUser UserPrincipal currentUser,
                                                            @Valid @RequestBody PayosAccountRequest request) {
        roleGuard.requireBCN(currentUser);
        payosSettingsService.update(currentUser.getId(), request.clientId(), request.apiKey(), request.checksumKey());
        return ResponseEntity.ok(ApiResponse.success(new PayosAccount(payos.enabled(), payos.clientId())));
    }
}
