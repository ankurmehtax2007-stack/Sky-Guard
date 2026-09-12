# SkyGuard AI • AWS Station Anomaly & 5-Model Diagnostic Matrix

> **Comprehensive Technical Reference**: Catalog of all meteorological sensor anomalies generated or ingested across AWS (Automated Weather Station) nodes, the 5-tier machine learning and physical rule detection architecture, and actionable engineering remediation procedures.

---

## 1. The 5-Tier Diagnostic & Evidence Architecture

SkyGuard AI employs a fused multi-source architecture where decisions are not made by a single black-box algorithm, but by combining evidence weights across 5 complementary analytical tiers:

| Tier | Analytical Model | Evidence Weight ($w_i$) | Role & Detection Scope | Primary Features & Inputs Used |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Supervised XGBoost Classifier** | **45%** ($w = 0.45$) | Multi-class non-linear pattern recognition trained on labeled fault signatures. | Rolling stats, lag features, rate-of-change, dew point depression, spatial Z-scores. |
| **Tier 2** | **Physics-Based Domain Rules Engine** | **25%** ($w = 0.25$) | Deterministic thermodynamic and meteorological law enforcement; hard physical bounds. | Operating limits (min/max), maximum physical hourly rate limits, Magnus equation dew-point depression. |
| **Tier 3** | **Unsupervised Isolation Forest** | **15%** ($w = 0.15$) | Novelty and out-of-distribution detection for unknown, multi-sensor corruptions. | Normalized feature space matrix; evaluates path length across recursive random partition trees. |
| **Tier 4** | **Temporal Rate & Rolling Lag Engine** | **7.5%** ($w = 0.075$) | Rapid transient spike detection, zero-variance freeze counters, and progressive slope drift. | $\Delta t$ derivatives, 1-hour rate of change ($\text{rate}_{1h}$), consecutive identical packet counter (`frozen_count`). |
| **Tier 5** | **Spatial Cluster Consistency Engine** | **7.5%** ($w = 0.075$) | Cross-station regional consistency check against neighboring meteorological stations. | Cluster baselines (NCR, Konkan, etc.), spatial delta ($\Delta_{\text{station}} - \mu_{\text{cluster}}$), spatial Z-score ($Z \ge 3.0\sigma$). |

### Evidence Fusion Formula
$$\text{Fused Score} = \text{clip}\left(\sum_{i=1}^5 w_i \cdot \text{Score}_i, 0.0, 1.0\right)$$
*When a primary physical violation or spatial outlier triggers, non-linear boosting elevates the incident priority above normal triage thresholds.*

---

## 2. Complete AWS Station Anomaly Catalog & Model Mapping

Below is the complete inventory of all 13 anomaly types that can be injected, simulated, or detected across SkyGuard AWS stations (`AWS_01`, `AWS_02`, `AWS_03`, etc.).

---

### 1. Temperature Spike (`temperature_spike` / `thermal_spike`)

* **Affected Sensor**: Temperature ($T$, in °C)
* **Simulator Characteristics**: Abrupt positive surge $+16^\circ\text{C}$ to $+35^\circ\text{C}$ (e.g., jump to $48^\circ\text{C} - 55^\circ\text{C}$).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Triggers Range Anomaly ($T > 46.0^\circ\text{C}$) and Rate Anomaly ($|\text{rate}_{1h}| > 5.0^\circ\text{C/hr}$).
  * **Tier 1 (XGBoost)**: Identifies `temperature_spike` class with high SHAP attribution on `temperature_c`.
  * **Tier 4 (Temporal)**: Detects sharp lag-1 derivative discontinuity.
* **Supporting Models**: Tier 5 (Spatial Z-score deviates strongly from cluster mean).
* **Physical Root Cause**:
  * Solar radiation shield detachment or direct sunlight ingress onto RTD/thermistor.
  * Ground loop or electrical voltage spike on analog-to-digital converter (ADC) channel.
  * Local heat source interference (exhaust vents, generator proximity, asphalt heating).
