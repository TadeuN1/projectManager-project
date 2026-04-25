package com.java360.pmanager.infrastructure.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SaveTaskDataDTO {
    @NotNull(message = "Title cannot be empty")
    private final String title;
    @NotNull(message = "Description cannot be empty")
    @Size(min = 1, max = 150, message = "Invalid Description")
    private final String description;
    @NotNull
    @Positive(message = "Number of days must be positive")
    private final Integer numberOfDays;

    private final String  status;

    private final String projectId;
    private final String memberId;
}
