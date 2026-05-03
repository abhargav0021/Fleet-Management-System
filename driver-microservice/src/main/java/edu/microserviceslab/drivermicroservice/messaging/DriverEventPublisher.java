package edu.microserviceslab.drivermicroservice.messaging;

import edu.microserviceslab.drivermicroservice.common.config.RabbitMqConfig;
import edu.microserviceslab.drivermicroservice.dto.DriverStatusChangedEvent;
import edu.microserviceslab.drivermicroservice.entity.DriverStatus;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DriverEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public DriverEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishStatusChanged(Long driverId, DriverStatus previousStatus, DriverStatus newStatus) {
        DriverStatusChangedEvent event = new DriverStatusChangedEvent();
        event.setDriverId(driverId);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(newStatus);
        event.setChangedAt(LocalDateTime.now());
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.FLEET_EXCHANGE,
                RabbitMqConfig.DRIVER_STATUS_ROUTING_KEY,
                event);
    }
}