* **Engineering SOP & Probable Solution**:
  1. Inspect aspirated/passive solar radiation shield for physical damage or misalignment.
  2. Verify 4-wire PT100/RTD cable shielding and grounding terminal connections to eliminate EMF spikes.
  3. Validate ADC reference voltage and signal conditioner integrity.

---

### 2. Cryogenic Dip (`cryogenic_dip` / `temp_dip`)

* **Affected Sensor**: Temperature ($T$, in °C)
* **Simulator Characteristics**: Abrupt downward plunge $-10^\circ\text{C}$ to $-20^\circ\text{C}$ (e.g., dropping to $<3.0^\circ\text{C}$ or sub-zero in tropical/sub-tropical nodes).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Triggers low operating limit breach ($T < -5.0^\circ\text{C}$ or regional threshold) and high negative rate limit.
  * **Tier 1 (XGBoost)**: Recognizes thermal outlier class with negative SHAP factor.
  * **Tier 5 (Spatial)**: Spatial Z-score drops below $-3.0\sigma$ while neighbor stations remain warm.
* **Supporting Models**: Tier 3 (Isolation Forest flags extreme bivariate $T$-vs-Pressure outlier).
* **Physical Root Cause**:
  * Partial open-circuit or intermittent disconnect in thermistor wiring (leads to near-infinite resistance reading).
  * Cold-junction compensation failure on thermocouple / transducer.
  * Water ingress into cable splice causing resistive shunting.
* **Engineering SOP & Probable Solution**:
  1. Perform continuity and loop resistance check on sensor leads.
  2. Inspect junction box and terminal block for corrosion, moisture, or oxidation.
  3. Replace sensor transducer if cold-junction bridge circuit is damaged.

---

### 3. Moisture Saturation Surge (`humidity_spike` / `moisture_saturation_surge`)

* **Affected Sensor**: Relative Humidity ($RH$, in % RH)
* **Simulator Characteristics**: Sudden jump $+25\%$ to $+50\%$ RH reaching $95\% - 100\%$ saturation.
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Violates upper operational ceiling ($RH \ge 98.0\%$) and rate-of-change ($|\text{rate}_{1h}| > 18.0\%/\text{hr}$).
  * **Tier 1 (XGBoost)**: Identifies `humidity_spike` driven by `humidity_pct` SHAP factor.
  * **Tier 2 (Dew Point)**: Magnus calculation shows dew point depression collapsing to zero without corresponding rain/fog telemetry.
* **Supporting Models**: Tier 4 (Temporal rate jump).
* **Physical Root Cause**:
  * Liquid condensation entrapment or water film covering capacitive hygrometer polymer.
  * Salt, dust, or insect contamination on the protective sintered filter cap.
  * Sensor enclosure seal degradation allowing water pooling inside housing.
* **Engineering SOP & Probable Solution**:
  1. Remove and clean or replace the PTFE / sintered bronze sensor filter cap.
  2. Check enclosure drainage ports and Gore-Tex breathing vents for blockages.
  3. Allow capacitive element to dry; if saturation hysteresis persists $>24\text{h}$, recalibrate using standard salt chambers ($75.3\%$ NaCl, $33\%$ $\text{MgCl}_2$).

---

### 4. Arid Drop (`arid_drop`)

* **Affected Sensor**: Relative Humidity ($RH$, in % RH)
* **Simulator Characteristics**: Sudden plummet of $-25\%$ to $-40\%$ RH down into extreme non-physical arid levels ($<10\% - 15\%$ RH in coastal/monsoon regions).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Breaches lower physical boundary ($RH < 5.0\% - 10.0\%$) and exceeds rate limit ($>18\%/\text{hr}$).
  * **Tier 1 (XGBoost)**: High probability for humidity fault class.
  * **Tier 5 (Spatial)**: Severe spatial discrepancy against regional cluster baseline.
