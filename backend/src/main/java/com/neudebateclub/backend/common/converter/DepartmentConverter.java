package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.Department;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class DepartmentConverter implements AttributeConverter<Department, String> {

    @Override
    public String convertToDatabaseColumn(Department attribute) {
        return attribute != null ? attribute.name().toLowerCase() : null;
    }

    @Override
    public Department convertToEntityAttribute(String dbData) {
        return dbData != null ? Department.valueOf(dbData.toUpperCase()) : null;
    }
}
