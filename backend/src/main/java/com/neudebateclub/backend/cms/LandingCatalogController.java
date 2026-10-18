package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.common.enums.AdminModule;
import com.neudebateclub.backend.common.exception.ValidationException;
import com.neudebateclub.backend.user.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class LandingCatalogController {

    private final LandingProjectRepository projectRepository;
    private final LandingAchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;
    private final ObjectMapper objectMapper;

    @GetMapping("/projects")
    public ResponseEntity<List<LandingProject>> projects() {
        return ResponseEntity.ok(projectRepository.findByVisibleTrueOrderByDisplayOrderAscUpdatedAtDesc());
    }

    @GetMapping("/projects/{slug}")
    public ResponseEntity<LandingProject> project(@PathVariable String slug) {
        return projectRepository.findBySlugAndVisibleTrue(slug)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<LandingAchievement>> achievements() {
        return ResponseEntity.ok(achievementRepository.findByVisibleTrueOrderByDisplayOrderAscUpdatedAtDesc());
    }

    @GetMapping("/achievements/{slug}")
    public ResponseEntity<LandingAchievement> achievement(@PathVariable String slug) {
        return achievementRepository.findBySlugAndVisibleTrue(slug)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/cms/landing/catalog/{type}")
    public ResponseEntity<List<?>> cmsItems(
            @PathVariable String type,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        return switch (normalizeType(type)) {
            case "projects" -> ResponseEntity.ok(projectRepository.findAllByOrderByDisplayOrderAscUpdatedAtDesc());
            case "achievements" -> ResponseEntity.ok(achievementRepository.findAllByOrderByDisplayOrderAscUpdatedAtDesc());
            default -> throw new ValidationException("Unknown landing catalog: " + type);
        };
    }

    @GetMapping("/cms/landing/catalog/{type}/slug-available")
    public ResponseEntity<Map<String, Boolean>> slugAvailable(
            @PathVariable String type,
            @RequestParam String slug,
            @RequestParam(required = false) UUID excludeId,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        String normalizedSlug = normalizeSlug(slug);
        if (normalizedSlug.isBlank()) throw new ValidationException("slug is required");
        boolean exists = switch (normalizeType(type)) {
            case "projects" -> excludeId == null
                    ? projectRepository.existsBySlug(normalizedSlug)
                    : projectRepository.existsBySlugAndIdNot(normalizedSlug, excludeId);
            case "achievements" -> excludeId == null
                    ? achievementRepository.existsBySlug(normalizedSlug)
                    : achievementRepository.existsBySlugAndIdNot(normalizedSlug, excludeId);
            default -> false;
        };
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    @PutMapping(value = "/cms/landing/catalog/{type}/publish", consumes = "application/json")
    @Transactional
    public ResponseEntity<List<?>> publishItems(
            @PathVariable String type,
            @RequestBody JsonNode request,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireModuleManager(user, AdminModule.LANDING_CMS);
        JsonNode items = request == null ? null : request.get("items");
        if (items == null || !items.isArray()) {
            throw new ValidationException("items must be an array");
        }
        String normalizedType = normalizeType(type);
        List<?> result = normalizedType.equals("projects")
                ? publishProjects(items, user)
                : publishAchievements(items, user);
        return ResponseEntity.ok(result);
    }

    private List<LandingProject> publishProjects(JsonNode items, UserPrincipal principal) {
        var user = userRepository.getReferenceById(principal.getId());
        List<LandingProject> saved = new ArrayList<>();
        for (JsonNode item : items) {
                UUID id = uuid(item.get("id"));
                LandingProject entity = id == null ? new LandingProject() : projectRepository.findById(id)
                    .orElseGet(LandingProject::new);
            entity.setTitle(requiredText(item, "title"));
            entity.setSlug(slug(item, entity.getId()));
            entity.setDescription(text(item, "description", "desc"));
            entity.setContent(jsonContent(item.get("content")));
            entity.setImageUrl(text(item, "imageUrl", "image"));
            entity.setImageAlt(text(item, "imageAlt"));
            entity.setCategory(category(item, List.of("talkshow", "workshop", "debate_tournament",
                    "debate_camp", "debate_training", "other")));
            entity.setDisplayOrder(displayOrder(item));
            entity.setVisible(!item.path("hidden").asBoolean(false));
            entity.setUpdatedBy(user);
            if (entity.getCreatedAt() == null) entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            if (entity.getCreatedBy() == null) entity.setCreatedBy(user);
            saved.add(projectRepository.save(entity));
        }
        return saved;
    }

    private List<LandingAchievement> publishAchievements(JsonNode items, UserPrincipal principal) {
        var user = userRepository.getReferenceById(principal.getId());
        List<LandingAchievement> saved = new ArrayList<>();
        for (JsonNode item : items) {
                UUID id = uuid(item.get("id"));
                LandingAchievement entity = id == null ? new LandingAchievement() : achievementRepository.findById(id)
                    .orElseGet(LandingAchievement::new);
            entity.setTitle(requiredText(item, "title"));
            entity.setSlug(slug(item, entity.getId()));
            entity.setDescription(text(item, "description", "desc"));
            entity.setContent(jsonContent(item.get("content")));
            entity.setImageUrl(text(item, "imageUrl", "image"));
            entity.setImageAlt(text(item, "imageAlt"));
            entity.setCategory(category(item, List.of("championship", "award", "event", "other")));
            entity.setDisplayOrder(displayOrder(item));
            entity.setVisible(!item.path("hidden").asBoolean(false));
            entity.setUpdatedBy(user);
            if (entity.getCreatedAt() == null) entity.setCreatedAt(LocalDateTime.now());
            entity.setUpdatedAt(LocalDateTime.now());
            if (entity.getCreatedBy() == null) entity.setCreatedBy(user);
            saved.add(achievementRepository.save(entity));
        }
        return saved;
    }

    private String normalizeType(String type) {
        String normalized = type.toLowerCase();
        if (!normalized.equals("projects") && !normalized.equals("achievements")) {
            throw new ValidationException("Unknown landing catalog: " + type);
        }
        return normalized;
    }

    private UUID uuid(JsonNode value) {
        if (value == null || value.isNull()) return null;
        try { return UUID.fromString(value.asText()); } catch (IllegalArgumentException ignored) { return null; }
    }

    private String requiredText(JsonNode item, String key) {
        String value = text(item, key);
        if (value.isBlank()) throw new ValidationException(key + " is required");
        return value;
    }

    private String text(JsonNode item, String... keys) {
        for (String key : keys) {
            JsonNode value = item.get(key);
            if (value != null && !value.isNull()) return value.asText("");
        }
        return "";
    }

    private String category(JsonNode item, List<String> allowed) {
        String value = requiredText(item, "category");
        if (!allowed.contains(value)) throw new ValidationException("Unknown category: " + value);
        return value;
    }

    private Object jsonContent(JsonNode value) {
        if (value == null || value.isNull()) return null;
        // Hibernate treats a String-typed JSON field as already-encoded JSON.
        // Object preserves text (including empty strings) and structured JSON values.
        return objectMapper.convertValue(value, Object.class);
    }

    private boolean pinned(JsonNode item) {
        return item.path("pinned").asBoolean(false) || item.path("displayOrder").asInt(1) == 0;
    }

    private int displayOrder(JsonNode item) {
        JsonNode value = item.get("displayOrder");
        if (value != null) {
            try {
                return Integer.parseInt(value.asText());
            } catch (NumberFormatException ignored) {
                // Fall back to the existing pinned-item convention.
            }
        }
        return pinned(item) ? 0 : 1;
    }

    private String slug(JsonNode item, UUID existingId) {
        String value = normalizeSlug(text(item, "slug", "title"));
        return value.isBlank() ? "landing-" + (existingId == null ? UUID.randomUUID() : existingId) : value;
    }

    private String normalizeSlug(String value) {
        return value.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
