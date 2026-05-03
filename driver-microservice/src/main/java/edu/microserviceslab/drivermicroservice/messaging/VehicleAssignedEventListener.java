package edu.microserviceslab.drivermicroservice.messaging;

import edu.microserviceslab.drivermicroservice.common.config.RabbitMqConfig;
import edu.microserviceslab.drivermicroservice.dto.VehicleAssignedEvent;
import edu.microserviceslab.drivermicroservice.service.interfaces.DriverService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class VehicleAssignedEventListener {

    private final DriverService driverService;

    public VehicleAssignedEventListener(DriverService driverService) {
        this.driverService = driverService;
    }

    @RabbitListener(queues = RabbitMqConfig.VEHICLE_ASSIGNED_QUEUE)
    public void handleVehicleAssigned(VehicleAssignedEvent event) {
        driverService.assignVehicle(event.getDriverId(), event.getVehicleId());
    }
}
