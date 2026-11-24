package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.PartnerStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PartnerStatusConverter implements AttributeConverter<PartnerStatus, String> {

    @Override
    public String convertToDatabaseColumn(PartnerStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public PartnerStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : PartnerStatus.valueOf(dbData.toUpperCase());
    }
}
