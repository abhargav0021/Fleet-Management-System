package edu.microserviceslab.drivermicroservice.common.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String FLEET_EXCHANGE = "fleet.exchange";
    public static final String LOCATION_QUEUE = "fleet.location.queue";
    public static final String LOCATION_DLQ = "fleet.location.dlq";
    public static final String LOCATION_ROUTING_KEY = "fleet.location.update";
    public static final String LOCATION_DLQ_ROUTING_KEY = "fleet.location.dlq";
    public static final String DRIVER_STATUS_ROUTING_KEY = "fleet.driver.status.changed";
    public static final String VEHICLE_ASSIGNED_QUEUE = "fleet.vehicle.assigned.queue";
    public static final String VEHICLE_ASSIGNED_ROUTING_KEY = "fleet.vehicle.assigned";

    @Bean
    public TopicExchange fleetExchange() {
        return new TopicExchange(FLEET_EXCHANGE);
    }

    @Bean
    public Queue locationQueue() {
        return QueueBuilder.durable(LOCATION_QUEUE)
                .deadLetterExchange(FLEET_EXCHANGE)
                .deadLetterRoutingKey(LOCATION_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue locationDeadLetterQueue() {
        return QueueBuilder.durable(LOCATION_DLQ).build();
    }

    @Bean
    public Binding locationBinding(Queue locationQueue, TopicExchange fleetExchange) {
        return BindingBuilder.bind(locationQueue).to(fleetExchange).with(LOCATION_ROUTING_KEY);
    }

    @Bean
    public Binding locationDeadLetterBinding(Queue locationDeadLetterQueue, TopicExchange fleetExchange) {
        return BindingBuilder.bind(locationDeadLetterQueue).to(fleetExchange).with(LOCATION_DLQ_ROUTING_KEY);
    }

    @Bean
    public Queue vehicleAssignedQueue() {
        return QueueBuilder.durable(VEHICLE_ASSIGNED_QUEUE).build();
    }

    @Bean
    public Binding vehicleAssignedBinding(Queue vehicleAssignedQueue, TopicExchange fleetExchange) {
        return BindingBuilder.bind(vehicleAssignedQueue).to(fleetExchange).with(VEHICLE_ASSIGNED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }
}
