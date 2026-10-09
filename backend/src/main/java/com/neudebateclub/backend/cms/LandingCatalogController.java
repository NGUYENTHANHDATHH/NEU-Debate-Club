package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.annotation.CurrentUser;
import com.neudebateclub.backend.common.security.RoleGuard;
import com.neudebateclub.backend.user.UserRepository;
import tools.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class LandingCatalogController {

    private final LandingProjectRepository projectRepository;
    private final LandingAchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final RoleGuard roleGuard;

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
        roleGuard.requireCmsEditor(user);
        return switch (normalizeType(type)) {
            case "projects" -> ResponseEntity.ok(projectRepository.findAllByOrderByDisplayOrderAscUpdatedAtDesc());
            case "achievements" -> ResponseEntity.ok(achievementRepository.findAllByOrderByDisplayOrderAscUpdatedAtDesc());
            default -> throw new IllegalArgumentException("Unknown landing catalog: " + type);
        };
    }

    @PutMapping(value = "/cms/landing/catalog/{type}/publish", consumes = "application/json")
    public ResponseEntity<List<?>> publishItems(
            @PathVariable String type,
            @RequestBody JsonNode request,
            @CurrentUser UserPrincipal user) {
        roleGuard.requireCmsEditor(user);
        JsonNode items = request == null ? null : request.get("items");
        if (items == null || !items.isArray()) {
            return ResponseEntity.badRequest().build();
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
            entity.setContent(jsonText(item.get("content")));
            entity.setImageUrl(text(item, "imageUrl", "image"));
            entity.setImageAlt(text(item, "imageAlt"));
            entity.setCategory(requiredText(item, "category"));
            entity.setDisplayOrder(pinned(item) ? 0 : 1);
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
            entity.setContent(jsonText(item.get("content")));
            entity.setImageUrl(text(item, "imageUrl", "image"));
            entity.setImageAlt(text(item, "imageAlt"));
            entity.setCategory(requiredText(item, "category"));
            entity.setDisplayOrder(pinned(item) ? 0 : 1);
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
            throw new IllegalArgumentException("Unknown landing catalog: " + type);
        }
        return normalized;
    }

    private UUID uuid(JsonNode value) {
        if (value == null || value.isNull()) return null;
        try { return UUID.fromString(value.asText()); } catch (IllegalArgumentException ignored) { return null; }
    }

    private String requiredText(JsonNode item, String key) {
        String value = text(item, key);
        if (value.isBlank()) throw new IllegalArgumentException(key + " is required");
        return value;
    }

    private String text(JsonNode item, String... keys) {
        for (String key : keys) {
            JsonNode value = item.get(key);
            if (value != null && !value.isNull()) return value.asText("");
        }
        return "";
    }

    private String jsonText(JsonNode value) {
        if (value == null || value.isNull()) return null;
        return value.isTextual() ? value.asText() : value.toString();
    }

    private boolean pinned(JsonNode item) {
        return item.path("pinned").asBoolean(false) || item.path("displayOrder").asInt(1) == 0;
    }

    private String slug(JsonNode item, UUID existingId) {
        String value = text(item, "slug", "title").toLowerCase()
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return value.isBlank() ? "landing-" + (existingId == null ? UUID.randomUUID() : existingId) : value;
    }
}