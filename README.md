# Event-Driven Architecture (EDA) - Order Notification System

A complete hands-on, end-to-end Event-Driven Architecture demonstration built in **Java 17+** and **Spring Boot 3**, implementing the **Publish/Subscribe (Pub/Sub)** pattern with an embedded **Apache Kafka** broker.

---

## 📌 Project Overview

This repository demonstrates the core building blocks of Event-Driven Systems:
* **Events**: Strongly typed immutable `OrderPlacedEvent` schema (`eventId`, `eventType`, `timestamp`, `payload`).
* **Producer**: REST API (`POST /api/orders`) that asynchronously publishes events to Kafka.
* **Event Channel / Broker**: Apache Kafka (`EmbeddedKafkaBroker` running in-memory on port `9092` with topic `order-events` — zero Docker or external installations required).
* **Consumers (Pub/Sub)**:
  * **`NotificationConsumer`** (`notification-service-group`): Independently receives orders and simulates email/SMS confirmation dispatch.
  * **`AnalyticsConsumer`** (`analytics-service-group`): Independently tracks revenue and order counts.
* **Idempotency Guard**: At-least-once message delivery deduplication implemented in `AnalyticsConsumer` using [IdempotencyService.java](order-notification-system/src/main/java/com/example/eda/service/IdempotencyService.java).
* **Architecture Documentation**: Full architectural write-up in [`ARCHITECTURE.md`](order-notification-system/ARCHITECTURE.md).

---

## 📂 Directory Structure

```
EDA/
├── README.md                           # Root documentation & execution instructions
└── order-notification-system/          # Main Java & Spring Boot project folder
    ├── pom.xml                         # Maven dependencies & build setup
    ├── ARCHITECTURE.md                 # Detailed architectural write-up
    ├── README.md                       # Project-level guide
    ├── test_flow.sh                    # Automated end-to-end testing script
    └── src/
        └── main/
            ├── resources/
            │   └── application.yml     # Kafka connection & topic properties
            └── java/com/example/eda/
                ├── EdaApplication.java # Spring Boot entry point
                ├── config/             # Embedded Kafka Broker & topic config
                ├── model/              # Event schema, payload, and request models
                ├── producer/           # REST Controller & Kafka Producer service
                ├── consumer/           # Notification & Analytics consumers
                └── service/            # Thread-safe Idempotency service
```

---

## ⚙️ Prerequisites

* **Java 17** or **Java 21** installed
* **Maven** (`mvn`) installed
* *(No Docker or standalone Kafka installation needed — the broker boots in-memory with the app)*

---

## 🚀 Running the Application

1. Open a terminal and navigate into the project directory:
   ```bash
   cd /Users/harshal.tarmale/Documents/T300_Backend/EDA/order-notification-system
   ```

2. Compile and launch the Spring Boot service:
   ```bash
   mvn clean spring-boot:run
   ```

3. The application will start on **`http://localhost:8080`**, and the embedded Kafka broker will start on **`localhost:9092`**.

---

## 🧪 Testing Instructions

### Option 1: Automated Test Script (Recommended)

In a separate terminal, run the provided shell script:
```bash
cd order-notification-system
./test_flow.sh
```
This script will automatically:
1. Place a new order via the producer endpoint.
2. Wait for both consumers to process the event.
3. Query the analytics endpoint to inspect updated metrics.
4. Intentionally re-send the **exact same event ID**.
5. Verify that `AnalyticsConsumer` detects the duplicate and ignores it (idempotency verified).

---

### Option 2: Manual Testing via cURL

#### 1. Place an Order (Producer)
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-101",
    "customerEmail": "alice@example.com",
    "currency": "USD",
    "totalAmount": 129.98,
    "items": [
      {
        "productId": "PROD-1",
        "name": "Mechanical Keyboard",
        "quantity": 1,
        "price": 99.99
      },
      {
        "productId": "PROD-2",
        "name": "Gaming Mousepad",
        "quantity": 1,
        "price": 29.99
      }
    ]
  }'
```

**Expected Response (`202 Accepted`)**:
```json
{
  "status": "ACCEPTED",
  "message": "Order placement event dispatched asynchronously",
  "orderId": "ORD-XXXXXXXX",
  "eventId": "e9b2a123-5e92-4f18-b8d4-59e51c8632bf",
  "timestamp": "2026-10-12T10:15:30Z"
}
```

**Console Output**:
* `[NotificationConsumer]` logs email/SMS notification dispatch.
* `[AnalyticsConsumer]` logs order recorded: `Total Orders Count: 1`, `Total Revenue: 129.98`.

---

#### 2. Query Analytics
```bash
curl http://localhost:8080/api/analytics
```

**Expected Response**:
```json
{
  "totalOrdersProcessed": 1,
  "duplicateEventsIgnored": 0,
  "totalRevenue": 129.98,
  "uniqueEventsTracked": 1
}
```

---

#### 3. Test Idempotency (Replay Duplicate Event)
Take the `eventId` returned from Step 1 and call the simulate duplicate endpoint:
```bash
curl -X POST http://localhost:8080/api/orders/simulate-duplicate/<eventId-from-step-1>
```

**Console Output**:
```text
⚠️ [AnalyticsConsumer] IDEMPOTENCY GUARD TRIGGERED! Event ID '...' has ALREADY been processed. Skipping to avoid duplicate analytics recording.
```

**Verify Analytics (Zero side effects on state)**:
```bash
curl http://localhost:8080/api/analytics
```
```json
{
  "totalOrdersProcessed": 1,
  "duplicateEventsIgnored": 1,
  "totalRevenue": 129.98,
  "uniqueEventsTracked": 1
}
```
`duplicateEventsIgnored` increments to `1`, but `totalOrdersProcessed` and `totalRevenue` remain unchanged, proving idempotency.

---

## 📖 Architectural Details
For the in-depth architectural flow diagram and decoupling comparison with synchronous Request/Response models, please refer to:
👉 [**`order-notification-system/ARCHITECTURE.md`**](ARCHITECTURE.md)
