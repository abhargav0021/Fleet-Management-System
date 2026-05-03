package edu.microserviceslab.usagemicroservice.common.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;

@Configuration
public class RabbitMqConfig {

    public static final String FLEET_EXCHANGE = "fleet.exchange";
    public static final String LOCATION_QUEUE = "fleet.location.queue";
    public static final String LOCATION_DLQ = "fleet.location.dlq";
    public static final String LOCATION_ROUTING_KEY = "fleet.location.update";
    public static final String LOCATION_DLQ_ROUTING_KEY = "fleet.location.dlq";

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
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }

    @Bean
    public RetryOperationsInterceptor rabbitRetryInterceptor() {
        return RetryInterceptorBuilder.stateless()
                .maxAttempts(3)
                .backOffOptions(2000, 1.0, 2000)
                .recoverer(new RejectAndDontRequeueRecoverer())
                .build();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            RetryOperationsInterceptor rabbitRetryInterceptor) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setAdviceChain(rabbitRetryInterceptor);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }
}
