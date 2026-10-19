package com.neudebateclub.backend.common.converter;

import com.neudebateclub.backend.common.enums.TaskStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TaskStatusConverter implements AttributeConverter<TaskStatus, String> {

    @Override
    public String convertToDatabaseColumn(TaskStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case TODO -> "todo";
            case IN_PROGRESS -> "in_progress";
            case DONE -> "done";
            default -> "todo";
        };
    }

    @Override
    public TaskStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData.toLowerCase()) {
            case "todo" -> TaskStatus.TODO;
            case "in_progress" -> TaskStatus.IN_PROGRESS;
            case "done" -> TaskStatus.DONE;
            default -> TaskStatus.TODO;
        };
    }
}
