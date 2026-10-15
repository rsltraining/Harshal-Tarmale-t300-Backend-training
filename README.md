# Event-Driven Architecture (EDA) - User Registration Fan-Out System

A full-stack demonstration of the **Publish-Subscribe (Pub/Sub) Fan-Out pattern** using **Spring Boot** (Java 17) for the backend and **React + Vite** for the frontend.

This project demonstrates how a user registration event triggers multiple independent subscribers (**Email Service** and **Audit Service**) asynchronously, without blocking the core registration API response.

Both **In-Memory (Spring ApplicationEventPublisher)** and **Real Message Broker (RabbitMQ Fanout Exchange)** approaches are implemented and run side-by-side.

---

## Architecture Overview

```text
                             ┌───► [Email Service Subscriber] ──► Prints Welcome Email
[Frontend / Client]          │     (In-Memory + RabbitMQ Queue)
        │                    │
   POST /api/register        │
        ▼                    │
[UserController (Publisher)] ┼───► Immediate HTTP 200 OK (returned in < 25ms)
        │                    │
        ▼                    │
[Fan-Out Event Bus / Broker] └───► [Audit Service Subscriber] ──► Prints Audit Timestamp
                                   (In-Memory + RabbitMQ Queue)
```

1. **Client** sends `POST /api/register` with `name` and `email`.
2. **UserController (Publisher)** publishes a `user.registered` event and returns an immediate `200 OK` response to the client.
3. **Email Service** receives a copy of the event and simulates sending an email:
   `[EMAIL SERVICE] Sending Welcome Email to [User Name] ([Email])`
4. **Audit Service** receives the same event simultaneously and logs it:
   `[AUDIT SERVICE] Logging: New user signed up at [Timestamp]`

---

## Tech Stack

- **Backend**: Java 17, Spring Boot, Spring AMQP (RabbitMQ), Spring Web
- **Message Broker**: RabbitMQ 3.x (with Management Plugin) via Docker
- **In-Memory Bus**: Spring `@EventListener` with `@Async` thread pool
- **Frontend**: React 18, Vite 5, Vanilla CSS

---

## Project Structure

```text
EDA_Pub_Sub/
├── eda_pubsub/                         # Spring Boot Backend
│   ├── src/main/java/com/example/eda_pubsub/
│   │   ├── config/
│   │   │   ├── AsyncConfig.java        # Enables @Async background thread execution
│   │   │   ├── RabbitMQConfig.java     # Declares FanoutExchange, Queues & Bindings
│   │   │   └── SecurityConfig.java     # Configures endpoint access
│   │   ├── controller/
│   │   │   └── UserController.java     # REST API endpoint (Publisher)
│   │   ├── dto/
│   │   │   ├── RegisterRequest.java    # Request payload { name, email }
│   │   │   └── ApiResponse.java        # Response payload { message, success }
│   │   ├── event/
│   │   │   └── UserRegisteredEvent.java# Event model
│   │   ├── inmemory/
│   │   │   ├── EmailEventListener.java # In-Memory Subscriber 1
│   │   │   └── AuditEventListener.java # In-Memory Subscriber 2
│   │   └── rabbitmq/
│   │       ├── RabbitMQEmailConsumer.java # RabbitMQ Subscriber 1
│   │       └── RabbitMQAuditConsumer.java # RabbitMQ Subscriber 2
│   ├── src/main/resources/
│   │   └── application.properties      # Port 8081 & RabbitMQ credentials
│   └── pom.xml
├── frontend/                           # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx                     # Registration form + Fan-out pipeline visualizer
│   │   └── App.css                     # Dark-mode styling
│   └── package.json
├── docker-compose.yml                  # RabbitMQ container definition
└── README.md
```

---

## Prerequisites

Make sure you have the following installed:
- **Java 17+** (`java -version`)
- **Maven** (or use the included `./mvnw` wrapper)
- **Node.js 18+** & **npm** (`node -v && npm -v`)
- **Docker Desktop** (`docker --version`)

---

## How to Run the Application

Run the components in the following order:

### 1. Start RabbitMQ (Docker)
From the project root directory:

```bash
docker compose up -d
```

- **AMQP Broker Port**: `localhost:5672`
- **Management Web UI**: [http://localhost:15672](http://localhost:15672) (Username: `guest` / Password: `guest`)

---

### 2. Start Spring Boot Backend
Navigate into `eda_pubsub` and start the server:

```bash
cd eda_pubsub
./mvnw spring-boot:run
```

The backend starts on **port 8081** (`http://localhost:8081`).
On startup, Spring Boot automatically connects to RabbitMQ and creates:
- Exchange: `user.fanout.exchange`
- Queues: `user.email.queue` and `user.audit.queue`
- Bindings between the exchange and queues.

---

### 3. Start React Frontend
In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## How to Trigger the API

### Method A: Via the React UI (Recommended)
1. Open [http://localhost:5173](http://localhost:5173).
2. Enter a Name and Email (or click any of the quick pre-fill buttons like **+ Alice**).
3. Click **"🚀 Register & Fire Fan-Out"**.
4. The UI displays an immediate success message and animates the fan-out pipeline across both subscriber services.

---

### Method B: Via cURL (Terminal)
You can also trigger the API directly without the frontend:

```bash
curl -X POST http://localhost:8081/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Wonderland", "email": "alice@example.com"}'
```

#### Expected HTTP Response (Immediate):
```json
{
  "message": "User registered successfully!",
  "success": true
}
```

---

### Expected Console Output (Spring Boot Terminal)

Whenever an event is published, the following logs appear in the backend console:

```text
[USER CONTROLLER] Processing registration for: Alice Wonderland

-- In-Memory Subscribers (Executed asynchronously via @Async):
[IN-MEMORY EMAIL SERVICE] Sending Welcome Email to Alice Wonderland (alice@example.com) [Thread: task-1]
[IN-MEMORY AUDIT SERVICE] Logging: New user signed up at 2026-10-15T15:43:00.123 [Thread: task-2]

-- RabbitMQ Broker Subscribers (Received from user.fanout.exchange):
[RABBITMQ EMAIL SERVICE] Sending Welcome Email to Alice Wonderland (alice@example.com)
[RABBITMQ AUDIT SERVICE] Logging: New user signed up at 2026-10-15T15:43:00.123
```

> **Key Takeaway:** Notice that `task-1` and `task-2` run on separate background threads. The HTTP response was sent back to the user before the email or audit actions finished, proving full decoupling.

---

## Verifying in RabbitMQ Dashboard

1. Navigate to [http://localhost:15672](http://localhost:15672) and sign in (`guest` / `guest`).
2. Go to the **Exchanges** tab and click `user.fanout.exchange`:
   - Under **Bindings**, see `user.email.queue` and `user.audit.queue` bound to this exchange.
3. Go to the **Queues** tab:
   - Notice both queues have `1` active consumer attached.
   - Message rates reflect each published registration event.

---

## How to Stop Everything

When you are done testing, run:

```bash
# 1. Stop RabbitMQ
docker compose down

# 2. Stop frontend & backend (Ctrl + C in their respective terminal windows)
```
