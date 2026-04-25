package com.java360.pmanager;

import com.java360.pmanager.infrastructure.config.AppConfigProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(
		exclude = {SecurityAutoConfiguration.class, UserDetailsServiceAutoConfiguration.class}
)
@EnableConfigurationProperties(AppConfigProperties.class)
public class PManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(PManagerApplication.class, args);
	}

}
