package com.lab.web;

import com.lab.dao.DBConnection;
import com.lab.dao.PriorityDAO;
import com.lab.dao.TestTypeDAO;
import com.lab.dao.UserDAO;
import com.lab.model.User;
import com.lab.web.dto.ApiResponse;
import com.lab.web.dto.PriorityRequest;
import com.lab.web.dto.TestTypeRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AdminController {

    private final PriorityDAO priorityDAO;
    private final TestTypeDAO testTypeDAO;
    private final UserDAO userDAO;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminController(PriorityDAO priorityDAO, TestTypeDAO testTypeDAO, UserDAO userDAO, PasswordEncoder passwordEncoder) {
        this.priorityDAO = (priorityDAO != null) ? priorityDAO : new PriorityDAO();
        this.testTypeDAO = (testTypeDAO != null) ? testTypeDAO : new TestTypeDAO();
        this.userDAO = (userDAO != null) ? userDAO : new UserDAO();
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/priorities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPriorities() {
        List<Map<String, Object>> priorities = priorityDAO.findAll();
        return ResponseEntity.ok(ApiResponse.ok("Priorities retrieved successfully", priorities));
    }

    @PostMapping("/priorities")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPriority(@Valid @RequestBody PriorityRequest request) {
        String sql = "INSERT INTO priorities (name, rank_order, target_minutes) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, request.getName().trim().toUpperCase());
            stmt.setInt(2, request.getRankOrder());
            stmt.setInt(3, request.getTargetMinutes());
            stmt.executeUpdate();

            Map<String, Object> data = Map.of(
                    "name", request.getName().trim().toUpperCase(),
                    "rankOrder", request.getRankOrder(),
                    "targetMinutes", request.getTargetMinutes()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Priority created successfully (Admin)", data));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Failed to create priority: " + e.getMessage());
        }
    }

    @PutMapping("/priorities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePriority(@PathVariable int id,
                                                                          @Valid @RequestBody PriorityRequest request) {
        String sql = "UPDATE priorities SET name = ?, rank_order = ?, target_minutes = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, request.getName().trim().toUpperCase());
            stmt.setInt(2, request.getRankOrder());
            stmt.setInt(3, request.getTargetMinutes());
            stmt.setInt(4, id);

            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new IllegalArgumentException("Priority with ID " + id + " not found.");
            }

            Map<String, Object> data = Map.of(
                    "id", id,
                    "name", request.getName().trim().toUpperCase(),
                    "rankOrder", request.getRankOrder(),
                    "targetMinutes", request.getTargetMinutes()
            );
            return ResponseEntity.ok(ApiResponse.ok("Priority updated successfully (Admin)", data));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Failed to update priority: " + e.getMessage());
        }
    }

    @GetMapping("/test-types")
    public ResponseEntity<ApiResponse<List<String>>> getTestTypes() {
        List<String> types = testTypeDAO.findAllNames();
        return ResponseEntity.ok(ApiResponse.ok("Test types retrieved successfully", types));
    }

    @PostMapping("/test-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTestType(@Valid @RequestBody TestTypeRequest request) {
        int id = testTypeDAO.findOrInsert(request.getName().trim());
        Map<String, Object> data = Map.of(
                "id", id,
                "name", request.getName().trim()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Test Type registered successfully (Admin)", data));
    }

    @PutMapping("/test-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTestType(@PathVariable int id,
                                                                          @Valid @RequestBody TestTypeRequest request) {
        String sql = "UPDATE test_types SET name = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, request.getName().trim());
            stmt.setInt(2, id);

            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new IllegalArgumentException("Test Type with ID " + id + " not found.");
            }

            Map<String, Object> data = Map.of("id", id, "name", request.getName().trim());
            return ResponseEntity.ok(ApiResponse.ok("Test Type updated successfully (Admin)", data));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Failed to update test type: " + e.getMessage());
        }
    }

    @DeleteMapping("/priorities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePriority(@PathVariable int id) {
        String sql = "DELETE FROM priorities WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new IllegalArgumentException("Priority with ID " + id + " not found.");
            }
            return ResponseEntity.ok(ApiResponse.ok("Priority tier deleted successfully", "Deleted ID: " + id));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Cannot delete priority: " + e.getMessage());
        }
    }

    @DeleteMapping("/test-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteTestType(@PathVariable int id) {
        String sql = "DELETE FROM test_types WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new IllegalArgumentException("Test category with ID " + id + " not found.");
            }
            return ResponseEntity.ok(ApiResponse.ok("Test category deleted successfully", "Deleted ID: " + id));
        } catch (SQLException e) {
            throw new IllegalArgumentException("Cannot delete test category: " + e.getMessage());
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        List<User> users = userDAO.findAll();
        List<Map<String, Object>> safeUsers = new ArrayList<>();
        for (User u : users) {
            safeUsers.add(Map.of(
                    "id", u.getId(),
                    "username", u.getUsername(),
                    "role", u.getRole() != null ? u.getRole() : "STAFF"
            ));
        }
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully", safeUsers));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String role = request.get("role");

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Username and password are required.");
        }

        String cleanUsername = username.trim();
        if (userDAO.findByUsername(cleanUsername).isPresent()) {
            throw new IllegalArgumentException("Username '" + cleanUsername + "' is already taken.");
        }

        String cleanRole = (role != null && role.trim().toUpperCase().contains("ADMIN")) ? "ADMIN" : "STAFF";
        String encodedHash = (passwordEncoder != null) ? passwordEncoder.encode(password.trim()) : password.trim();

        User user = new User(cleanUsername, encodedHash, cleanRole);
        boolean saved = userDAO.save(user);
        if (!saved) {
            throw new IllegalArgumentException("Could not create user in database.");
        }

        Map<String, Object> data = Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User created successfully", data));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable int id) {
        boolean deleted = userDAO.delete(id);
        if (!deleted) {
            throw new IllegalArgumentException("User with ID " + id + " not found or cannot be deleted.");
        }
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", "Deleted ID: " + id));
    }
}
