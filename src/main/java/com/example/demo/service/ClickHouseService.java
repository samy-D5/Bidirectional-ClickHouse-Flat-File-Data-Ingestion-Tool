package com.example.demo.service;

import org.springframework.stereotype.Service;
import com.example.demo.util.CSVUtil;

import java.sql.*;
import java.util.*;

@Service
public class ClickHouseService {

    public List<String> getTableColumns(String url, String jwt, String database, String table) throws SQLException {
        List<String> columns = new ArrayList<>();
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement("DESCRIBE TABLE " + database + "." + table);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                columns.add(rs.getString("name"));
            }
        }
        return columns;
    }

    public int exportTableToCSV(String url, String jwt, String database, String table) throws Exception {
        int rowCount = 0;
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM " + database + "." + table);
             ResultSet rs = stmt.executeQuery()) {

            rowCount = CSVUtil.writeResultSetToCSV(rs, "output.csv");
        }
        return rowCount;
    }
    
    // New method for selective column export
    public int exportSelectiveColumnsToCSV(String url, String jwt, String database, String table, List<String> columns) throws Exception {
        int rowCount = 0;
        
        // Construct the SELECT statement with only the selected columns
        StringBuilder selectQuery = new StringBuilder("SELECT ");
        for (int i = 0; i < columns.size(); i++) {
            selectQuery.append(columns.get(i));
            if (i < columns.size() - 1) {
                selectQuery.append(", ");
            }
        }
        selectQuery.append(" FROM ").append(database).append(".").append(table);
        
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement(selectQuery.toString());
             ResultSet rs = stmt.executeQuery()) {

            rowCount = CSVUtil.writeResultSetToCSV(rs, "output.csv");
        }
        return rowCount;
    }
    
    // New method for previewing data
    public List<Map<String, Object>> previewData(String url, String jwt, String database, String table, List<String> columns, int limit) throws SQLException {
        List<Map<String, Object>> previewData = new ArrayList<>();
        
        // Construct the SELECT statement for preview
        StringBuilder selectQuery = new StringBuilder("SELECT ");
        if (columns != null && !columns.isEmpty()) {
            for (int i = 0; i < columns.size(); i++) {
                selectQuery.append(columns.get(i));
                if (i < columns.size() - 1) {
                    selectQuery.append(", ");
                }
            }
        } else {
            selectQuery.append("*");
        }
        selectQuery.append(" FROM ").append(database).append(".").append(table)
                  .append(" LIMIT ").append(limit);
        
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement(selectQuery.toString());
             ResultSet rs = stmt.executeQuery()) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();
            
            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.put(metaData.getColumnName(i), rs.getObject(i));
                }
                previewData.add(row);
            }
        }
        return previewData;
    }
    
    // Method for multi-table join (bonus feature)
    public int exportJoinedTablesToCSV(String url, String jwt, String database, List<String> tables, 
                                     Map<String, String> joinConditions, List<String> columns) throws Exception {
        int rowCount = 0;
        
        // Construct the JOIN query
        StringBuilder joinQuery = new StringBuilder("SELECT ");
        
        // Add selected columns
        for (int i = 0; i < columns.size(); i++) {
            joinQuery.append(columns.get(i));
            if (i < columns.size() - 1) {
                joinQuery.append(", ");
            }
        }
        
        // Add FROM clause with the first table
        joinQuery.append(" FROM ").append(database).append(".").append(tables.get(0));
        
        // Add JOIN clauses for subsequent tables
        for (int i = 1; i < tables.size(); i++) {
            joinQuery.append(" JOIN ").append(database).append(".").append(tables.get(i))
                    .append(" ON ").append(joinConditions.get(tables.get(i)));
        }
        
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement(joinQuery.toString());
             ResultSet rs = stmt.executeQuery()) {

            rowCount = CSVUtil.writeResultSetToCSV(rs, "joined_output.csv");
        }
        return rowCount;
    }
    
    // Method to get all tables in a database
    public List<String> getTables(String url, String jwt, String database) throws SQLException {
        List<String> tables = new ArrayList<>();
        String query = "SHOW TABLES FROM " + database;
        
        try (Connection conn = getConnection(url, jwt);
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
        }
        return tables;
    }

    private Connection getConnection(String url, String jwt) throws SQLException {
        return DriverManager.getConnection(url + "?user=default&password=" + jwt);
    }
}