* **Supporting Models**: Tier 3 (Isolation Forest).
* **Physical Root Cause**:
  * Capacitive polymer delamination or micro-crack on sensing die.
  * High-impedance connection on I2C/analog humidity return trace.
  * Sensor drying out under abnormal internal heating from shorted power line.
* **Engineering SOP & Probable Solution**:
  1. Verify supply voltage at sensor header (typically $3.3\text{V} \pm 5\%$).
  2. Inspect capacitive element under magnification for physical delamination or scorch marks.
  3. Replace hygrometer module if capacitive response curve is degraded.

---

### 5. Barometric Pressure Jump / Surge (`pressure_jump` / `barometric_surge`)

* **Affected Sensor**: Atmospheric Pressure ($P$, in hPa)
* **Simulator Characteristics**: Abrupt step change $+25$ to $+80$ hPa (e.g., $1050$ to $1080$ hPa).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Operating limit breach ($P > 1035.0$ hPa) and extreme barometric rate violation ($|\text{rate}_{1h}| > 3.0$ hPa/hr).
  * **Tier 1 (XGBoost)**: Detects `pressure_jump` with dominant SHAP attribution on `pressure_hpa`.
  * **Tier 4 (Temporal)**: High temporal rate lag coefficient.
* **Supporting Models**: Tier 5 (Spatial barometric gradient is meteorologically impossible across tens of kilometers).
* **Physical Root Cause**:
  * Dynamic wind pressure ramming into an unvented or incorrectly ported enclosure.
  * Barometric vent tube kinked, crushed, or obstructed by insects/debris.
  * Piezoresistive diaphragm transducer over-pressure shock or sensor failure.
* **Engineering SOP & Probable Solution**:
  1. Inspect static pressure port and dynamic pressure damping baffle.
  2. Clear obstruction or moisture inside barometric capillary vent tube.
  3. Validate zero-point offset against an onsite calibrated reference barometer.

---

### 6. Barometric Depression (`barometric_depression` / `barometric_drop`)

* **Affected Sensor**: Atmospheric Pressure ($P$, in hPa)
* **Simulator Characteristics**: Abrupt drop $-25$ to $-80$ hPa (e.g., dropping to $<960 - 970$ hPa outside severe cyclonic centers).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Breaches regional minimum threshold ($P < 980.0$ hPa) and rate threshold ($>3.0$ hPa/hr).
  * **Tier 1 (XGBoost)**: Flags `pressure_jump` / depression signature.
  * **Tier 5 (Spatial)**: Massive cluster Z-score divergence ($Z < -3.5$).
* **Supporting Models**: Tier 3 (Isolation Forest).
* **Physical Root Cause**:
  * Enclosure vacuum effect caused by suction in high-wind conditions through improper venting.
  * ADC reference voltage drop or faulty bridge excitation supply.
  * Sensor MEMS diaphragm rupture.
* **Engineering SOP & Probable Solution**:
  1. Install an all-weather quad-disc static pressure port to eliminate Bernoulli wind-suction effects.
  2. Test transducer bridge excitation voltage ($5.000\text{V} \pm 2\text{mV}$).
  3. Replace barometric transducer module if internal vacuum cavity has leaked.

---

### 7. Sensor Freeze (`freeze` / `sensor_freeze`)

* **Affected Sensor**: Any sensor ($T$, $RH$, or $P$)
* **Simulator Characteristics**: Exact identical numerical float value repeated for $\ge 3 - 10$ consecutive cycles with zero microscopic noise ($\sigma = 0.000$).
* **Primary Detecting Models**:
  * **Tier 4 (Temporal Engine)**: Directly tracks `frozen_count` ($\ge 4$ consecutive identical packets).
  * **Tier 1 (XGBoost)**: High confidence for `freeze` classification.
  * **Tier 3 (Isolation Forest)**: Zero local temporal variance is statistically abnormal for real ambient atmosphere.
