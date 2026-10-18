package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.auth.jwt.JwtService;
import com.neudebateclub.backend.auth.security.UserPrincipal;
import com.neudebateclub.backend.common.enums.Department;
import com.neudebateclub.backend.common.enums.Role;
import com.neudebateclub.backend.user.User;
import com.neudebateclub.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

// Opt in only with an explicitly selected disposable PostgreSQL database.
@EnabledIfEnvironmentVariable(named = "CMS_TEST_DATABASE_URL", matches = ".+")
@ActiveProfiles("cms-test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.config.import=",
        "spring.datasource.url=${CMS_TEST_DATABASE_URL}",
        "spring.datasource.username=${CMS_TEST_DATABASE_USERNAME:cms_test}",
        "spring.datasource.password=${CMS_TEST_DATABASE_PASSWORD:cms_test}",
        "spring.flyway.baseline-on-migrate=false",
        "app.jwt.secret=Y21zLXRlc3Qtb25seS1zZWNyZXQtMzItYnl0ZXMtbG9uZw==",
        "app.google.client-id=cms-test",
        "spring.jpa.open-in-view=false"
})
class CmsPublishIntegrationTest {
    @Value("${local.server.port}") int port;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired ObjectMapper mapper;
    private final HttpClient http = HttpClient.newHttpClient();
    private String token;

    @BeforeEach
    void editor() {
        token = tokenFor(Role.TRUONG_BAN);
    }

    @ParameterizedTest
    @ValueSource(strings = {"hero", "vision", "departments", "comments", "achievements", "projects"})
    void savesAndPublishesSections(String section) throws Exception {
        String path = "/public/landing/cms/landing/" + section;
        String body = "{\"headline\":\"Published regression test\",\"stats\":[]}";
        assertStatus(200, request("PUT", path + "/draft", body));
        assertStatus(200, request("POST", path + "/publish", null));
        JsonNode published = json(request("GET", "/public/landing/" + section, null)).path("data");
        assertEquals(mapper.readTree(body), published);
        JsonNode cms = json(request("GET", path, null)).path("data");
        assertEquals("PUBLISHED", cms.path("status").asText());
        assertTrue(cms.path("draft").isNull());
        assertEquals("PUBLISHED", json(request("GET", path + "/history", null))
                .path("data").get(0).path("status").asText());
        assertStatus(400, request("POST", path + "/publish", null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"projects", "achievements"})
    void publishesCatalogTextAndReadsItBack(String type) throws Exception {
        String slug = "publish-test-" + UUID.randomUUID();
        var item = mapper.createObjectNode().put("title", "CMS test").put("slug", slug)
                .put("category", "other").put("content", "Nội dung \"CMS\"\nDòng mới");
        var body = mapper.createObjectNode();
        body.putArray("items").add(item);
        String path = "/public/cms/landing/catalog/" + type + "/publish";
        JsonNode saved = json(request("PUT", path, body.toString())).get(0);
        assertEquals(item.path("content"), saved.path("content"));
        assertFalse(saved.has("createdBy"));
        assertFalse(saved.has("updatedBy"));
        JsonNode published = json(request("GET", "/public/" + type + "/" + slug, null));
        assertEquals(item.path("content"), published.path("content"));
        item.put("id", saved.path("id").asText()).put("content", "");
        assertEquals("", json(request("PUT", path, body.toString())).get(0).path("content").asText());
        item.set("content", mapper.readTree("{\"paragraph\":\"Structured content\"}"));
        assertEquals(item.path("content"), json(request("PUT", path, body.toString())).get(0).path("content"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"projects", "achievements"})
    void checksCatalogSlugAvailability(String type) throws Exception {
        String slug = "slug-check-" + UUID.randomUUID();
        var item = mapper.createObjectNode().put("title", "Slug check").put("slug", slug)
                .put("category", "other");
        var body = mapper.createObjectNode();
        body.putArray("items").add(item);
        JsonNode saved = json(request("PUT", "/public/cms/landing/catalog/" + type + "/publish",
                body.toString())).get(0);
        String checkPath = "/public/cms/landing/catalog/" + type + "/slug-available?slug=" + slug;
        assertFalse(json(request("GET", checkPath, null)).path("available").asBoolean());
        assertTrue(json(request("GET", checkPath + "&excludeId=" + saved.path("id").asText(), null))
                .path("available").asBoolean());
        assertTrue(json(request("GET", checkPath + "-new", null)).path("available").asBoolean());
    }

    @ParameterizedTest
    @ValueSource(strings = {"projects", "achievements"})
    void invalidCatalogBatchDoesNotPublishEarlierItems(String type) throws Exception {
        String slug = "rollback-test-" + UUID.randomUUID();
        String body = "{\"items\":[{\"title\":\"Valid\",\"slug\":\"" + slug
                + "\",\"category\":\"other\"},{\"title\":\"Invalid\",\"category\":\"unknown\"}]}";
        var response = request("PUT", "/public/cms/landing/catalog/" + type + "/publish", body);
        assertStatus(400, response);
        assertTrue(mapper.readTree(response.body()).path("message").asText().contains("category"));
        assertStatus(404, request("GET", "/public/" + type + "/" + slug, null));
    }

    @Test
    void invalidInputAndUnauthorizedPublishHaveClientErrors() throws Exception {
        assertStatus(400, request("PUT", "/public/landing/cms/landing/unknown/draft", "{}"));
        assertStatus(400, request("PUT", "/public/landing/cms/landing/hero/draft", "[]"));
        assertStatus(400, request("PUT", "/public/cms/landing/catalog/projects/publish",
                "{\"items\":[{\"title\":\"\",\"category\":\"other\"}]}"));
        token = tokenFor(Role.MEMBER);
        assertStatus(403, request("POST", "/public/landing/cms/landing/hero/publish", null));
        assertStatus(403, request("PUT", "/public/cms/landing/catalog/projects/publish", "{\"items\":[]}"));
        token = null;
        assertStatus(401, request("POST", "/public/landing/cms/landing/hero/publish", null));
    }

    @Test
    void runtimeOpenApiRetainsPublishRoutes() throws Exception {
        JsonNode paths = json(request("GET", "/v3/api-docs", null)).path("paths");
        assertTrue(paths.path("/public/landing/cms/landing/{section}/draft").has("put"));
        assertTrue(paths.path("/public/landing/cms/landing/{section}/publish").has("post"));
        assertTrue(paths.path("/public/cms/landing/catalog/{type}/publish").has("put"));
        assertTrue(paths.path("/public/cms/landing/catalog/{type}/slug-available").has("get"));
    }

    private String tokenFor(Role role) {
        User user = users.saveAndFlush(User.builder().email(UUID.randomUUID() + "@cms.test")
                .fullName("CMS test").role(role).department(Department.TRUYEN_THONG).active(true).build());
        return jwt.generateToken(UserPrincipal.builder().id(user.getId()).role(role)
                .department(user.getDepartment()).active(true).build());
    }

    private HttpResponse<String> request(String method, String path, String body) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api" + path))
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        if (token != null) request.header("Authorization", "Bearer " + token);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode json(HttpResponse<String> response) {
        assertStatus(200, response);
        return mapper.readTree(response.body());
    }

    private void assertStatus(int status, HttpResponse<String> response) {
        assertEquals(status, response.statusCode(), response.body());
    }
}
