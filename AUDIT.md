# Fleet Management System — Codebase Audit

> Audited: 2026-04-29  
> Branch: `main`  
> Scope: `vehicle-microservice`, `driver-microservice`, `usage-microservice`

---

## Table of Contents

1. [File Inventory](#1-file-inventory)
2. [Per-Service Findings](#2-per-service-findings)
   - [vehicle-microservice](#vehicle-microservice)
   - [driver-microservice](#driver-microservice)
   - [usage-microservice](#usage-microservice)
3. [Cross-Cutting Issues](#3-cross-cutting-issues)
4. [Inter-Service Inconsistencies](#4-inter-service-inconsistencies)
5. [Priority Matrix](#5-priority-matrix)

---

## 1. File Inventory

### vehicle-microservice

| File | Purpose |
|------|---------|
| `VehicleApplication.java` | Spring Boot entry point |
| `common/config/VehicleDatabaseConfig.java` | Enables JPA repositories |
| `common/config/VehicleWebConfig.java` | Enables Spring MVC |
| `controller/VehicleController.java` | REST endpoints: `/vehicle/list`, `/vehicle/add`, `/vehicle/licensePlate/{id}` |
| `entity/Vehicle.java` | JPA entity — id, make, model, modelYear, registration (OneToOne) |
| `entity/Registration.java` | JPA entity — id, licensePlate, licensedTo |
| `repo/VehicleRepo.java` | JPA repository for Vehicle |
| `repo/RegistrationRepo.java` | JPA repository for Registration |
| `service/interfaces/VehicleService.java` | Service interface |
| `service/VehicleServiceImpl.java` | Service implementation |
| `resources/application.properties` | Server port 8080, H2 settings |
| `resources/schema.sql` | DDL for `vehicle` and `registration` tables |
| `resources/data.sql` | Seed data (3 vehicles + 3 registrations) |
| `build.gradle` | Gradle build config |
| `hs_err_pid*.log` (×3) | JVM crash logs — should not be committed |

### driver-microservice

| File | Purpose |
|------|---------|
| `DriverApplication.java` | Spring Boot entry point |
| `common/config/DriverConfigProperties.java` | Binds `driver.vehicleBaseUrl` from properties |
| `common/config/DriverDatabaseConfig.java` | Enables JPA repos + registers config properties |
| `common/config/DriverWebConfig.java` | Enables Spring MVC |
| `common/proxies/VehicleRestProxy.java` | HTTP client for vehicle-microservice |
| `controller/DriverController.java` | REST endpoints: `/driver/add`, `/driver/changeVehicle`, `/driver/list`, `/driver/{id}`, `/driver/{id}/licensePlate`, `/driver/{id}/vehicleId` |
| `dto/DriverVehicleChangeRequest.java` | Request DTO for vehicle change |
| `entity/Driver.java` | JPA entity — id, firstName, lastName, phoneNumber, vehicleId |
| `repo/DriverRepo.java` | JPA repository for Driver |
| `service/interfaces/DriverService.java` | Service interface |
| `service/DriverServiceImpl.java` | Service implementation |
| `resources/application.properties` | Server port 8081, H2 settings, `driver.vehicleBaseUrl` |
| `resources/schema.sql` | DDL for `driver` table |
| `resources/data.sql` | Seed data (3 drivers) |
| `build.gradle` | Gradle build config |

### usage-microservice

| File | Purpose |
|------|---------|
| `Application.java` | Spring Boot entry point; defines `@Bean RestTemplate` |
| `common/config/UsageConfigProperties.java` | Binds `usage.vehicleBaseUrl` and `usage.driverBaseUrl` |
| `common/config/UsageDatabaseConfig.java` | Enables JPA repos + registers config properties |
| `common/config/UsageWebConfig.java` | Enables Spring MVC |
| `common/proxies/DriverRestProxy.java` | HTTP client for driver-microservice |
| `common/proxies/VehicleRestProxy.java` | HTTP client for vehicle-microservice |
| `controller/UsageController.java` | REST endpoints: `/usage/list`, `/usage/driver/{id}`, `/usage/vehicle/{id}`, `/usage/add` |
| `entity/UsageStatistic.java` | JPA entity — telemetry + denormalised driver/vehicle fields |
| `entity/UsageResponse.java` | DTO (unused — never referenced anywhere) |
| `entity/Driver.java` | Local POJO mirroring driver-microservice's Driver entity |
| `entity/Vehicle.java` | Local POJO with only id + licensePlate |
| `entity/Registration.java` | Local POJO mirroring vehicle-microservice's Registration |
| `repo/UsageStatisticRepo.java` | JPA repository with custom JPQL queries |
| `service/interfaces/UsageService.java` | Service interface |
| `service/UsageServiceImpl.java` | Service implementation |
| `resources/application.properties` | Server port 8082, H2 settings, vehicle + driver URLs |
| `resources/schema.sql` | DDL for `usage_statistic` table |
| `resources/data.sql` | Seed data (1 usage record) |
| `build.gradle` | Gradle build config |

---

## 2. Per-Service Findings

### vehicle-microservice

#### Broken / Will Not Work

**[CRITICAL] Static repository fields + static service method** (`VehicleServiceImpl.java:16–17, 44`)  
`vehicleRepo` and `registrationRepo` are declared `static`. Spring injects into the instance fields but the static method `addVehicleRegistration` references them via the static field. If a second `VehicleServiceImpl` instance is ever created (e.g. in tests), the static fields are overwritten and the previous instance's references are lost. This is a well-known Spring anti-pattern.

**[CRITICAL] Controller calls static method directly** (`VehicleController.java:30`)  
`VehicleServiceImpl.addVehicleRegistration(vehicle)` is called as a static method, bypassing the injected `VehicleService` interface entirely. The `vehicleService` field is never used for `add` operations, making the interface contract meaningless for that endpoint.

**[HIGH] `addVehicle` can NullPointerException** (`VehicleServiceImpl.java:46`)  
`registrationRepo.save(vehicle.getRegistration())` has no null check. If a caller omits the `registration` field in the JSON body, this throws an NPE at runtime.

**[HIGH] `addVehicleRegistration` not declared on the `VehicleService` interface**  
The interface only exposes `getAllVehicles()` and `getVehicleLicensePlate()`. The add operation exists only as a static backdoor, so it cannot be mocked or tested through the interface.

#### Incomplete / Missing

**[MEDIUM] `application.properties` missing datasource URL**  
`spring.datasource.url` is absent. Spring Boot auto-configures an in-memory H2 URL, but without `spring.datasource.url=jdbc:h2:mem:vehicledb;DB_CLOSE_DELAY=-1` the DB name is random per restart and schema.sql initialisation behaviour is undefined across Boot versions.

**[MEDIUM] No FK constraint in schema.sql**  
`vehicle.registration_id` references the `registration` table but there is no `FOREIGN KEY` clause. Orphaned vehicle records are possible.

**[LOW] No HTTP method constraints on `@RequestMapping`**  
`/vehicle/list` and `/vehicle/licensePlate/{id}` accept any HTTP method (GET, POST, DELETE, etc). Should use `@GetMapping`.

**[LOW] Unused import** (`VehicleApplication.java:3–4`)  
`Vehicle` and `VehicleRepo` are imported but never used.

**[LOW] `getVehicleLicensePlate` returns `null` for missing vehicle**  
No `404` response — callers receive HTTP 200 with a null/empty body and cannot distinguish "not found" from "no plate".

**[INFO] No tests** — `testCompile` dependency declared but zero test files exist.

---

### driver-microservice

#### Broken / Will Not Work

**[HIGH] `IllegalStateException` used for input validation**  
`DriverController.addDriver` and `changeVehicle` throw `IllegalStateException` on bad input. Without a `@ControllerAdvice` this becomes HTTP 500 (Internal Server Error), not the correct HTTP 400 (Bad Request).

**[HIGH] No error handling around cross-service proxy call** (`DriverController.java:46`)  
`vehicleRestProxy.getVehicleLicensePlate(...)` inside `changeVehicle` makes a live HTTP call. If vehicle-microservice is down or returns a non-2xx response, `RestTemplate` throws `RestClientException`, which propagates as an unhandled HTTP 500 with no useful message.

**[MEDIUM] `changeVehicle` silently returns `null` when driver not found**  
`DriverServiceImpl.changeVehicle` returns `null` if the driver ID does not exist. The controller passes that null to Spring's serialiser, which returns HTTP 200 with an empty body — the caller cannot tell the operation failed.

**[MEDIUM] `VehicleRestProxy` creates its own `RestTemplate`** (`VehicleRestProxy.java:16`)  
A `new RestTemplate()` is instantiated in the constructor. There is no shared bean, no interceptors, no timeout configuration, and it cannot be overridden in tests.

#### Incomplete / Missing

**[MEDIUM] `application.properties` missing datasource URL** — same as vehicle-microservice.

**[LOW] No HTTP method constraints on read endpoints**  
`/driver/list`, `/{driverId}`, `/{driverId}/licensePlate`, `/{driverId}/vehicleId` all accept any method.

**[LOW] `getDriverLicensePlate` returns `null` on missing driver** — same null/200 problem as vehicle service.

**[INFO] No tests.**

---

### usage-microservice

#### Broken / Will Not Work

**[CRITICAL] Static repository field + static service method** (`UsageServiceImpl.java:13, 35`)  
`usageStatisticRepo` is `static`. Same anti-pattern as vehicle-microservice. `addUsageService` is a static method called directly by the controller (`UsageController.java:53`) — again bypassing the injected interface.

**[CRITICAL] Proxy beans are never injected into `UsageServiceImpl`**  
`DriverRestProxy` and `VehicleRestProxy` are Spring `@Component` beans but are not fields in `UsageServiceImpl`. The comment "Fetch vehicle information" in `addUsageService` (line 36) is a placeholder; the actual enrichment (setting `driverFullname`, `vehicleLicensePlate`) never executes. Every saved `UsageStatistic` will have `null` for those denormalised fields unless the caller provides them manually.

**[CRITICAL] Both proxies ignore the `@Bean RestTemplate`**  
`Application.java` defines a `@Bean RestTemplate`, but `DriverRestProxy` and `VehicleRestProxy` each construct `new RestTemplate()` in their own constructors, making the bean pointless.

**[HIGH] `createdDate` is never set**  
`UsageStatistic.createdDate` has no default and is never populated in `addUsageService`. Every record written through the API will have a `null` timestamp.

**[HIGH] `addUsageService` method name mismatch**  
The `UsageService` interface declares `addUsageStatistic`. The controller calls the static `addUsageService`. The instance method `addUsageStatistic` is declared but **never called** anywhere. The interface contract is never fulfilled by the controller path.

**[HIGH] `UsageController` error message is wrong** (`UsageController.java:43`)  
Validation error says `"Please submit a driver to add."` — this is a copy-paste mistake from another service; the endpoint is for usage statistics.

**[HIGH] `Vehicle.java` has no no-arg constructor** (`entity/Vehicle.java:7`)  
The only constructor is `Vehicle(Long id, String licensePlate)`. Jackson requires a no-arg constructor for deserialisation. Any attempt to deserialise a Vehicle from JSON will fail with an `InvalidDefinitionException`.

**[MEDIUM] `UsageResponse.rotationsPerMinute` is `int`** (`UsageResponse.java:8`)  
`UsageStatistic.rotationsPerMinute` is `Long`. The DTO type is narrower; large RPM values would overflow silently. (Also, `UsageResponse` is never used anywhere.)

**[MEDIUM] Springfox 3.0.0 is incompatible with Spring Boot 2.0.5** (`build.gradle:32`)  
Springfox 3.x requires Spring Boot 2.6+ and Spring MVC auto-configuration that differs from 2.0.x. The application will fail to start with a `BeanCreationException` related to `springfox.documentation`.

**[MEDIUM] `DriverRestProxy.getVehicleForDriver` misleading name**  
The method returns the `vehicleId` for a driver, not a Vehicle object, yet it's named `getVehicleForDriver`. The return type is also `String` (raw JSON number), not `Long`.

#### Incomplete / Missing

**[MEDIUM] `application.properties` missing datasource URL** — same as other services.

**[LOW] `UsageResponse` is dead code** — defined but never populated, returned, or referenced.

**[LOW] Local `Driver`, `Vehicle`, `Registration` POJOs** are incomplete mirrors of the actual entities in other services and are unused in any actual proxy response parsing.

**[LOW] No HTTP method constraints on read endpoints.**

**[INFO] No tests.**

---

## 3. Cross-Cutting Issues

| # | Issue | Severity | Affects |
|---|-------|----------|---------|
| 1 | Spring Boot **2.0.5.RELEASE** — released Sept 2018, EOL. Many CVEs. | HIGH | All 3 |
| 2 | Gradle `compile` configuration is **removed in Gradle 7+**; must be `implementation` | HIGH | All 3 |
| 3 | `io.spring.dependency-management` plugin is absent — version alignment via BOM not applied | MEDIUM | All 3 |
| 4 | No `spring.datasource.url` — DB identity is non-deterministic across restarts | MEDIUM | All 3 |
| 5 | `data.sql` inserts `id=0` — non-standard with `AUTO_INCREMENT`; may conflict with sequence state | MEDIUM | All 3 |
| 6 | No global exception handler (`@ControllerAdvice`) — validation errors return HTTP 500 | HIGH | All 3 |
| 7 | No unit or integration tests | MEDIUM | All 3 |
| 8 | `build/` directories committed to git — generated artefacts should be in `.gitignore` | LOW | All 3 |
| 9 | JVM crash logs (`hs_err_pid*.log`) committed | LOW | vehicle |
| 10 | No Dockerfile, docker-compose, or any deployment descriptor | INFO | All 3 |
| 11 | `@RequestMapping` used without `method=` for GET endpoints — any HTTP verb accepted | LOW | All 3 |
| 12 | `jackson-xml-databind:0.6.2` pulled in but services produce JSON — unused dependency | LOW | All 3 |

---

## 4. Inter-Service Inconsistencies

| # | Inconsistency |
|---|--------------|
| 1 | **Main class naming**: `VehicleApplication`, `DriverApplication`, `Application` — no consistent convention |
| 2 | **Static anti-pattern**: present in vehicle and usage services; driver service uses correct instance DI |
| 3 | **`RestTemplate` management**: usage defines a `@Bean`, the other two do not; none of the proxies actually inject the bean |
| 4 | **Add-endpoint naming**: `addVehicleRegistration` (vehicle), `addDriver` (driver), `addUsageService` (usage) — no consistent naming scheme |
| 5 | **`ConfigProperties` pattern**: driver and usage have a `*ConfigProperties` class; vehicle does not (it makes no outbound calls, so this is acceptable — but vehicle has no `@ConfigurationProperties` binding at all) |
| 6 | **Return-on-not-found**: all three return `null` + HTTP 200 instead of HTTP 404 |
| 7 | **Port assignment**: vehicle=8080, driver=8081, usage=8082 — consistent and documented in README |
| 8 | **`UsageResponse`** class in usage-microservice has no parallel in the other services and is completely unused |
| 9 | **`rotationsPerMinute` type**: `Long` in `UsageStatistic`, `int` in `UsageResponse` |
| 10 | **Local POJO copies** in usage-microservice (`Driver`, `Vehicle`, `Registration`) duplicate entity definitions from other services rather than sharing a common library — and are themselves not used in any proxy logic |
| 11 | **Springfox** added only to usage-microservice (and with an incompatible version); not present in vehicle or driver |

---

## 5. Priority Matrix

| Priority | Item | Service |
|----------|------|---------|
| P0 | Remove static repo fields; make `addVehicleRegistration` and `addUsageService` instance methods wired through the service interface | vehicle, usage |
| P0 | Inject proxies into `UsageServiceImpl`; implement driver/vehicle enrichment in `addUsageStatistic` | usage |
| P0 | Downgrade or replace `springfox-boot-starter:3.0.0` (incompatible with Boot 2.0.5) | usage |
| P1 | Add `@ControllerAdvice` / `@ExceptionHandler` to return proper 4xx codes | all |
| P1 | Set `createdDate = new Date()` before saving in `UsageServiceImpl` | usage |
| P1 | Add null-guard on `vehicle.getRegistration()` in `addVehicleRegistration` | vehicle |
| P1 | Wrap proxy calls in try/catch to handle downstream service failures | driver, usage |
| P1 | Return `ResponseEntity` with 404 when entity not found | all |
| P2 | Add explicit `spring.datasource.url` to all `application.properties` | all |
| P2 | Replace `compile` with `implementation` in all `build.gradle` files | all |
| P2 | Upgrade Spring Boot (minimum 2.7.x LTS, ideally 3.x) | all |
| P2 | Add FK constraint on `vehicle.registration_id` | vehicle |
| P2 | Fix copy-paste error message in `UsageController.addUsageService` | usage |
| P2 | Add no-arg constructor to `Vehicle` POJO (or remove it if unused) | usage |
| P3 | Add `build/` and `hs_err_pid*.log` to `.gitignore` and remove from repo | all |
| P3 | Replace bare `@RequestMapping` with `@GetMapping`/`@PostMapping` | all |
| P3 | Remove unused `UsageResponse`, dead POJO copies (`Driver`, `Vehicle`, `Registration` in usage), and unused imports | usage, vehicle |
| P3 | Write unit tests (service layer) and integration tests (controller + H2) | all |