* **Supporting Models**: Tier 2 (Rate-of-change equals zero during peak diurnal heating hours).
* **Physical Root Cause**:
  * Firmware microcontroller I2C/SPI bus hangup or deadlocked lock-up condition.
  * ADC converter frozen in sample-and-hold latch state.
  * Analog input pin floated to rail or stuck register in smart digital sensor probe.
* **Engineering SOP & Probable Solution**:
  1. Issue a remote hardware watchdog / sensor power-cycle reset command.
  2. Reflash data logger firmware to resolve I2C bus arbitration deadlock.
  3. If freeze returns immediately after power cycling, replace the sensor probe or data acquisition board.

---

### 8. Calibration Drift (`drift` / `sensor_drift`)

* **Affected Sensor**: Typically Temperature or Humidity, occasionally Pressure
* **Simulator Characteristics**: Continuous slow linear departure over time (e.g., $+0.5^\circ\text{C}$ to $+1.5^\circ\text{C}$ per hour compounding over days).
* **Primary Detecting Models**:
  * **Tier 5 (Spatial Cluster Engine)**: Detects steady drift away from neighbor cluster mean over multi-hour baselines.
  * **Tier 1 (XGBoost)**: Classified as `drift` when multi-lag rates show consistent monotonic direction.
  * **Tier 3 (Isolation Forest)**: Flags multidimensional shift away from historical normal cluster manifold.
* **Supporting Models**: Tier 4 (Moving average divergence).
* **Physical Root Cause**:
  * Chemical contamination or aging of sensing layer (e.g., volatile organic compounds poisoning polymer).
  * Gradual component value degradation in precision resistors / reference diodes.
  * Progressive dirt accumulation on optical or thermistor surface.
* **Engineering SOP & Probable Solution**:
  1. Collocate a portable tertiary reference sensor (traveling standard) for a 2-hour comparison run.
  2. Calculate 24-hour mean bias relative to cluster neighbors.
  3. Perform multi-point span recalibration or replace sensor cartridge if aging limit exceeded.

---

### 9. Sensor Bias Offset (`offset` / `sensor_offset`)

* **Affected Sensor**: Temperature, Humidity, or Pressure
* **Simulator Characteristics**: Telemetry follows normal diurnal fluctuations and rates, but with a constant parallel vertical offset (e.g., $+10^\circ\text{C}$ to $+15^\circ\text{C}$ or $+20$ hPa bias).
* **Primary Detecting Models**:
  * **Tier 5 (Spatial Engine)**: Constant non-zero spatial delta ($\Delta > 2.5\sigma$) that persists across both day and night cycles.
  * **Tier 1 (XGBoost)**: Recognizes `offset` signature (normal rate profile, abnormal baseline).
  * **Tier 2 (Physics Rules)**: May trigger range checks depending on offset magnitude.
* **Supporting Models**: Tier 3 (Isolation Forest).
* **Physical Root Cause**:
  * Incorrect calibration constant or station altitude setting entered into station logger config (e.g., sea-level reduction formula offset).
  * Resistor bridge zero-potentiometer drift or ADC zero-offset shift.
  * Sensor replaced without updating calibration coefficient table in firmware.
* **Engineering SOP & Probable Solution**:
  1. Verify station elevation, latitude, and longitude metadata in station registry.
  2. Check data logger conversion equation: $Y = m \cdot X + c$ (confirm offset term $c$).
  3. Apply firmware calibration offset correction.

---

### 10. Multivariate Inconsistency (`multivariate_inconsistency`)

* **Affected Sensor**: Multi-sensor ($T + RH$, or $T + P$)
* **Simulator Characteristics**: Coexistence of mutually conflicting physical states (e.g., Extreme Heat $T > 42^\circ\text{C}$ accompanied simultaneously by Saturated Humidity $RH > 85\%$, creating an impossible thermodynamic enthalpy index).
* **Primary Detecting Models**:
  * **Tier 2 (Physics Rules)**: Cross-sensor consistency check (`physics_cross_score`) and abnormal Magnus dew-point depression violation.
  * **Tier 1 (XGBoost)**: Flags `multivariate_inconsistency`.
  * **Tier 3 (Isolation Forest)**: Highly sensitive to multi-feature correlation breakdowns (low tree isolation depth).
