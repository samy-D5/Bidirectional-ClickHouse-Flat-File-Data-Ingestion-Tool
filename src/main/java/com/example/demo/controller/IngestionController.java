package com.example.demo.controller;

import com.example.demo.service.ClickHouseService;
import com.example.demo.service.FlatFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ingestion")
@CrossOrigin(origins = "*")
public class IngestionController {

    @Autowired
    private ClickHouseService clickHouseService;

    @Autowired
    private FlatFileService flatFileService;

    @GetMapping("/columns")
    public ResponseEntity<?> getTableColumns(
            @RequestParam String clickhouseUrl,
            @RequestParam(required = false) String jwtToken,
            @RequestParam String database,
            @RequestParam String table) {
        try {
            return ResponseEntity.ok(clickHouseService.getTableColumns(clickhouseUrl, jwtToken, database, table));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/tables")
    public ResponseEntity<?> getTables(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database) {
        try {
            return ResponseEntity.ok(clickHouseService.getTables(clickhouseUrl, jwtToken, database));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/clickhouse-to-file")
    public ResponseEntity<?> clickhouseToFile(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam String table) {
        try {
            int count = clickHouseService.exportTableToCSV(clickhouseUrl, jwtToken, database, table);
            return ResponseEntity.ok("Successfully exported " + count + " rows to file!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/clickhouse-to-file-selective")
    public ResponseEntity<?> clickhouseToFileSelective(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam String table,
            @RequestParam List<String> columns) {
        try {
            int count = clickHouseService.exportSelectiveColumnsToCSV(clickhouseUrl, jwtToken, database, table, columns);
            return ResponseEntity.ok("Successfully exported " + count + " rows with selected columns to file!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/file-to-clickhouse")
    public ResponseEntity<?> fileToClickhouse(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam String table,
            @RequestParam("file") MultipartFile file) {
        try {
            int count = flatFileService.importCSVToClickHouse(clickhouseUrl, jwtToken, database, table, file);
            return ResponseEntity.ok("Successfully ingested " + count + " rows into ClickHouse!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/file-to-clickhouse-selective")
    public ResponseEntity<?> fileToClickhouseSelective(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam String table,
            @RequestParam("file") MultipartFile file,
            @RequestParam List<String> columns) {
        try {
            int count = flatFileService.importSelectiveCSVToClickHouse(clickhouseUrl, jwtToken, database, table, file, columns);
            return ResponseEntity.ok("Successfully ingested " + count + " rows with selected columns into ClickHouse!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/preview-clickhouse")
    public ResponseEntity<?> previewClickHouse(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam String table,
            @RequestParam(required = false) List<String> columns,
            @RequestParam(defaultValue = "100") int limit) {
        try {
            return ResponseEntity.ok(clickHouseService.previewData(clickhouseUrl, jwtToken, database, table, columns, limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/preview-file")
    public ResponseEntity<?> previewFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "100") int limit) {
        try {
            return ResponseEntity.ok(flatFileService.previewCSV(file, limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/get-csv-headers")
    public ResponseEntity<?> getCSVHeaders(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(flatFileService.getCSVHeaders(file));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/clickhouse-join-to-file")
    public ResponseEntity<?> clickhouseJoinToFile(
            @RequestParam String clickhouseUrl,
            @RequestParam String jwtToken,
            @RequestParam String database,
            @RequestParam List<String> tables,
            @RequestParam Map<String, String> joinConditions,
            @RequestParam List<String> columns) {
        try {
            int count = clickHouseService.exportJoinedTablesToCSV(clickhouseUrl, jwtToken, database, tables, joinConditions, columns);
            return ResponseEntity.ok("Successfully exported " + count + " rows from joined tables to file!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
