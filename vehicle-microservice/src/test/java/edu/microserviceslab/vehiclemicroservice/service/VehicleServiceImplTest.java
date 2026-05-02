package edu.microserviceslab.vehiclemicroservice.service;

import edu.microserviceslab.vehiclemicroservice.dto.CreateVehicleRequest;
import edu.microserviceslab.vehiclemicroservice.entity.Vehicle;
import edu.microserviceslab.vehiclemicroservice.entity.VehicleStatus;
import edu.microserviceslab.vehiclemicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.vehiclemicroservice.repo.VehicleRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock
    private VehicleRepo vehicleRepo;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    @Test
    void findAllReturnsVehicles() {
        Vehicle vehicle = new Vehicle();
        when(vehicleRepo.findAll()).thenReturn(List.of(vehicle));

        assertThat(vehicleService.findAll()).containsExactly(vehicle);
    }

    @Test
    void createDefaultsStatusToActive() {
        when(vehicleRepo.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Vehicle vehicle = vehicleService.create(request(null));

        assertThat(vehicle.getLicensePlate()).isEqualTo("ABC123");
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.ACTIVE);
    }

    @Test
    void updateStatusChangesExistingVehicle() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(VehicleStatus.ACTIVE);
        when(vehicleRepo.findById(7L)).thenReturn(Optional.of(vehicle));
        when(vehicleRepo.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Vehicle updated = vehicleService.updateStatus(7L, VehicleStatus.MAINTENANCE);

        assertThat(updated.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(vehicleRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Vehicle not found");
    }

    @Test
    void deleteRemovesExistingVehicle() {
        Vehicle vehicle = new Vehicle();
        when(vehicleRepo.findById(4L)).thenReturn(Optional.of(vehicle));

        vehicleService.delete(4L);

        verify(vehicleRepo).delete(vehicle);
    }

    private CreateVehicleRequest request(VehicleStatus status) {
        CreateVehicleRequest request = new CreateVehicleRequest();
        request.setLicensePlate("ABC123");
        request.setType("Van");
        request.setMake("Ford");
        request.setModel("Transit");
        request.setYear(2024);
        request.setStatus(status);
        return request;
    }
}
