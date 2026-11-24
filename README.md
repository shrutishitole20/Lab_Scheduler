# 🏥 Lab Sample Scheduler

A high-performance laboratory sample scheduling and SLA monitoring system built with **Java 17**, **Spring Boot 3.3.5**, **MySQL 8.0**, and a responsive **Bootstrap 5 Single-Page Web Application**.

---

## 📌 Project Overview

In clinical and diagnostic laboratories, medical samples (Blood, Urine, Thyroid, etc.) arrive continuously with varying urgency tiers (Emergency, High, Normal). Processing equipment has strict physical constraints: limited parallel slots, specific diagnostic capabilities, and occasional maintenance downtimes.

The **Lab Sample Scheduler** solves this optimization challenge by implementing a deterministic **4-tier Priority Queue scheduling algorithm**. It guarantees that critical life-threatening samples are prioritized, turnaround deadlines are enforced, machine capacity is maximized without preemption, and all lifecycle events are permanently audited in a relational database.

---

## ✨ Key Features

- **Priority Queue Scheduling**: Orders samples by Priority Rank (Emergency > High > Normal), earlier deadline, arrival time (FIFO), and deterministic ID tie-breaking.
- **Dynamic Machine Dispatch**: Automatically pairs queued samples with available, capable machines (`currentLoad < capacity`).
- **Non-Preemptive Execution**: In-progress samples are never interrupted or evicted when an emergency sample arrives.
- **SLA & Delay Tracking**:
  - 🟢 **On Track**: Normal processing time elapsed.
  - 🟡 **Approaching**: $\ge 80\%$ of target turnaround time elapsed.
  - 🔴 **Overdue**: Current time exceeds deadline ($receivedTime + targetMinutes$).
- **Machine Availability Management**: Supports marking machines DOWN for maintenance; active samples continue processing while pending samples automatically route to alternative compatible machines.
- **Hold & Release Lifecycle**: Move stalled or flagged samples to `ON_HOLD` (removing them from queue) and release them back to `QUEUED`.
- **Database Persistence**: Complete JDBC DAO layer using `PreparedStatement` preventing SQL injection with full audit logging in `sample_history`.
- **Role-Based Security**: Spring Security with HTTP Basic Auth protecting REST endpoints (`ADMIN` vs `STAFF`).
- **Live Bootstrap 5 Web UI**:
  - Real-time dashboard with auto-refresh every 10 seconds.
  - Visual color highlights for SLA warnings (Red for Overdue, Yellow for Approaching).
  - One-click action buttons (Complete, Hold, Release, Machine Up/Down, History).
  - Admin-only management console for machines, priorities, and test types.
  - Daily performance reporting with date picker and summary metrics.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Language & Runtime** | Java 17 (LTS), OpenJDK |
| **Backend Framework** | Spring Boot 3.3.5, Spring MVC, Spring Security |
| **Persistence / Database** | MySQL 8.0+, JDBC, `PreparedStatement`, `mysql-connector-j` 8.4.0 |
| **Testing** | JUnit 5 (Jupiter), Spring Security Test |
| **Frontend UI** | HTML5, CSS3, JavaScript (Fetch API), Bootstrap 5.3, Bootstrap Icons |
| **Build & Tooling** | Apache Maven 3.8+, Maven Wrapper (`mvnw`) |

---

## 🗄️ Database Setup

1. **Prerequisites**: Ensure MySQL 8.0+ server is running on `localhost:3306`.
2. **Execute the Schema Script**:
   - Open **MySQL Workbench** and connect to your instance.
   - Go to **`File` $\rightarrow$ `Open SQL Script...`** and select:
     ```text
     lab-scheduler/database/schema.sql
     ```
   - Click the **Execute** button (⚡) or press `Ctrl + Shift + Enter`.
   - The script creates the `lab_scheduler` database, all 7 tables with primary/foreign keys and indexes, and seeds initial data (3 priorities, 3 test types, 2 machines, 2 users, and 5 samples `S001`-`S005`).

---

## ⚙️ Configuration (`config.properties`)

The application securely loads database credentials from `src/main/resources/config.properties`, which is excluded from version control via `.gitignore`.

1. Copy the example configuration template:
   ```bash
   cp src/main/resources/config.properties.example src/main/resources/config.properties
   ```
2. Open `src/main/resources/config.properties` and enter your MySQL root password:
   ```properties
   db.url=jdbc:mysql://localhost:3306/lab_scheduler?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   db.user=root
   db.password=YOUR_MYSQL_ROOT_PASSWORD
   ```

