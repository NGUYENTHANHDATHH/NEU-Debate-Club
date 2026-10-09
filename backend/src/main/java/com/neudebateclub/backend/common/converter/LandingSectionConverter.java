package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.LandingSection;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LandingSectionConverter implements AttributeConverter<LandingSection, String> {

    @Override
    public String convertToDatabaseColumn(LandingSection attribute) {
        return attribute != null ? attribute.name().toLowerCase() : null;
    }

    @Override
    public LandingSection convertToEntityAttribute(String dbData) {
        return dbData != null ? LandingSection.valueOf(dbData.toUpperCase()) : null;
    }
}
