package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.common.enums.TransactionType;
import com.neudebateclub.backend.notification.NotificationService;
import com.neudebateclub.backend.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MemberPaymentServiceTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private TransactionRepository repository;
    private PayosClient payos;
    private NotificationService notificationService;
    private MemberPaymentService service;
    private User member;

    @BeforeEach
    void setUp() {
        repository = mock(TransactionRepository.class);
        payos = mock(PayosClient.class);
        notificationService = mock(NotificationService.class);
        service = new MemberPaymentService(repository, payos, mock(ActivityLogService.class), notificationService,
                "https://ndc.example/");
        member = User.builder().id(UUID.randomUUID()).fullName("Trần Bình").build();
        when(payos.enabled()).thenReturn(true);
    }

    private Transaction charge(Long orderCode, String amount) {
        return Transaction.builder().id(UUID.randomUUID()).type(TransactionType.INCOME).amount(new BigDecimal(amount))
                .description("Quỹ 2026").member(member).paid(false).payosOrderCode(orderCode)
                .transactionDate(LocalDate.parse("2026-01-01")).build();
    }

    private ObjectNode status(String value) {
        return json.createObjectNode().put("status", value);
    }

    @Test
    void createsLinkWithSequenceOrderCodeAndReturnUrl() {
        Transaction tx = charge(null, "200000.00");
        when(repository.nextPayosOrderCode()).thenReturn(100001L);
        when(payos.create(eq(100001L), eq(200000L), anyString(), anyString(), anyString()))
                .thenReturn(json.createObjectNode().put("qrCode", "000201VIETQR").put("checkoutUrl", "https://pay.payos.vn/x"));

        var link = service.link(tx);

        assertEquals("000201VIETQR", link.qrCode());
        assertEquals(100001L, tx.getPayosOrderCode());
        verify(payos).create(100001L, 200000L, "NDCQUY",
                "https://ndc.example/dashboard/tools/finance?pay=" + tx.getId(), "https://ndc.example/dashboard/tools/finance");
    }

    @Test
    void reusesPendingLinkAndReplacesExpiredOne() {
        Transaction pending = charge(5L, "200000");
        pending.setPayosQrCode("OLDQR");
        when(payos.get(5L)).thenReturn(status("PENDING"));
        assertEquals("OLDQR", service.link(pending).qrCode());

        Transaction expired = charge(6L, "200000");
        when(payos.get(6L)).thenReturn(status("EXPIRED"));
        when(repository.nextPayosOrderCode()).thenReturn(7L);
        when(payos.create(eq(7L), anyLong(), anyString(), anyString(), anyString()))
                .thenReturn(json.createObjectNode().put("qrCode", "NEWQR"));
        assertEquals("NEWQR", service.link(expired).qrCode());
        assertEquals(7L, expired.getPayosOrderCode());
    }

    @Test
    void refreshSettlesWhenPayosSaysPaid() {
        Transaction tx = charge(9L, "200000");
        when(payos.get(9L)).thenReturn(status("PAID"));

        assertTrue(service.refresh(tx));
        assertTrue(tx.isPaid());
        verify(notificationService).notifyMemberTransactions(List.of(tx), null);
        // Đã thu rồi thì không hỏi lại PayOS.
        assertTrue(service.refresh(tx));
        verify(payos).get(9L);
    }

    @Test
    void webhookSettlesMatchingChargeOnlyWhenAmountMatches() {
        when(payos.verifiedWebhookData("ok")).thenReturn(json.createObjectNode().put("code", "00").put("orderCode", 11).put("amount", 200000));
        when(payos.verifiedWebhookData("wrong")).thenReturn(json.createObjectNode().put("code", "00").put("orderCode", 12).put("amount", 1000));
        Transaction ok = charge(11L, "200000.00");
        Transaction wrong = charge(12L, "200000.00");
        when(repository.findByPayosOrderCode(11L)).thenReturn(Optional.of(ok));
        when(repository.findByPayosOrderCode(12L)).thenReturn(Optional.of(wrong));

        assertTrue(service.handleWebhook("ok"));
        assertTrue(ok.isPaid());
        assertTrue(service.handleWebhook("wrong"));
        assertFalse(wrong.isPaid());
        assertFalse(service.handleWebhook("bad signature"));
    }

    @Test
    void manualSettleCancelsOpenPayosLink() {
        Transaction tx = charge(20L, "200000");

        service.settle(tx, UUID.randomUUID(), "MARK_PAID");

        assertTrue(tx.isPaid());
        verify(payos).cancel(eq(20L), anyString());
        service.cancelLinkQuietly(tx, "x");
        verify(payos, never()).cancel(eq(20L), eq("x"));
    }
}
