import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Person,
  Info,
  Home,
  HealthAndSafety,
  AccountBalance,
  LocationOn,
  GpsFixed,
} from '@mui/icons-material';

interface ClientProfile {
  firstName: string;
  lastName: string;
  aliases: string;
  age: number;
  identificationNumber: string;
  roiCompleted: 'yes' | 'no' | 'na';
  gender: string;
  ethnicity: string;
  hasChildren: boolean;
  numberOfChildren: number;
  childrenAges: string;
  isVeteran: boolean;
  isDomesticViolenceVictim: boolean;
  currentHousingSituation: string;
  homelessnessLength: string;
  numberOfEpisodes: number;
  hasMentalIllness: boolean;
  hasPhysicalDisability: boolean;
  hasSubstanceUse: boolean;
  hasLegalIssues: boolean;
  hasIncome: boolean;
  incomeSource: string;
  hasTransportation: boolean;
  transportationType: string;
  notes: string;
  // Location data for heat map integration
  encounterLocation: {
    lat: number;
    lng: number;
    address: string;
    detectedAutomatically: boolean;
  };
}

const steps = [
  'Basic Information',
  'Demographics',
  'Homelessness History', 
  'Health & Disabilities',
  'Income & Support'
];

const ClientProfileForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    firstName: '',
    lastName: '',
    aliases: '',
    age: 0,
    identificationNumber: '',
    roiCompleted: 'na',
    gender: '',
    ethnicity: '',
    hasChildren: false,
    numberOfChildren: 0,
    childrenAges: '',
    isVeteran: false,
    isDomesticViolenceVictim: false,
    currentHousingSituation: '',
    homelessnessLength: '',
    numberOfEpisodes: 0,
    hasMentalIllness: false,
    hasPhysicalDisability: false,
    hasSubstanceUse: false,
    hasLegalIssues: false,
    hasIncome: false,
    incomeSource: '',
    hasTransportation: false,
    transportationType: '',
    notes: '',
    encounterLocation: {
      lat: 33.2002, // Default to Vista center
      lng: -117.2425,
      address: '',
      detectedAutomatically: false,
    },
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setClientProfile({
      firstName: '',
      lastName: '',
      aliases: '',
      age: 0,
      identificationNumber: '',
      roiCompleted: 'na',
      gender: '',
      ethnicity: '',
      hasChildren: false,
      numberOfChildren: 0,
      childrenAges: '',
      isVeteran: false,
      isDomesticViolenceVictim: false,
      currentHousingSituation: '',
      homelessnessLength: '',
      numberOfEpisodes: 0,
      hasMentalIllness: false,
      hasPhysicalDisability: false,
      hasSubstanceUse: false,
      hasLegalIssues: false,
      hasIncome: false,
      incomeSource: '',
      hasTransportation: false,
      transportationType: '',
      notes: '',
      encounterLocation: {
        lat: 33.2002,
        lng: -117.2425,
        address: '',
        detectedAutomatically: false,
      },
    });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get address from coordinates
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          // Using a simple reverse geocoding service (you might want to use a proper API key)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          if (data.display_name || data.locality) {
            address = data.display_name || `${data.locality}, ${data.principalSubdivision}`;
          }
        } catch (error) {
          console.log('Could not fetch address:', error);
        }

        setClientProfile(prev => ({
          ...prev,
          encounterLocation: {
            lat: latitude,
            lng: longitude,
            address,
            detectedAutomatically: true,
          }
        }));
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Unable to detect location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = () => {
    // Save client profile data
    console.log('Client Profile Submitted:', clientProfile);
    
    // Create encounter data for heat map
    const encounterData = {
      id: Date.now().toString(),
      lat: clientProfile.encounterLocation.lat,
      lng: clientProfile.encounterLocation.lng,
      timestamp: new Date(),
      notes: `Client Intake: ${clientProfile.firstName} ${clientProfile.lastName} - ${clientProfile.notes || 'No additional notes'}`,
      individualCount: 1,
      services: getServicesFromProfile(clientProfile)
    };

    console.log('Creating encounter data:', encounterData);

    // Store encounter data (in a real app, this would be saved to a database)
    // For now, we'll use localStorage to persist data between sessions
    const existingEncounters = JSON.parse(localStorage.getItem('clientEncounters') || '[]');
    existingEncounters.push(encounterData);
    localStorage.setItem('clientEncounters', JSON.stringify(existingEncounters));
    
    console.log('Stored encounters:', existingEncounters);

    // Dispatch custom event to notify heat map of new data
    window.dispatchEvent(new CustomEvent('clientIntakeSubmitted'));
    console.log('Dispatched clientIntakeSubmitted event');

    alert('Client profile saved successfully! Location added to heat map.');
    handleReset();
  };

  const getServicesFromProfile = (profile: ClientProfile): string[] => {
    const services: string[] = [];
    if (profile.hasMentalIllness) services.push('mental-health');
    if (profile.hasPhysicalDisability) services.push('medical');
    if (profile.hasSubstanceUse) services.push('medical');
    if (profile.currentHousingSituation === 'street' || profile.currentHousingSituation === 'vehicle') {
      services.push('housing');
    }
    if (!profile.hasIncome) services.push('food');
    if (!profile.hasTransportation) services.push('transportation');
    // Default to basic services if none detected
    if (services.length === 0) services.push('food', 'clothing');
    return services;
  };

  const updateProfile = (field: keyof ClientProfile, value: any) => {
    setClientProfile(prev => ({ ...prev, [field]: value }));
  };

  const renderBasicInformation = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="First Name *"
          value={clientProfile.firstName}
          onChange={(e) => updateProfile('firstName', e.target.value)}
        />
        <TextField
          fullWidth
          label="Last Name *"
          value={clientProfile.lastName}
          onChange={(e) => updateProfile('lastName', e.target.value)}
        />
      </Box>
      
      <TextField
        fullWidth
        label="Aliases (comma-separated)"
        value={clientProfile.aliases}
        onChange={(e) => updateProfile('aliases', e.target.value)}
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Age"
          type="number"
          value={clientProfile.age}
          onChange={(e) => updateProfile('age', parseInt(e.target.value) || 0)}
        />
        <TextField
          fullWidth
          label="Identification Number"
          value={clientProfile.identificationNumber}
          onChange={(e) => updateProfile('identificationNumber', e.target.value)}
        />
      </Box>
      
      <FormControl fullWidth>
        <InputLabel>ROI Completed</InputLabel>
        <Select
          value={clientProfile.roiCompleted}
          onChange={(e) => updateProfile('roiCompleted', e.target.value)}
        >
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
          <MenuItem value="na">N/A</MenuItem>
        </Select>
      </FormControl>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
          <strong>Encounter Location:</strong> This information will be used to track outreach contacts on the heat map.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          label="Latitude"
          type="number"
          value={clientProfile.encounterLocation.lat}
          onChange={(e) => updateProfile('encounterLocation', {
            ...clientProfile.encounterLocation,
            lat: parseFloat(e.target.value) || 0
          })}
          inputProps={{ step: 0.0001 }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Longitude"
          type="number"
          value={clientProfile.encounterLocation.lng}
          onChange={(e) => updateProfile('encounterLocation', {
            ...clientProfile.encounterLocation,
            lng: parseFloat(e.target.value) || 0
          })}
          inputProps={{ step: 0.0001 }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={locationLoading ? undefined : <GpsFixed />}
          onClick={detectCurrentLocation}
          disabled={locationLoading}
          sx={{ minWidth: '140px' }}
        >
          {locationLoading ? 'Detecting...' : 'Auto-Detect'}
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Address/Location Description"
        value={clientProfile.encounterLocation.address}
        onChange={(e) => updateProfile('encounterLocation', {
          ...clientProfile.encounterLocation,
          address: e.target.value
        })}
        placeholder="e.g., Downtown Vista, Civic Center parking lot, etc."
        helperText={
          clientProfile.encounterLocation.detectedAutomatically 
            ? "Location detected automatically" 
            : "Enter a description of where this encounter took place"
        }
      />
    </Stack>
  );

  const renderDemographics = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={clientProfile.gender}
            onChange={(e) => updateProfile('gender', e.target.value)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="transgender">Transgender</MenuItem>
            <MenuItem value="other">Other</MenuItem>
            <MenuItem value="declined">Client Declined</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Ethnicity</InputLabel>
          <Select
            value={clientProfile.ethnicity}
            onChange={(e) => updateProfile('ethnicity', e.target.value)}
          >
            <MenuItem value="hispanic">Hispanic/Latino</MenuItem>
            <MenuItem value="non-hispanic">Non-Hispanic/Non-Latino</MenuItem>
            <MenuItem value="declined">Client Declined</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Divider />
      <Typography variant="h6">Family Information</Typography>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasChildren}
            onChange={(e) => updateProfile('hasChildren', e.target.checked)}
          />
        }
        label="Has Children"
      />

      {clientProfile.hasChildren && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Number of Children"
            type="number"
            value={clientProfile.numberOfChildren}
            onChange={(e) => updateProfile('numberOfChildren', parseInt(e.target.value) || 0)}
          />
          <TextField
            fullWidth
            label="Children's Ages"
            value={clientProfile.childrenAges}
            onChange={(e) => updateProfile('childrenAges', e.target.value)}
          />
        </Box>
      )}

      <Divider />
      <Typography variant="h6">Veteran & Vulnerability Status</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.isVeteran}
            onChange={(e) => updateProfile('isVeteran', e.target.checked)}
          />
        }
        label="Veteran"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.isDomesticViolenceVictim}
            onChange={(e) => updateProfile('isDomesticViolenceVictim', e.target.checked)}
          />
        }
        label="Domestic Violence Victim"
      />
    </Stack>
  );

  const renderHomelessnessHistory = () => (
    <Stack spacing={3}>
      <Typography variant="h6">Current Living Situation</Typography>
      
      <FormControl fullWidth>
        <InputLabel>Where are you staying tonight?</InputLabel>
        <Select
          value={clientProfile.currentHousingSituation}
          onChange={(e) => updateProfile('currentHousingSituation', e.target.value)}
        >
          <MenuItem value="street">Street/Outdoors</MenuItem>
          <MenuItem value="vehicle">Vehicle</MenuItem>
          <MenuItem value="abandoned">Abandoned Building</MenuItem>
          <MenuItem value="shelter">Emergency Shelter</MenuItem>
          <MenuItem value="transitional">Transitional Housing</MenuItem>
          <MenuItem value="friend">Staying with Friend/Family</MenuItem>
          <MenuItem value="hotel">Hotel/Motel</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Length of Current Homelessness</InputLabel>
        <Select
          value={clientProfile.homelessnessLength}
          onChange={(e) => updateProfile('homelessnessLength', e.target.value)}
        >
          <MenuItem value="less-week">Less than a week</MenuItem>
          <MenuItem value="1-4-weeks">1-4 weeks</MenuItem>
          <MenuItem value="1-3-months">1-3 months</MenuItem>
          <MenuItem value="4-6-months">4-6 months</MenuItem>
          <MenuItem value="7-12-months">7-12 months</MenuItem>
          <MenuItem value="1-4-years">1-4 years</MenuItem>
          <MenuItem value="more-4-years">More than 4 years</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Number of Homeless Episodes"
        type="number"
        value={clientProfile.numberOfEpisodes}
        onChange={(e) => updateProfile('numberOfEpisodes', parseInt(e.target.value) || 0)}
      />

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Chronic Homelessness Definition:</strong> Individual with a disability who has been continuously homeless for 1+ years 
          or has had 4+ episodes of homelessness in the last 3 years.
        </Typography>
      </Alert>
    </Stack>
  );

  const renderHealthDisabilities = () => (
    <Stack spacing={3}>
      <Typography variant="h6">Mental Health</Typography>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasMentalIllness}
            onChange={(e) => updateProfile('hasMentalIllness', e.target.checked)}
          />
        }
        label="History of Mental Illness"
      />

      <Typography variant="h6">Physical Health & Disabilities</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasPhysicalDisability}
            onChange={(e) => updateProfile('hasPhysicalDisability', e.target.checked)}
          />
        }
        label="Physical Disability"
      />

      <Typography variant="h6">Substance Use</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasSubstanceUse}
            onChange={(e) => updateProfile('hasSubstanceUse', e.target.checked)}
          />
        }
        label="Substance Use Disorder"
      />

      <Typography variant="h6">Legal Issues</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasLegalIssues}
            onChange={(e) => updateProfile('hasLegalIssues', e.target.checked)}
          />
        }
        label="Current Legal Issues"
      />
    </Stack>
  );

  const renderIncomeSupport = () => (
    <Stack spacing={3}>
      <Typography variant="h6">Income</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasIncome}
            onChange={(e) => updateProfile('hasIncome', e.target.checked)}
          />
        }
        label="Has Income Source"
      />

      {clientProfile.hasIncome && (
        <TextField
          fullWidth
          label="Income Source"
          value={clientProfile.incomeSource}
          onChange={(e) => updateProfile('incomeSource', e.target.value)}
        />
      )}

      <Typography variant="h6">Transportation</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={clientProfile.hasTransportation}
            onChange={(e) => updateProfile('hasTransportation', e.target.checked)}
          />
        }
        label="Has Transportation"
      />

      {clientProfile.hasTransportation && (
        <TextField
          fullWidth
          label="Transportation Type"
          value={clientProfile.transportationType}
          onChange={(e) => updateProfile('transportationType', e.target.value)}
        />
      )}

      <Typography variant="h6">Additional Notes</Typography>

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={clientProfile.notes}
        onChange={(e) => updateProfile('notes', e.target.value)}
      />
    </Stack>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderDemographics();
      case 2:
        return renderHomelessnessHistory();
      case 3:
        return renderHealthDisabilities();
      case 4:
        return renderIncomeSupport();
      default:
        return 'Unknown step';
    }
  };

  const getStepIcon = (step: number) => {
    const icons = [Person, Info, Home, HealthAndSafety, AccountBalance];
    const Icon = icons[step];
    return <Icon />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Client Intake Form
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          HMIS-Compliant Homeless Outreach Client Profile
        </Typography>

        <Box sx={{ mb: 4 }}>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep / steps.length) * 100} 
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => (
                  <Chip
                    icon={getStepIcon(index)}
                    label={index + 1}
                    color={activeStep >= index ? 'primary' : 'default'}
                    size="small"
                  />
                )}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Complete!
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                All client information has been collected. Review and submit the profile.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={handleReset} variant="outlined">
                  Create New Profile
                </Button>
                <Button onClick={handleSubmit} variant="contained">
                  Submit Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                {getStepContent(activeStep)}
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleNext} variant="contained">
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClientProfileForm;