package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.OutreachResult;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class OutreachResultConverter implements AttributeConverter<OutreachResult, String> {

    @Override
    public String convertToDatabaseColumn(OutreachResult attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public OutreachResult convertToEntityAttribute(String dbData) {
        return dbData == null ? null : OutreachResult.valueOf(dbData.toUpperCase());
    }
}
