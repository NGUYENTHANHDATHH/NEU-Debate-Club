package com.neudebateclub.backend.tenure;

import com.neudebateclub.backend.activity.ActivityLogService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/seasons")
@RequiredArgsConstructor
public class SeasonController {

    private final SeasonRepository seasonRepository;
    private final SeasonMemberRepository seasonMemberRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SeasonResponse>>> list(
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : seasonMemberRepository.countBySeason()) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return ResponseEntity.ok(ApiResponse.success(seasonRepository.findAllByOrderByStartDateDesc().stream()
                .map(season -> SeasonResponse.from(season, counts.getOrDefault(season.getId(), 0L)))
                .toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<SeasonResponse>> create(
            @Valid @RequestBody SeasonRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        if (!request.endDate().isAfter(request.startDate())) {
            throw new ValidationException("Ngày kết thúc phải sau ngày bắt đầu");
        }
        if (request.active()) {
            // Only one active season; the DB trigger trg_one_active_season enforces the same rule.
            seasonRepository.deactivateAll();
        }
        Season season = Season.builder()
                .name(request.name().trim())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .active(request.active())
                .build();
        Season saved = seasonRepository.save(season);
        activityLogService.record(currentUser.getId(), "CREATE", "SEASON", saved.getId(),
                ActivityLogService.metadata("name", saved.getName(), "active", saved.isActive()));
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã tạo nhiệm kỳ", SeasonResponse.from(saved, 0L)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        Season season = findSeason(id);
        seasonRepository.delete(season);
        activityLogService.record(currentUser.getId(), "DELETE", "SEASON", id,
                ActivityLogService.metadata("name", season.getName()));
        return ResponseEntity.ok(ApiResponse.success("Đã xóa nhiệm kỳ", null));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<SeasonMemberResponse>>> listMembers(
            @PathVariable UUID id,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        findSeason(id);
        return ResponseEntity.ok(ApiResponse.success(
                seasonMemberRepository.findBySeasonIdOrderByDepartmentAscUserFullNameAsc(id).stream()
                        .map(SeasonMemberResponse::from).toList()));
    }

    @PostMapping("/{id}/members")
    @Transactional
    public ResponseEntity<ApiResponse<SeasonMemberResponse>> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody SeasonMemberRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        Season season = findSeason(id);
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.userId().toString()));
        Role role = request.role() == null ? user.getRole() : request.role();
        if (user.getRole() == Role.GUEST || role == Role.GUEST) {
            throw new ValidationException("Không thể thêm khách (GUEST) vào nhiệm kỳ");
        }
        Department department = request.department() == null ? user.getDepartment() : request.department();
        if (department == null) {
            throw new ValidationException("Thành viên chưa có ban, vui lòng chọn ban");
        }
        if (seasonMemberRepository.existsBySeasonIdAndUserId(id, user.getId())) {
            throw new ValidationException("Thành viên đã có trong nhiệm kỳ này");
        }
        SeasonMember member = SeasonMember.builder()
                .season(season)
                .user(user)
                .role(role)
                .department(department)
                .joinedAt(request.joinedAt() == null ? LocalDate.now() : request.joinedAt())
                .build();
        SeasonMember saved = seasonMemberRepository.save(member);
        // entityId is the season; the member is identified in metadata.
        activityLogService.record(currentUser.getId(), "ADD_MEMBER", "SEASON", id,
                ActivityLogService.metadata("seasonName", season.getName(), "userId", user.getId().toString(),
                        "fullName", user.getFullName(), "role", role, "department", department));
        return ResponseEntity.status(201).body(ApiResponse.success(
                "Đã thêm thành viên vào nhiệm kỳ", SeasonMemberResponse.from(saved)));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.TENURE);
        SeasonMember member = seasonMemberRepository.findByIdAndSeasonId(memberId, id)
                .orElseThrow(() -> new ResourceNotFoundException("SeasonMember", memberId.toString()));
        User user = member.getUser();
        Map<String, Object> metadata = ActivityLogService.metadata("userId", user.getId().toString(),
                "fullName", user.getFullName(), "role", member.getRole(), "department", member.getDepartment());
        seasonMemberRepository.delete(member);
        activityLogService.record(currentUser.getId(), "REMOVE_MEMBER", "SEASON", id, metadata);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thành viên khỏi nhiệm kỳ", null));
    }

    private Season findSeason(UUID id) {
        return seasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Season", id.toString()));
    }

    public record SeasonRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            boolean active) {
    }

    public record SeasonMemberRequest(
            @NotNull UUID userId,
            Role role,
            Department department,
            LocalDate joinedAt) {
    }

    public record SeasonResponse(
            UUID id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            boolean active,
            long memberCount,
            Instant createdAt) {

        static SeasonResponse from(Season season, long memberCount) {
            return new SeasonResponse(season.getId(), season.getName(), season.getStartDate(),
                    season.getEndDate(), season.isActive(), memberCount, season.getCreatedAt());
        }
    }

    public record SeasonMemberResponse(
            UUID id,
            UUID userId,
            String fullName,
            String email,
            Role role,
            Department department,
            LocalDate joinedAt,
            LocalDate leftAt) {

        static SeasonMemberResponse from(SeasonMember member) {
            User user = member.getUser();
            return new SeasonMemberResponse(member.getId(), user.getId(), user.getFullName(), user.getEmail(),
                    member.getRole(), member.getDepartment(), member.getJoinedAt(), member.getLeftAt());
        }
    }
}
