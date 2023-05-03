export const PROJECT_FILENAME = 'project.json';

export const ARRAY_HELP_URL = 'https://www.narrabri.atnf.csiro.au/operations/array_configurations/configurations.html';

export const SUB_BANDS_PER_IF = 15;
export const NUMBER_OF_IF = 2;

// GHz
export const IF_BAND_WIDTH = 1.92;

export const EPOCHS = ['J2000', 'B1950', 'AzEl', 'Galactic'];

export const correlator_configurations = [
  {
    name: 'Continuum',
    num_of_antenna: 6,
    integration: 10.24,
    integration_unit: 'second',
    number_of_IF: 2,
    subbands_per_IF: 15,
    spectral_points_per_subband: 128,
    spectral_resolution: 1000,
    spectral_resolution_unit: 'kHz',
    number_of_spectral_windows: 0,
    number_of_zoom_windows: 0,
  },
  {
    name: 'Wideband Spectral',
    num_of_antenna: 6,
    integration: 10.24,
    integration_unit: 'second',
    number_of_IF: 2,
    subbands_per_IF: 15,
    spectral_points_per_subband: 1024,
    spectral_resolution: 125,
    spectral_resolution_unit: 'kHz',
    number_of_spectral_windows: 0,
    number_of_zoom_windows: 0,
  },
  {
    name: 'High Resolution Spectral',
    num_of_antenna: 6,
    integration: 10.24,
    integration_unit: 'second',
    number_of_IF: 2,
    subbands_per_IF: 15,
    spectral_resolution: 1000,
    spectral_resolution_unit: 'kHz',
    spectral_points_per_subband: 128,
    number_of_spectral_windows: 0,
    number_of_zoom_windows: 4,
    zoom: [
      {
        name: 'zoom1',
        points: 2048,
        spectral_resolution: 0.478,
        unit: 'kHz'
      },
      {
        name: 'zoom2',
        points: 2048,
        spectral_resolution: 0.478,
        unit: 'kHz'
      },
      {
        name: 'zoom3',
        points: 2048,
        spectral_resolution: 0.478,
        unit: 'kHz'
      },
      {
        name: 'zoom4',
        points: 4096,
        spectral_resolution: 0.1,
        unit: 'kHz'
      },
    ]
  }
];

export const ReceiverRange = [
  { name: '16cm', start: 1.1, end: 3.1 },
  { name: '4cm', start: 3.9, end: 11 },
  { name: '15mm', start: 16, end: 25 },
  { name: '7mm', start: 30, end: 50 },
  { name: '3mm', start: 83, end: 105 }
];

export const SCAN_TYPES = ['Normal', 'Dwell', 'Mosaic', 'Point',
  'Paddle', 'Closefile', 'OTFMos', 'Focus'];

export const POINTINGS = ['Global', 'Offset', 'Offpnt', 'Update']


// google 20c colors
export const COLOR_LIST = ["#3366cc", "#dc3912", "#ff9900", "#109618",
  "#990099", "#0099c6", "#dd4477", "#66aa00",
  "#b82e2e", "#316395", "#994499", "#22aa99",
  "#aaaa11", "#6633cc", "#e67300", "#8b0707",
  "#651067", "#329262", "#5574a6", "#3b3eac"];

export const ARRAY_CONFIGURATIONS = [
  {
    name: '6A',
    stations: ['W4', 'W45','W102', 'W173', 'W195', 'W392'],
    note: ''
  },
  {
    name: '6B',
    stations: ['W2', 'W64', 'W147', 'W182', 'W196', 'W392'],
    note: ''
  },
  {
    name: '6C', 
    stations: ['W0  ', 'W10', 'W113', 'W140', 'W182', 'W392'],
    note: ''
  },
  {
    name: '6D', 
    stations: ['W8  ', 'W32', 'W84', 'W168', 'W173', 'W392'], 
    note: ''
  },
  {
    name: '1.5A', 
    stations: ['W100', 'W110', 'W147', 'W168', 'W196', 'W392'], 
    note: ''
  },
  {
    name: '1.5B', 
    stations: ['W111', 'W113', 'W163', 'W182', 'W195', 'W392'], 
    note: ''
  },
  {
    name: '1.5C', 
    stations: ['W98 ', 'W128', 'W173', 'W190', 'W195', 'W392'], 
    note: ''
  },
  {
    name: '1.5D', 
    stations: ['W102', 'W109', 'W140', 'W182', 'W196', 'W392'], 
    note: ''
  },
  {
    name: '750A', 
    stations: ['W147', 'W163', 'W172', 'W190', 'W195', 'W392'], 
    note: ''
  },
  {
    name: '750B', 
    stations: ['W98 ', 'W109', 'W113', 'W140', 'W148', 'W392'], 
    note: ''
  },
  {
    name: '750C', 
    stations: ['W64 ', 'W84', 'W100', 'W110', 'W113', 'W392'], 
    note: ''
  },
  {
    name: '750D', 
    stations: ['W100', 'W102', 'W128', 'W140', 'W147', 'W392'], 
    note: ''
  },
  { 
    name: 'EW367', 
    stations: ['W104', 'W110', 'W113', 'W124', 'W128', 'W392'], 
    note: '' 
  },
  { 
    name: 'EW352', 
    stations: ['W102', 'W104', 'W109', 'W112', 'W125', 'W392'], 
    note: '' 
  },
  {
    name: 'H214', 
    station: ['W98', 'W104', 'W113', 'N5', 'N14', 'W392'], 
    note: 'also H214B, H214C, H214D'
  },
  {
    name: 'H168', 
    station: ['W100', 'W104', 'W111', 'N7', 'N11', 'W392'], 
    note: 'also H168B, H168C, H168D'
  },
  {
    name: 'H75', 
    station: ['W104', 'W106', 'W109', 'N2', 'N5 ', 'W392'], 
    note: 'also H75B, H75C'
  },
  {
    name: 'EW214', 
    stations: ['W98', 'W102', 'W104', 'W109', 'W112', 'W392'], 
    note:'not routinely scheduled'
  },
  {
    name: 'NS214', 
    stations: ['W106', 'N2', 'N7', 'N11', 'N14', 'W392'], 
    note:'not routinely scheduled'
  },
  {
    name: '122C', 
    stations: ['W98', 'W100', 'W102', 'W104', 'W106', 'W392'], 
    note: 'not routinely scheduled'
  }
];

