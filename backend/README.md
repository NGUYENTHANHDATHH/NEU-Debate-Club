# NEU Debate Club Backend - Developer Setup Guide

Spring Boot backend application. Built with Java 21 and Maven.

## Prerequisites
- **JDK 21** installed and configured in `JAVA_HOME`.
- IDE (e.g., IntelliJ IDEA or VS Code with Java Extension Pack).

## Step-by-Step Setup

### 1. Configure Database Connection
Update [application.properties](file:///e:/NEU%20Debate%20Club/backend/src/main/resources/application.properties) with database credentials:
```properties
spring.application.name=backend

# Database Config (Example: H2 or PostgreSQL)
# spring.datasource.url=jdbc:postgresql://localhost:5432/neudebate
# spring.datasource.username=postgres
# spring.datasource.password=password
# spring.jpa.hibernate.ddl-auto=update
```
*(If database driver is needed, add corresponding dependency to [pom.xml](file:///e:/NEU%20Debate%20Club/backend/pom.xml))*

### 2. Run the Application
From `backend` folder:
- **Windows**:
  ```cmd
  mvnw.cmd spring-boot:run
  ```
- **macOS / Linux**:
  ```bash
  chmod +x mvnw
  ./mvnw spring-boot:run
  ```

### 3. Create First REST Controller
Create `HelloController.java` in `com.neudebateclub.backend.controller`:
```java
package com.neudebateclub.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/api/hello")
    public String hello() {
        return "Hello from NEU Debate Club Backend!";
    }
}
```

### 4. Build and Package
Generate runnable JAR file:
```bash
./mvnw clean package
```
Result JAR located in `target/backend-0.0.1-SNAPSHOT.jar`.