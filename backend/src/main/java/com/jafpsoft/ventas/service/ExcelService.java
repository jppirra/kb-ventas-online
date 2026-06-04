package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelService {

    // Expected columns (case-insensitive): nombre/name, descripcion/description, precio/price, sku, categoria/category
    public List<ProductRequest> parseProducts(MultipartFile file) throws IOException {
        List<ProductRequest> products = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row header = sheet.getRow(0);
            if (header == null) return products;

            int nameCol = -1, descCol = -1, priceCol = -1, skuCol = -1, categoryCol = -1;

            for (Cell cell : header) {
                String val = cell.getStringCellValue().trim().toLowerCase();
                int idx = cell.getColumnIndex();
                switch (val) {
                    case "nombre", "name" -> nameCol = idx;
                    case "descripcion", "descripción", "description" -> descCol = idx;
                    case "precio", "price" -> priceCol = idx;
                    case "sku" -> skuCol = idx;
                    case "categoria", "categoría", "category" -> categoryCol = idx;
                }
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String name = nameCol >= 0 ? getString(row.getCell(nameCol)) : null;
                if (name == null || name.isBlank()) continue;

                ProductRequest req = new ProductRequest();
                req.setName(name);
                req.setDescription(descCol >= 0 ? getString(row.getCell(descCol)) : null);
                req.setPrice(priceCol >= 0 ? getDecimal(row.getCell(priceCol)) : null);
                req.setSku(skuCol >= 0 ? getString(row.getCell(skuCol)) : null);
                req.setCategory(categoryCol >= 0 ? getString(row.getCell(categoryCol)) : null);
                req.setSortOrder(i);
                products.add(req);
            }
        }

        return products;
    }

    private String getString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private BigDecimal getDecimal(Cell cell) {
        if (cell == null) return null;
        try {
            return switch (cell.getCellType()) {
                case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
                case STRING -> new BigDecimal(cell.getStringCellValue().trim());
                default -> null;
            };
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