export const SCAN_INTENTS = {
  normal: [
    { 
      name: 'CALIBRATE_AMPLI', 
      note: 'this is a scan to calibrate how the amplitudes have changed' 
    },
    { 
      name: 'CALIBRATE_BANDPASS', 
      note: 'this is a scan to take data that will later be used for bandpass calibration' 
    },
    { 
      name: 'CALIBRATE_DELAY', 
      note: 'likely will always be specified along with CALIBRATE_BANDPASS' 
    },
    { 
      name: 'CALIBRATE_FLUX', 
      note: 'this is a scan to take data that will later be used for flux density calibration' 
    },
    { 
      name: 'CALIBRATE_PHASE', 
      note: 'this is a scan to calibrate how the phases have changed; will almost always be specified along with CALIBRATE_AMPLI' 
    },
    { 
      name: 'CALIBRATE_POINTING', 
      note: 'this is a scan to determine local pointing offsets(the equivalent of the "Point" scan type now)' 
    },
    { 
      name: 'CALIBRATE_POLARIZATION', 
      note: 'this is a scan to take data that will later be used for polarization calibration' 
    },
    { 
      name: 'OBSERVE_TARGET', 
      note: 'take data on a scientifically- interesting source' 
    },
    { 
      name: 'CALIBRATE_POL_LEAKAGE', 
      note: 'this is a scan to take data that will later be used for polarization leakage calibration' 
    },
    { 
      name: 'CALIBRATE_POL_ANGLE', 
      note: 'this is a scan to take data that will later be used for polarization angle calibration' 
    },
    { 
      name: 'OBSERVE_CHECK_SOURCE', 
      note: 'take data on a source for quality assurance purposes' 
    },
  ],

  advanced: [
    { name: 'CALIBRATE_FOCUS'},
    { name: 'CALIBRATE_FOCUS_X'},
    { name: 'CALIBRATE_FOCUS_Y' },
    { name: 'CALIBRATE_WVR' },
    { name: 'DO_SKYDIP' },
    { name: 'MAP_ANTENNA_SURFACE' },
    { name: 'MAP_PRIMARY_BEAM' },
    { name: 'TEST' },
    { name: 'UNSPECIFIED' },
    { name: 'CALIBRATE_ANTENNA_POSITION' },
    { name: 'CALIBRATE_ANTENNA_PHASE' },
    { name: 'SYSTEM_CONFIGURATION' },
    { name: 'MEASURE_RFI' },
    { name: 'CALIBRATE_ANTENNA_POINTING_MODEL' }
  ],

  other: [
    { name: 'CALIBRATE_SIDEBAND_RATIO'}, 
    { name: 'CALIBRATE_APPPHASE_ACTIVE' },
    { name: 'CALIBRATE_APPPHASE_PASSIVE' },
    { name: 'CALIBRATE_DIFFGAIN ' },
  ] 
}


export const getStartFreq = (corr_modes: any, band: number, subband: number) => {
  const freqName = 'centreFreq' + band;
  let freq = corr_modes[freqName];
  freq = (freq - IF_BAND_WIDTH / 2) + (subband - 1) * IF_BAND_WIDTH / SUB_BANDS_PER_IF;

  return freq;
};

export const getEndFreq = (corr_modes: any, band: number, subband: number) => {
  const freqName = 'centreFreq' + band;
  let freq = corr_modes[freqName];
  freq = (freq - IF_BAND_WIDTH / 2) + subband * IF_BAND_WIDTH / SUB_BANDS_PER_IF;

  return freq;
};
