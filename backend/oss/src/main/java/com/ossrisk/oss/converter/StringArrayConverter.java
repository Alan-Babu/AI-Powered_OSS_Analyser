package com.ossrisk.oss.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Converter
public class StringArrayConverter implements AttributeConverter<String[], String> {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(String[] attribute) {
        try {
            return attribute == null ? "[]" : objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Error converting String[] to JSON", e);
        }
    }

    @Override
    public String[] convertToEntityAttribute(String dbData) {
        try {
            if (dbData == null || dbData.isBlank()) return new String[]{};
            return objectMapper.readValue(dbData, new TypeReference<String[]>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Error converting JSON to String[]", e);
        }
    }
}
