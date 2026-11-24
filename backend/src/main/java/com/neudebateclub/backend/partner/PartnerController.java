package com.neudebateclub.backend.partner;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.OutreachResult;
import com.neudebateclub.backend.common.enums.PartnerStatus;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.event.Event;
import com.neudebateclub.backend.event.EventRepository;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Nhà tài trợ (Ban Đối ngoại, module SPONSORS): hồ sơ, người liên hệ, lịch sử tài trợ, nhật ký liên hệ. */
@RestController
@RequestMapping("/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerRepository partnerRepository;
    private final PartnerContactRepository contactRepository;
    private final CollaborationRepository collaborationRepository;
    private final OutreachLogRepository outreachLogRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;

    /** Mọi nhà tài trợ kèm số liệu đã ký và điểm tiềm năng (tab "Tiềm năng" chỉ sắp xếp lại). */
    @GetMapping
    @Transactional
    public ResponseEntity<ApiResponse<List<PartnerSummary>>> list(@CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        // shortcut: tính trong bộ nhớ trên mọi dòng, đủ cho vài trăm nhà tài trợ; nhiều hơn thì gom bằng SQL.
        Map<UUID, List<Collaboration>> signed = collaborationRepository.findAll().stream()
                .filter(Collaboration::isSigned)
                .collect(Collectors.groupingBy(Collaboration::getPartnerId));
        Map<UUID, List<OutreachLog>> logs = outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc().stream()
                .collect(Collectors.groupingBy(OutreachLog::getPartnerId));
        Map<UUID, BigDecimal> totals = new HashMap<>();
        signed.forEach((id, rows) -> totals.put(id, rows.stream()
                .map(Collaboration::getSponsoredAmount).reduce(BigDecimal.ZERO, BigDecimal::add)));
        BigDecimal max = totals.values().stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        LocalDate today = LocalDate.now();

        return ResponseEntity.ok(ApiResponse.success(partnerRepository.findAllByOrderByCompanyNameAsc().stream()
                .map(partner -> {
                    List<Collaboration> rows = signed.getOrDefault(partner.getId(), List.of());
                    List<OutreachLog> partnerLogs = logs.getOrDefault(partner.getId(), List.of());
                    BigDecimal total = totals.getOrDefault(partner.getId(), BigDecimal.ZERO);
                    LocalDate last = rows.stream().map(Collaboration::getCollaborationDate)
                            .max(Comparator.naturalOrder()).orElse(null);
                    long agreed = partnerLogs.stream().filter(log -> log.getResult() == OutreachResult.DONG_Y).count();
                    long declined = partnerLogs.stream().filter(log -> log.getResult() == OutreachResult.TU_CHOI).count();
                    return new PartnerSummary(partner.getId(), partner.getCompanyName(), partner.getField(),
                            partner.getLogoUrl(), partner.getStatus(), partner.getNotes(), rows.size(), total, last,
                            partnerLogs.isEmpty() ? null : partnerLogs.get(0).getContactDate(),
                            PartnerScore.of(last, total, max, rows.size(), agreed, declined, today));
                })
                .toList()));
    }

    /** Lần liên hệ gần nhất của mỗi nhà tài trợ có hẹn liên hệ lại đến hạn. Ghi một lần liên hệ mới là xoá khỏi danh sách. */
    @GetMapping("/follow-ups")
    @Transactional
    public ResponseEntity<ApiResponse<List<FollowUp>>> followUps(@CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        LocalDate today = LocalDate.now();
        Map<UUID, String> names = partnerRepository.findAll().stream()
                .collect(Collectors.toMap(Partner::getId, Partner::getCompanyName));
        return ResponseEntity.ok(ApiResponse.success(outreachLogRepository.findAllByOrderByContactDateDescCreatedAtDesc()
                .stream()
                .collect(Collectors.toMap(OutreachLog::getPartnerId, Function.identity(), (newest, older) -> newest))
                .values().stream()
                .filter(log -> log.getFollowUpDate() != null && !log.getFollowUpDate().isAfter(today))
                .sorted(Comparator.comparing(OutreachLog::getFollowUpDate))
                .map(log -> new FollowUp(log.getPartnerId(), names.get(log.getPartnerId()), log.getFollowUpDate(),
                        log.getContent(), log.getCreatedBy() == null ? null : log.getCreatedBy().getFullName()))
                .toList()));
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<PartnerDetail>> get(@PathVariable UUID id, @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        return ResponseEntity.ok(ApiResponse.success(new PartnerDetail(
                partner.getId(), partner.getCompanyName(), partner.getField(), partner.getLogoUrl(),
                partner.getStatus(), partner.getNotes(),
                contactRepository.findAllByPartnerIdOrderByPrimaryDescFullNameAsc(id).stream()
                        .map(ContactResponse::from).toList(),
                collaborationRepository.findAllByPartnerIdOrderByCollaborationDateDesc(id).stream()
                        .map(CollaborationResponse::from).toList(),
                outreachLogRepository.findAllByPartnerIdOrderByContactDateDescCreatedAtDesc(id).stream()
                        .map(OutreachResponse::from).toList())));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<UUID>> create(@Valid @RequestBody PartnerRequest request,
                                                    @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = new Partner();
        partner.setCreatedBy(userRepository.getReferenceById(currentUser.getId()));
        apply(partner, request);
        Partner saved = partnerRepository.save(partner);
        record(currentUser, "CREATE", saved, "name", saved.getCompanyName());
        return ResponseEntity.status(201).body(ApiResponse.success("Đã thêm nhà tài trợ", saved.getId()));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> update(@PathVariable UUID id, @Valid @RequestBody PartnerRequest request,
                                                    @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        apply(partner, request);
        record(currentUser, "UPDATE", partner, "name", partner.getCompanyName());
        return ResponseEntity.ok(ApiResponse.success("Đã lưu nhà tài trợ", null));
    }

    /** Không xoá nhà tài trợ còn lịch sử tài trợ, để không mất hồ sơ hợp đồng (DB cũng chặn: ON DELETE RESTRICT). */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        if (collaborationRepository.existsByPartnerId(id)) {
            throw new ValidationException("Nhà tài trợ còn lịch sử tài trợ, hãy xoá các lần tài trợ trước");
        }
        partnerRepository.delete(partner);
        record(currentUser, "DELETE", partner, "name", partner.getCompanyName());
        return ResponseEntity.ok(ApiResponse.success("Đã xoá nhà tài trợ", null));
    }

    @PostMapping("/{id}/contacts")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> addContact(@PathVariable UUID id, @Valid @RequestBody ContactRequest request,
                                                        @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        contactRepository.save(PartnerContact.builder()
                .partnerId(id)
                .fullName(request.fullName().trim())
                .position(blankToNull(request.position()))
                .phone(blankToNull(request.phone()))
                .email(blankToNull(request.email()))
                .primary(Boolean.TRUE.equals(request.primary()))
                .build());
        record(currentUser, "ADD_CONTACT", partner, "contact", request.fullName().trim());
        return ResponseEntity.status(201).body(ApiResponse.success("Đã thêm người liên hệ", null));
    }

    @DeleteMapping("/{id}/contacts/{contactId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteContact(@PathVariable UUID id, @PathVariable UUID contactId,
                                                           @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        PartnerContact contact = contactRepository.findById(contactId)
                .filter(row -> row.getPartnerId().equals(id))
                .orElseThrow(() -> new ResourceNotFoundException("PartnerContact", contactId.toString()));
        contactRepository.delete(contact);
        record(currentUser, "DELETE_CONTACT", partner, "contact", contact.getFullName());
        return ResponseEntity.ok(ApiResponse.success("Đã xoá người liên hệ", null));
    }

    @PostMapping("/{id}/collaborations")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> addCollaboration(@PathVariable UUID id,
                                                              @Valid @RequestBody CollaborationRequest request,
                                                              @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        String tier = blankToNull(request.tier());
        if (tier != null && !Collaboration.TIERS.contains(tier)) {
            throw new ValidationException("Hạng tài trợ không hợp lệ");
        }
        if (!Collaboration.CONTRACT_STATUSES.contains(request.contractStatus())) {
            throw new ValidationException("Tình trạng hợp đồng không hợp lệ");
        }
        String link = blankToNull(request.mouLink());
        if (link != null && !isHttpUrl(link)) {
            throw new ValidationException("Link hợp đồng phải là http(s)");
        }
        Event event = request.eventId() == null ? null : eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId().toString()));
        collaborationRepository.save(Collaboration.builder()
                .partnerId(id)
                .event(event)
                .description(request.description().trim())
                .sponsoredAmount(request.sponsoredAmount())
                .mouLink(link)
                .collaborationDate(request.collaborationDate())
                .tier(tier)
                .contractStatus(request.contractStatus())
                .benefitsCommitted(blankToNull(request.benefitsCommitted()))
                .createdBy(userRepository.getReferenceById(currentUser.getId()))
                .build());
        record(currentUser, "ADD_COLLABORATION", partner, "amount", request.sponsoredAmount(),
                "description", request.description().trim());
        return ResponseEntity.status(201).body(ApiResponse.success("Đã thêm lần tài trợ", null));
    }

    @DeleteMapping("/{id}/collaborations/{collaborationId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteCollaboration(@PathVariable UUID id, @PathVariable UUID collaborationId,
                                                                 @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        Collaboration collaboration = collaborationRepository.findById(collaborationId)
                .filter(row -> row.getPartnerId().equals(id))
                .orElseThrow(() -> new ResourceNotFoundException("Collaboration", collaborationId.toString()));
        collaborationRepository.delete(collaboration);
        record(currentUser, "DELETE_COLLABORATION", partner, "amount", collaboration.getSponsoredAmount(),
                "description", collaboration.getDescription());
        return ResponseEntity.ok(ApiResponse.success("Đã xoá lần tài trợ", null));
    }

    @PostMapping("/{id}/outreach")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> addOutreach(@PathVariable UUID id, @Valid @RequestBody OutreachRequest request,
                                                         @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        if (request.followUpDate() != null && request.followUpDate().isBefore(request.contactDate())) {
            throw new ValidationException("Ngày liên hệ lại phải sau ngày liên hệ");
        }
        outreachLogRepository.save(OutreachLog.builder()
                .partnerId(id)
                .contactDate(request.contactDate())
                .method(request.method().trim())
                .content(request.content().trim())
                .result(request.result())
                .followUpDate(request.followUpDate())
                .createdBy(userRepository.getReferenceById(currentUser.getId()))
                .build());
        record(currentUser, "ADD_OUTREACH", partner, "result", request.result());
        return ResponseEntity.status(201).body(ApiResponse.success("Đã ghi lần liên hệ", null));
    }

    @DeleteMapping("/{id}/outreach/{logId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteOutreach(@PathVariable UUID id, @PathVariable UUID logId,
                                                            @CurrentUser UserPrincipal currentUser) {
        requireAccess(currentUser);
        Partner partner = find(id);
        OutreachLog log = outreachLogRepository.findById(logId)
                .filter(row -> row.getPartnerId().equals(id))
                .orElseThrow(() -> new ResourceNotFoundException("OutreachLog", logId.toString()));
        outreachLogRepository.delete(log);
        record(currentUser, "DELETE_OUTREACH", partner, "result", log.getResult());
        return ResponseEntity.ok(ApiResponse.success("Đã xoá lần liên hệ", null));
    }

    private void requireAccess(UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.SPONSORS);
    }

    private Partner find(UUID id) {
        return partnerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Partner", id.toString()));
    }

    private void apply(Partner partner, PartnerRequest request) {
        String logo = blankToNull(request.logoUrl());
        if (logo != null && !isHttpUrl(logo)) {
            throw new ValidationException("Link logo phải là http(s)");
        }
        partner.setCompanyName(request.companyName().trim());
        partner.setField(blankToNull(request.field()));
        partner.setLogoUrl(logo);
        partner.setStatus(request.status());
        partner.setNotes(blankToNull(request.notes()));
    }

    private void record(UserPrincipal currentUser, String action, Partner partner, Object... metadata) {
        activityLogService.record(currentUser.getId(), action, "PARTNER", partner.getId(),
                ActivityLogService.metadata(metadata));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean isHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public record PartnerRequest(
            @NotBlank @Size(max = 255) String companyName,
            @Size(max = 100) String field,
            @Size(max = 2000) String logoUrl,
            @NotNull PartnerStatus status,
            @Size(max = 5000) String notes) {
    }

    public record ContactRequest(
            @NotBlank @Size(max = 255) String fullName,
            @Size(max = 100) String position,
            @Size(max = 20) String phone,
            @Email @Size(max = 255) String email,
            Boolean primary) {
    }

    public record CollaborationRequest(
            UUID eventId,
            @NotBlank @Size(max = 500) String description,
            @NotNull @DecimalMin("0.00") @Digits(integer = 13, fraction = 2) BigDecimal sponsoredAmount,
            @Size(max = 2000) String mouLink,
            @NotNull LocalDate collaborationDate,
            String tier,
            @NotBlank String contractStatus,
            @Size(max = 5000) String benefitsCommitted) {
    }

    public record OutreachRequest(
            @NotNull LocalDate contactDate,
            @NotBlank @Size(max = 50) String method,
            @NotBlank @Size(max = 5000) String content,
            @NotNull OutreachResult result,
            LocalDate followUpDate) {
    }

    public record PartnerSummary(UUID id, String companyName, String field, String logoUrl, PartnerStatus status,
                                 String notes, int signedCount, BigDecimal signedTotal, LocalDate lastSignedDate,
                                 LocalDate lastContactDate, PartnerScore score) {
    }

    public record FollowUp(UUID partnerId, String companyName, LocalDate followUpDate, String content,
                           String createdByName) {
    }

    public record PartnerDetail(UUID id, String companyName, String field, String logoUrl, PartnerStatus status,
                                String notes, List<ContactResponse> contacts,
                                List<CollaborationResponse> collaborations, List<OutreachResponse> outreach) {
    }

    public record ContactResponse(UUID id, String fullName, String position, String phone, String email,
                                  boolean primary) {
        static ContactResponse from(PartnerContact contact) {
            return new ContactResponse(contact.getId(), contact.getFullName(), contact.getPosition(),
                    contact.getPhone(), contact.getEmail(), contact.isPrimary());
        }
    }

    public record CollaborationResponse(UUID id, UUID eventId, String eventTitle, String description,
                                        BigDecimal sponsoredAmount, String mouLink, LocalDate collaborationDate,
                                        String tier, String contractStatus, String benefitsCommitted) {
        static CollaborationResponse from(Collaboration row) {
            Event event = row.getEvent();
            return new CollaborationResponse(row.getId(), event == null ? null : event.getId(),
                    event == null ? null : event.getTitle(), row.getDescription(), row.getSponsoredAmount(),
                    row.getMouLink(), row.getCollaborationDate(), row.getTier(), row.getContractStatus(),
                    row.getBenefitsCommitted());
        }
    }

    public record OutreachResponse(UUID id, LocalDate contactDate, String method, String content,
                                   OutreachResult result, LocalDate followUpDate, String createdByName) {
        static OutreachResponse from(OutreachLog log) {
            User creator = log.getCreatedBy();
            return new OutreachResponse(log.getId(), log.getContactDate(), log.getMethod(), log.getContent(),
                    log.getResult(), log.getFollowUpDate(), creator == null ? null : creator.getFullName());
        }
    }
}
