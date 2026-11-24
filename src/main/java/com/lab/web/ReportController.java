package com.lab.web;

import com.lab.dao.SampleDAO;
import com.lab.model.DelayStatus;
import com.lab.model.Sample;
import com.lab.model.Status;
import com.lab.service.SchedulerService;
import com.lab.web.dto.ApiResponse;
import com.lab.web.dto.DailyReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final SchedulerService schedulerService;
    private final SampleDAO sampleDAO;

    @Autowired
    public ReportController(SchedulerService schedulerService, SampleDAO sampleDAO) {
        this.schedulerService = schedulerService;
        this.sampleDAO = (sampleDAO != null) ? sampleDAO : new SampleDAO();
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<DailyReportResponse>> getDailyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate reportDate = (date != null) ? date : LocalDate.now();
        LocalDateTime refTime = LocalDateTime.now();

        Map<String, Sample> combinedPool = new LinkedHashMap<>();
        try {
            List<Sample> dbSamples = sampleDAO.findAll();
            for (Sample s : dbSamples) {
                combinedPool.put(s.getId(), s);
            }
        } catch (Exception ignored) {
        }

        for (Sample s : schedulerService.getAllSamples().values()) {
            combinedPool.put(s.getId(), s);
        }

        long completedCount = 0;
        long pendingCount = 0;
        long delayedCount = 0;
        long onHoldCount = 0;
        List<Sample> relevantSamples = new ArrayList<>();

        for (Sample s : combinedPool.values()) {
            LocalDate receivedDate = (s.getReceivedTime() != null) ? s.getReceivedTime().toLocalDate() : null;
            LocalDate completionDate = (s.getCompletionTime() != null) ? s.getCompletionTime().toLocalDate() : null;

            if (s.getStatus() == Status.COMPLETED) {

                if (reportDate.equals(completionDate) || reportDate.equals(receivedDate)) {
                    completedCount++;
                    relevantSamples.add(s);
                }
            } else if (s.getStatus() == Status.ON_HOLD) {
                if (reportDate.equals(receivedDate)) {
                    onHoldCount++;
                    relevantSamples.add(s);
                }
            } else if (s.getStatus() == Status.QUEUED || s.getStatus() == Status.PROCESSING || s.getStatus() == Status.RECEIVED) {
                if (reportDate.equals(receivedDate)) {
                    pendingCount++;
                    relevantSamples.add(s);

                    DelayStatus delayStatus = schedulerService.checkDelay(s, refTime);
                    if (delayStatus == DelayStatus.APPROACHING || delayStatus == DelayStatus.OVERDUE) {
                        delayedCount++;
                    }
                }
            }
        }

        DailyReportResponse report = new DailyReportResponse(
                reportDate,
                completedCount,
                pendingCount,
                delayedCount,
                onHoldCount,
                relevantSamples
        );

        return ResponseEntity.ok(ApiResponse.ok("Daily report generated for " + reportDate, report));
    }
}
