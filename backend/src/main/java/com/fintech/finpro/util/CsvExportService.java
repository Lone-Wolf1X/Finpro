package com.fintech.finpro.util;

import com.fintech.finpro.dto.AccountStatementDTO;
import com.fintech.finpro.dto.BankTransactionDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CsvExportService {

    private static final String CSV_HEADER = "Date,Transaction ID,Description,Reference,Type,Amount,Status\n";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateStatementCsv(AccountStatementDTO statement) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
                PrintWriter writer = new PrintWriter(out)) {

            // Write Header
            writer.write(CSV_HEADER);

            // Write Rows
            List<BankTransactionDTO> transactions = statement.getTransactions();
            if (transactions != null) {
                for (BankTransactionDTO txn : transactions) {
                    writer.write(escapeSpecialCharacters(txn.getDate().format(DATE_FORMATTER)));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(String.valueOf(txn.getId())));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(txn.getDescription()));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(txn.getReferenceId()));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(txn.getType()));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(String.valueOf(txn.getAmount())));
                    writer.write(",");
                    writer.write(escapeSpecialCharacters(txn.getStatus()));
                    writer.write("\n");
                }
            }

            writer.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV export", e);
        }
    }

    private String escapeSpecialCharacters(String data) {
        if (data == null) {
            return "";
        }
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
