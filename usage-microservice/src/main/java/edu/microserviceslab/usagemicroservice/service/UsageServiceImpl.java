package edu.microserviceslab.usagemicroservice.service;

import edu.microserviceslab.usagemicroservice.dto.EndTripRequest;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateRequest;
import edu.microserviceslab.usagemicroservice.dto.StartTripRequest;
import edu.microserviceslab.usagemicroservice.entity.LocationUpdate;
import edu.microserviceslab.usagemicroservice.entity.Trip;
import edu.microserviceslab.usagemicroservice.entity.TripStatus;
import edu.microserviceslab.usagemicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.usagemicroservice.repo.LocationUpdateRepository;
import edu.microserviceslab.usagemicroservice.repo.TripRepository;
import edu.microserviceslab.usagemicroservice.service.interfaces.UsageService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UsageServiceImpl implements UsageService {

    private final LocationUpdateRepository locationUpdateRepository;
    private final TripRepository tripRepository;

    public UsageServiceImpl(LocationUpdateRepository locationUpdateRepository, TripRepository tripRepository) {
        this.locationUpdateRepository = locationUpdateRepository;
        this.tripRepository = tripRepository;
    }

    @Override
    public LocationUpdate ingestLocation(LocationUpdateRequest request) {
        LocationUpdate locationUpdate = new LocationUpdate();
        locationUpdate.setVehicleId(request.getVehicleId());
        locationUpdate.setDriverId(request.getDriverId());
        locationUpdate.setLatitude(request.getLatitude());
        locationUpdate.setLongitude(request.getLongitude());
        locationUpdate.setSpeed(request.getSpeed());
        locationUpdate.setHeading(request.getHeading());
        locationUpdate.setTripId(request.getTripId());
        locationUpdate.setTimestamp(LocalDateTime.now());
        return locationUpdateRepository.save(locationUpdate);
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
}