* **Supporting Models**: Tier 5 (Spatial comparison).
* **Physical Root Cause**:
  * Water spray/mist directly hitting humidity probe while ambient temperature is legitimate.
  * Internal logger heating affecting temperature sensor while humidity probe is external.
  * Two sensors from different stations cross-wired into wrong ADC channels.
* **Engineering SOP & Probable Solution**:
  1. Inspect physical layout to ensure humidity and temperature sensors are co-located in the same aspirated shield.
  2. Verify wiring pinout mapping against channel configuration sheet.
  3. Test combined thermo-hygrometer probe for internal cross-talk.

---

### 11. Spatial Inconsistency (`spatial_inconsistency` / `spatial_divergence`)

* **Affected Sensor**: Any sensor on an individual station
* **Simulator Characteristics**: Station reading diverges dramatically from surrounding stations in the same geographic/climatic cluster (e.g., $AWS\_02$ in Mumbai reports rain storm while neighboring coastal nodes report clear weather).
* **Primary Detecting Models**:
  * **Tier 5 (Spatial Cluster Engine)**: Direct trigger when spatial Z-score $|Z_{\text{spatial}}| \ge 3.0$ and neighbor consistency score drops significantly.
  * **Tier 1 (XGBoost)**: Categorizes `spatial_inconsistency`.
  * **Tier 3 (Isolation Forest)**: Flags the station as an isolated cluster outlier.
* **Supporting Models**: Tier 2 (If reading also crosses local range limits).
* **Physical Root Cause**:
  * Siting obstruction (e.g., tree canopy growth, new building construction altering air flow, air conditioning unit exhaust plume).
  * Localized non-meteorological micro-climate interference.
  * Sensor decalibration on one isolated station while peer network is healthy.
* **Engineering SOP & Probable Solution**:
  1. Review automated satellite / radar imagery over the station location to confirm whether a localized convective cloud was present.
  2. Conduct a site inspection for new physical obstacles or reflective structures within 30 meters.
  3. Recalibrate sensor against neighboring cluster baseline if obstruction is ruled out.

---

### 12. Missing Telemetry / Packet Drop (`missing_data`)

* **Affected Sensor**: All telemetry channels
* **Simulator Characteristics**: Dropped packets, null payloads, zero transmission during scheduled 10-second cadence.
* **Primary Detecting Models**:
  * **Tier 4 (Temporal Engine)**: Telemetry arrival watchdog detects timeout ($>30$ seconds without packet).
  * **Tier 1 (XGBoost)**: Classified as `missing_data` when null/imputed values exceed threshold.
* **Supporting Models**: Backend ingestion pipeline health monitor.
* **Physical Root Cause**:
  * Solar battery voltage collapse, solar panel dust accumulation, or charge controller failure.
  * Cellular (4G/LTE), LoRaWAN, or satellite modem antenna disconnection or carrier tower outage.
  * Data logger system crash or corrupt SD storage buffer.
* **Engineering SOP & Probable Solution**:
  1. Check solar power subsystem: battery open-circuit voltage, solar panel charging current, and regulator output.
  2. Inspect RF antenna cable, VSWR ratio, and cellular SIM card carrier registration.
  3. Reboot data logger and review on-board error logs from non-volatile storage.

---

### 13. Novel Multi-Sensor Anomaly (`novel_anomaly`)

* **Affected Sensor**: Multi-sensor or complex non-linear combinations
* **Simulator Characteristics**: Arbitrary multidimensional telemetry deviations that do not fit standard labeled failure classes.
* **Primary Detecting Models**:
  * **Tier 3 (Isolation Forest)**: Primary novelty detector; triggers when Isolation Forest novelty score exceeds novelty threshold ($>0.65$) while supervised class probabilities remain indeterminate.
  * **Evidence Fusion Engine**: Fused score elevates based on combined anomaly boost.
