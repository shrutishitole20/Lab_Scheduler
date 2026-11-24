package com.lab.service;

import com.lab.dao.AssignmentDAO;
import com.lab.dao.DBConnection;
import com.lab.dao.DowntimeDAO;
import com.lab.dao.HistoryDAO;
import com.lab.dao.MachineDAO;
import com.lab.dao.SampleDAO;
import com.lab.model.DelayStatus;
import com.lab.model.HistoryEntry;
import com.lab.model.Machine;
import com.lab.model.Priority;
import com.lab.model.Sample;
import com.lab.model.Status;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.PriorityQueue;

@Service
public class SchedulerService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final PriorityQueue<Sample> queue;
    private final Map<String, Machine> machines;
    private final Map<String, Sample> allSamples;
    private final List<HistoryEntry> history;
    private int idCounter;

    private final SampleDAO sampleDAO;
    private final MachineDAO machineDAO;
    private final HistoryDAO historyDAO;
    private final DowntimeDAO downtimeDAO;
    private final AssignmentDAO assignmentDAO;
    private final boolean persistenceEnabled;

    public SchedulerService() {
        this(false);
    }

    @Autowired
    public SchedulerService(SampleDAO sampleDAO, MachineDAO machineDAO, HistoryDAO historyDAO, DowntimeDAO downtimeDAO, AssignmentDAO assignmentDAO) {
        this(sampleDAO, machineDAO, historyDAO, downtimeDAO, assignmentDAO, DBConnection.testConnection());
    }

    public SchedulerService(SampleDAO sampleDAO, MachineDAO machineDAO, HistoryDAO historyDAO) {
        this(sampleDAO, machineDAO, historyDAO, new DowntimeDAO(), new AssignmentDAO(), DBConnection.testConnection());
    }

    public SchedulerService(boolean enablePersistence) {
        this(new SampleDAO(), new MachineDAO(), new HistoryDAO(), new DowntimeDAO(), new AssignmentDAO(), enablePersistence && DBConnection.testConnection());
    }

    public SchedulerService(SampleDAO sampleDAO, MachineDAO machineDAO, HistoryDAO historyDAO, boolean enablePersistence) {
        this(sampleDAO, machineDAO, historyDAO, new DowntimeDAO(), new AssignmentDAO(), enablePersistence);
    }

    public SchedulerService(SampleDAO sampleDAO, MachineDAO machineDAO, HistoryDAO historyDAO, DowntimeDAO downtimeDAO, AssignmentDAO assignmentDAO, boolean enablePersistence) {
        this.queue = new PriorityQueue<>(new SampleComparator());
        this.machines = new LinkedHashMap<>();
        this.allSamples = new LinkedHashMap<>();
        this.history = new ArrayList<>();
        this.idCounter = 1;

        this.sampleDAO = (sampleDAO != null) ? sampleDAO : new SampleDAO();
        this.machineDAO = (machineDAO != null) ? machineDAO : new MachineDAO();
        this.historyDAO = (historyDAO != null) ? historyDAO : new HistoryDAO();
        this.downtimeDAO = (downtimeDAO != null) ? downtimeDAO : new DowntimeDAO();
        this.assignmentDAO = (assignmentDAO != null) ? assignmentDAO : new AssignmentDAO();
        this.persistenceEnabled = enablePersistence;

        if (this.persistenceEnabled) {
            loadFromDatabase();
        }
    }

    public synchronized final void loadFromDatabase() {
        try {

            List<Machine> dbMachines = machineDAO.findAll();
            for (Machine m : dbMachines) {
                m.setCurrentLoad(0);
                machines.put(m.getId(), m);
            }

            int maxId = sampleDAO.getMaxSampleIdNumber();

            List<Sample> queuedSamples = sampleDAO.findByStatus(Status.QUEUED);
            List<Sample> processingSamples = sampleDAO.findByStatus(Status.PROCESSING);
            List<Sample> onHoldSamples = sampleDAO.findByStatus(Status.ON_HOLD);

            for (Sample s : processingSamples) {
                allSamples.put(s.getId(), s);
                maxId = Math.max(maxId, extractIdNumber(s.getId()));

                if (s.getAssignedMachineId() != null) {
                    Machine m = machines.get(s.getAssignedMachineId());
                    if (m != null) {
                        m.setCurrentLoad(m.getCurrentLoad() + 1);
                    }
                }
            }

            for (Sample s : onHoldSamples) {
                allSamples.put(s.getId(), s);
                maxId = Math.max(maxId, extractIdNumber(s.getId()));
            }

            for (Sample s : queuedSamples) {
                allSamples.put(s.getId(), s);
                queue.add(s);
                maxId = Math.max(maxId, extractIdNumber(s.getId()));
            }

            this.idCounter = maxId + 1;

            assignSamples();

        } catch (Exception e) {
            System.err.println("Warning: Error loading state from database: " + e.getMessage());
        }
    }

    private int extractIdNumber(String id) {
        if (id == null) return 0;
        try {
            String digits = id.replaceAll("\\D+", "");
            return digits.isEmpty() ? 0 : Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public synchronized void addMachine(Machine m) {
        if (m == null || m.getId() == null) {
            throw new IllegalArgumentException("Machine and its ID cannot be null.");
        }
        machines.put(m.getId(), m);

        if (persistenceEnabled) {
            machineDAO.save(m);
        }
    }

    public synchronized void updateMachine(Machine m) {
        if (m == null || m.getId() == null) {
            throw new IllegalArgumentException("Machine and its ID cannot be null.");
        }
        machines.put(m.getId(), m);

        if (persistenceEnabled) {
            machineDAO.update(m);
        }
        assignSamples();
    }

    public synchronized Sample registerSample(String testType, Priority priority, LocalDateTime receivedTime) {
        if (priority == null) {
            throw new IllegalArgumentException("Priority cannot be null.");
        }
        return registerSample(null, testType, null, null, priority, receivedTime, priority.getDefaultTargetMinutes());
    }

    public synchronized Sample registerSample(String testType, Priority priority, LocalDateTime receivedTime, int targetMinutes) {
        return registerSample(null, testType, null, null, priority, receivedTime, targetMinutes);
    }

    public synchronized Sample registerSample(String sampleType, String testType, String testCategory, String processingType,
                                             Priority priority, LocalDateTime receivedTime, int targetMinutes) {
        if (testType == null || testType.trim().isEmpty()) {
            throw new IllegalArgumentException("Test type cannot be null or empty.");
        }
        if (priority == null) {
            throw new IllegalArgumentException("Priority cannot be null.");
        }
        if (receivedTime == null) {
            receivedTime = LocalDateTime.now();
        }
        if (targetMinutes <= 0) {
            throw new IllegalArgumentException("Target turnaround duration must be greater than 0 minutes.");
        }

        while (allSamples.containsKey(String.format("S%03d", idCounter))) {
            idCounter++;
        }
        String id = String.format("S%03d", idCounter++);

        Sample sample = new Sample(id, sampleType, testType.trim(), testCategory, processingType, priority, receivedTime, targetMinutes);

        sample.forceStatus(Status.RECEIVED);
        HistoryEntry recEntry = new HistoryEntry(
                id,
                receivedTime,
                "RECEIVED",
                "Sample received in laboratory (Type: " + sample.getSampleType() + ", Priority: " + priority.name() + ", Target: " + targetMinutes + " min)"
        );
        history.add(recEntry);

        sample.setStatus(Status.QUEUED);
        int queuePosition = queue.size() + 1;
        HistoryEntry qEntry = new HistoryEntry(
                id,
                receivedTime,
                "QUEUED",
                "Sample placed in priority queue (Position: #" + queuePosition + ")"
        );
        history.add(qEntry);

        allSamples.put(id, sample);
        queue.add(sample);

        if (persistenceEnabled) {
            sampleDAO.save(sample);
            historyDAO.save(recEntry);
            historyDAO.save(qEntry);
        }

        assignSamples();
        return sample;
    }

    public synchronized void assignSamples() {
        List<Sample> unassigned = new ArrayList<>();

        while (!queue.isEmpty()) {
            Sample sample = queue.poll();

            if (sample.getStatus() == Status.PROCESSING) {
                continue;
            }

            Machine targetMachine = null;
            for (Machine m : machines.values()) {
                if (m.isAvailable() && m.canProcess(sample.getTestType()) && m.hasFreeSlot()) {
                    targetMachine = m;
                    break;
                }
            }

            if (targetMachine != null) {
                sample.setStatus(Status.PROCESSING);
                LocalDateTime now = LocalDateTime.now();
                sample.setStartTime(now);
                sample.setAssignedMachineId(targetMachine.getId());
                targetMachine.setCurrentLoad(targetMachine.getCurrentLoad() + 1);

                HistoryEntry procEntry = new HistoryEntry(
                        sample.getId(),
                        now,
                        "PROCESSING",
                        "Assigned to machine " + targetMachine.getId() + " (" + targetMachine.getName() + ")"
                );
                history.add(procEntry);

                if (persistenceEnabled) {
                    sampleDAO.update(sample);
                    machineDAO.update(targetMachine);
                    historyDAO.save(procEntry);
                    assignmentDAO.recordAssignment(sample.getId(), targetMachine.getId(), "PROCESSING", "Assigned to machine " + targetMachine.getId());
                }
            } else {
                unassigned.add(sample);
            }
        }

        queue.addAll(unassigned);
    }

    public synchronized void completeSample(String id) {
        Sample sample = allSamples.get(id);
        if (sample == null) {
            throw new NoSuchElementException("Sample not found with ID: " + id);
        }
        if (sample.getStatus() != Status.PROCESSING) {
            throw new IllegalStateException("Sample " + id + " cannot be completed because it is in status: " + sample.getStatus());
        }

        sample.setStatus(Status.COMPLETED);
        LocalDateTime now = LocalDateTime.now();
        sample.setCompletionTime(now);

        String machineId = sample.getAssignedMachineId();
        Machine machine = machineId != null ? machines.get(machineId) : null;
        if (machine != null && machine.getCurrentLoad() > 0) {
            machine.setCurrentLoad(machine.getCurrentLoad() - 1);
        }

        DelayStatus delayStatus = checkDelay(sample, now);
        long elapsedMinutes = (sample.getReceivedTime() != null)
                ? Duration.between(sample.getReceivedTime(), now).toMinutes()
                : 0;

        HistoryEntry compEntry = new HistoryEntry(
                sample.getId(),
                now,
                "COMPLETED",
                "Processing completed on machine " + machineId + " (Duration: " + elapsedMinutes + " min, SLA: " + delayStatus + ")"
        );
        history.add(compEntry);

        if (persistenceEnabled) {
            sampleDAO.update(sample);
            if (machine != null) {
                machineDAO.update(machine);
            }
            historyDAO.save(compEntry);
            if (machineId != null) {
                assignmentDAO.updateStatus(sample.getId(), machineId, "COMPLETED", sample.getStartTime(), now);
            }
        }

        assignSamples();
    }

    public synchronized void markMachineDown(String machineId) {
        markMachineDown(machineId, "Machine " + machineId + " marked DOWN. Active processing samples remain untouched.");
    }

    public synchronized void markMachineDown(String machineId, String reason) {
        Machine machine = machines.get(machineId);
        if (machine == null) {
            throw new NoSuchElementException("Machine not found with ID: " + machineId);
        }

        machine.setAvailable(false);
        String details = (reason != null && !reason.trim().isEmpty()) ? reason : "Machine " + machineId + " marked DOWN.";
        HistoryEntry downEntry = new HistoryEntry(
                "SYSTEM",
                LocalDateTime.now(),
                "MACHINE_DOWN",
                details
        );
        history.add(downEntry);

        if (persistenceEnabled) {
            machineDAO.update(machine);
            historyDAO.save(downEntry);
            downtimeDAO.recordDowntime(machineId, details, "SYSTEM");
        }

        assignSamples();
    }

    public synchronized void markMachineUp(String machineId) {
        Machine machine = machines.get(machineId);
        if (machine == null) {
            throw new NoSuchElementException("Machine not found with ID: " + machineId);
        }

        machine.setAvailable(true);
        HistoryEntry upEntry = new HistoryEntry(
                "SYSTEM",
                LocalDateTime.now(),
                "MACHINE_UP",
                "Machine " + machineId + " marked UP/AVAILABLE."
        );
        history.add(upEntry);

        if (persistenceEnabled) {
            machineDAO.update(machine);
            historyDAO.save(upEntry);
            downtimeDAO.resolveDowntime(machineId);
        }

        assignSamples();
    }

    public synchronized void putOnHold(String sampleId) {
        Sample sample = allSamples.get(sampleId);
        if (sample == null) {
            throw new NoSuchElementException("Sample not found with ID: " + sampleId);
        }
        if (sample.getStatus() == Status.COMPLETED) {
            throw new IllegalStateException("Cannot place COMPLETED sample " + sampleId + " on hold.");
        }

        if (sample.getStatus() == Status.PROCESSING) {

            String machineId = sample.getAssignedMachineId();
            if (machineId != null) {
                Machine m = machines.get(machineId);
                if (m != null && m.getCurrentLoad() > 0) {
                    m.setCurrentLoad(m.getCurrentLoad() - 1);
                }
            }
            sample.setAssignedMachineId(null);
        } else if (sample.getStatus() == Status.QUEUED || sample.getStatus() == Status.RECEIVED) {
            queue.remove(sample);
        }

        sample.setStatus(Status.ON_HOLD);
        HistoryEntry holdEntry = new HistoryEntry(
                sampleId,
                LocalDateTime.now(),
                "ON_HOLD",
                "Sample placed on hold and removed from priority queue."
        );
        history.add(holdEntry);

        if (persistenceEnabled) {
            sampleDAO.update(sample);
            historyDAO.save(holdEntry);
        }

        assignSamples();
    }

    public synchronized void releaseFromHold(String sampleId) {
        Sample sample = allSamples.get(sampleId);
        if (sample == null) {
            throw new NoSuchElementException("Sample not found with ID: " + sampleId);
        }
        if (sample.getStatus() != Status.ON_HOLD) {
            throw new IllegalStateException("Sample " + sampleId + " is not ON_HOLD (current: " + sample.getStatus() + ").");
        }

        sample.setStatus(Status.QUEUED);
        queue.add(sample);
        HistoryEntry relEntry = new HistoryEntry(
                sampleId,
                LocalDateTime.now(),
                "RELEASED",
                "Sample released from hold and returned to priority queue."
        );
        history.add(relEntry);

        if (persistenceEnabled) {
            sampleDAO.update(sample);
            historyDAO.save(relEntry);
        }

        assignSamples();
    }

    public DelayStatus checkDelay(Sample s, LocalDateTime now) {
        if (s == null || s.getReceivedTime() == null || now == null) {
            return DelayStatus.ON_TIME;
        }

        LocalDateTime deadline = s.getDeadline();
        if (deadline == null) {
            return DelayStatus.ON_TIME;
        }

        if (!now.isBefore(deadline)) {
            return DelayStatus.OVERDUE;
        }

        long totalSeconds = (long) s.getTargetMinutes() * 60;
        long elapsedSeconds = Duration.between(s.getReceivedTime(), now).getSeconds();

        if (elapsedSeconds >= (totalSeconds * 0.8)) {
            return DelayStatus.APPROACHING;
        }

        return DelayStatus.ON_TIME;
    }

    public List<Sample> getDelayedSamples(LocalDateTime now) {
        List<Sample> delayed = new ArrayList<>();
        for (Sample s : allSamples.values()) {
            if (s.getStatus() != Status.COMPLETED) {
                DelayStatus delayStatus = checkDelay(s, now);
                if (delayStatus == DelayStatus.APPROACHING || delayStatus == DelayStatus.OVERDUE) {
                    delayed.add(s);
                }
            }
        }
        return delayed;
    }

    public void displayQueue() {
        System.out.println("=========================================================================================");
        System.out.printf("                              WAITING QUEUE (%d SAMPLES)                                 %n", queue.size());
        System.out.println("=========================================================================================");
        if (queue.isEmpty()) {
            System.out.println("  (No samples currently waiting in queue)");
            System.out.println("-----------------------------------------------------------------------------------------\n");
            return;
        }

        System.out.printf("%-5s | %-6s | %-10s | %-16s | %-10s | %-16s | %-16s%n",
                "Pos", "ID", "Test Type", "Priority", "Target", "Received", "Deadline");
        System.out.println("-----------------------------------------------------------------------------------------");

        PriorityQueue<Sample> copyQueue = new PriorityQueue<>(queue);
        int pos = 1;
        while (!copyQueue.isEmpty()) {
            Sample s = copyQueue.poll();
            System.out.printf("#%-4d | %-6s | %-10s | %-16s | %-3d min   | %-16s | %-16s%n",
                    pos++,
                    s.getId(),
                    s.getTestType(),
                    s.getPriority().name() + " (R" + s.getPriority().getRank() + ")",
                    s.getTargetMinutes(),
                    s.getReceivedTime().format(TIME_FMT),
                    s.getDeadline().format(TIME_FMT)
            );
        }
        System.out.println("-----------------------------------------------------------------------------------------\n");
    }

    public void displayMachineWorkload() {
        System.out.println("=========================================================================================");
        System.out.println("                               MACHINE WORKLOAD STATUS                                   ");
        System.out.println("=========================================================================================");
        System.out.printf("%-6s | %-32s | %-12s | %-10s | %-10s | %-20s%n",
                "ID", "Name", "Workload", "Free Slots", "Status", "Supported Tests");
        System.out.println("-----------------------------------------------------------------------------------------");

        for (Machine m : machines.values()) {
            int freeSlots = m.isAvailable() ? Math.max(0, m.getCapacity() - m.getCurrentLoad()) : 0;
            String statusStr = m.isAvailable()
                    ? (m.getCurrentLoad() >= m.getCapacity() ? "FULL" : "AVAILABLE")
                    : "DOWN";

            System.out.printf("%-6s | %-32s | %2d / %-2d %-4s | %-10d | %-10s | %-20s%n",
                    m.getId(),
                    m.getName(),
                    m.getCurrentLoad(),
                    m.getCapacity(),
                    (m.getCurrentLoad() >= m.getCapacity() && m.isAvailable() ? "[BUSY]" : ""),
                    freeSlots,
                    statusStr,
                    m.getSupportedTestTypes()
            );
        }
        System.out.println("-----------------------------------------------------------------------------------------\n");
    }

    public PriorityQueue<Sample> getQueue() { return queue; }
    public Map<String, Machine> getMachines() { return Collections.unmodifiableMap(machines); }
    public Map<String, Sample> getAllSamples() { return Collections.unmodifiableMap(allSamples); }
    public List<HistoryEntry> getHistory() { return Collections.unmodifiableList(history); }
    public boolean isPersistenceEnabled() { return persistenceEnabled; }
}
