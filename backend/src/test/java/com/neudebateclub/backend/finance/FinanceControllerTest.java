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
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private FinanceController controller;
    private UserPrincipal financeLead;
    private User financeLeadUser;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        eventRepository = mock(EventRepository.class);
        userRepository = mock(UserRepository.class);
        controller = new FinanceController(transactionRepository, eventRepository, userRepository, new RoleGuard(),
                mock(ActivityLogService.class));
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
                category, eventId, LocalDate.parse("2026-11-10"));
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

    @Test
    void deleteMissingTransactionIsNotFound() {
        UUID id = UUID.randomUUID();
        when(transactionRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> controller.delete(id, financeLead));
        verify(transactionRepository, never()).delete(any());
    }
}
