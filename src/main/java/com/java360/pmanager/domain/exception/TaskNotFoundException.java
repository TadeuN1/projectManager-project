package com.java360.pmanager.domain.exception;

import com.java360.pmanager.infrastructure.exception.RequestException;

public class TaskNotFoundException extends RequestException {

    public TaskNotFoundException(String taskID){
        super("TaskNotFound", "Task Not found: " + taskID);
    }
}
