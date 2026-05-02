package edu.microserviceslab.usagemicroservice.common.proxies;

import edu.microserviceslab.usagemicroservice.common.config.UsageConfigProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class VehicleRestProxy {

    private final UsageConfigProperties usageConfigProperties;
    private final RestTemplate restTemplate;

    public VehicleRestProxy(UsageConfigProperties usageConfigProperties, RestTemplate restTemplate) {
        this.usageConfigProperties = usageConfigProperties;
        this.restTemplate = restTemplate;
    }

    public String getVehicleLicensePlate(Long vehicleId) {
        return restTemplate.getForObject(usageConfigProperties.getVehicleBaseUrl() + "vehicles/{vehicleId}", String.class, vehicleId);
    }
}
