package com.example.eda;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.test.EmbeddedKafkaKraftBroker;

@SpringBootApplication
@EnableKafka
public class EdaApplication {

    private static final Logger log = LoggerFactory.getLogger(EdaApplication.class);

    public static void main(String[] args) {
        // 1. Boot up in-memory Apache Kafka broker in KRaft mode before Spring context loads
        log.info("Starting local Embedded Apache Kafka Broker (KRaft mode)...");
        EmbeddedKafkaKraftBroker broker = new EmbeddedKafkaKraftBroker(1, 2, "order-events");
        broker.afterPropertiesSet();

        String brokerAddress = broker.getBrokersAsString();
        System.setProperty("spring.kafka.bootstrap-servers", brokerAddress);
        log.info("✅ Embedded Apache Kafka Broker successfully started at: {}", brokerAddress);

        // Ensure clean shutdown of Kafka when application stops
        Runtime.getRuntime().addShutdownHook(new Thread(broker::destroy));

        // 2. Launch Spring Boot application connected to the running embedded broker
        SpringApplication.run(EdaApplication.class, args);
    }
}
