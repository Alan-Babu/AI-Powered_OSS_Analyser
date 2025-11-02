package com.ossrisk.oss.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    @Autowired
    private ObjectMapper objectMapper;

    @PostConstruct
    public void setUp() {
        // ✅ Register JavaTimeModule to handle LocalDate, LocalDateTime, etc.
        objectMapper.registerModule(new JavaTimeModule());
    }
}
