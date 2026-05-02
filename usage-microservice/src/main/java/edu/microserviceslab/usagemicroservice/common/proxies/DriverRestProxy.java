package edu.microserviceslab.usagemicroservice.common.proxies;

import edu.microserviceslab.usagemicroservice.common.config.UsageConfigProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class DriverRestProxy {

    private final UsageConfigProperties usageConfigProperties;
    private final RestTemplate restTemplate;

    public DriverRestProxy(UsageConfigProperties usageConfigProperties, RestTemplate restTemplate) {
        this.usageConfigProperties = usageConfigProperties;
        this.restTemplate = restTemplate;
    }

    public String getVehicleForDriver(Long driverId) {
        return restTemplate.getForObject(usageConfigProperties.getDriverBaseUrl() + "drivers/{driverId}", String.class, driverId);
    }
}
