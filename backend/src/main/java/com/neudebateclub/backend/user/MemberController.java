package com.neudebateclub.backend.user;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.common.exception.ForbiddenException;
import com.neudebateclub.backend.common.exception.ResourceNotFoundException;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.common.response.ApiResponse;
import com.neudebateclub.backend.common.security.RoleGuard;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

    private final UserRepository userRepository;
    private final RoleGuard roleGuard;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MemberResponse>>> list(
            @CurrentUser UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.BCN) {
            roleGuard.requireBCN(currentUser);
        } else {
            roleGuard.requireTruongBanOrAbove(currentUser);
        }
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAllByOrderByFullNameAsc()
                .stream()
                .filter(user -> user.getRole() != Role.GUEST)
                .filter(user -> currentUser.getRole() == Role.BCN
                        || user.getDepartment() == currentUser.getDepartment())
                .map(MemberResponse::from)
                .toList()));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<MemberResponse>> create(
            @Valid @RequestBody MemberRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.MEMBERSHIP);
        User member = save(new User(), request, currentUser);
        return ResponseEntity.status(201)
                .body(ApiResponse.success("Đã thêm thành viên", MemberResponse.from(member)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<MemberResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody MemberRequest request,
            @CurrentUser UserPrincipal currentUser) {
        roleGuard.requireModuleManager(currentUser, AdminModule.MEMBERSHIP);
        User member = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member", id.toString()));
        if (member.getRole() == Role.BCN && currentUser.getRole() != Role.BCN) {
            throw new ForbiddenException("Chỉ BCN được chỉnh sửa tài khoản BCN");
        }
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thành viên",
                MemberResponse.from(save(member, request, currentUser))));
    }

    private User save(User member, MemberRequest request, UserPrincipal currentUser) {
        if (request.role() == Role.GUEST) {
            throw new ValidationException("Không thể tạo khách từ danh sách thành viên");
        }
        if ((request.role() == Role.BCN) != (request.department() == Department.BCN)) {
            throw new ValidationException("Chức vụ BCN phải thuộc Ban Chủ nhiệm");
        }
        if (request.role() == Role.BCN && currentUser.getRole() != Role.BCN) {
            throw new ForbiddenException("Chỉ BCN được cấp quyền BCN");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        boolean duplicateEmail = member.getId() == null
                ? userRepository.existsByEmailIgnoreCase(email)
                : userRepository.existsByEmailIgnoreCaseAndIdNot(email, member.getId());
        if (duplicateEmail) {
            throw new ValidationException("Email đã tồn tại");
        }

        String studentId = request.studentId().trim();
        boolean duplicateStudentId = member.getId() == null
                ? userRepository.existsByStudentIdIgnoreCase(studentId)
                : userRepository.existsByStudentIdIgnoreCaseAndIdNot(studentId, member.getId());
        if (duplicateStudentId) {
            throw new ValidationException("MSSV đã tồn tại");
        }

        member.setFullName(request.fullName().trim());
        member.setEmail(email);
        member.setStudentId(studentId);
        member.setPhone(request.phone().trim());
        member.setDepartment(request.department());
        member.setRole(request.role());
        member.setActive(request.active());
        return userRepository.save(member);
    }

    public record MemberRequest(
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 20) String studentId,
            @NotBlank @Pattern(regexp = "^[0-9+ .()-]{8,20}$", message = "Số điện thoại không hợp lệ") String phone,
            @NotNull Department department,
            @NotNull Role role,
            boolean active) {
    }

    public record MemberResponse(
            UUID id,
            String fullName,
            String email,
            String studentId,
            String phone,
            Department department,
            Role role,
            boolean active) {

        static MemberResponse from(User user) {
            return new MemberResponse(user.getId(), user.getFullName(), user.getEmail(),
                    user.getStudentId(), user.getPhone(), user.getDepartment(), user.getRole(),
                    user.isActive());
        }
    }
}
