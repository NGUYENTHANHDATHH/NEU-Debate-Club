package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.TaskPriority;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TaskPriorityConverter implements AttributeConverter<TaskPriority, String> {

    @Override
    public String convertToDatabaseColumn(TaskPriority attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case LOW -> "low";
            case MEDIUM -> "medium";
            case HIGH, URGENT -> "high";
        };
    }

    @Override
    public TaskPriority convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData.toLowerCase()) {
            case "low" -> TaskPriority.LOW;
            case "medium" -> TaskPriority.MEDIUM;
            case "high" -> TaskPriority.HIGH;
            default -> TaskPriority.MEDIUM;
        };
    }
}
