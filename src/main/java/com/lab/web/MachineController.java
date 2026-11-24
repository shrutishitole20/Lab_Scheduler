package com.lab.web;

import com.lab.dao.MachineDAO;
import com.lab.model.Machine;
import com.lab.service.SchedulerService;
import com.lab.web.dto.ApiResponse;
import com.lab.web.dto.MachineRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final SchedulerService schedulerService;
    private final MachineDAO machineDAO;

    @Autowired
    public MachineController(SchedulerService schedulerService, MachineDAO machineDAO) {
        this.schedulerService = schedulerService;
        this.machineDAO = (machineDAO != null) ? machineDAO : new MachineDAO();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Machine>>> getAllMachines() {
        List<Machine> machines = new ArrayList<>(schedulerService.getMachines().values());
        return ResponseEntity.ok(ApiResponse.ok("Machines retrieved successfully", machines));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Machine>> getMachineById(@PathVariable String id) {
        Machine machine = schedulerService.getMachines().get(id);
        if (machine == null) {
            throw new NoSuchElementException("Machine not found with ID: " + id);
        }
        return ResponseEntity.ok(ApiResponse.ok("Machine retrieved successfully", machine));
    }

    @PostMapping("/{id}/down")
    public ResponseEntity<ApiResponse<Machine>> markMachineDown(@PathVariable String id,
                                                                @RequestBody(required = false) Map<String, String> body) {
        Machine machine = schedulerService.getMachines().get(id);
        if (machine == null) {
            throw new NoSuchElementException("Machine not found with ID: " + id);
        }

        String reason = (body != null && body.containsKey("reason") && !body.get("reason").trim().isEmpty())
                ? body.get("reason").trim()
                : "Machine marked DOWN for maintenance";

        schedulerService.markMachineDown(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Machine " + id + " marked DOWN: " + reason, machine));
    }

    @PostMapping("/{id}/up")
    public ResponseEntity<ApiResponse<Machine>> markMachineUp(@PathVariable String id) {
        Machine machine = schedulerService.getMachines().get(id);
        if (machine == null) {
            throw new NoSuchElementException("Machine not found with ID: " + id);
        }

        schedulerService.markMachineUp(id);
        return ResponseEntity.ok(ApiResponse.ok("Machine " + id + " marked UP/AVAILABLE", machine));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Machine>> createMachine(@Valid @RequestBody MachineRequest request) {
        if (schedulerService.getMachines().containsKey(request.getId())) {
            throw new IllegalArgumentException("Machine already exists with ID: " + request.getId());
        }

        Machine machine = new Machine(
                request.getId(),
                request.getName(),
                request.getSupportedTestTypes(),
                request.getCapacity(),
                0,
                request.isAvailable()
        );
        schedulerService.addMachine(machine);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Machine created successfully (Admin)", machine));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Machine>> updateMachine(@PathVariable String id,
                                                              @Valid @RequestBody MachineRequest request) {
        Machine existing = schedulerService.getMachines().get(id);
        if (existing == null) {
            throw new NoSuchElementException("Machine not found with ID: " + id);
        }

        existing.setName(request.getName());
        existing.setCapacity(request.getCapacity());
        existing.setAvailable(request.isAvailable());
        if (request.getSupportedTestTypes() != null) {
            existing.setSupportedTestTypes(request.getSupportedTestTypes());
        }

        schedulerService.updateMachine(existing);

        return ResponseEntity.ok(ApiResponse.ok("Machine " + id + " updated successfully (Admin)", existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteMachine(@PathVariable String id) {
        Machine existing = schedulerService.getMachines().get(id);
        if (existing == null) {
            throw new NoSuchElementException("Machine not found with ID: " + id);
        }
        if (existing.getCurrentLoad() > 0) {
            throw new IllegalStateException("Cannot delete machine " + id + " while it has active processing samples.");
        }

        schedulerService.getMachines().remove(id);
        machineDAO.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Machine deleted successfully (Admin)", "Deleted ID: " + id));
    }
}
