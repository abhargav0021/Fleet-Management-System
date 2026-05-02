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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsageServiceImplTest {

    @Mock
    private LocationUpdateRepository locationUpdateRepository;

    @Mock
    private TripRepository tripRepository;

    @InjectMocks
    private UsageServiceImpl usageService;

    @Test
    void ingestLocationCreatesTimestampedLocationUpdate() {
        when(locationUpdateRepository.save(any(LocationUpdate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocationUpdate saved = usageService.ingestLocation(locationRequest());

        assertThat(saved.getVehicleId()).isEqualTo(1L);
        assertThat(saved.getDriverId()).isEqualTo(2L);
        assertThat(saved.getTimestamp()).isNotNull();
    }

    @Test
    void findLocationsByVehicleUsesBetweenWhenBothBoundsPresent() {
        LocalDateTime from = LocalDateTime.now().minusHours(1);
        LocalDateTime to = LocalDateTime.now();
        LocationUpdate location = new LocationUpdate();
        when(locationUpdateRepository.findByVehicleIdAndTimestampBetween(1L, from, to)).thenReturn(List.of(location));

        assertThat(usageService.findLocationsByVehicle(1L, from, to)).containsExactly(location);
    }

    @Test
    void startTripCreatesInProgressTrip() {
        when(tripRepository.save(any(Trip.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Trip trip = usageService.startTrip(startTripRequest());

        assertThat(trip.getVehicleId()).isEqualTo(1L);
        assertThat(trip.getStatus()).isEqualTo(TripStatus.IN_PROGRESS);
        assertThat(trip.getStartTime()).isNotNull();
    }

    @Test
    void endTripCompletesExistingTrip() {
        Trip trip = new Trip();
        trip.setStatus(TripStatus.IN_PROGRESS);
        when(tripRepository.findById(5L)).thenReturn(Optional.of(trip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Trip completed = usageService.endTrip(5L, endTripRequest());

        assertThat(completed.getStatus()).isEqualTo(TripStatus.COMPLETED);
        assertThat(completed.getEndTime()).isNotNull();
        assertThat(completed.getDistanceKm()).isEqualTo(12.5);
    }

    @Test
    void endTripThrowsWhenMissing() {
        when(tripRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usageService.endTrip(99L, endTripRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Trip not found");
    }

    @Test
    void findAllTripsDelegatesToRepository() {
        Trip trip = new Trip();
        when(tripRepository.findAll()).thenReturn(List.of(trip));

        assertThat(usageService.findAllTrips()).containsExactly(trip);
        verify(tripRepository).findAll();
    }

    private LocationUpdateRequest locationRequest() {
        LocationUpdateRequest request = new LocationUpdateRequest();
        request.setVehicleId(1L);
        request.setDriverId(2L);
        request.setLatitude(41.0);
        request.setLongitude(-87.0);
        request.setSpeed(35.5);
        request.setHeading(180.0);
        request.setTripId(3L);
        return request;
    }

    private StartTripRequest startTripRequest() {
        StartTripRequest request = new StartTripRequest();
        request.setVehicleId(1L);
        request.setDriverId(2L);
        request.setStartLat(41.0);
        request.setStartLon(-87.0);
        return request;
    }

    private EndTripRequest endTripRequest() {
        EndTripRequest request = new EndTripRequest();
        request.setEndLat(42.0);
        request.setEndLon(-88.0);
        request.setDistanceKm(12.5);
        return request;
    }
}
