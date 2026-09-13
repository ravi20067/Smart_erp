package com.Smart.Erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SmartErpApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartErpApplication.class, args);
	}

}
