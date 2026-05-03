package edu.microserviceslab.usagemicroservice.service;

import edu.microserviceslab.usagemicroservice.common.config.RabbitMqConfig;
import edu.microserviceslab.usagemicroservice.dto.EndTripRequest;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateMessage;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateRequest;
import edu.microserviceslab.usagemicroservice.dto.StartTripRequest;
import edu.microserviceslab.usagemicroservice.entity.LocationUpdate;
import edu.microserviceslab.usagemicroservice.entity.Trip;
import edu.microserviceslab.usagemicroservice.entity.TripStatus;
import edu.microserviceslab.usagemicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.usagemicroservice.repo.LocationUpdateRepository;
import edu.microserviceslab.usagemicroservice.repo.TripRepository;
import edu.microserviceslab.usagemicroservice.service.interfaces.UsageService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UsageServiceImpl implements UsageService {

    private final LocationUpdateRepository locationUpdateRepository;
    private final TripRepository tripRepository;
    private final RabbitTemplate rabbitTemplate;

    public UsageServiceImpl(LocationUpdateRepository locationUpdateRepository, TripRepository tripRepository, RabbitTemplate rabbitTemplate) {
        this.locationUpdateRepository = locationUpdateRepository;
        this.tripRepository = tripRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public LocationUpdateMessage ingestLocation(LocationUpdateRequest request) {
        LocationUpdateMessage message = toMessage(request);
        rabbitTemplate.convertAndSend(
                RabbitMqConfig.FLEET_EXCHANGE,
                RabbitMqConfig.LOCATION_ROUTING_KEY,
                message);
        return message;
    }

    @Override
    @RabbitListener(queues = RabbitMqConfig.LOCATION_QUEUE)
    public void persistLocationUpdate(LocationUpdateMessage message) {
        LocationUpdate locationUpdate = new LocationUpdate();
        locationUpdate.setVehicleId(message.getVehicleId());
        locationUpdate.setDriverId(message.getDriverId());
        locationUpdate.setLatitude(message.getLatitude());
        locationUpdate.setLongitude(message.getLongitude());
        locationUpdate.setSpeed(message.getSpeed());
        locationUpdate.setHeading(message.getHeading());
        locationUpdate.setTimestamp(message.getTimestamp() == null ? LocalDateTime.now() : message.getTimestamp());
        locationUpdateRepository.save(locationUpdate);
    }

    @Override
    public List<LocationUpdate> findLocationsByVehicle(Long vehicleId, LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null) {
            return locationUpdateRepository.findByVehicleIdAndTimestampBetween(vehicleId, from, to);
        }
        if (from != null) {
            return locationUpdateRepository.findByVehicleIdAndTimestampAfter(vehicleId, from);
        }
        if (to != null) {
            return locationUpdateRepository.findByVehicleIdAndTimestampBefore(vehicleId, to);
        }
        return locationUpdateRepository.findByVehicleId(vehicleId);
    }

    @Override
    public List<Trip> findAllTrips() {
        return tripRepository.findAll();
    }

    @Override
    public Trip startTrip(StartTripRequest request) {
        Trip trip = new Trip();
        trip.setVehicleId(request.getVehicleId());
        trip.setDriverId(request.getDriverId());
        trip.setStartLat(request.getStartLat());
        trip.setStartLon(request.getStartLon());
        trip.setStartTime(LocalDateTime.now());
        trip.setStatus(TripStatus.IN_PROGRESS);
        return tripRepository.save(trip);
    }

    @Override
    public Trip endTrip(Long id, EndTripRequest request) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id " + id));
        if (trip.getStatus() == TripStatus.COMPLETED) {
            throw new IllegalArgumentException("Trip is already completed");
        }
        trip.setEndLat(request.getEndLat());
        trip.setEndLon(request.getEndLon());
        trip.setDistanceKm(request.getDistanceKm());
        trip.setEndTime(LocalDateTime.now());
        trip.setStatus(TripStatus.COMPLETED);
        return tripRepository.save(trip);
    }

    private LocationUpdateMessage toMessage(LocationUpdateRequest request) {
        LocationUpdateMessage message = new LocationUpdateMessage();
        message.setVehicleId(request.getVehicleId());
        message.setDriverId(request.getDriverId());
        message.setLatitude(request.getLatitude());
        message.setLongitude(request.getLongitude());
        message.setSpeed(request.getSpeed());
        message.setHeading(request.getHeading());
        message.setTimestamp(LocalDateTime.now());
        return message;
    }
}
