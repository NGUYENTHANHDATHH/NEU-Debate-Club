package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.Platform;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PlatformConverter implements AttributeConverter<Platform, String> {

    @Override
    public String convertToDatabaseColumn(Platform attribute) {
        // Hibernate converts every enum constant at startup, so this must not throw; the controller rejects
        // values the PostgreSQL enum lacks (400) before they reach the database.
        return attribute != null ? attribute.name().toLowerCase() : null;
    }

    @Override
    public Platform convertToEntityAttribute(String dbData) {
        return dbData != null ? Platform.valueOf(dbData.toUpperCase()) : null;
    }
}
