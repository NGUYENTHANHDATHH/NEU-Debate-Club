package com.neudebateclub.backend.cms;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.enums.LandingSection;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/public/landing")
@RequiredArgsConstructor
public class LandingContentController {

    private final LandingContentRepository repo;
    private final LandingContentVersionRepository versionRepo;
    private final UserRepository userRepo;
    private final RoleGuard roleGuard;
    private final ObjectMapper objectMapper;

    private static final String DRAFT = "DRAFT";
    private static final String PUBLISHED = "PUBLISHED";

    /** GET /api/public/landing — all published sections as Map<section, json> */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAll() {
        Map<String, String> result = new LinkedHashMap<>();
        for (LandingContent lc : repo.findAllPublished()) {
            result.put(lc.getSection().toLowerCase(), lc.getContentJson());
        }
        StringBuilder sb = new StringBuilder("{\"success\":true,\"data\":{");
        boolean first = true;
        for (Map.Entry<String, String> e : result.entrySet()) {
            if (!first) sb.append(',');
            sb.append('"').append(e.getKey()).append("\":").append(e.getValue());
            first = false;
        }
        sb.append("}}");
        return ResponseEntity.ok(sb.toString());
    }

    /** GET /api/public/landing/{section} — single section JSON */
    @GetMapping(value = "/{section}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getOne(@PathVariable String section) {
        return repo.findPublishedBySection(section.toLowerCase())
                .map(lc -> ResponseEntity.ok(
                        "{\"success\":true,\"data\":" + lc.getContentJson() + "}"))
                .orElse(ResponseEntity.status(404)
                        .body("{\"success\":false,\"message\":\"Section not found\"}"));
    }

    @GetMapping(value = "/cms/landing", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getCms(@CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        List<Map<String, Object>> sections = Arrays.stream(LandingSection.values()).map(section -> {
            String name = section.name().toLowerCase();
            LandingContent published = repo.findBySection(name).orElse(null);
            LandingContentVersion draft = versionRepo
                    .findFirstBySectionAndStatusOrderByCreatedAtDesc(name, DRAFT).orElse(null);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("section", name);
            item.put("draft", parseJson(draft == null ? null : draft.getContentJson()));
            item.put("published", parseJson(published == null ? null : published.getContentJson()));
            item.put("publishedAt", published == null ? null : published.getUpdatedAt());
            item.put("draftAt", draft == null ? null : draft.getCreatedAt());
            item.put("status", draft == null ? PUBLISHED : "DRAFT");
            return item;
        }).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", sections));
    }

    @GetMapping(value = "/cms/landing/{section}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getCmsSection(
            @PathVariable String section,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        String normalized = validateSection(section);
        LandingContent published = repo.findBySection(normalized).orElse(null);
        LandingContentVersion draft = versionRepo
                .findFirstBySectionAndStatusOrderByCreatedAtDesc(normalized, DRAFT).orElse(null);
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("section", normalized);
        item.put("draft", parseJson(draft == null ? null : draft.getContentJson()));
        item.put("published", parseJson(published == null ? null : published.getContentJson()));
        item.put("publishedAt", published == null ? null : published.getUpdatedAt());
        item.put("draftAt", draft == null ? null : draft.getCreatedAt());
        item.put("status", draft == null ? PUBLISHED : DRAFT);
        return ResponseEntity.ok(Map.of("success", true, "data", item));
    }

    @PutMapping(value = "/cms/landing/{section}/draft", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> saveDraft(
            @PathVariable String section,
            @RequestBody JsonNode content,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        String normalized = validateSection(section);
        if (!content.isObject()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Content must be a JSON object"));
        }
        LandingContentVersion draft = versionRepo.save(LandingContentVersion.builder()
                .section(normalized)
                .contentJson(content.toString())
                .status(DRAFT)
                .createdBy(userRepo.getReferenceById(user.getId()))
                .createdAt(Instant.now())
                .build());
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
                "section", normalized, "content", content, "savedAt", draft.getCreatedAt())));
    }

    @PostMapping("/cms/landing/{section}/publish")
    @Transactional
    public ResponseEntity<Map<String, Object>> publish(
            @PathVariable String section,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        String normalized = validateSection(section);
        LandingContentVersion draft = versionRepo
                .findFirstBySectionAndStatusOrderByCreatedAtDesc(normalized, DRAFT)
                .orElseThrow(() -> new ValidationException("No draft exists for section " + normalized));
        LandingContent content = repo.findBySection(normalized).orElseGet(() -> LandingContent.builder()
                .section(normalized)
                .updatedBy(userRepo.getReferenceById(user.getId()))
                .build());
        content.setContentJson(draft.getContentJson());
        content.setPublished(true);
        content.setUpdatedBy(userRepo.getReferenceById(user.getId()));
        content.setUpdatedAt(Instant.now());
        repo.save(content);
        draft.setStatus(PUBLISHED);
        versionRepo.save(draft);
        return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
                "section", normalized, "content", parseJson(content.getContentJson()), "publishedAt", content.getUpdatedAt())));
    }

    @GetMapping("/cms/landing/{section}/history")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> history(
            @PathVariable String section,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        String normalized = validateSection(section);
        List<Map<String, Object>> items = versionRepo.findTop20BySectionOrderByCreatedAtDesc(normalized).stream()
                .map(version -> Map.<String, Object>of(
                        "id", version.getId(), "status", version.getStatus(),
                        "content", parseJson(version.getContentJson()), "createdAt", version.getCreatedAt(),
                        "createdBy", version.getCreatedBy().getFullName()))
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "data", items));
    }

    private String validateSection(String section) {
        String normalized = section.toLowerCase();
        try {
            LandingSection.valueOf(normalized.toUpperCase());
            return normalized;
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Unknown landing section: " + section);
        }
    }

    private JsonNode parseJson(String value) {
        try {
            return value == null ? null : objectMapper.readTree(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid landing content JSON", exception);
        }
    }
}
