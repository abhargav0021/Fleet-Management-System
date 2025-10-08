package edu.microserviceslab.usagemicroservice.controller;

import edu.microserviceslab.usagemicroservice.entity.UsageStatistic;
import edu.microserviceslab.usagemicroservice.service.UsageServiceImpl;
import edu.microserviceslab.usagemicroservice.service.interfaces.UsageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usage")
public class UsageController {

    private UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    @ResponseBody
    @RequestMapping("/list")
    public List<UsageStatistic> listAllUsageStatistics() {
        return usageService.getAllUsageStatistics();
    }

    @ResponseBody
    @RequestMapping("/driver/{driverId}")
    public List<UsageStatistic> listAllUsageStatisticsForDriver(@PathVariable("driverId") Long driverId) {
        return usageService.getUsageStatisticsPerDriver(driverId);
    }

    @ResponseBody
    @RequestMapping("/vehicle/{vehicleId}")
    public List<UsageStatistic> listAllUsageStatisticsForVehicle(@PathVariable("vehicleId") Long vehicleId) {
        return usageService.getUsageStatisticsPerVehicle(vehicleId);
    }

    @ResponseBody
    @RequestMapping(path="/add", method= RequestMethod.POST)
    public UsageStatistic addUsageService(@RequestBody UsageStatistic usageStatistic) {
        if (usageStatistic == null) {
            throw new IllegalStateException("Please submit a driver to add.");
        }
        if (usageStatistic.getSpeed() == null){
            throw new IllegalStateException("UsageStatistic speed is required");
        }
        if (usageStatistic.getRotationsPerMinute() == null){
            throw new IllegalStateException("UsageStatistic RPM is required");
        }
        if (usageStatistic.getFuelLevel() == null){
            throw new IllegalStateException("UsageStatistic fuel is required");
        }
        return UsageServiceImpl.addUsageService(usageStatistic);
    }
}
