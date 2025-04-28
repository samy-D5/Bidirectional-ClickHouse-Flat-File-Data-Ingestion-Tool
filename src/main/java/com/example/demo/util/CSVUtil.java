package com.example.demo.util;

import java.io.FileWriter;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;

public class CSVUtil {

    public static int writeResultSetToCSV(ResultSet rs, String filePath) throws Exception {
        int rowCount = 0;
        try (FileWriter writer = new FileWriter(filePath)) {
            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            // Write header
            for (int i = 1; i <= colCount; i++) {
                writer.append(meta.getColumnName(i));
                if (i < colCount) writer.append(",");
            }
            writer.append("\n");

            // Write data
            while (rs.next()) {
                for (int i = 1; i <= colCount; i++) {
                    writer.append(rs.getString(i));
                    if (i < colCount) writer.append(",");
                }
                writer.append("\n");
                rowCount++;
            }
        }
        return rowCount;
    }
}
