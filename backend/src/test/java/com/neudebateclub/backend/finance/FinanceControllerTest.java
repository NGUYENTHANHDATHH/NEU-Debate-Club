package com.neudebateclub.backend.finance;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.enums.TransactionType;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.notification.NotificationService;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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

class FinanceControllerTest {

    private TransactionRepository transactionRepository;
    private EventRepository eventRepository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private MemberPaymentService memberPaymentService;
    private PayosClient payos;
    private FinanceController controller;
    private UserPrincipal financeLead;
    private User financeLeadUser;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        eventRepository = mock(EventRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        payos = mock(PayosClient.class);
        memberPaymentService = new MemberPaymentService(transactionRepository, payos, mock(ActivityLogService.class),
                notificationService, "http://localhost:3000/");
        controller = new FinanceController(transactionRepository, eventRepository, userRepository, TestRoleGuards.withDefaults(),
                mock(ActivityLogService.class), notificationService, memberPaymentService);
        financeLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.DOI_NGOAI).active(true).build();
        financeLeadUser = User.builder().id(financeLead.getId()).fullName("Lê Minh Anh").build();
        when(userRepository.getReferenceById(financeLead.getId())).thenReturn(financeLeadUser);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction transaction = invocation.getArgument(0);
            transaction.setId(UUID.randomUUID());
            return transaction;
        });
    }

    private FinanceController.TransactionRequest request(TransactionType type, String category, UUID eventId) {
        return new FinanceController.TransactionRequest(type, new BigDecimal("1500000.00"), " Thuê hội trường ",
                category, eventId, null, null, LocalDate.parse("2026-11-10"));
    }

    @Test
    void createsTransactionWithEventAndTrimmedFields() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(Event.builder().id(eventId).title("Debate Night").build()));

        var response = controller.create(request(TransactionType.EXPENSE, " Địa điểm ", eventId), financeLead);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertEquals(201, response.getStatusCode().value());
        assertEquals("Thuê hội trường", captor.getValue().getDescription());
        assertEquals("Địa điểm", captor.getValue().getCategory());
        assertEquals("Debate Night", response.getBody().getData().eventTitle());
        assertEquals("Lê Minh Anh", response.getBody().getData().createdByName());
    }

    @Test
    void blankCategoryBecomesNull() {
        controller.create(request(TransactionType.INCOME, "   ", null), financeLead);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertNull(captor.getValue().getCategory());
        assertNull(captor.getValue().getEvent());
    }

    @Test
    void rejectsTransferBecauseDbEnumLacksIt() {
        assertThrows(ValidationException.class,
                () -> controller.create(request(TransactionType.TRANSFER, null, null), financeLead));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void rejectsUnknownEvent() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> controller.create(request(TransactionType.EXPENSE, null, eventId), financeLead));
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void forbidsLeadOfOtherDepartment() {
        UserPrincipal mediaLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.TRUYEN_THONG).active(true).build();

        assertThrows(ForbiddenException.class, () -> controller.list(mediaLead));
        assertThrows(ForbiddenException.class,
                () -> controller.create(request(TransactionType.INCOME, null, null), mediaLead));
    }

    private UserPrincipal eventLead() {
        UserPrincipal lead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.SU_KIEN).active(true).build();
        when(userRepository.getReferenceById(lead.getId())).thenReturn(User.builder().id(lead.getId()).build());
        return lead;
    }

    @Test
    void eventLeadListsOnlyEventLinkedTransactions() {
        UserPrincipal lead = eventLead();
        when(transactionRepository.findAllByEventIsNotNullOrderByTransactionDateDescCreatedAtDesc()).thenReturn(List.of());

        controller.list(lead);

        verify(transactionRepository).findAllByEventIsNotNullOrderByTransactionDateDescCreatedAtDesc();
        verify(transactionRepository, never()).findAllByOrderByTransactionDateDescCreatedAtDesc();
    }

    @Test
    void financeLeadStillListsEverything() {
        when(transactionRepository.findAllByOrderByTransactionDateDescCreatedAtDesc()).thenReturn(List.of());

        controller.list(financeLead);

        verify(transactionRepository).findAllByOrderByTransactionDateDescCreatedAtDesc();
    }

    @Test
    void eventLeadCreatesEventTransactionButNotGeneralOne() {
        UserPrincipal lead = eventLead();
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId))
                .thenReturn(Optional.of(Event.builder().id(eventId).title("Debate Night").build()));

        assertEquals(201, controller.create(request(TransactionType.EXPENSE, null, eventId), lead)
                .getStatusCode().value());
        assertThrows(ForbiddenException.class,
                () -> controller.create(request(TransactionType.EXPENSE, null, null), lead));
    }

    @Test
    void eventLeadDeletesOnlyEventLinkedTransactions() {
        UserPrincipal lead = eventLead();
        UUID linkedId = UUID.randomUUID();
        UUID generalId = UUID.randomUUID();
        Transaction linked = Transaction.builder().id(linkedId).type(TransactionType.EXPENSE)
                .event(Event.builder().id(UUID.randomUUID()).build()).build();
        Transaction general = Transaction.builder().id(generalId).type(TransactionType.EXPENSE).build();
        when(transactionRepository.findById(linkedId)).thenReturn(Optional.of(linked));
        when(transactionRepository.findById(generalId)).thenReturn(Optional.of(general));

        controller.delete(linkedId, lead);
        verify(transactionRepository).delete(linked);
        assertThrows(ForbiddenException.class, () -> controller.delete(generalId, lead));
        verify(transactionRepository, never()).delete(general);
    }

    @Test
    void deleteMissingTransactionIsNotFound() {
        UUID id = UUID.randomUUID();
        when(transactionRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> controller.delete(id, financeLead));
        verify(transactionRepository, never()).delete(any());
    }

    @Test
    void importSavesEveryRowAndStopsOnForbiddenRow() {
        var ok = controller.importAll(new FinanceController.ImportRequest(List.of(
                request(TransactionType.INCOME, null, null), request(TransactionType.EXPENSE, "Địa điểm", null))), financeLead);
        assertEquals(2, ok.getBody().getData().size());

        UserPrincipal lead = eventLead();
        assertThrows(ForbiddenException.class, () -> controller.importAll(new FinanceController.ImportRequest(List.of(
                request(TransactionType.INCOME, null, null))), lead));
    }

    @Test
    void linksMemberAndRejectsUnknownMember() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Trần Bình").build();
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        var dues = new FinanceController.TransactionRequest(TransactionType.INCOME, new BigDecimal("200000"),
                "Đóng quỹ", "Quỹ thành viên", null, member.getId(), null, LocalDate.parse("2026-11-10"));

        var response = controller.create(dues, financeLead);
        assertEquals(member.getId(), response.getBody().getData().memberId());
        assertEquals("Trần Bình", response.getBody().getData().memberName());

        UUID unknown = UUID.randomUUID();
        when(userRepository.findById(unknown)).thenReturn(Optional.empty());
        var bad = new FinanceController.TransactionRequest(TransactionType.INCOME, new BigDecimal("200000"),
                "Đóng quỹ", null, null, unknown, null, LocalDate.parse("2026-11-10"));
        assertThrows(ResourceNotFoundException.class, () -> controller.create(bad, financeLead));
    }

    @Test
    void mineListsOnlyCallersOwnTransactions() {
        UserPrincipal member = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER)
                .department(Department.TRUYEN_THONG).active(true).build();
        when(transactionRepository.findAllByMemberIdOrderByTransactionDateDescCreatedAtDesc(member.getId()))
                .thenReturn(List.of());

        controller.mine(member);

        verify(transactionRepository).findAllByMemberIdOrderByTransactionDateDescCreatedAtDesc(member.getId());
        assertThrows(ForbiddenException.class, () -> controller.members(member));
    }

    private FinanceController.TransactionRequest charge(UUID memberId, UUID eventId, TransactionType type) {
        return new FinanceController.TransactionRequest(type, new BigDecimal("200000"), "Quỹ 2026", "Quỹ thành viên",
                eventId, memberId, false, LocalDate.parse("2026-11-01"));
    }

    @Test
    void unpaidChargeIsSavedAndNotifiedButMustBeMemberIncomeWithoutEvent() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Trần Bình").build();
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));

        var response = controller.create(charge(member.getId(), null, TransactionType.INCOME), financeLead);
        assertEquals(false, response.getBody().getData().paid());
        ArgumentCaptor<List<Transaction>> notified = ArgumentCaptor.captor();
        verify(notificationService).notifyMemberTransactions(notified.capture(), org.mockito.ArgumentMatchers.eq(financeLead.getId()));
        assertEquals(1, notified.getValue().size());

        assertThrows(ValidationException.class, () -> controller.create(charge(null, null, TransactionType.INCOME), financeLead));
        assertThrows(ValidationException.class,
                () -> controller.create(charge(member.getId(), null, TransactionType.EXPENSE), financeLead));
        assertThrows(ValidationException.class,
                () -> controller.create(charge(member.getId(), UUID.randomUUID(), TransactionType.INCOME), financeLead));
    }

    @Test
    void markPaidCountsChargeAndRejectsAlreadyPaid() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Trần Bình").build();
        Transaction unpaid = Transaction.builder().id(UUID.randomUUID()).type(TransactionType.INCOME).amount(new BigDecimal("200000"))
                .description("Quỹ 2026").member(member).paid(false).transactionDate(LocalDate.parse("2026-01-01")).build();
        when(transactionRepository.findById(unpaid.getId())).thenReturn(Optional.of(unpaid));

        var response = controller.markPaid(unpaid.getId(), financeLead);

        assertEquals(true, response.getBody().getData().paid());
        assertEquals(false, unpaid.getTransactionDate().equals(LocalDate.parse("2026-01-01")));
        verify(notificationService).notifyMemberTransactions(List.of(unpaid), financeLead.getId());
        assertThrows(ValidationException.class, () -> controller.markPaid(unpaid.getId(), financeLead));
    }

    @Test
    void payosEndpointsOnlyForTheChargedMember() {
        User member = User.builder().id(UUID.randomUUID()).fullName("Trần Bình").build();
        Transaction unpaid = Transaction.builder().id(UUID.randomUUID()).type(TransactionType.INCOME).amount(new BigDecimal("200000"))
                .description("Quỹ 2026").member(member).paid(false).build();
        when(transactionRepository.findById(unpaid.getId())).thenReturn(Optional.of(unpaid));

        assertThrows(ForbiddenException.class, () -> controller.payosLink(unpaid.getId(), financeLead));
        UserPrincipal self = UserPrincipal.builder().id(member.getId()).role(Role.MEMBER)
                .department(Department.TRUYEN_THONG).active(true).build();
        assertEquals(false, controller.payosRefresh(unpaid.getId(), self).getBody().getData());
    }
}
