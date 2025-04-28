# Bidirectional ClickHouse & Flat File Data Ingestion Tool

A web-based application that facilitates data transfer between ClickHouse databases and flat files (CSV). This tool supports bidirectional data flow, selective column ingestion, data preview, and multi-table join operations.

## Features

- **Bidirectional Data Flow**: 
  - ClickHouse to Flat File export
  - Flat File to ClickHouse import
  
- **Connection Management**:
  - ClickHouse connection with JWT token authentication
  - Support for different database configurations
  
- **Data Selection**:
  - Table selection (for ClickHouse source)
  - Column selection for partial data ingestion
  - Data preview before ingestion (up to 100 records)
  
- **Advanced Features**:
  - Multi-table JOIN operations for ClickHouse source
  - Progress tracking during ingestion
  - Detailed completion reporting
  - Error handling with user-friendly messages

## Technology Stack

- **Backend**: Java with Spring Boot
- **Frontend**: HTML, CSS, JavaScript with Bootstrap 5
- **Database**: ClickHouse
- **Libraries**:
  - OpenCSV for CSV parsing
  - ClickHouse JDBC driver for database connectivity

## Setup Instructions

### Prerequisites

- Java 11 or higher
- Maven
- Docker (for running ClickHouse locally)

### Running ClickHouse with Docker

The project includes a `docker-compose.yml` file to run ClickHouse locally:

```bash
docker-compose up -d
```

This will start a ClickHouse server accessible at `localhost:8123` with default user credentials.

### Building the Application

```bash
mvn clean package
```

### Running the Application

```bash
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

The application will be available at http://localhost:8080

## Usage Guide

### 1. Source Selection

Start by selecting your data source (ClickHouse or Flat File) using the radio buttons at the top of the interface.

### 2. Connection Settings

#### For ClickHouse Source:
- Enter Host (e.g., localhost)
- Enter Port (default: 8123)
- Specify Database name
- Enter JWT Token for authentication (if required)

#### For Flat File Source:
- Upload a CSV file
- Select delimiter type (comma, semicolon, tab, or pipe)

### 3. Table and Column Selection

- For ClickHouse source: Select a table from the dropdown menu and click "Load Columns"
- For Flat File source: Columns will be automatically loaded from the CSV headers
- Use checkboxes to select specific columns for ingestion

### 4. Multi-Table Join (Optional)

- Enable the "Multi-Table Join" switch
- Add additional tables using the "Add Another Table" button
- Define join conditions between tables (e.g., `table1.id = table2.foreign_id`)
- Click "Load Columns from Joined Tables" to proceed

### 5. Data Preview

Click the "Preview Data" button to see up to 100 rows of data with your selected columns before ingestion.

### 6. Target Configuration

For Flat File to ClickHouse ingestion, configure the target ClickHouse connection:
- Host, Port, Database
- Table name
- JWT Token (if required)

### 7. Data Ingestion

Click "Start Ingestion" to begin the data transfer process. A progress bar will show the status, and upon completion, the total number of records processed will be displayed.

## Example Use Cases

### Export from ClickHouse to CSV

1. Select "ClickHouse" as source
2. Connect to your ClickHouse database
3. Select a table and columns
4. Preview data (optional)
5. Start ingestion
6. The exported data will be saved as `output.csv` (or `joined_output.csv` for joins)

### Import from CSV to ClickHouse

1. Select "Flat File" as source
2. Upload your CSV file
3. Select columns to import
4. Configure target ClickHouse connection
5. Start ingestion
6. Verify the record count in the results area

## Testing

The application can be tested with example datasets from ClickHouse:

- UK Property Price Paid dataset (`uk_price_paid`)
- Airline On-time Performance dataset (`ontime`)

You can load these datasets into your ClickHouse instance following the [ClickHouse Example Datasets](https://clickhouse.com/docs/getting-started/example-datasets) documentation.

## Architecture Overview

The application follows a layered architecture:

- **Controller Layer**: REST endpoints for UI communication
- **Service Layer**: Business logic for data processing
- **Utility Layer**: Helper functions for CSV operations

### Main Components:

- `IngestionController`: HTTP endpoints for all operations
- `ClickHouseService`: Logic for ClickHouse connections and queries
- `FlatFileService`: CSV file processing and importing
- `CSVUtil`: Utility methods for CSV operations

## Error Handling

The application includes comprehensive error handling:
- Connection failures
- Authentication issues
- File format problems
- Data type mismatches

All errors are returned with descriptive messages to the UI.

## Performance Considerations

- Batch processing for large CSV imports
- Optimized JOIN operations
- Selective column ingestion to reduce data transfer
