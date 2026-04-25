package com.java360.pmanager.domain.exception;

import com.java360.pmanager.infrastructure.exception.RequestException;

public class MemberNotFoundException extends RequestException {

    public MemberNotFoundException(String memberID){
        super("MemberNotFound", "Member Not found: " + memberID);
    }
}
