import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, 
  ZAxis, Brush, ReferenceArea } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Dashboard = () => {
  // Data states
  const [patientOutcomes, setPatientOutcomes] = useState([]);
  const [diagnosisDistribution, setDiagnosisDistribution] = useState([]);
  const [stayDuration, setStayDuration] = useState([]);
  const [medicationFrequency, setMedicationFrequency] = useState([]);
  const [labValues, setLabValues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [zoomDomain, setZoomDomain] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');

  // Chart visibility toggles
  const [visibleCharts, setVisibleCharts] = useState({
    outcomes: true,
    diagnoses: true,
    stayDuration: true,
    vitalSigns: true,
    medications: true
  });

  // Toggle chart visibility
  const toggleChartVisibility = (chartName) => {
    setVisibleCharts({
      ...visibleCharts,
      [chartName]: !visibleCharts[chartName]
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [outcomes, diagnoses, stays, medications, labs] = await Promise.all([
          fetch('./processed_data/patient_outcomes.json').then(res => res.json()),
          fetch('./processed_data/diagnosis_distribution.json').then(res => res.json()),
          fetch('./processed_data/stay_duration.json').then(res => res.json()),
          fetch('./processed_data/medication_frequency.json').then(res => res.json()),
          fetch('./processed_data/lab_value_trends.json').then(res => res.json())
        ]);

        setPatientOutcomes(outcomes);
        setDiagnosisDistribution(diagnoses);
        setStayDuration(stays);
        setMedicationFrequency(medications);
        setLabValues(labs);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected age group
  const getFilteredData = () => {
    if (!selectedAgeGroup) return patientOutcomes;
    return patientOutcomes.filter(item => item.ageGroup === selectedAgeGroup);
  };

  // Filter diagnosis data based on selection
  const getFilteredDiagnoses = () => {
    if (!selectedDiagnosis) return diagnosisDistribution;
    return diagnosisDistribution.filter(item => item.name === selectedDiagnosis);
  };

  // Get vital signs data based on time range
  const getVitalSignsData = () => {
    if (timeRange === '24h') return labValues;
    if (timeRange === '12h') return labValues.filter(item => item.hour < 12);
    if (timeRange === '6h') return labValues.filter(item => item.hour < 6);
    return labValues;
  };

  // Handle zoom in line chart
  const handleMouseDown = (e) => {
    if (!isCustomizing) return;
    setRefAreaLeft(e.activeLabel);
  };

  const handleMouseMove = (e) => {
    if (!isCustomizing || !refAreaLeft) return;
    setRefAreaRight(e.activeLabel);
  };

  const handleMouseUp = () => {
    if (!isCustomizing || !refAreaLeft || !refAreaRight) {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    // Ensure left and right are in the correct order
    let left = Math.min(refAreaLeft, refAreaRight);
    let right = Math.max(refAreaLeft, refAreaRight);
    
    setZoomDomain([left, right]);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const handleZoomOut = () => {
    setZoomDomain(null);
  };

  // Handle click on bar chart
  const handleBarClick = (data) => {
    setSelectedAgeGroup(selectedAgeGroup === data.ageGroup ? null : data.ageGroup);
  };

  // Handle click on pie chart
  const handlePieClick = (data) => {
    setSelectedDiagnosis(selectedDiagnosis === data.name ? null : data.name);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading MIMIC-III data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <h1>MIMIC-III Clinical Dashboard</h1>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'patient' ? 'active' : ''} 
            onClick={() => setActiveTab('patient')}
          >
            Patient Vitals
          </button>
          <button 
            className={activeTab === 'medications' ? 'active' : ''} 
            onClick={() => setActiveTab('medications')}
          >
            Medications
          </button>
        </div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Customize Dashboard:</label>
          <div className="toggle-buttons">
            <label>
              <input 
                type="checkbox" 
                checked={visibleCharts.outcomes} 
                onChange={() => toggleChartVisibility('outcomes')}
              />
              Patient Outcomes
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={visibleCharts.diagnoses} 
                onChange={() => toggleChartVisibility('diagnoses')}
              />
              Diagnoses
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={visibleCharts.stayDuration} 
                onChange={() => toggleChartVisibility('stayDuration')}
              />
              Length of Stay
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={visibleCharts.vitalSigns} 
                onChange={() => toggleChartVisibility('vitalSigns')}
              />
              Vital Signs
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={visibleCharts.medications} 
                onChange={() => toggleChartVisibility('medications')}
              />
              Medications
            </label>
          </div>
        </div>

        {activeTab === 'patient' && (
          <div className="control-group">
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="6h">Last 6 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            <button 
              className={isCustomizing ? 'active' : ''} 
              onClick={() => setIsCustomizing(!isCustomizing)}
            >
              {isCustomizing ? 'Finish Zooming' : 'Enable Zoom'}
            </button>
            {zoomDomain && <button onClick={handleZoomOut}>Reset Zoom</button>}
          </div>
        )}

        {selectedAgeGroup && (
          <div className="selection-indicator">
            <span>Selected Age Group: {selectedAgeGroup}</span>
            <button onClick={() => setSelectedAgeGroup(null)}>Clear</button>
          </div>
        )}

        {selectedDiagnosis && (
          <div className="selection-indicator">
            <span>Selected Diagnosis: {selectedDiagnosis}</span>
            <button onClick={() => setSelectedDiagnosis(null)}>Clear</button>
          </div>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="charts">
          {visibleCharts.outcomes && (
            <div className="chart-container">
              <h2>Patient Outcomes by Age Group</h2>
              <p className="interaction-hint">Click on a bar to filter data</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getFilteredData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="survived" 
                    fill="#82ca9d" 
                    name="Survived" 
                    onClick={handleBarClick}
                    cursor="pointer"
                  />
                  <Bar 
                    dataKey="deceased" 
                    fill="#ff7f7f" 
                    name="Deceased" 
                    onClick={handleBarClick}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {visibleCharts.diagnoses && (
            <div className="chart-container">
              <h2>Diagnosis Distribution</h2>
              <p className="interaction-hint">Click on a segment to filter</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getFilteredDiagnoses()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {diagnosisDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={selectedDiagnosis && selectedDiagnosis !== entry.name ? 0.5 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {visibleCharts.stayDuration && (
            <div className="chart-container">
              <h2>Length of Stay by Service</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stayDuration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="days" fill="#8884d8" />
                  <Brush dataKey="service" height={30} stroke="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'patient' && (
        <div className="charts">
          {visibleCharts.vitalSigns && (
            <div className="chart-container full-width">
              <h2>Patient Vital Signs ({timeRange})</h2>
              {isCustomizing && <p className="interaction-hint">Click and drag to zoom into a specific time period</p>}
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={getVitalSignsData()}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    domain={zoomDomain || ['auto', 'auto']}
                    label={{ value: 'Hours', position: 'insideBottom', offset: 0 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="heartRate" stroke="#ff7f7f" name="Heart Rate" dot={false} />
                  <Line type="monotone" dataKey="o2Saturation" stroke="#82ca9d" name="O₂ Saturation" dot={false} />
                  <Line type="monotone" dataKey="bloodPressure" stroke="#8884d8" name="Blood Pressure" dot={false} />
                  <Line type="monotone" dataKey="glucose" stroke="#ffc658" name="Glucose" dot={false} />
                  {refAreaLeft && refAreaRight && (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="chart-container full-width">
            <h2>Vital Signs Correlation</h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="heartRate" name="Heart Rate" unit=" bpm" />
                <YAxis type="number" dataKey="bloodPressure" name="Blood Pressure" unit=" mmHg" />
                <ZAxis type="number" dataKey="o2Saturation" range={[50, 400]} name="O₂ Saturation" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Vital Signs" data={getVitalSignsData()} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="charts">
          {visibleCharts.medications && (
            <div className="chart-container full-width">
              <h2>Most Frequent Medications</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={medicationFrequency} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="chart-container full-width">
            <h2>Medication Usage Over Time (Simulated)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={[
                  { day: 1, antibiotics: 240, vasopressors: 120, analgesics: 180, sedatives: 90 },
                  { day: 2, antibiotics: 230, vasopressors: 110, analgesics: 200, sedatives: 80 },
                  { day: 3, antibiotics: 220, vasopressors: 90, analgesics: 190, sedatives: 85 },
                  { day: 4, antibiotics: 210, vasopressors: 80, analgesics: 170, sedatives: 75 },
                  { day: 5, antibiotics: 190, vasopressors: 70, analgesics: 160, sedatives: 65 },
                  { day: 6, antibiotics: 180, vasopressors: 60, analgesics: 150, sedatives: 60 },
                  { day: 7, antibiotics: 170, vasopressors: 50, analgesics: 140, sedatives: 50 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Day of ICU Stay', position: 'insideBottom', offset: 0 }} />
                <YAxis label={{ value: 'Number of Doses', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="antibiotics" stroke="#8884d8" name="Antibiotics" />
                <Line type="monotone" dataKey="vasopressors" stroke="#82ca9d" name="Vasopressors" />
                <Line type="monotone" dataKey="analgesics" stroke="#ffc658" name="Analgesics" />
                <Line type="monotone" dataKey="sedatives" stroke="#ff7f7f" name="Sedatives" />
                <Brush dataKey="day" height={30} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <footer>
        <p>ICU Clinical Dashboard - Based on MIMIC-III Data</p>
        <p className="small">Interactive dashboard for clinical data exploration. Data has been processed from MIMIC-III.</p>
      </footer>
    </div>
  );
};

export default Dashboard;