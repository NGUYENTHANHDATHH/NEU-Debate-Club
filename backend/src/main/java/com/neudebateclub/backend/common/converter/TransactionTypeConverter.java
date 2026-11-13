package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.TransactionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TransactionTypeConverter implements AttributeConverter<TransactionType, String> {

    @Override
    public String convertToDatabaseColumn(TransactionType attribute) {
        // Hibernate converts every enum constant at startup, so this must not throw; the controller rejects
        // values the PostgreSQL enum lacks (400) before they reach the database.
        return attribute != null ? attribute.name().toLowerCase() : null;
    }

    @Override
    public TransactionType convertToEntityAttribute(String dbData) {
        return dbData != null ? TransactionType.valueOf(dbData.toUpperCase()) : null;
    }
}
