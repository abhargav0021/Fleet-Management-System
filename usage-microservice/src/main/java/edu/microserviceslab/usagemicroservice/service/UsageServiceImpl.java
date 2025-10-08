package edu.microserviceslab.usagemicroservice.service;

import edu.microserviceslab.usagemicroservice.entity.UsageStatistic;
import edu.microserviceslab.usagemicroservice.repo.UsageStatisticRepo;
import edu.microserviceslab.usagemicroservice.service.interfaces.UsageService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsageServiceImpl implements UsageService {

    private static UsageStatisticRepo usageStatisticRepo;

    public UsageServiceImpl(UsageStatisticRepo usageStatisticRepo) {
        this.usageStatisticRepo = usageStatisticRepo;
    }

    public UsageStatistic addUsageStatistic(UsageStatistic usageStatistic) {
        return usageStatisticRepo.save(usageStatistic);
    }

    public List<UsageStatistic> getAllUsageStatistics() {
        return usageStatisticRepo.findAll();
    }

    public List<UsageStatistic> getUsageStatisticsPerDriver(Long driverId) {
        return usageStatisticRepo.findByDriverId(driverId);
    }

    public List<UsageStatistic> getUsageStatisticsPerVehicle(Long vehicleId) {
        return usageStatisticRepo.findByVehicleId(vehicleId);
    }

    public static UsageStatistic addUsageService(UsageStatistic usageStatistic) {
            // Fetch vehicle information
        UsageStatistic savedUsage = usageStatisticRepo.save(usageStatistic);
                return savedUsage;
            }
    }
