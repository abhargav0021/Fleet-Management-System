package edu.microserviceslab.usagemicroservice.repo;

import edu.microserviceslab.usagemicroservice.entity.LocationUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdate, Long> {
    List<LocationUpdate> findByVehicleId(Long vehicleId);
    List<LocationUpdate> findByVehicleIdAndTimestampBetween(Long vehicleId, LocalDateTime from, LocalDateTime to);
    List<LocationUpdate> findByVehicleIdAndTimestampAfter(Long vehicleId, LocalDateTime from);
    List<LocationUpdate> findByVehicleIdAndTimestampBefore(Long vehicleId, LocalDateTime to);
    List<LocationUpdate> findByTripId(Long tripId);
}
