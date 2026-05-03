package edu.microserviceslab.drivermicroservice.service;

import edu.microserviceslab.drivermicroservice.dto.CreateDriverRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.entity.DriverStatus;
import edu.microserviceslab.drivermicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.drivermicroservice.messaging.DriverEventPublisher;
import edu.microserviceslab.drivermicroservice.repo.DriverRepo;
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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriverServiceImplTest {

    @Mock
    private DriverRepo driverRepo;

    @Mock
    private DriverEventPublisher driverEventPublisher;

    @InjectMocks
    private DriverServiceImpl driverService;

    @Test
    void findAllReturnsDrivers() {
        Driver driver = new Driver();
        when(driverRepo.findAll()).thenReturn(List.of(driver));

        assertThat(driverService.findAll()).containsExactly(driver);
    }

    @Test
    void createDefaultsStatusToAvailable() {
        when(driverRepo.save(any(Driver.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Driver driver = driverService.create(request(null));

        assertThat(driver.getEmail()).isEqualTo("ada@example.com");
        assertThat(driver.getStatus()).isEqualTo(DriverStatus.AVAILABLE);
        verifyNoInteractions(driverEventPublisher);
    }

    @Test
    void assignVehicleUpdatesExistingDriver() {
        Driver driver = new Driver();
        when(driverRepo.findById(8L)).thenReturn(Optional.of(driver));
        when(driverRepo.save(any(Driver.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Driver updated = driverService.assignVehicle(8L, 42L);

        assertThat(updated.getAssignedVehicleId()).isEqualTo(42L);
    }

    @Test
    void updateStatusPublishesStatusChangedEvent() {
        Driver driver = new Driver();
        driver.setId(8L);
        driver.setStatus(DriverStatus.AVAILABLE);
        when(driverRepo.findById(8L)).thenReturn(Optional.of(driver));
        when(driverRepo.save(any(Driver.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Driver updated = driverService.updateStatus(8L, DriverStatus.ON_TRIP);

        assertThat(updated.getStatus()).isEqualTo(DriverStatus.ON_TRIP);
        verify(driverEventPublisher).publishStatusChanged(8L, DriverStatus.AVAILABLE, DriverStatus.ON_TRIP);
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(driverRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Driver not found");
    }

    @Test
    void deleteRemovesExistingDriver() {
        Driver driver = new Driver();
        when(driverRepo.findById(4L)).thenReturn(Optional.of(driver));

        driverService.delete(4L);

        verify(driverRepo).delete(driver);
    }

    private CreateDriverRequest request(DriverStatus status) {
        CreateDriverRequest request = new CreateDriverRequest();
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setEmail("ada@example.com");
        request.setPhone("555-0100");
        request.setLicenseNumber("D12345");
        request.setStatus(status);
        return request;
    }
}
