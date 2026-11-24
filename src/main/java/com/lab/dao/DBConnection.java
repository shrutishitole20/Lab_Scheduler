package com.lab.dao;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DBConnection {

    private static final Properties properties = new Properties();
    private static boolean driverLoaded = false;

    static {
        loadConfiguration();
    }

    private static synchronized void loadConfiguration() {

        try (InputStream input = DBConnection.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input != null) {
                properties.load(input);
            } else {
                try (InputStream fallbackInput = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
                    if (fallbackInput != null) {
                        properties.load(fallbackInput);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not read config.properties: " + e.getMessage());
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            driverLoaded = true;
        } catch (ClassNotFoundException e) {
            System.err.println("Error: MySQL JDBC Driver not found: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!driverLoaded) {
            loadConfiguration();
        }

        String url = properties.getProperty("db.url");
        String user = properties.getProperty("db.user");
        String password = properties.getProperty("db.password");

        if (url == null || user == null) {
            throw new SQLException("Database URL or user not specified in config.properties");
        }

        return DriverManager.getConnection(url, user, password != null ? password : "");
    }

    public static boolean testConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }

    public static void shutdown() {
        try {
            Class<?> clazz = Class.forName("com.mysql.cj.jdbc.AbandonedConnectionCleanupThread");
            clazz.getMethod("checkedShutdown").invoke(null);
        } catch (Throwable ignored) {
        }
    }
}
