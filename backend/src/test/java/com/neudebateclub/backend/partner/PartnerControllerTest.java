package com.neudebateclub.backend.partner;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.OutreachResult;
import com.neudebateclub.backend.common.enums.PartnerStatus;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.security.TestRoleGuards;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PartnerControllerTest {

    private PartnerRepository partnerRepository;
    private CollaborationRepository collaborationRepository;
    private OutreachLogRepository outreachLogRepository;
    private PartnerController controller;
    private UserPrincipal erLead;
    private final UUID partnerId = UUID.randomUUID();
    private final Partner partner = Partner.builder().id(partnerId).companyName("Vinamilk")
            .status(PartnerStatus.DA_HOP_TAC).build();

    @BeforeEach
    void setUp() {
        partnerRepository = mock(PartnerRepository.class);
        collaborationRepository = mock(CollaborationRepository.class);
        outreachLogRepository = mock(OutreachLogRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        controller = new PartnerController(partnerRepository, mock(PartnerContactRepository.class),
                collaborationRepository, outreachLogRepository, mock(EventRepository.class), userRepository,
                TestRoleGuards.withDefaults(), mock(ActivityLogService.class));
        erLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.DOI_NGOAI).active(true).build();
        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(partnerRepository.findAllByOrderByCompanyNameAsc()).thenReturn(List.of(partner));
        when(partnerRepository.findAll()).thenReturn(List.of(partner));
        when(userRepository.getReferenceById(any())).thenReturn(User.builder().fullName("Lan").build());
    }

    private Collaboration collaboration(String status, String amount) {
        return Collaboration.builder().partnerId(partnerId).contractStatus(status)
                .sponsoredAmount(new BigDecimal(amount)).collaborationDate(LocalDate.now().minusMonths(1)).build();
    }

    private OutreachLog log(LocalDate contactDate, LocalDate followUp) {
        return OutreachLog.builder().partnerId(partnerId).contactDate(contactDate).content("Gọi điện")
                .result(OutreachResult.CHO_PHAN_HOI).followUpDate(followUp).build();
    }

    @Test
    void externalRelationsMembersAllowedOtherDepartmentsForbidden() {
        UserPrincipal erMember = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER)
                .department(Department.DOI_NGOAI).active(true).build();
        UserPrincipal eventMember = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.MEMBER)
                .department(Department.SU_KIEN).active(true).build();
        UserPrincipal mediaLead = UserPrincipal.builder().id(UUID.randomUUID()).role(Role.TRUONG_BAN)
                .department(Department.TRUYEN_THONG).active(true).build();
        when(collaborationRepository.findAll()).thenReturn(List.of());
        when(outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc()).thenReturn(List.of());

        assertEquals(1, controller.list(erMember).getBody().getData().size());
        assertThrows(ForbiddenException.class, () -> controller.list(eventMember));
        assertThrows(ForbiddenException.class, () -> controller.list(mediaLead));
    }

    @Test
    void totalsCountOnlySignedContracts() {
        when(collaborationRepository.findAll()).thenReturn(List.of(
                collaboration("da_ky", "20000000"), collaboration("dang_dam_phan", "90000000")));
        when(outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc()).thenReturn(List.of());

        var summary = controller.list(erLead).getBody().getData().get(0);
        assertEquals(1, summary.signedCount());
        assertEquals(new BigDecimal("20000000"), summary.signedTotal());
        assertEquals(new PartnerScore(30 + 25 + 12 + 7, 30, 25, 12, 7), summary.score());
    }

    @Test
    void followUpUsesOnlyLatestContact() {
        LocalDate today = LocalDate.now();
        // Lần mới nhất có hẹn hôm qua → hiện; lần cũ hơn có hẹn đã qua không tính.
        when(outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc()).thenReturn(List.of(
                log(today.minusDays(3), today.minusDays(1)), log(today.minusDays(30), today.minusDays(20))));
        var followUps = controller.followUps(erLead).getBody().getData();
        assertEquals(1, followUps.size());
        assertEquals(today.minusDays(1), followUps.get(0).followUpDate());
        assertEquals("Vinamilk", followUps.get(0).companyName());

        // Đã liên hệ lại (lần mới nhất không hẹn) → hết nhắc.
        when(outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc()).thenReturn(List.of(
                log(today, null), log(today.minusDays(3), today.minusDays(1))));
        assertEquals(List.of(), controller.followUps(erLead).getBody().getData());
    }

    @Test
    void cannotDeletePartnerWithSponsorshipHistory() {
        when(collaborationRepository.existsByPartnerId(partnerId)).thenReturn(true);
        assertThrows(ValidationException.class, () -> controller.delete(partnerId, erLead));
        verify(partnerRepository, never()).delete(any());
    }

    @Test
    void rejectsNonHttpContractLinkAndUnknownStatus() {
        var badLink = new PartnerController.CollaborationRequest(null, "Tài trợ Debate Cup", BigDecimal.TEN,
                "javascript:alert(1)", LocalDate.now(), "vang", "da_ky", null);
        var badStatus = new PartnerController.CollaborationRequest(null, "Tài trợ Debate Cup", BigDecimal.TEN,
                "https://drive.google.com/file/d/abc", LocalDate.now(), "vang", "xong", null);
        assertThrows(ValidationException.class, () -> controller.addCollaboration(partnerId, badLink, erLead));
        assertThrows(ValidationException.class, () -> controller.addCollaboration(partnerId, badStatus, erLead));
        verify(collaborationRepository, never()).save(any());
    }
}
