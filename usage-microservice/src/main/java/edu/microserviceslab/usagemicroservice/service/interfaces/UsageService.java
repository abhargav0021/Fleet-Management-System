package edu.microserviceslab.usagemicroservice.service.interfaces;

import edu.microserviceslab.usagemicroservice.dto.EndTripRequest;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateMessage;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateRequest;
import edu.microserviceslab.usagemicroservice.dto.StartTripRequest;
import edu.microserviceslab.usagemicroservice.entity.LocationUpdate;
import edu.microserviceslab.usagemicroservice.entity.Trip;

import java.time.LocalDateTime;
import java.util.List;

public interface UsageService {
    LocationUpdateMessage ingestLocation(LocationUpdateRequest request);
    void persistLocationUpdate(LocationUpdateMessage message);
    List<LocationUpdate> findLocationsByVehicle(Long vehicleId, LocalDateTime from, LocalDateTime to);
    List<Trip> findAllTrips();
    Trip startTrip(StartTripRequest request);
    Trip endTrip(Long id, EndTripRequest request);
}
