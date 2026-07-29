package com.neudebateclub.backend.common.exception;

import java.util.Collections;
import java.util.Map;

public class ValidationException extends RuntimeException {

    private final Map<String, String> errors;

    public ValidationException(String message) {
        this(message, Collections.emptyMap());
    }

    public ValidationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors == null ? Collections.emptyMap() : Map.copyOf(errors);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}