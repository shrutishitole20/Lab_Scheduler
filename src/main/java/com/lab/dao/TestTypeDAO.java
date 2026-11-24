package com.lab.dao;

import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class TestTypeDAO {

    public int findOrInsert(String name) {
        if (name == null || name.trim().isEmpty()) {
            return 1;
        }
        String cleanName = name.trim();

        String selectSql = "SELECT id FROM test_types WHERE LOWER(name) = LOWER(?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(selectSql)) {

            stmt.setString(1, cleanName);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("id");
                }
            }

            String insertSql = "INSERT INTO test_types (name) VALUES (?)";
            try (PreparedStatement insStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insStmt.setString(1, cleanName);
                insStmt.executeUpdate();
                try (ResultSet keys = insStmt.getGeneratedKeys()) {
                    if (keys.next()) {
                        return keys.getInt(1);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("TestTypeDAO error resolving '" + name + "': " + e.getMessage());
        }
        return 1;
    }

    public List<String> findAllNames() {
        List<String> list = new ArrayList<>();
        String sql = "SELECT name FROM test_types ORDER BY id ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(rs.getString("name"));
            }
        } catch (SQLException e) {
            System.err.println("TestTypeDAO.findAllNames error: " + e.getMessage());
        }
        return list;
    }

    public Map<Integer, String> findAll() {
        Map<Integer, String> map = new LinkedHashMap<>();
        String sql = "SELECT id, name FROM test_types ORDER BY id ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                map.put(rs.getInt("id"), rs.getString("name"));
            }
        } catch (SQLException e) {
            System.err.println("TestTypeDAO.findAll error: " + e.getMessage());
        }
        return map;
    }
}
