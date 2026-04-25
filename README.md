# Project Management System

PManager is a backend application for a project management system, developed as a hands-on learning project to practice and solidify core backend development concepts. It provides a RESTful API for managing projects, tasks, and members, with a focus on clean architecture and best practices.
<br>

##  Features

*   **Project Management**: Full CRUD (Create, Read, Update, Delete) operations for projects.
*   **Task Management**: Full CRUD operations for tasks, including assignment to members and association with projects.
*   **Member Management**: CRUD operations for team members who can be assigned to projects.
*   **API Key Authentication**: Secure endpoints using a custom API key authentication mechanism.
*   **API Key Lifecycle**: Endpoints to create and revoke API keys.
*   **Advanced Filtering & Pagination**: Search and filter tasks by project, member, status, or title with paginated results.
*   **Data Validation**: Robust validation on incoming request data to ensure data integrity.
*   **Dual-Database Architecture**: Utilizes MySQL for relational data (projects, tasks, members) and MongoDB for document-based data (API keys).

## Tech Stack

*   **Framework**: Spring Boot
*   **Language**: Java 21
*   **Build Tool**: Maven
*   **Databases**:
    *   MySQL (for core application data via Spring Data JPA)
    *   MongoDB (for storing API keys via Spring Data MongoDB)
*   **API & Web**: Spring Web (for REST controllers)
*   **Security**: Spring Security (for custom API key authentication)
*   **Utilities**: Lombok

## Architecture

The application is structured using a layered architecture to separate concerns and improve maintainability:

-   **Domain Layer**: Contains the core business logic, including entities (`Project`, `Task`, `Member`), documents (`ApiKey`), repositories, and application services that orchestrate the business rules.
-   **Infrastructure Layer**: Handles all technical concerns, including:
    -   `controller`: Exposes the REST API endpoints.
    -   `dto`: Data Transfer Objects for API requests and responses.
    -   `security`: Implements the API key authentication filter and service.
    -   `config`: Application and security configuration.
    -   `exception`: Global exception handling for creating consistent error responses.

## Getting Started

### Prerequisites

*   Java 21 or later
*   Maven
*   MySQL Server
*   MongoDB Server

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/tadeun1/projectmanager-project.git
    cd projectmanager-project
    ```

2.  **Configure the application:**
    Open `src/main/resources/application.yml` and update the database connection details for both MongoDB and MySQL.

    ```yaml
    spring:
      data:
        mongodb:
          host: localhost
          port: 27017
          database: pmanagerdb
      datasource:
        url: jdbc:mysql://localhost:3306/pmanagerdb
        username: your-mysql-username
        password: your-mysql-password
    app:
      security:
        masterApiKey: thekey # You can change the master API key here
    ```

3.  **Run the application:**
    ```sh
    ./mvnw spring-boot:run
    ```
    The application will start on `http://localhost:8080`.

## API Usage

All API requests must be authenticated using an API key provided in the `x-api-key` header.

### Authentication

You can use the master API key defined in `application.yml` (default: `thekey`) or generate new API keys via the API.

**Example Request:**
```sh
curl -X GET 'http://localhost:8080/projects' \
-H 'x-api-key: thekey'
```

### API Endpoints

The following are the primary resources exposed by the API:

| Resource        | Base Path         | Description                                     |
| --------------- | ----------------- | ----------------------------------------------- |
| Projects        | `/projects`       | Manage projects.                                |
| Members         | `/members`        | Manage team members.                            |
| Tasks           | `/tasks`          | Manage tasks. Supports filtering and pagination.|
| API Keys        | `/apiKeys`        | Generate and revoke API keys.                   |

#### Task Filtering

The `/tasks` endpoint supports the following query parameters for filtering and pagination:

*   `projectId`: Filter tasks by project ID.
*   `memberId`: Filter tasks by the assigned member's ID.
*   `status`: Filter by task status (`PENDING`, `IN_PROGRESS`, `FINISHED`).
*   `partialTitle`: Search for tasks with a matching title.
*   `page`: The page number for pagination (0-indexed).
*   `direction`: Sort direction (`ASC` or `DESC`).
*   `sort`: Comma-separated list of properties to sort by (e.g., `title,status`).