---

## 🚀 How to Build and Run

### 1. Run the Spring Boot Web Application (Recommended)
```powershell
cd lab-scheduler
mvn clean compile spring-boot:run
```
Once started, open your browser and navigate to:
```text
http://localhost:8080/
```

### 2. Run the Standalone CLI Demo
To run the automated terminal simulation demonstrating PriorityQueue dispatching and machine allocation:
```powershell
mvn clean compile exec:java
```

---

## 🔐 Default Login Accounts

| Username | Password | Roles | Capabilities |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | `ADMIN`, `STAFF` | Full access: View dashboard, register/complete samples, toggle machines, and manage Admin Panel (Add Machines, Priorities, Test Types). |
| **`staff`** | `staff123` | `STAFF` | Daily laboratory operations: View dashboard, register samples, complete/hold/release samples, toggle machine status. Admin settings are hidden. |

---

## 🧪 How to Run Tests

The test suite runs deterministically with **zero real-time waiting** using fixed timestamp calculations.

```powershell
# Run all unit and integration test suites
mvn test

# Run only the 7 core scheduling policy tests
mvn test -Dtest=SchedulerServiceTest
```

---

## 📁 Project Directory Structure

```text
lab-scheduler/
├── database/
│   └── schema.sql                          # MySQL database DDL schema and seed data
├── docs/
│   ├── EXPLANATION.md                      # Plain-English technical explanations
│   ├── TEST_CASES.md                       # Detailed table of the test cases
│   └── DEMO_SCRIPT.md                      # 5-minute step-by-step demonstration guide
├── src/
│   ├── main/
│   │   ├── java/com/lab/
│   │   │   ├── LabSchedulerApplication.java # Spring Boot application entry point
│   │   │   ├── Main.java                    # Standalone terminal simulation runner
│   │   │   ├── config/                      # Spring Security & App configuration (SecurityConfig)
│   │   │   ├── controller/                  # REST Controllers (Admin, Auth, Machine, Queue, Report, Sample)
│   │   │   ├── dto/                         # Request & Response Data Transfer Objects
│   │   │   ├── enums/                       # Domain enumerations (Priority, Status, DelayStatus)
│   │   │   ├── exception/                   # Custom business exceptions & GlobalExceptionHandler
│   │   │   ├── model/                       # Domain entities (Sample, Machine, User, HistoryEntry, etc.)
│   │   │   ├── repository/                  # Database repository layer with JDBC PreparedStatements
│   │   │   ├── scheduler/                   # Core scheduling engine (SchedulerEngine & SampleComparator)
│   │   │   ├── service/                     # Business services (SchedulerService, AdminService, ReportService)
│   │   │   ├── util/                        # DBConnection (with env vars) & DateTime utilities
│   │   │   └── dao/                         # Backward-compatible repository adapters
│   │   └── resources/
│   │       ├── application.properties       # Server, DataSource & Jackson settings
│   │       ├── config.properties.example    # Configuration template
│   │       ├── config.properties            # Active local configuration (in .gitignore)
│   │       └── static/                      # Single-page web UI (index.html, app.js, style.css)
│   └── test/java/com/lab/                   # Comprehensive JUnit 5 test suites (58 unit & integration tests)
├── Lab_Scheduler_APIs.postman_collection.json # Complete Postman API testing collection
├── pom.xml                                  # Maven project configuration
└── .gitignore                               # Git ignore rules
```

---

## 📚 In-Depth Documentation

Detailed operational guides are available in the `docs/` directory:

1. **[docs/EXPLANATION.md](file:///c:/Users/shruti%20shitole/Downloads/lab-scheduler/lab-scheduler/docs/EXPLANATION.md)**: Explains the 4-tier queue ordering policy, why `PriorityQueue` was chosen, how machine assignment works, non-preemptive execution rules, and how delay status is tracked.
2. **[docs/TEST_CASES.md](file:///c:/Users/shruti%20shitole/Downloads/lab-scheduler/lab-scheduler/docs/TEST_CASES.md)**: Comprehensive table of the 7 JUnit 5 test cases detailing test objectives, inputs, expected vs. actual results, and core invariant proofs.
3. **[docs/DEMO_SCRIPT.md](file:///c:/Users/shruti%20shitole/Downloads/lab-scheduler/lab-scheduler/docs/DEMO_SCRIPT.md)**: Step-by-step minute-by-minute presentation script for a 5-minute live demonstration covering login, priority jumping, failover, and admin console.

