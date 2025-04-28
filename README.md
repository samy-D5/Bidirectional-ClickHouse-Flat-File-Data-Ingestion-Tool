# Zeotap Assignment

A simple backend and frontend portal to:

- Fetch table columns from ClickHouse
- Export ClickHouse tables to a CSV file
- Upload CSV files into a ClickHouse table

## Backend

- Spring Boot Java Application
- Exposes 3 APIs under `/api/ingestion`
- ClickHouse JDBC connection with JWT-based simple authentication

## Frontend

- HTML, CSS, JavaScript
- Simple single-page application (SPA)
- Three sections: Get Columns, Export Table, Upload CSV

## Setup

1. Start the Spring Boot backend (port 8080).
2. Open `index.html` in any browser.
3. Interact with the APIs easily!

---
