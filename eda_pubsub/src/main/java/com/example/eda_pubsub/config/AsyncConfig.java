package com.example.eda_pubsub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // TODO: Configure custom ThreadPoolTaskExecutor if desired
}
