---
name: Java Spring Boot Development
description: Rules and guidelines for writing backend Java code in Spring Boot.
applyTo: "backend/**/*.java"
---

# Java & Spring Boot Guidelines

- Use Constructor Injection instead of `@Autowired` on fields.
- Keep Controllers thin. Business logic belongs in `@Service` classes.
- Use Lombok annotations (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`) where appropriate to reduce boilerplate.
- Prefer returning standard REST response wrappers.
- Implement proper logging using SLF4J (`@Slf4j`).
