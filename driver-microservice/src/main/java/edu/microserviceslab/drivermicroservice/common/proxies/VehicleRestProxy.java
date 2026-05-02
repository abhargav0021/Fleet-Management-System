package edu.microserviceslab.drivermicroservice.common.proxies;

import edu.microserviceslab.drivermicroservice.common.config.DriverConfigProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class VehicleRestProxy {

    private final DriverConfigProperties driverConfigProperties;
    private final RestTemplate restTemplate;

    public VehicleRestProxy(DriverConfigProperties driverConfigProperties, RestTemplate restTemplate) {
        this.driverConfigProperties = driverConfigProperties;
        this.restTemplate = restTemplate;
    }

    public String getVehicleLicensePlate(Long vehicleId) {
        return restTemplate.getForObject(driverConfigProperties.getVehicleBaseUrl() + "vehicles/{vehicleId}", String.class, vehicleId);
    }
}
