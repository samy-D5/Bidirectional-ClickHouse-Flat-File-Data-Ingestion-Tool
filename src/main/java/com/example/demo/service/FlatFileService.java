package com.example.demo.service;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Service
public class FlatFileService {

    public int importCSVToClickHouse(String url, String jwt, String database, String table, MultipartFile file) throws Exception {
        int rowCount = 0;
        try (Connection conn = getConnection(url, jwt);
             CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {

            String[] headers = reader.readNext();
            if (headers == null) throw new Exception("Empty CSV file!");

            StringBuilder sb = new StringBuilder();
            sb.append("INSERT INTO ").append(database).append(".").append(table).append(" (");
            for (int i = 0; i < headers.length; i++) {
                sb.append(headers[i]);
                if (i < headers.length - 1) sb.append(",");
            }
            sb.append(") VALUES (");
            for (int i = 0; i < headers.length; i++) {
                sb.append("?");
                if (i < headers.length - 1) sb.append(",");
            }
            sb.append(")");

            PreparedStatement ps = conn.prepareStatement(sb.toString());

            String[] line;
            while ((line = reader.readNext()) != null) {
                for (int i = 0; i < line.length; i++) {
                    ps.setString(i + 1, line[i]);
                }
                ps.addBatch();
                rowCount++;
            }

            ps.executeBatch();
        }
        return rowCount;
    }
    
    // New method to import specific columns only
    public int importSelectiveCSVToClickHouse(String url, String jwt, String database, String table, 
                                            MultipartFile file, List<String> selectedColumns) throws Exception {
        int rowCount = 0;
        try (Connection conn = getConnection(url, jwt);
             CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {

            String[] headers = reader.readNext();
            if (headers == null) throw new Exception("Empty CSV file!");
            
            // Map selected columns to their indices in the CSV
            Map<Integer, String> selectedColumnIndices = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                if (selectedColumns.contains(headers[i])) {
                    selectedColumnIndices.put(i, headers[i]);
                }
            }
            
            if (selectedColumnIndices.isEmpty()) {
                throw new Exception("None of the selected columns match the CSV headers!");
            }
            
            // Build the insert query with only selected columns
            StringBuilder sb = new StringBuilder();
            sb.append("INSERT INTO ").append(database).append(".").append(table).append(" (");
            
            int columnIndex = 0;
            for (String column : selectedColumnIndices.values()) {
                sb.append(column);
                if (columnIndex < selectedColumnIndices.size() - 1) sb.append(",");
                columnIndex++;
            }
            
            sb.append(") VALUES (");
            for (int i = 0; i < selectedColumnIndices.size(); i++) {
                sb.append("?");
                if (i < selectedColumnIndices.size() - 1) sb.append(",");
            }
            sb.append(")");

            PreparedStatement ps = conn.prepareStatement(sb.toString());

            String[] line;
            while ((line = reader.readNext()) != null) {
                int paramIndex = 1;
                for (Integer index : selectedColumnIndices.keySet()) {
                    if (index < line.length) {
                        ps.setString(paramIndex++, line[index]);
                    } else {
                        ps.setString(paramIndex++, ""); // Default value for missing data
                    }
                }
                ps.addBatch();
                rowCount++;
                
                // Execute batch every 1000 rows for better performance
                if (rowCount % 1000 == 0) {
                    ps.executeBatch();
                }
            }
            
            // Execute remaining batch
            ps.executeBatch();
        }
        return rowCount;
    }
    
    // New method to preview CSV data
    public List<Map<String, String>> previewCSV(MultipartFile file, int limit) throws Exception {
        List<Map<String, String>> previewData = new ArrayList<>();
        
        try (CSVReader reader = new CSVReaderBuilder(new InputStreamReader(file.getInputStream())).build()) {
            String[] headers = reader.readNext();
            if (headers == null) throw new Exception("Empty CSV file!");
            
            String[] line;
            int count = 0;
            while ((line = reader.readNext()) != null && count < limit) {
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    if (i < line.length) {
                        row.put(headers[i], line[i]);
                    } else {
                        row.put(headers[i], ""); // Default value for missing data
                    }
                }
                previewData.add(row);
                count++;
            }
        }
        
        return previewData;
    }
    
    // Method to get headers from CSV file
    public List<String> getCSVHeaders(MultipartFile file) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = reader.readNext();
            if (headers == null) throw new Exception("Empty CSV file!");
            return Arrays.asList(headers);
        }
    }

    private Connection getConnection(String url, String jwt) throws Exception {
        return DriverManager.getConnection(url + "?user=default&password=" + jwt);
    }
}