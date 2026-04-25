package com.java360.pmanager.domain.exception;

import com.java360.pmanager.infrastructure.exception.RequestException;

public class ProjectNotFoundException extends RequestException {

    public ProjectNotFoundException(String projectID){
        super("ProjectNotFound", "Project Not found: " + projectID);
    }
}
