package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.EventStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EventStatusConverter implements AttributeConverter<EventStatus, String> {

    @Override
    public String convertToDatabaseColumn(EventStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public EventStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EventStatus.valueOf(dbData.toUpperCase());
    }
}
