package edu.microserviceslab.vehiclemicroservice;

import edu.microserviceslab.vehiclemicroservice.entity.Vehicle;
import edu.microserviceslab.vehiclemicroservice.repo.VehicleRepo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VehicleApplication {
    public static void main(String[] args) {
        SpringApplication.run(VehicleApplication.class, args);
    }

}
