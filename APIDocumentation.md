# API Documentation

This document outlines the REST API endpoints provided by the Bidirectional Data Ingestion Tool.

## Base URL

All endpoints are prefixed with `/api/ingestion`

## Authentication

ClickHouse authentication is handled via JWT tokens passed as request parameters. The application itself does not require authentication.

## Endpoints

### Table Operations

#### Get Tables
Retrieves all tables from a ClickHouse database.

```
GET /api/ingestion/tables
```

**Query Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name

**Response:**
- `200 OK`: List of table names
- `400 Bad Request`: Error message

#### Get Table Columns
Retrieves all columns for a specific table.

```
GET /api/ingestion/columns
```

**Query Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name

**Response:**
- `200 OK`: List of column names
- `400 Bad Request`: Error message

### Data Preview

#### Preview ClickHouse Data
Retrieves a preview of data from a ClickHouse table.

```
GET /api/ingestion/preview-clickhouse
```

**Query Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name
- `columns` (optional): List of column names to include
- `limit` (optional, default=100): Maximum number of records to return

**Response:**
- `200 OK`: List of records with column values
- `400 Bad Request`: Error message

#### Preview CSV File
Retrieves a preview of data from a CSV file.

```
POST /api/ingestion/preview-file
```

**Form Parameters:**
- `file` (required): CSV file to preview
- `limit` (optional, default=100): Maximum number of records to return

**Response:**
- `200 OK`: List of records with column values
- `400 Bad Request`: Error message

#### Get CSV Headers
Retrieves column headers from a CSV file.

```
POST /api/ingestion/get-csv-headers
```

**Form Parameters:**
- `file` (required): CSV file to analyze

**Response:**
- `200 OK`: List of column headers
- `400 Bad Request`: Error message

### Data Ingestion

#### ClickHouse to File (All Columns)
Exports all data from a ClickHouse table to a CSV file.

```
POST /api/ingestion/clickhouse-to-file
```

**Query Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name

**Response:**
- `200 OK`: Success message with row count
- `400 Bad Request`: Error message

#### ClickHouse to File (Selected Columns)
Exports selected columns from a ClickHouse table to a CSV file.

```
POST /api/ingestion/clickhouse-to-file-selective
```

**Query Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name
- `columns` (required): List of column names to include

**Response:**
- `200 OK`: Success message with row count
- `400 Bad Request`: Error message

#### File to ClickHouse (All Columns)
Imports data from a CSV file to a ClickHouse table.

```
POST /api/ingestion/file-to-clickhouse
```

**Form Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name
- `file` (required): CSV file to import

**Response:**
- `200 OK`: Success message with row count
- `400 Bad Request`: Error message

#### File to ClickHouse (Selected Columns)
Imports selected columns from a CSV file to a ClickHouse table.

```
POST /api/ingestion/file-to-clickhouse-selective
```

**Form Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `table` (required): Table name
- `file` (required): CSV file to import
- `columns` (required): List of column names to include

**Response:**
- `200 OK`: Success message with row count
- `400 Bad Request`: Error message

#### Multi-Table Join to File
Exports data from joined ClickHouse tables to a CSV file.

```
POST /api/ingestion/clickhouse-join-to-file
```

**Form Parameters:**
- `clickhouseUrl` (required): JDBC URL for ClickHouse connection
- `jwtToken` (required): JWT token for authentication
- `database` (required): Database name
- `tables` (required): List of table names
- `joinConditions` (required): Map of join conditions
- `columns` (required): List of columns to include

**Response:**
- `200 OK`: Success message with row count
- `400 Bad Request`: Error message

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` for successful operations
- `400 Bad Request` for validation errors or operation failures

Error responses include a message describing the issue to facilitate debugging.