* **Supporting Models**: Tier 2 and Tier 4.
* **Physical Root Cause**:
  * Unprecedented extreme weather events (microburst, haboob, lightning strike near station).
  * Complex multi-sensor ground bus fault or partial lightning surge protector arrestor breakdown.
  * Firmware corruption generating pseudo-random telemetry outputs.
* **Engineering SOP & Probable Solution**:
  1. Run on-demand LLM Root-Cause Diagnosis in SkyGuard UI for specialized physics-based hypothesis generation.
  2. Dispatch field engineering team for complete physical, electrical, and telemetry audit.
  3. Isolate station telemetry from downstream automated forecasting models until manual sign-off.

---

## 3. Quick-Reference Matrix: Anomalies vs. 5 Models

| Anomaly Type | XGBoost (45%) | Physics Rules (25%) | Isolation Forest (15%) | Temporal Engine (7.5%) | Spatial Engine (7.5%) | Typical Severity | Primary Recommended Action |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Temperature Spike** | **Primary** | **Primary** | Secondary | **Primary** | Secondary | **High / Critical** | Inspect RTD wiring, shielding, ADC voltage. |
| **Cryogenic Dip** | **Primary** | **Primary** | Secondary | Secondary | **Primary** | **High** | Check open circuit, corrosion, cold junction. |
| **Humidity Surge** | **Primary** | **Primary** | Secondary | Secondary | Secondary | **Medium / High** | Inspect sintered filter cap, condensation. |
| **Arid Drop** | **Primary** | **Primary** | Secondary | Secondary | **Primary** | **Medium** | Check capacitive sensor element delamination. |
| **Pressure Surge** | **Primary** | **Primary** | Secondary | **Primary** | Secondary | **High** | Clear static pressure port and vent tube. |
| **Barometric Depression** | **Primary** | **Primary** | Secondary | Secondary | **Primary** | **High** | Check wind-suction Bernoulli effect, vent seal. |
| **Sensor Freeze** | **Primary** | Secondary | **Primary** | **Primary (Count $\ge 4$)** | Secondary | **High** | Power-cycle sensor probe, resolve I2C hang. |
| **Calibration Drift** | **Primary** | Secondary | **Primary** | Secondary | **Primary** | **High** | Collocate reference standard, recalibrate span. |
| **Sensor Bias Offset** | **Primary** | Secondary | Secondary | Secondary | **Primary** | **Medium** | Verify station altitude config and offset $c$. |
| **Multivariate Conflict**| **Primary** | **Primary** | **Primary** | Secondary | Secondary | **High** | Inspect $T/RH$ pair alignment, check cross-talk.|
| **Spatial Inconsistency**| **Primary** | Secondary | Secondary | Secondary | **Primary ($Z \ge 3$)** | **Medium** | Check site obstruction, local micro-climate. |
| **Missing Telemetry** | **Primary** | Secondary | Secondary | **Primary (Timeout)**| Secondary | **Critical** | Inspect solar battery, modem, SIM registration. |
| **Novel Anomaly** | Secondary | Secondary | **Primary ($>0.65$)** | Secondary | Secondary | **High / Critical** | Run on-demand LLM diagnosis, field dispatch. |

---

## 4. How to Use This Matrix for Generating AI Recommendations

When generating automated solutions in the frontend, backend, or LLM prompt templates:
1. Match the detected `anomalyType` (or `root_cause`) to the table above.
2. Query the primary detecting model to explain **why** the incident was flagged (e.g. SHAP feature attribution for XGBoost, or $Z$-score for Spatial Engine).
3. Inject the corresponding **Physical Root Cause** and **Engineering SOP Actions** directly into the remediation briefing and maintenance ticketing system.
