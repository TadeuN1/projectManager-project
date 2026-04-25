package com.java360.pmanager.domain.document;

import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "api_key")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey {

    @Id
    private String id;

    private String value;
    private Instant expiresWhen;

    @CreatedDate
    private Instant createdWhen;

    public boolean isExpired(Instant now){
        return now.isAfter(expiresWhen);
    }

}
