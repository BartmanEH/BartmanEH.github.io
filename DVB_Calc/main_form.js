//================================================================================
//=ToDo: IdealQEFEbNoDVBSQPSK are wrong? Ideals are higher than Actuals?
//=ToDo: QEF Points: many are missing
//=      QEF Points for DVB-S are C/N and not Es/No?
//================================================================================
/*
DVB-S2X Modes reference snapshot (quoted source selection list):
Source: https://www.satellite-calculations.com/Satellite/bitrates.htm
Cross-check source: https://www.satbroadcasts.com/DVB-S2X_Bitrate_and_Bandwidth_Calculator.html

BPSK-S 1/5 (15390)
BPSK-S 11/45 (15390)

BPSK 1/5 (14976)
BPSK 4/15 (14976)
BPSK 1/3 (16200)

BPSK 1/5 (30780)
BPSK 11/45 (30780)
BPSK 1/3 (30780)

QPSK 11/45 (16200)
QPSK 4/15 (16200)
QPSK 14/45 (16200)
QPSK 7/15 (16200)
QPSK 8/15 (16200)
QPSK 32/45 (16200)

QPSK 2/9 (61560)

QPSK 13/45 (64800)
QPSK 9/20 (64800)
QPSK 11/20 (64800)

8PSK 7/15 (16200)
8PSK 8/15 (16200)
8PSK 26/45 (16200)
8PSK 32/45 (16200)

8PSK 23/36 (64800)
8PSK 25/36 (64800)
8PSK 13/18 (64800)

8APSK 5/9-L (64800)
8APSK 26/45-L (64800)

16APSK 7/15 (16200)
16APSK 8/15 (16200)
16APSK 26/45 (16200)
16APSK 3/5 (16200)
16APSK 32/45 (16200)

16APSK 1/2-L (64800)
16APSK 8/15-L (64800)
16APSK 5/9-L (64800)
16APSK 26/45 (64800)
16APSK 3/5 (64800)
16APSK 3/5-L (64800)
16APSK 28/45 (64800)
16APSK 23/36 (64800)
16APSK 2/3-L (64800)
16APSK 25/36 (64800)
16APSK 13/18 (64800)
16APSK 7/9 (64800)
16APSK 77/90 (64800)

32APSK 2/3 (16200)
32APSK 32/45 (16200)

32APSK 2/3-L (64800)
32APSK 32/45 (64800)
32APSK 11/15 (64800)
32APSK 7/9 (64800)

64APSK 32/45-L (64800)
64APSK 11/15 (64800)
64APSK 7/9 (64800)
64APSK 4/5 (64800)
64APSK 5/6 (64800)

128APSK 3/4 (64800)
128APSK 7/9 (64800)

256APSK 29/45-L (64800)
256APSK 2/3-L (64800)
256APSK 31/45-L (64800)
256APSK 32/45 (64800)
256APSK 11/15-L (64800)
256APSK 3/4 (64800)
*/
//
const enableDVBS2X = true;  //enableDVBS2X: true -> enable DVB-S2X, false -> disable DVB-S2X
const enable16QAM = true;   //enable16QAM: true -> enable DVB-S 16QAM, false -> disable DVB-S 16QAM
const showPI = true;        //showPI: true -> display Pilot Insertion, false -> hide it
const showFL = true;        //showFL: true -> display Frame Length, false -> hide it
const showEF = true;        //showEF: true -> display Efficiency, false -> hide it
const showMM = false;       //showMM: true -> display Modulation Multiplier, false -> hide it
const enableDVBS2XVLSNRModes = true; //true enables VL-SNR MODCODs (BPSK with optional -S FEC entries)
const enableDVBS2ModesInDVBS2X = true; //true adds DVB-S2 MODCODs into matching DVB-S2X frame/modulation buckets
const useLegacyDVBS16QAMIdealEsNo = true; //true preserves v1.0.0 behavior (16QAM ideal Es/No from QPSK table)
const varSymbolRateDefault = 45;          //default Symbol Rate to kick off default calculation
const varBandwidthDefault = 36;           //default Bandwidth to kick off default calculation
const initDVBStandard = 'DVB-S2X';        //page-load DVB standard: 'DVB-S' | 'DVB-S2' | 'DVB-S2X'
const initModulationByStandard = {        //page-load modulation by standard
  'DVB-S': 'QPSK',
  'DVB-S2': '8PSK',
  'DVB-S2X': 'QPSK'
};
let emailBody = '';                     //global var email message body
let version = '';                       //global version
//build data arrays       //invalid datapoint placeholder: -9999 || -9999
//FEC RATE    1/4 1/3 2/5 1/2 3/5 2/3 3/4 4/5 5/6 7/8 8/9 9/10
//DVB-S  QPSK              X       X   X       X   X
//DVB-S  8PSK                      X           X       X
//DVB-S 16QAM                          X           X
//ETSI EN 300 421
//NOTE 1: The figures in table D.1 refer to computer simulation results achieved on a hypothetical satellite chain, including IMUX, TWTA and OMUX
//(see figures C.1 and C.2), with modulation roll-off of 0,35. The C/N figures are based on the assumption of soft-decision Viterbi decoding
//in the receiver. The ratio BW/Rs = 1,28 has been adopted.
//NOTE 2: The figures for C/N include a calculated degradation of 0,2 dB due to bandwidth limitations on IMUX and OMUX filters,
//0,8 dB non-linear distortion on TWTA at saturation and 0,8 dB modem degradation.
//The figures apply to BER = 2 × 10-4 before RS(204,188), which corresponds to "Quasi Error Free" at the RS coder output.
//Degradation due to interference is not taken into account.
//FEC RATE                    1/4        1/3        2/5        1/2        3/5        2/3        3/4        4/5        5/6        7/8        8/9        9/10
const IdealQEFEbNoDVBSQPSK = { 14: -9999, 13: -9999, 25: -9999, 12: 4.500, 35: -9999, 23: 5.000, 34: 5.500, 45: -9999, 56: 6.000, 78: 6.400, 89: -9999, 910: -9999 };
const IdealQEFEsNoDVBSQPSK = { 14: -9999, 13: -9999, 25: -9999, 12: 4.100, 35: -9999, 23: 5.800, 34: 6.800, 45: -9999, 56: 7.800, 78: 8.400, 89: -9999, 910: -9999 };
const IdealQEFEsNoDVBS8PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: -9999, 45: -9999, 56: -9999, 78: -9999, 89: -9999, 910: -9999 };
const IdealQEFEsNoDVBS16QAM = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: -9999, 45: -9999, 56: -9999, 78: -9999, 89: -9999, 910: -9999 };
//BER = 1e-9 per waterfall curves from engineering for 01 & 04
//FEC RATE                      1/4        1/3        2/5        1/2        3/5        2/3        3/4        4/5        5/6        7/8        8/9        9/10
const ActualQEFEbNoDVBSQPSK = { 14: -9999, 13: -9999, 25: -9999, 12: 3.500, 35: -9999, 23: 3.900, 34: 4.400, 45: -9999, 56: 5.100, 78: 5.400, 89: -9999, 910: -9999 };
const ActualQEFEbNoDVBS8PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 6.000, 34: -9999, 45: -9999, 56: 8.400, 78: -9999, 89: 9.200, 910: -9999 };
const ActualQEFEbNoDVBS16QAM = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: -9999, 45: -9999, 56: -9999, 78: -9999, 89: -9999, 910: -9999 };
//FEC RATE      1/4 1/3 2/5 1/2 3/5 2/3 3/4 4/5 5/6 7/8 8/9 9/10
//DVB-S2   QPSK  X   X   X   X   X   X   X   X   X       X   X
//DVB-S2   8PSK                  X   X   X       X       X   X
//DVB-S2 16APSK                      X   X   X   X       X   X
//DVB-S2 32APSK                          X   X   X       X   X
//PER = 1e-6 per ETSI EN 302 307 standard (ideal Es/No)
//FEC RATE                        1/4        1/3        2/5        1/2        3/5        2/3        3/4        4/5        5/6        7/8        8/9        9/10
const IdealQEFEsNoDVBS2QPSK = { 14: -2.35, 13: -1.24, 25: -0.30, 12: 1.000, 35: 2.230, 23: 3.100, 34: 4.030, 45: 4.680, 56: 5.180, 78: -9999, 89: 6.200, 910: 6.420 };
const IdealQEFEsNoDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 5.500, 23: 6.620, 34: 7.910, 45: -9999, 56: 9.350, 78: -9999, 89: 10.69, 910: 10.98 };
const IdealQEFEsNoDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 8.970, 34: 10.21, 45: 11.03, 56: 11.61, 78: -9999, 89: 12.89, 910: 13.13 };
const IdealQEFEsNoDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: 12.73, 45: 13.64, 56: 14.28, 78: -9999, 89: 15.69, 910: 16.05 };
//BER = 1e-6 per waterfall curves from engineering for 01 & 04
//FEC RATE                        1/4        1/3        2/5        1/2        3/5        2/3        3/4        4/5        5/6        7/8        8/9        9/10
const ActualQEFPointsDVBS2QPSK = { 14: -1.85, 13: -0.74, 25: 0.200, 12: 1.500, 35: 2.730, 23: 3.600, 34: 4.530, 45: 5.180, 56: 5.680, 78: -9999, 89: 6.700, 910: 6.920 };
const ActualQEFPointsDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 6.000, 23: 7.120, 34: 8.410, 45: -9999, 56: 9.850, 78: -9999, 89: 11.19, 910: 11.48 };
const ActualQEFPointsDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 9.470, 34: 10.71, 45: 11.53, 56: 12.11, 78: -9999, 89: 13.39, 910: 13.63 };
const ActualQEFPointsDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: -9999, 45: -9999, 56: -9999, 78: -9999, 89: -9999, 910: -9999 };
//Efficiency
//DVB-S2, Pilot Insertion: Off, Frames: Normal
//FEC RATE                                        1/4                    1/3                    2/5                    1/2                    3/5                    2/3                    3/4                    4/5                    5/6                    7/8                    8/9                    9/10
const EfficiencyPilotsOffNormalFramesDVBS2QPSK = { 14: 0.490243151738997, 13: 0.656448137888581, 25: 0.789412126808249, 12: 0.988858110187750, 35: 1.188304093567250, 23: 1.322253000923360, 34: 1.487473068636500, 45: 1.587196060326250, 56: 1.654662973222530, 78: -9999, 89: 1.766451215758700, 910: 1.788611880578640 };
const EfficiencyPilotsOffNormalFramesDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 1.779990779160900, 23: 1.980636237897650, 34: 2.228123559243890, 45: -9999, 56: 2.478561549100970, 78: -9999, 89: 2.646011987090830, 910: 2.679207007837710 };
const EfficiencyPilotsOffNormalFramesDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 2.637200736648250, 34: 2.966728054020870, 45: 3.165623081645180, 56: 3.300184162062620, 78: -9999, 89: 3.523143032535300, 910: 3.567341927562920 };
const EfficiencyPilotsOffNormalFramesDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: 3.703295019157090, 45: 3.951570881226050, 56: 4.119540229885060, 78: -9999, 89: 4.397854406130270, 910: 4.453026819923370 };
//DVB-S2, Pilot Insertion:  On, Frames:  Normal
//FEC RATE                                        1/4                    1/3                    2/5                    1/2                    3/5                    2/3                    3/4                    4/5                    5/6                    7/8                    8/9                    9/10
const EfficiencyPilotsOnNormalFramesDVBS2QPSK = { 14: 0.478577008593234, 13: 0.640826873385013, 25: 0.770626765218436, 12: 0.965326602968572, 35: 1.160026440718710, 23: 1.290787813232380, 34: 1.452076197343910, 45: 1.549426116218980, 56: 1.615287542815940, 78: -9999, 89: 1.724415600024040, 910: 1.746048915329610 };
const EfficiencyPilotsOnNormalFramesDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 1.739569252951250, 23: 1.935658286023250, 34: 2.177525457330810, 45: -9999, 56: 2.422276290889430, 78: -9999, 89: 2.585924123637020, 910: 2.618365323961430 };
const EfficiencyPilotsOnNormalFramesDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 2.574613448399860, 34: 2.896320268488550, 45: 3.090495025770110, 56: 3.221862639338370, 78: -9999, 89: 3.439530145031760, 910: 3.482680091094330 };
const EfficiencyPilotsOnNormalFramesDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: 3.623331833858150, 45: 3.866246813615230, 56: 4.030589293747190, 78: -9999, 89: 4.302893987104510, 910: 4.356875093717200 };
//DVB-S2, Pilot Insertion:  Off, Frames:  Short
//FEC RATE                                        1/4                    1/3                    2/5                    1/2                    3/5                    2/3                    3/4                    4/5                    5/6                    7/8                    8/9                    9/10
const EfficiencyPilotsOffShortFramesDVBS2QPSK = { 14: 0.365323565323565, 13: 0.629059829059829, 25: 0.760927960927961, 12: 0.848840048840049, 35: 1.156532356532360, 23: 1.288400488400490, 34: 1.420268620268620, 45: 1.508180708180710, 56: 1.596092796092800, 78: -9999, 89: 1.727960927960930, 910: -9999 };
const EfficiencyPilotsOffShortFramesDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 1.725318761384340, 23: 1.922040072859740, 34: 2.118761384335150, 45: -9999, 56: 2.381056466302370, 78: -9999, 89: 2.577777777777780, 910: -9999 };
const EfficiencyPilotsOffShortFramesDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 2.548792270531400, 34: 2.809661835748790, 45: 2.983574879227050, 56: 3.157487922705310, 78: -9999, 89: 3.418357487922710, 910: -9999 };
const EfficiencyPilotsOffShortFramesDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: 3.493093093093090, 45: 3.709309309309310, 56: 3.925525525525530, 78: -9999, 89: 4.249849849849850, 910: -9999 };
//DVB-S2, Pilot Insertion:  On, Frames:  Short
//FEC RATE                                        1/4                    1/3                    2/5                    1/2                    3/5                    2/3                    3/4                    4/5                    5/6                    7/8                    8/9                    9/10
const EfficiencyPilotsOnShortFramesDVBS2QPSK = { 14: 0.357467144563919, 13: 0.615531660692951, 25: 0.744563918757467, 12: 0.830585424133811, 35: 1.131660692951020, 23: 1.260692951015530, 34: 1.389725209080050, 45: 1.475746714456390, 56: 1.561768219832740, 78: -9999, 89: 1.690800477897250, 910: -9999 };
const EfficiencyPilotsOnShortFramesDVBS28PSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: 1.692032868881740, 23: 1.884958913897820, 34: 2.077884958913900, 45: -9999, 56: 2.335119685602000, 78: -9999, 89: 2.528045730618080, 910: -9999 };
const EfficiencyPilotsOnShortFramesDVBS216APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: 2.505223171889840, 34: 2.761633428300100, 45: 2.932573599240270, 56: 3.103513770180440, 78: -9999, 89: 3.359924026590690, 910: -9999 };
const EfficiencyPilotsOnShortFramesDVBS232APSK = { 14: -9999, 13: -9999, 25: -9999, 12: -9999, 35: -9999, 23: -9999, 34: 3.419165196942970, 45: 3.630805408583190, 56: 3.842445620223400, 78: -9999, 89: 4.159905937683720, 910: -9999 };

const INVALID_QEF_POINT = -9999;
const INVALID_EFFICIENCY = -9999;
const DVBS2ShortFrameIdealEsNoDegradationDb = 0.3; //ETSI short-frame degradation applied to ideal Es/No

function applyIdealEsNoDegradation(qefPoints, degradationDb) {
  const degradedPoints = {};
  const fecKeys = Object.keys(qefPoints);
  for (let i = 0; i < fecKeys.length; i++) {
    const fecKey = fecKeys[i];
    const qefPoint = qefPoints[fecKey];
    degradedPoints[fecKey] = qefPoint === INVALID_QEF_POINT
      ? INVALID_QEF_POINT
      : Number((qefPoint + degradationDb).toFixed(3));
  }//for
  return degradedPoints;
}//applyIdealEsNoDegradation()

const IdealQEFEsNoDVBS2QPSKShort = applyIdealEsNoDegradation(IdealQEFEsNoDVBS2QPSK, DVBS2ShortFrameIdealEsNoDegradationDb);
const IdealQEFEsNoDVBS28PSKShort = applyIdealEsNoDegradation(IdealQEFEsNoDVBS28PSK, DVBS2ShortFrameIdealEsNoDegradationDb);
const IdealQEFEsNoDVBS216APSKShort = applyIdealEsNoDegradation(IdealQEFEsNoDVBS216APSK, DVBS2ShortFrameIdealEsNoDegradationDb);
const IdealQEFEsNoDVBS232APSKShort = applyIdealEsNoDegradation(IdealQEFEsNoDVBS232APSK, DVBS2ShortFrameIdealEsNoDegradationDb);

const ModulationMultipliers = {
  'BPSK-S': 0.5,
  'BPSK': 1,
  'QPSK': 2,
  '8PSK': 3,
  '8APSK': 3,
  '16QAM': 4,
  '16APSK': 4,
  '32APSK': 5,
  '64APSK': 6,
  '128APSK': 7,
  '256APSK': 8
};

const DVBSLookup = {
  QPSK: {
    idealEbNo: IdealQEFEbNoDVBSQPSK,
    idealEsNo: IdealQEFEsNoDVBSQPSK,
    actualEbNo: ActualQEFEbNoDVBSQPSK
  },
  '8PSK': {
    idealEbNo: null,
    idealEsNo: IdealQEFEsNoDVBS8PSK,
    actualEbNo: ActualQEFEbNoDVBS8PSK
  },
  '16QAM': {
    idealEbNo: null,
    idealEsNo: useLegacyDVBS16QAMIdealEsNo ? IdealQEFEsNoDVBSQPSK : IdealQEFEsNoDVBS16QAM,
    actualEbNo: ActualQEFEbNoDVBS16QAM
  }
};

const DVBS2Lookup = {
  Off: {
    Normal: {
      QPSK: { efficiency: EfficiencyPilotsOffNormalFramesDVBS2QPSK, idealEsNo: IdealQEFEsNoDVBS2QPSK, actualEsNo: ActualQEFPointsDVBS2QPSK },
      '8PSK': { efficiency: EfficiencyPilotsOffNormalFramesDVBS28PSK, idealEsNo: IdealQEFEsNoDVBS28PSK, actualEsNo: ActualQEFPointsDVBS28PSK },
      '16APSK': { efficiency: EfficiencyPilotsOffNormalFramesDVBS216APSK, idealEsNo: IdealQEFEsNoDVBS216APSK, actualEsNo: ActualQEFPointsDVBS216APSK },
      '32APSK': { efficiency: EfficiencyPilotsOffNormalFramesDVBS232APSK, idealEsNo: IdealQEFEsNoDVBS232APSK, actualEsNo: ActualQEFPointsDVBS232APSK }
    },
    Short: {
      QPSK: { efficiency: EfficiencyPilotsOffShortFramesDVBS2QPSK, idealEsNo: IdealQEFEsNoDVBS2QPSKShort, actualEsNo: ActualQEFPointsDVBS2QPSK },
      '8PSK': { efficiency: EfficiencyPilotsOffShortFramesDVBS28PSK, idealEsNo: IdealQEFEsNoDVBS28PSKShort, actualEsNo: ActualQEFPointsDVBS28PSK },
      '16APSK': { efficiency: EfficiencyPilotsOffShortFramesDVBS216APSK, idealEsNo: IdealQEFEsNoDVBS216APSKShort, actualEsNo: ActualQEFPointsDVBS216APSK },
      '32APSK': { efficiency: EfficiencyPilotsOffShortFramesDVBS232APSK, idealEsNo: IdealQEFEsNoDVBS232APSKShort, actualEsNo: ActualQEFPointsDVBS232APSK }
    }
  },
  On: {
    Normal: {
      QPSK: { efficiency: EfficiencyPilotsOnNormalFramesDVBS2QPSK, idealEsNo: IdealQEFEsNoDVBS2QPSK, actualEsNo: ActualQEFPointsDVBS2QPSK },
      '8PSK': { efficiency: EfficiencyPilotsOnNormalFramesDVBS28PSK, idealEsNo: IdealQEFEsNoDVBS28PSK, actualEsNo: ActualQEFPointsDVBS28PSK },
      '16APSK': { efficiency: EfficiencyPilotsOnNormalFramesDVBS216APSK, idealEsNo: IdealQEFEsNoDVBS216APSK, actualEsNo: ActualQEFPointsDVBS216APSK },
      '32APSK': { efficiency: EfficiencyPilotsOnNormalFramesDVBS232APSK, idealEsNo: IdealQEFEsNoDVBS232APSK, actualEsNo: ActualQEFPointsDVBS232APSK }
    },
    Short: {
      QPSK: { efficiency: EfficiencyPilotsOnShortFramesDVBS2QPSK, idealEsNo: IdealQEFEsNoDVBS2QPSKShort, actualEsNo: ActualQEFPointsDVBS2QPSK },
      '8PSK': { efficiency: EfficiencyPilotsOnShortFramesDVBS28PSK, idealEsNo: IdealQEFEsNoDVBS28PSKShort, actualEsNo: ActualQEFPointsDVBS28PSK },
      '16APSK': { efficiency: EfficiencyPilotsOnShortFramesDVBS216APSK, idealEsNo: IdealQEFEsNoDVBS216APSKShort, actualEsNo: ActualQEFPointsDVBS216APSK },
      '32APSK': { efficiency: EfficiencyPilotsOnShortFramesDVBS232APSK, idealEsNo: IdealQEFEsNoDVBS232APSKShort, actualEsNo: ActualQEFPointsDVBS232APSK }
    }
  }
};

//DVB-S2X MODCOD performance profiles (ETSI EN 302 307-2 / DVB BlueBook A083-2r4 aligned).
//For each MODCOD, explicit pilot-off and pilot-on efficiencies are stored.
const DVBS2XLookup = {
  Normal: {
    BPSK: {
      '1/5': { efficiencyPilotsOff: 0.1807843709, efficiencyPilotsOn: 0.1764823091, idealEsNo: -6.85 },
      '11/45': { efficiencyPilotsOff: 0.2481735271, efficiencyPilotsOn: 0.2422678293, idealEsNo: -5.50 },
      '1/3': { efficiencyPilotsOff: 0.3414815895, efficiencyPilotsOn: 0.3333554727, idealEsNo: -4.00 }
    },
    QPSK: {
      '13/45': { efficiencyPilotsOff: 0.5678054786, efficiencyPilotsOn: 0.5542936122, idealEsNo: -2.03 },
      '9/20': { efficiencyPilotsOff: 0.8891351185, efficiencyPilotsOn: 0.8679766841, idealEsNo: 0.22 },
      '11/20': { efficiencyPilotsOff: 1.0885811019, efficiencyPilotsOn: 1.0626765218, idealEsNo: 1.45 }
    },
    '8PSK': {
      '23/36': { efficiencyPilotsOff: 1.8961733518, efficiencyPilotsOn: 1.8531134541, idealEsNo: 6.12 },
      '25/36': { efficiencyPilotsOff: 2.0621484555, efficiencyPilotsOn: 2.0153194557, idealEsNo: 7.02 },
      '13/18': { efficiencyPilotsOff: 2.1451360074, efficiencyPilotsOn: 2.0964224565, idealEsNo: 7.49 }
    },
    '8APSK': {
      '5/9-L': { efficiencyPilotsOff: 1.6472106962, efficiencyPilotsOn: 1.6098044517, idealEsNo: 4.73 },
      '26/45-L': { efficiencyPilotsOff: 1.7136007377, efficiencyPilotsOn: 1.6746868523, idealEsNo: 5.13 }
    },
    '16APSK': {
      '1/2-L': { efficiencyPilotsOff: 1.9722529159, efficiencyPilotsOn: 1.9254464821, idealEsNo: 5.97 },
      '8/15-L': { efficiencyPilotsOff: 2.1048496010, efficiencyPilotsOn: 2.0548963203, idealEsNo: 6.55 },
      '5/9-L': { efficiencyPilotsOff: 2.1932473910, efficiencyPilotsOn: 2.1411962124, idealEsNo: 6.84 },
      '26/45': { efficiencyPilotsOff: 2.2816451811, efficiencyPilotsOn: 2.2274961045, idealEsNo: 7.51 },
      '3/5': { efficiencyPilotsOff: 2.3700429711, efficiencyPilotsOn: 2.3137959966, idealEsNo: 7.80 },
      '3/5-L': { efficiencyPilotsOff: 2.3700429711, efficiencyPilotsOn: 2.3137959966, idealEsNo: 7.41 },
      '28/45': { efficiencyPilotsOff: 2.4584407612, efficiencyPilotsOn: 2.4000958888, idealEsNo: 8.10 },
      '23/36': { efficiencyPilotsOff: 2.5247391037, efficiencyPilotsOn: 2.4648208079, idealEsNo: 8.38 },
      '2/3-L': { efficiencyPilotsOff: 2.6352363413, efficiencyPilotsOn: 2.5726956730, idealEsNo: 8.43 },
      '25/36': { efficiencyPilotsOff: 2.7457335789, efficiencyPilotsOn: 2.6805705382, idealEsNo: 9.27 },
      '13/18': { efficiencyPilotsOff: 2.8562308165, efficiencyPilotsOn: 2.7884454033, idealEsNo: 9.71 },
      '7/9': { efficiencyPilotsOff: 3.0772252916, efficiencyPilotsOn: 3.0041951336, idealEsNo: 10.65 },
      '77/90': { efficiencyPilotsOff: 3.3866175568, efficiencyPilotsOn: 3.3062447561, idealEsNo: 11.99 }
    },
    '32APSK': {
      '2/3-L': { efficiencyPilotsOff: 3.2895019157, efficiencyPilotsOn: 3.2184735343, idealEsNo: 11.10 },
      '32/45': { efficiencyPilotsOff: 3.5101915709, efficiencyPilotsOn: 3.4343979607, idealEsNo: 11.75 },
      '11/15': { efficiencyPilotsOff: 3.6205363985, efficiencyPilotsOn: 3.5423601739, idealEsNo: 12.17 },
      '7/9': { efficiencyPilotsOff: 3.8412260536, efficiencyPilotsOn: 3.7582846004, idealEsNo: 13.05 }
    },
    '64APSK': {
      '32/45-L': { efficiencyPilotsOff: 4.2064279155, efficiencyPilotsOn: 4.1112906121, idealEsNo: 13.98 },
      '11/15': { efficiencyPilotsOff: 4.3386593205, efficiencyPilotsOn: 4.2405313229, idealEsNo: 14.81 },
      '7/9': { efficiencyPilotsOff: 4.6031221304, efficiencyPilotsOn: 4.4990127446, idealEsNo: 15.47 },
      '4/5': { efficiencyPilotsOff: 4.7353535354, efficiencyPilotsOn: 4.6282534554, idealEsNo: 15.87 },
      '5/6': { efficiencyPilotsOff: 4.9366391185, efficiencyPilotsOn: 4.8249865374, idealEsNo: 16.55 }
    },
    '128APSK': {
      '3/4': { efficiencyPilotsOff: 5.1704190408, efficiencyPilotsOn: 5.0537930474, idealEsNo: 17.73 },
      '7/9': { efficiencyPilotsOff: 5.3629938272, efficiencyPilotsOn: 5.2420240416, idealEsNo: 18.53 }
    },
    '256APSK': {
      '29/45-L': { efficiencyPilotsOff: 5.0656898657, efficiencyPilotsOn: 4.9567502987, idealEsNo: 16.98 },
      '2/3-L': { efficiencyPilotsOff: 5.2415140415, efficiencyPilotsOn: 5.1287933094, idealEsNo: 17.24 },
      '31/45-L': { efficiencyPilotsOff: 5.4173382173, efficiencyPilotsOn: 5.3008363202, idealEsNo: 18.10 },
      '32/45': { efficiencyPilotsOff: 5.5931623932, efficiencyPilotsOn: 5.4728793309, idealEsNo: 18.59 },
      '11/15-L': { efficiencyPilotsOff: 5.7689865690, efficiencyPilotsOn: 5.6449223417, idealEsNo: 18.84 },
      '3/4': { efficiencyPilotsOff: 5.9008547009, efficiencyPilotsOn: 5.7739545998, idealEsNo: 19.57 }
    }
  },
  Short: {
    BPSK: {
      '1/5': { efficiencyPilotsOff: 0.1992329001, efficiencyPilotsOn: 0.1944918251, idealEsNo: -6.10 },
      '4/15': { efficiencyPilotsOff: 0.2711485191, efficiencyPilotsOn: 0.2646960935, idealEsNo: -4.90 },
      '1/3': { efficiencyPilotsOff: 0.3171437365, efficiencyPilotsOn: 0.3095967790, idealEsNo: -3.72 }
    },
    QPSK: {
      '11/45': { efficiencyPilotsOff: 0.4532356532, efficiencyPilotsOn: 0.4434886499, idealEsNo: -2.50 },
      '4/15': { efficiencyPilotsOff: 0.4971916972, efficiencyPilotsOn: 0.4864994026, idealEsNo: -2.24 },
      '14/45': { efficiencyPilotsOff: 0.5851037851, efficiencyPilotsOn: 0.5725209080, idealEsNo: -1.46 },
      '7/15': { efficiencyPilotsOff: 0.8927960928, efficiencyPilotsOn: 0.8735961768, idealEsNo: 0.60 },
      '8/15': { efficiencyPilotsOff: 1.0246642247, efficiencyPilotsOn: 1.0026284349, idealEsNo: 1.45 },
      '32/45': { efficiencyPilotsOff: 1.3763125763, efficiencyPilotsOn: 1.3467144564, idealEsNo: 3.66 }
    },
    '8PSK': {
      '7/15': { efficiencyPilotsOff: 1.3318761384, efficiencyPilotsOn: 1.3061807788, idealEsNo: 3.83 },
      '8/15': { efficiencyPilotsOff: 1.5285974499, efficiencyPilotsOn: 1.4991068239, idealEsNo: 4.71 },
      '26/45': { efficiencyPilotsOff: 1.6597449909, efficiencyPilotsOn: 1.6277241872, idealEsNo: 5.52 },
      '32/45': { efficiencyPilotsOff: 2.0531876138, efficiencyPilotsOn: 2.0135762772, idealEsNo: 7.54 }
    },
    '16APSK': {
      '7/15': { efficiencyPilotsOff: 1.7661835749, efficiencyPilotsOn: 1.7359924027, idealEsNo: 5.99 },
      '8/15': { efficiencyPilotsOff: 2.0270531401, efficiencyPilotsOn: 1.9924026591, idealEsNo: 6.93 },
      '26/45': { efficiencyPilotsOff: 2.2009661836, efficiencyPilotsOn: 2.1633428300, idealEsNo: 7.66 },
      '3/5': { efficiencyPilotsOff: 2.2879227053, efficiencyPilotsOn: 2.2488129155, idealEsNo: 8.10 },
      '32/45': { efficiencyPilotsOff: 2.7227053140, efficiencyPilotsOn: 2.6761633428, idealEsNo: 9.81 }
    },
    '32APSK': {
      '2/3': { efficiencyPilotsOff: 3.1687687688, efficiencyPilotsOn: 3.1017048795, idealEsNo: 11.41 },
      '32/45': { efficiencyPilotsOff: 3.3849849850, efficiencyPilotsOn: 3.3133450911, idealEsNo: 12.18 }
    }
  },
  ShortS: {
    QPSK: {
      '2/9': { efficiencyPilotsOff: 0.4577278839, efficiencyPilotsOn: 0.4468354951, idealEsNo: -2.85 }
    },
    BPSK: {
      '1/5-S': { efficiencyPilotsOff: 0.0787934749, efficiencyPilotsOn: 0.0769184544, idealEsNo: -9.90 },
      '11/45-S': { efficiencyPilotsOff: 0.1202637249, efficiencyPilotsOn: 0.1174018515, idealEsNo: -8.30 }
    }
  }
};

function isDVBS2BackwardCompatibleFec(frameLength, modulation, fecRate) {
  if (!enableDVBS2ModesInDVBS2X) {
    return false;
  }//if
  return getAllowedFecRates('DVB-S2', modulation, frameLength).indexOf(fecRate) !== -1;
}//isDVBS2BackwardCompatibleFec()

function cloneDVBS2XLookup(sourceLookup) {
  const clonedLookup = {};
  const frameKeys = Object.keys(sourceLookup);
  for (let i = 0; i < frameKeys.length; i++) {
    const frameKey = frameKeys[i];
    clonedLookup[frameKey] = {};
    const modulationKeys = Object.keys(sourceLookup[frameKey]);
    for (let j = 0; j < modulationKeys.length; j++) {
      const modulation = modulationKeys[j];
      clonedLookup[frameKey][modulation] = {};
      const fecRates = Object.keys(sourceLookup[frameKey][modulation]);
      for (let k = 0; k < fecRates.length; k++) {
        const fecRate = fecRates[k];
        const profile = sourceLookup[frameKey][modulation][fecRate];
        clonedLookup[frameKey][modulation][fecRate] = {
          efficiencyPilotsOff: profile.efficiencyPilotsOff,
          efficiencyPilotsOn: profile.efficiencyPilotsOn,
          idealEsNo: profile.idealEsNo,
          sourceStandard: typeof profile.sourceStandard === 'string'
            ? profile.sourceStandard
            : (isDVBS2BackwardCompatibleFec(frameKey, modulation, fecRate) ? 'S2' : 'S2X')
        };
        if (typeof profile.actualEsNo === 'number') {
          clonedLookup[frameKey][modulation][fecRate].actualEsNo = profile.actualEsNo;
        }//if
      }//for
    }//for
  }//for
  return clonedLookup;
}//cloneDVBS2XLookup()

function buildDVBS2XLookup() {
  const mergedLookup = cloneDVBS2XLookup(DVBS2XLookup);
  if (!enableDVBS2ModesInDVBS2X) {
    return mergedLookup;
  }//if
  const mergeFrames = ['Normal', 'Short'];
  const mergeModulations = ['QPSK', '8PSK', '16APSK', '32APSK'];
  for (let i = 0; i < mergeFrames.length; i++) {
    const frameLength = mergeFrames[i];
    for (let j = 0; j < mergeModulations.length; j++) {
      const modulation = mergeModulations[j];
      const dvbs2ProfileOff = getDVBS2Profile('Off', frameLength, modulation);
      const dvbs2ProfileOn = getDVBS2Profile('On', frameLength, modulation);
      if (dvbs2ProfileOff === null || dvbs2ProfileOn === null) {
        continue;
      }//if
      if (typeof mergedLookup[frameLength] === 'undefined') {
        mergedLookup[frameLength] = {};
      }//if
      if (typeof mergedLookup[frameLength][modulation] === 'undefined') {
        mergedLookup[frameLength][modulation] = {};
      }//if
      const dvbs2FecRates = getAllowedFecRates('DVB-S2', modulation, frameLength);
      for (let k = 0; k < dvbs2FecRates.length; k++) {
        const fecRate = dvbs2FecRates[k];
        if (typeof mergedLookup[frameLength][modulation][fecRate] !== 'undefined') {
          continue;
        }//if
        const dvbs2DataKey = fecToKey(fecRate);
        const efficiencyPilotsOff = dvbs2ProfileOff.efficiency[dvbs2DataKey];
        const efficiencyPilotsOn = dvbs2ProfileOn.efficiency[dvbs2DataKey];
        const idealEsNo = dvbs2ProfileOff.idealEsNo[dvbs2DataKey];
        const actualEsNo = dvbs2ProfileOff.actualEsNo[dvbs2DataKey];
        if (
          efficiencyPilotsOff === INVALID_EFFICIENCY ||
          efficiencyPilotsOn === INVALID_EFFICIENCY ||
          idealEsNo === INVALID_QEF_POINT
        ) {
          continue;
        }//if
        mergedLookup[frameLength][modulation][fecRate] = {
          efficiencyPilotsOff: efficiencyPilotsOff,
          efficiencyPilotsOn: efficiencyPilotsOn,
          idealEsNo: idealEsNo,
          actualEsNo: actualEsNo,
          sourceStandard: 'S2'
        };
      }//for
    }//for
  }//for
  return mergedLookup;
}//buildDVBS2XLookup()

const DVBS2XLookupResolved = buildDVBS2XLookup();

//main function () called after document DOM is ready
$(document).ready(function () {
  console.log('DOM ready!');  //log DOM ready
  initializeJQueryUi();          //first things first: generate jQuery UI Widgets
  attachUiEventHandlers();    //attach UI change event handlers
  setDefaultSelections();            //set default selections
  onSIPrefixChange();      //set SI prefix
  onCalculatorModeChange();    //call Calculator Mode change handler
  onDvbStandardChange();      //call highest level UI change handler; other selections ripple down
  calculate();               //ensure configured defaults always produce calculated outputs on initial page load
  getVersion().catch(function (error) {
    console.log('getVersion error: ' + error);
  });
});//$(document).ready()

async function getVersion() {                    //must be async function
  const versionURL = 'version.json';          //json version info data
  const requestVersion = new Request(versionURL);
  const responseVersion = await fetch(requestVersion);
  const versionData = await responseVersion.json();
  version = versionData.buildMajor + '.' + versionData.buildMinor + '.' + versionData.buildRevision;
  if (typeof versionData.buildTag !== 'undefined' && versionData.buildTag !== '') {
    version += '-' + versionData.buildTag;
  }//if
  console.log('version: v' + version);            //log version
  document.getElementById('version').innerHTML = 'v' + version.toString();  //update webpage version info
}//getVersion()

function reportInternalError($param) {              //'something is wrong' helper function
  alert('something is wrong in \'' + $param + '\'!');    //popup an alert with offending function
  console.log('something is wrong in \'' + $param + '\'!');  //log a message with offending function
}//reportInternalError()

function removeButtonById($param) {          //remove an element helper function: takes id as string with no 'id=[]' nor '#'
  $('[id=' + $param + ']').remove();      //remove the button element from the jQuery buttonset
  $('label[for=' + $param + ']').remove();    //remove the associated label element from the jQuery button
}//removeButtonById()

function setModulationSelection(preferredModulation, fallbackModulation) {
  const preferredSelector = 'input[id=Modulation_' + preferredModulation + '_radio][type=radio]';
  if ($(preferredSelector).length > 0 && !$(preferredSelector).prop('disabled')) {
    $(preferredSelector).prop('checked', true);
    return;
  }//if
  const fallbackSelector = 'input[id=Modulation_' + fallbackModulation + '_radio][type=radio]';
  if ($(fallbackSelector).length > 0 && !$(fallbackSelector).prop('disabled')) {
    $(fallbackSelector).prop('checked', true);
    return;
  }//if
  reportInternalError('setModulationSelection() -> preferred/fallback -> \'' + preferredModulation + '/' + fallbackModulation + '\'');
}//setModulationSelection()

function round(value, decimals) {          //performs proper rounding
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}//round()

function initializeJQueryUi() {              //generate jQuery UI Widgets
  $('#Calculator_Mode_select').buttonset();
  $('#SI_prefix_select').buttonset();
  $('#DVB_Standard_select').buttonset();
  $('#Roll-Off_select').buttonset();
  $('#Modulation_select').buttonset();
  $('#FEC_Rate_select').selectmenu();
  $('#Frame_Length_select').buttonset();
  $('#Pilot_Insertion_select').buttonset();
  applyFrameLengthButtonSizing();
}//initializeJQueryUi()

function attachUiEventHandlers() {                      //attach event handlers to UI elements
  $('input[type=radio][name=Calculator_Mode]').change(function (e) {  //Calculator_Mode selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onCalculatorModeChange(); ;
    }//if
  });//e()-change() Calculator_Mode
  $('input[type=radio][name=SI_prefix]').change(function (e) {      //SI_prefix selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onSIPrefixChange(); ;
    }//if
  });//e()-change() SI_prefix
  $('input[type=radio][name=DVB_Standard]').change(function (e) {    //DVB_Standard selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onDvbStandardChange();
    }//if
  });//e()-change() DVB_Standard
  $('input[type=radio][name=Modulation]').change(function (e) {      //Modulation selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onModulationChange();
    }//if
  });//e()-change() Modulation
  $('#FEC_Rate_select').selectmenu({
    change: function (e) {       //FEC_Rate selection change handler
      e.preventDefault();
      if (e.handled !== true) {
        e.handled = true;
        onFecRateChange();
      }//if
    }
  });//e()-change()-selectmenu() FEC_Rate_select
  $('input[type=radio][name=Roll-Off]').change(function (e) {       //Roll-Off selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onRollOffChange();
    }//if
  });//e()-change() Roll-Off
  $('input[type=radio][name=Frame_Length]').change(function (e) {    //Frame_Length selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onFrameLengthChange(this.value);
    }//if
  });//e()-change() Frame_Length
  $('input[type=radio][name=Pilot_Insertion]').change(function (e) { //Pilot_Insertion selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onPilotInsertionChange();
    }//if
  });//e()-change() Pilot_Insertion
  $('#Symbol_Rate_input_number, #Transport_Stream_Rate_input_number, #Bandwidth_input_number').on('change input', function (e) {  //input number change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      if (this.value.slice(0, 1) === '.') {    //first character entered is a decimal
        this.value = '0.';                    //prepend 0 else .isNumeric is false
      }//if
      if ($.isNumeric(this.value) === false) {  //last character entered rendered not a valid number
        this.value = this.value.slice(0, -1);      //chop off the last character entered
        console.log('invalid character!');        //log this action
      } else if (this.value.slice(-1) !== '.') {  //last character entered is not a decimal
        calculate();                              //so go ahead and calculate on-the-fly
      } else {                                    //last character entered is a decimal
        console.log('got a decimal...');          //log it and standby for further input
      }//if else
    }//if
  });//e()-change() Symbol_Rate_input_number, Transport_Stream_Rate_input_number, Bandwidth_input_number
  $('#emailIt').on('click', function () {                  //email button handler
    window.location.href = 'mailto:?subject=' + encodeURIComponent('DVB Calculator results') + '&body=' + encodeURIComponent(emailBody);
    //console.log ('mailto:?subject=' + encodeURIComponent('DVB Calculator results') + '&body=' + encodeURIComponent(emailBody));
  });//on() emailIt
}//attachUiEventHandlers()

function setDefaultSelections() {                //set default selections
  console.log('setting setDefaultSelections...');
  //make minimum UI changes
  if (enableDVBS2X) {
    $('input[id=DVB_Standard_S2X_radio][type=radio]').prop('disabled', false);//enable DVB-S2X
  } else {
    $('input[id=DVB_Standard_S2X_radio][type=radio]').prop('disabled', true); //disable DVB-S2X
  }//if
  if (!showFL) {                        //hide unimportant UI elements to save precious UI space
    $('#Frame_Length').hide();          //hide Frame Length (will write to console.log() instead)
  }//if
  if (!showPI) {                        //hide unimportant UI elements to save precious UI space
    $('#Pilot_Insertion').hide();        //hide Pilot Insertion (will write to console.log() instead)
  }//if
  if (!showEF) {                        //hide unimportant UI elements to save precious UI space
    $('#Efficiency_output').hide();      //hide Efficiency (will write to console.log() instead)
  }//if
  if (!showMM) {                        //hide unimportant UI elements to save precious UI space
    $('#Modulation_Multiplier_output').hide();  //hide Modulation Multiplier (will write to console.log() instead)
  }//if
  removeButtonById('Modulation_BPSK_radio');      //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_8APSK_radio');     //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_16QAM_radio');     //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_16APSK_radio');    //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_32APSK_radio');    //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_64APSK_radio');    //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_128APSK_radio');    //remove Modulation button that change handler appends as necessary
  removeButtonById('Modulation_256APSK_radio');    //remove Modulation button that change handler appends as necessary
  //make default selections
  //$('input[type=radio][id=Calculator_Mode_Symbol_Rate_radio]').prop('checked', true);
  $('input[type=radio][id=Calculator_Mode_Bandwidth_radio]').prop('checked', true);
  $('input[type=radio][id=Frame_Length_Normal_radio]').prop('checked', true);
  //change default Pilot Insertion mode to On
  //$('input[type=radio][id=Pilot_Insertion_Off_radio]').prop('checked', true);
  $('input[type=radio][id=Pilot_Insertion_On_radio]').prop('checked', true);
  $('input[type=radio][id=SI_prefix_M_radio]').prop('checked', true);
  let effectiveInitDVBStandard = initDVBStandard;
  if (effectiveInitDVBStandard === 'DVB-S2X' && !enableDVBS2X) {
    effectiveInitDVBStandard = 'DVB-S2';
  }//if
  const initDVBStandardRadioIdByValue = {
    'DVB-S': 'DVB_Standard_S_radio',
    'DVB-S2': 'DVB_Standard_S2_radio',
    'DVB-S2X': 'DVB_Standard_S2X_radio'
  };
  if (typeof initDVBStandardRadioIdByValue[effectiveInitDVBStandard] === 'undefined') {
    reportInternalError('setDefaultSelections() -> initDVBStandard -> \'' + initDVBStandard + '\'');
    effectiveInitDVBStandard = 'DVB-S2';
  }//if
  $('input[type=radio][id=' + initDVBStandardRadioIdByValue[effectiveInitDVBStandard] + ']').prop('checked', true);
  //$('input[type=radio][id=Roll-Off_20_radio]').prop('checked', true);
  //$('input[id=Modulation_8PSK_radio][type=radio]').prop('checked', true);
  //$('option[id=FEC_Rate_78_option]').remove();
  //$('option[id=FEC_Rate_56_option]').prop('selected', true);
  //refresh buttons/selectmenu to show selections
  $('#Calculator_Mode_select').buttonset('refresh');
  $('#Frame_Length_select').buttonset('refresh');
  $('#Pilot_Insertion_select').buttonset('refresh');
  $('#SI_prefix_select').buttonset('refresh');
  $('#DVB_Standard_select').buttonset('refresh');
  //$('#Roll-Off_select').buttonset('refresh');
  //$('#Modulation_select').buttonset('refresh');
  //$('#FEC_Rate_select').selectmenu('refresh');
  $('#Symbol_Rate_input_number').val(varSymbolRateDefault);
  console.log('Symbol Rate input: \'' + varSymbolRateDefault + '\'');
  $('#Bandwidth_input_number').val(varBandwidthDefault);
  console.log('Bandwidth input: \'' + varBandwidthDefault + '\'');
}//setDefaultSelections()

function onSIPrefixChange() {            //SI prefix changed
  console.log('SI prefix -> \'' + $('input[type=radio][name=SI_prefix]:checked').val() + '\'');
  if ($('input[type=radio][name=SI_prefix]:checked').val() === 'M') {
    //change unit labels to have M prefix
    $('#Symbol_Rate_input_label_units').text('MBaud');
    $('#Transport_Stream_Rate_input_label_units').text('Mb/s');
    $('#Bandwidth_input_label_units').text('MHz');
    $('#Symbol_Rate_output_label_units').text('MBaud');
    $('#Transport_Stream_Rate_output_label_units').text('Mb/s');
    $('#Bandwidth_output_label_units').text('MHz');
  } else if ($('input[type=radio][name=SI_prefix]:checked').val() === 'k') {
    //change unit labels to have k prefix
    $('#Symbol_Rate_input_label_units').text('kBaud');
    $('#Transport_Stream_Rate_input_label_units').text('kb/s');
    $('#Bandwidth_input_label_units').text('kHz');
    $('#Symbol_Rate_output_label_units').text('kBaud');
    $('#Transport_Stream_Rate_output_label_units').text('kb/s');
    $('#Bandwidth_output_label_units').text('kHz');
  } else {
    reportInternalError('onSIPrefixChange()');
  }//if else
}//onSIPrefixChange()

function onCalculatorModeChange() {        //Calculator Mode changed
  console.log('Calculator Mode -> \'' + $('input[type=radio][name=Calculator_Mode]:checked').val() + '\'');
  if ($('input[type=radio][name=Calculator_Mode]:checked').val() === 'Symbol Rate') {
    $('#Transport_Stream_Rate').hide();
    $('#Bandwidth').hide();
    $('#Symbol_Rate').fadeIn('slow');
    $('#Symbol_Rate_output').hide();
    $('#Transport_Stream_Rate_output').fadeIn('slow');
    $('#Bandwidth_output').fadeIn('slow');
  } else if ($('input[type=radio][name=Calculator_Mode]:checked').val() === 'Transport Stream Rate') {
    $('#Symbol_Rate').hide();
    $('#Bandwidth').hide();
    $('#Transport_Stream_Rate').fadeIn('slow');
    $('#Transport_Stream_Rate_output').hide();
    $('#Symbol_Rate_output').fadeIn('slow');
    $('#Bandwidth_output').fadeIn('slow');
  } else if ($('input[type=radio][name=Calculator_Mode]:checked').val() === 'Bandwidth') {
    $('#Symbol_Rate').hide();
    $('#Transport_Stream_Rate').hide();
    $('#Bandwidth').fadeIn('slow');
    $('#Bandwidth_output').hide();
    $('#Symbol_Rate_output').fadeIn('slow');
    $('#Transport_Stream_Rate_output').fadeIn('slow');
  } else {
    reportInternalError('onCalculatorModeChange()');
  }//if else
}//onCalculatorModeChange()

function syncHeaderLogoFade(dvbLogoSrc) {
  const headerLogos = $('#DVB_logo_img, #IES_logo_img');
  headerLogos.stop(true, true).fadeOut('fast').promise().done(function () {
    $('#DVB_logo_img').prop('src', dvbLogoSrc);
    headerLogos.fadeIn('slow');
  });
}//syncHeaderLogoFade()

function onDvbStandardChange() {          //DVB Standard changed
  console.log('DVB Standard -> \'' + $('input[type=radio][name=DVB_Standard]:checked').val() + '\'');
  if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S') {
    //swap DVB-S2/S2X to DVB-S logo
    syncHeaderLogoFade('img/DVB-S_small_edit.bmp');
    //Roll-Off
    $('input[id=Roll-Off_05_radio][type=radio]').prop('disabled', true);
    $('input[id=Roll-Off_10_radio][type=radio]').prop('disabled', true);
    $('input[id=Roll-Off_15_radio][type=radio]').prop('disabled', true);
    $('input[id=Roll-Off_20_radio][type=radio]').prop('disabled', true);
    $('input[id=Roll-Off_25_radio][type=radio]').prop('disabled', true);
    $('input[type=radio][id=Roll-Off_35_radio]').prop('checked', true);
    $('#Roll-Off_select').buttonset('refresh');
    $('input[id=Frame_Length_Normal_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_Short_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_ShortS_radio][type=radio]').prop('disabled', true);
    if ($('input[id=Frame_Length_ShortS_radio][type=radio]').is(':checked')) {
      $('input[id=Frame_Length_Normal_radio][type=radio]').prop('checked', true);
    }//if
    $('#Frame_Length_select').buttonset('refresh');
    //Modulation
    $('#Modulation_label').text('Modulation');        //change modulation label
    removeButtonById('Modulation_BPSK_radio');
    removeButtonById('Modulation_QPSK_radio');
    removeButtonById('Modulation_8PSK_radio');
    removeButtonById('Modulation_8APSK_radio');
    removeButtonById('Modulation_16APSK_radio');
    removeButtonById('Modulation_32APSK_radio');
    removeButtonById('Modulation_64APSK_radio');
    removeButtonById('Modulation_128APSK_radio');
    removeButtonById('Modulation_256APSK_radio');
    $('#Modulation_select').append('<input type="radio" id="Modulation_QPSK_radio" name="Modulation" value="QPSK"/><label for="Modulation_QPSK_radio">QPSK</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_8PSK_radio" name="Modulation" value="8PSK"/><label for="Modulation_8PSK_radio">8PSK</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_16QAM_radio" name="Modulation" value="16QAM" /><label for="Modulation_16QAM_radio">16QAM</label>');
    if (enable16QAM) {
      $('input[id=Modulation_16QAM_radio][type=radio]').prop('disabled', false); //enable 16QAM
    } else {
      $('input[id=Modulation_16QAM_radio][type=radio]').prop('disabled', true);  //disable 16QAM (because QEF and Efficiency are unknown)
    }//if
    setModulationSelection(initModulationByStandard['DVB-S'], 'QPSK');
    //QEF label
    $('#QEF_label_DVBS2').hide();
    $('#QEF_label_DVBS').show();
    $('#ideal_QEF_EsNo').show();
    $('#ideal_QEF_EbNo').show();
    $('#actual_QEF_EsNo').show();
    $('#actual_QEF_EbNo').show();
  } else if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S2') {
    //swap DVB-S/S2X to DVB-S2 logo
    syncHeaderLogoFade('img/DVB-S2_small_edit.bmp');
    //Roll-Off
    //$('input[id=Roll-Off_05_radio][type=radio]').prop('disabled', true);
    //$('input[id=Roll-Off_10_radio][type=radio]').prop('disabled', true);
    //$('input[id=Roll-Off_15_radio][type=radio]').prop('disabled', true);
    //let's add roll-offs <20% even though not officially supported
    $('input[id=Roll-Off_05_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_10_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_15_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_20_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_25_radio][type=radio]').prop('disabled', false);
    $('input[type=radio][id=Roll-Off_20_radio]').prop('checked', true);
    $('#Roll-Off_select').buttonset('refresh');
    $('input[id=Frame_Length_Normal_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_Short_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_ShortS_radio][type=radio]').prop('disabled', true);
    if ($('input[id=Frame_Length_ShortS_radio][type=radio]').is(':checked')) {
      $('input[id=Frame_Length_Normal_radio][type=radio]').prop('checked', true);
    }//if
    $('#Frame_Length_select').buttonset('refresh');
    //Modulation
    $('#Modulation_label').text('Modulation');        //change modulation label
    removeButtonById('Modulation_BPSK_radio');
    removeButtonById('Modulation_QPSK_radio');
    removeButtonById('Modulation_8PSK_radio');
    removeButtonById('Modulation_8APSK_radio');
    removeButtonById('Modulation_16QAM_radio');
    removeButtonById('Modulation_16APSK_radio');
    removeButtonById('Modulation_32APSK_radio');
    removeButtonById('Modulation_64APSK_radio');
    removeButtonById('Modulation_128APSK_radio');
    removeButtonById('Modulation_256APSK_radio');
    $('#Modulation_select').append('<input type="radio" id="Modulation_QPSK_radio" name="Modulation" value="QPSK"/><label for="Modulation_QPSK_radio">QPSK</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_8PSK_radio" name="Modulation" value="8PSK"/><label for="Modulation_8PSK_radio">8PSK</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_16APSK_radio" name="Modulation" value="16APSK" /><label for="Modulation_16APSK_radio">16APSK</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_32APSK_radio" name="Modulation" value="32APSK" /><label for="Modulation_32APSK_radio">32APSK</label>');
    setModulationSelection(initModulationByStandard['DVB-S2'], '8PSK');
    //QEF label
    $('#QEF_label_DVBS').hide();
    $('#QEF_label_DVBS2').show();
    $('#ideal_QEF_EsNo').show();
    $('#ideal_QEF_EbNo').show();
    $('#actual_QEF_EsNo').show();
    $('#actual_QEF_EbNo').show();
  } else if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S2X') {
    //swap DVB-S/S2 to DVB-S2X logo
    syncHeaderLogoFade('img/DVB-S2X_edit.bmp');
    //Roll-Off
    $('input[id=Roll-Off_05_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_10_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_15_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_20_radio][type=radio]').prop('disabled', false);
    $('input[id=Roll-Off_25_radio][type=radio]').prop('disabled', false);
    $('input[type=radio][id=Roll-Off_05_radio]').prop('checked', true);
    $('#Roll-Off_select').buttonset('refresh');
    //Modulation
    $('#Modulation_label').html(                            //change modulation label
      '<p style="line-height:0.75rem; margin-top:0; margin-bottom:6px">Modulation</p>' +
      '<p style="line-height:0.75rem; margin-top:6px; margin-bottom:0">[PSK]</p>'
    );
    removeButtonById('Modulation_BPSK_radio');
    removeButtonById('Modulation_QPSK_radio');
    removeButtonById('Modulation_8PSK_radio');
    removeButtonById('Modulation_8APSK_radio');
    removeButtonById('Modulation_16QAM_radio');
    removeButtonById('Modulation_16APSK_radio');
    removeButtonById('Modulation_32APSK_radio');
    removeButtonById('Modulation_64APSK_radio');
    removeButtonById('Modulation_128APSK_radio');
    removeButtonById('Modulation_256APSK_radio');
    $('#Modulation_select').append('<input type="radio" id="Modulation_BPSK_radio" name="Modulation" value="BPSK"/><label for="Modulation_BPSK_radio" style="min-width:20px;text-indent:-1px;position:relative;text-align:center"><span style="position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:0.62em;line-height:0.5rem;margin:0;padding:0;white-space:nowrap">&pi;/2</span><span style="display:block;font-size:1em;line-height:1.2em;margin:0;padding:0">B</span></label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_QPSK_radio" name="Modulation" value="QPSK"/><label for="Modulation_QPSK_radio" style="min-width:20px;text-indent:-1px">Q</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_8PSK_radio" name="Modulation" value="8PSK"/><label for="Modulation_8PSK_radio" style="min-width:20px;text-indent:-1px">8</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_8APSK_radio" name="Modulation" value="8APSK"/><label for="Modulation_8APSK_radio" style="min-width:25px;text-indent:-1px">8A</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_16APSK_radio" name="Modulation" value="16APSK"/><label for="Modulation_16APSK_radio" style="min-width:29px;text-indent:-1px">16A</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_32APSK_radio" name="Modulation" value="32APSK"/><label for="Modulation_32APSK_radio" style="min-width:30px;text-indent:-1px">32A</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_64APSK_radio" name="Modulation" value="64APSK"/><label for="Modulation_64APSK_radio" style="min-width:30px;text-indent:-1px">64A</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_128APSK_radio" name="Modulation" value="128APSK"/><label for="Modulation_128APSK_radio" style="min-width:36px;text-indent:-1px">128A</label>');
    $('#Modulation_select').append('<input type="radio" id="Modulation_256APSK_radio" name="Modulation" value="256APSK"/><label for="Modulation_256APSK_radio" style="min-width:33px">256A</label>');
    $('input[id=Modulation_BPSK_radio][type=radio]').prop('disabled', !enableDVBS2XVLSNRModes);
    setModulationSelection(initModulationByStandard['DVB-S2X'], 'QPSK');
    //QEF label
    $('#QEF_label_DVBS').hide();
    $('#QEF_label_DVBS2').show();
    $('#ideal_QEF_EbNo').hide();
    $('#ideal_QEF_EsNo').show();
    $('#actual_QEF_EsNo').show();
    $('#actual_QEF_EbNo').show();
  } else {
    reportInternalError('onDvbStandardChange()');
  }//if else
  $('#Modulation_select').buttonset('refresh');
  $('input[type=radio][name=Modulation]').change(function (e) {      //Modulation selection change handler
    e.preventDefault();
    if (e.handled !== true) {
      e.handled = true;
      onModulationChange();
    }//if
  });//e()-change() Modulation
  onModulationChange();
}//onDvbStandardChange()

function getFrameLengthButtonValue(selectedStandard, selectedModulation, radioId) {
  if (selectedStandard === 'DVB-S2X') {
    if (radioId === 'Frame_Length_Normal_radio') {
      return selectedModulation === 'BPSK' ? '30780' : '64800';
    }//if
    if (radioId === 'Frame_Length_Short_radio') {
      return selectedModulation === 'BPSK' ? '14976' : '16200';
    }//if
    if (radioId === 'Frame_Length_ShortS_radio') {
      if (selectedModulation === 'QPSK') {
        return '61560';
      }//if
      return '15390';
    }//if
  }//if
  if (radioId === 'Frame_Length_Normal_radio') {
    return '64800';
  }//if
  if (radioId === 'Frame_Length_Short_radio') {
    return '16200';
  }//if
  return '16200';
}//getFrameLengthButtonValue()

function buildFrameLengthButtonLabelHtml(labelText, frameLengthValue) {
  return '<span style="display:block;font-size:1em;font-weight:inherit;line-height:1em;">' + labelText + '</span>' +
    '<span style="display:block;font-size:0.76em;font-weight:normal;line-height:0.9em;margin-top:1px;">(' + frameLengthValue + ')</span>';
}//buildFrameLengthButtonLabelHtml()

function applyFrameLengthButtonSizing() {
  const standardButton = $('#DVB_Standard_select > label.ui-button').first();
  if (standardButton.length === 0) {
    return;
  }//if
  const targetOuterWidth = Math.round(standardButton.outerWidth());
  if (!Number.isFinite(targetOuterWidth) || targetOuterWidth <= 0) {
    return;
  }//if
  const frameLengthLabels = $('#Frame_Length_select > label.ui-button');
  if (frameLengthLabels.length === 0) {
    return;
  }//if
  frameLengthLabels.each(function () {
    const labelElement = $(this);
    const labelNode = labelElement.get(0);
    labelElement.outerWidth(targetOuterWidth);
    labelNode.style.setProperty('width', targetOuterWidth + 'px', 'important');
    labelNode.style.setProperty('min-width', targetOuterWidth + 'px', 'important');
    labelNode.style.setProperty('max-width', targetOuterWidth + 'px', 'important');
  });
  frameLengthLabels.each(function () {
    const labelElement = $(this);
    const uiButtonTextSpan = labelElement.find('.ui-button-text');
    if (uiButtonTextSpan.length > 0) {
      uiButtonTextSpan.css({
        paddingTop: '0.24em',
        paddingBottom: '0.24em',
        lineHeight: '0.95em'
      });
    } else {
      labelElement.css({
        paddingTop: '0.24em',
        paddingBottom: '0.24em',
        lineHeight: '0.95em'
      });
    }//if else
  });
}//applyFrameLengthButtonSizing()

function reorderFrameLengthButtons(selectedStandard, selectedModulation) {
  const frameLengthContainer = $('#Frame_Length_select');
  const frameLengthRadioIds = ['Frame_Length_Short_radio', 'Frame_Length_ShortS_radio', 'Frame_Length_Normal_radio'];
  const frameLengthEntries = [];
  for (let i = 0; i < frameLengthRadioIds.length; i++) {
    const radioId = frameLengthRadioIds[i];
    const inputElement = $('input[id=' + radioId + '][type=radio]');
    frameLengthEntries.push({
      radioId: radioId,
      inputElement: inputElement,
      labelElement: $('label[for=' + radioId + ']'),
      disabled: inputElement.prop('disabled'),
      sortValue: Number(getFrameLengthButtonValue(selectedStandard, selectedModulation, radioId)),
      tieBreaker: i
    });
  }//for
  frameLengthEntries.sort(function (a, b) {
    if (a.disabled !== b.disabled) {
      return a.disabled ? 1 : -1;  //show selectable frame lengths first
    }//if
    if (a.sortValue !== b.sortValue) {
      return a.sortValue - b.sortValue;
    }//if
    return a.tieBreaker - b.tieBreaker;
  });
  for (let i = 0; i < frameLengthEntries.length; i++) {
    frameLengthContainer.append(frameLengthEntries[i].inputElement);
    frameLengthContainer.append(frameLengthEntries[i].labelElement);
  }//for
}//reorderFrameLengthButtons()

function setFrameLengthButtonLabel(radioId, labelText, selectedStandard, selectedModulation) {
  const frameLengthValue = getFrameLengthButtonValue(selectedStandard, selectedModulation, radioId);
  const labelHtml = buildFrameLengthButtonLabelHtml(labelText, frameLengthValue);
  const labelElement = $('label[for=' + radioId + ']');
  labelElement.html(labelHtml);
  const uiButtonTextSpan = labelElement.find('.ui-button-text');
  if (uiButtonTextSpan.length > 0) {
    uiButtonTextSpan.html(labelHtml);
  } else {
    labelElement.html(labelHtml);
  }//if else
}//setFrameLengthButtonLabel()

function getDVBS2XThirdFrameLabel(modulation) {
  if (modulation === 'QPSK') {
    return 'Medium';
  }//if
  if (modulation === 'BPSK') {
    return 'Short-S';
  }//if
  return 'Short-S';
}//getDVBS2XThirdFrameLabel()

function onModulationChange() {            //Modulation changed
  const selectedStandard = $('input[type=radio][name=DVB_Standard]:checked').val();
  const selectedModulation = $('input[type=radio][name=Modulation]:checked').val();
  console.log('Modulation -> \'' + selectedModulation + '\'');
  const normalFrameLengthLabel = selectedStandard === 'DVB-S2X' && selectedModulation === 'BPSK' ? 'Medium' : 'Normal';
  setFrameLengthButtonLabel('Frame_Length_Normal_radio', normalFrameLengthLabel, selectedStandard, selectedModulation);
  setFrameLengthButtonLabel('Frame_Length_Short_radio', 'Short', selectedStandard, selectedModulation);
  const shortSFrameLengthLabel = selectedStandard === 'DVB-S2X'
    ? getDVBS2XThirdFrameLabel(selectedModulation)
    : 'Short-S';
  setFrameLengthButtonLabel('Frame_Length_ShortS_radio', shortSFrameLengthLabel, selectedStandard, selectedModulation);
  $('#Frame_Length_select').buttonset('refresh');
  $('#FEC_Rate_select').find('option').remove().end();
  if (selectedStandard !== 'DVB-S2X') {
    $('input[id=Frame_Length_Normal_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_Short_radio][type=radio]').prop('disabled', false);
    $('input[id=Frame_Length_ShortS_radio][type=radio]').prop('disabled', true);
    if ($('input[id=Frame_Length_ShortS_radio][type=radio]').is(':checked')) {
      $('input[id=Frame_Length_Normal_radio][type=radio]').prop('checked', true);
    }//if
    $('#Frame_Length_select').buttonset('refresh');
    $('input[id=Pilot_Insertion_On_radio][type=radio]').prop('disabled', false);
    $('input[id=Pilot_Insertion_Off_radio][type=radio]').prop('disabled', false);
    $('#Pilot_Insertion_select').buttonset('refresh');
  }//if
  if (selectedStandard === 'DVB-S') {
    //FEC RATE    1/4  1/3  2/5  1/2  3/5  2/3  3/4  4/5  5/6  7/8  8/9  9/10
    //DVB-S   QPSK            X      X   X      X   X
    //DVB-S   8PSK                  X         X      X
    //DVB-S  16QAM                     X         X
    if (selectedModulation === 'QPSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_12_option" value="1/2">1/2</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_23_option" value="2/3">2/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_78_option" value="7/8">7/8</option>');
      $('option[id=FEC_Rate_12_option]').prop('selected', true);
    } else if (selectedModulation === '8PSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_23_option" value="2/3">2/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_89_option" value="8/9">8/9</option>');
      $('option[id=FEC_Rate_23_option]').prop('selected', true);
    } else if (selectedModulation === '16QAM') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_78_option" value="7/8">7/8</option>');
      $('option[id=FEC_Rate_34_option]').prop('selected', true);
    } else {
      reportInternalError('onModulationChange()');
    }//if else
  } else if (selectedStandard === 'DVB-S2') {
    //FEC RATE    1/4  1/3  2/5  1/2  3/5  2/3  3/4  4/5  5/6  7/8  8/9  9/10
    //DVB-S2   QPSK   X   X   X   X   X   X   X   X   X      X   X
    //DVB-S2   8PSK               X   X   X      X      X   X
    //DVB-S2 16APSK                  X   X   X   X      X   X
    //DVB-S2 32APSK                     X   X   X      X   X
    if (selectedModulation === 'QPSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_14_option" value="1/4">1/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_13_option" value="1/3">1/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_25_option" value="2/5">2/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_12_option" value="1/2">1/2</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_35_option" value="3/5">3/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_23_option" value="2/3">2/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_45_option" value="4/5">4/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_89_option" value="8/9">8/9</option>');
      if ($('input[type=radio][name=Frame_Length]:checked').val() === 'Normal') {
        $('#FEC_Rate_select').append('<option id="FEC_Rate_910_option" value="9/10">9/10</option>');
      }//if
      $('option[id=FEC_Rate_13_option]').prop('selected', true);
    } else if (selectedModulation === '8PSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_35_option" value="3/5">3/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_23_option" value="2/3">2/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_89_option" value="8/9">8/9</option>');
      if ($('input[type=radio][name=Frame_Length]:checked').val() === 'Normal') {
        $('#FEC_Rate_select').append('<option id="FEC_Rate_910_option" value="9/10">9/10</option>');
      }//if
      $('option[id=FEC_Rate_56_option]').prop('selected', true);
    } else if (selectedModulation === '16APSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_23_option" value="2/3">2/3</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_45_option" value="4/5">4/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_89_option" value="8/9">8/9</option>');
      if ($('input[type=radio][name=Frame_Length]:checked').val() === 'Normal') {
        $('#FEC_Rate_select').append('<option id="FEC_Rate_910_option" value="9/10">9/10</option>');
      }//if
      $('option[id=FEC_Rate_45_option]').prop('selected', true);
    } else if (selectedModulation === '32APSK') {
      $('#FEC_Rate_select').append('<option id="FEC_Rate_34_option" value="3/4">3/4</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_45_option" value="4/5">4/5</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_56_option" value="5/6">5/6</option>');
      $('#FEC_Rate_select').append('<option id="FEC_Rate_89_option" value="8/9">8/9</option>');
      if ($('input[type=radio][name=Frame_Length]:checked').val() === 'Normal') {
        $('#FEC_Rate_select').append('<option id="FEC_Rate_910_option" value="9/10">9/10</option>');
      }//if
      $('option[id=FEC_Rate_34_option]').prop('selected', true);
    } else {
      reportInternalError('onModulationChange() -> $(\'input[type=radio][name=Modulation]:checked\').val() -> \'' + $('input[type=radio][name=Modulation]:checked').val() + '\'');
    }//if else
  } else if (selectedStandard === 'DVB-S2X') {
    if (isDVBS2XVLSNRModulation(selectedModulation)) {
      $('input[id=Pilot_Insertion_Off_radio][type=radio]').prop('checked', true);
      $('input[id=Pilot_Insertion_On_radio][type=radio]').prop('disabled', true);
      $('input[id=Pilot_Insertion_Off_radio][type=radio]').prop('disabled', false);
    } else {
      $('input[id=Pilot_Insertion_On_radio][type=radio]').prop('disabled', false);
      $('input[id=Pilot_Insertion_Off_radio][type=radio]').prop('disabled', false);
    }//if else
    $('#Pilot_Insertion_select').buttonset('refresh');
    const availableFrames = getDVBS2XFramesForModulation(selectedModulation);
    if (availableFrames.length === 0) {
      console.log('DVB-S2X modulation \'' + selectedModulation + '\' has no active profile table yet; falling back to 8PSK.');
      if (selectedModulation !== '8PSK' && $('input[id=Modulation_8PSK_radio][type=radio]').length > 0) {
        $('input[id=Modulation_8PSK_radio][type=radio]').prop('checked', true);
        $('#Modulation_select').buttonset('refresh');
        onModulationChange();
        return;
      }//if
      reportInternalError('onModulationChange() -> DVB-S2X fallback failed for modulation -> \'' + selectedModulation + '\'');
    } else {
      const hasNormal = availableFrames.indexOf('Normal') !== -1;
      const hasShort = availableFrames.indexOf('Short') !== -1;
      const hasShortS = availableFrames.indexOf('ShortS') !== -1;
      $('input[id=Frame_Length_Normal_radio][type=radio]').prop('disabled', !hasNormal);
      $('input[id=Frame_Length_Short_radio][type=radio]').prop('disabled', !hasShort);
      $('input[id=Frame_Length_ShortS_radio][type=radio]').prop('disabled', !hasShortS);
      let selectedFrameLength = $('input[type=radio][name=Frame_Length]:checked').val();
      if (availableFrames.indexOf(selectedFrameLength) === -1) {
        selectedFrameLength = availableFrames[0];
        $('input[type=radio][id=Frame_Length_' + selectedFrameLength + '_radio]').prop('checked', true);
      }//if
      $('#Frame_Length_select').buttonset('refresh');
      const dvbs2xProfiles = getDVBS2XProfilesByFrameAndModulation(selectedFrameLength, selectedModulation);
      if (dvbs2xProfiles === null) {
        reportInternalError('onModulationChange() -> DVB-S2X profile lookup -> frame/modulation -> \'' + selectedFrameLength + '/' + selectedModulation + '\'');
      } else {
        const fecRates = Object.keys(dvbs2xProfiles);
        for (let i = 0; i < fecRates.length; i++) {
          const fecRate = fecRates[i];
          const fecRateDisplayLabel = getFecRateDisplayLabel(fecRate, dvbs2xProfiles[fecRate].sourceStandard);
          $('#FEC_Rate_select').append('<option value="' + fecRate + '">' + fecRateDisplayLabel + '</option>');
        }//for
        if (fecRates.length > 0) {
          $('#FEC_Rate_select').find('option:first').prop('selected', true);
        }//if
      }//if else
    }//if else
  } else {
    reportInternalError('onModulationChange() -> $(\'input[type=radio][name=DVB_Standard]:checked\').val() -> \'' + $('input[type=radio][name=DVB_Standard]:checked').val() + '\'');
  }//if else
  reorderFrameLengthButtons(selectedStandard, selectedModulation);
  $('#Frame_Length_select').buttonset('refresh');
  applyFrameLengthButtonSizing();
  $('#FEC_Rate_select').selectmenu('refresh');
  refreshFecRateSelectmenuLabelLayout();
  setTimeout(refreshFecRateSelectmenuLabelLayout, 0);
  $('#FEC_Rate_select').selectmenu({
    create: function () {
      refreshFecRateSelectmenuLabelLayout();
      setTimeout(refreshFecRateSelectmenuLabelLayout, 0);
    },
    open: function () {
      refreshFecRateSelectmenuLabelLayout();
      setTimeout(refreshFecRateSelectmenuLabelLayout, 0);
    },
    change: function (e) {    //FEC_Rate selection change handler
      e.preventDefault();
      if (e.handled !== true) {
        e.handled = true;
        onFecRateChange();
      }//if
    }
  });//e()-change()-selectmenu() FEC_Rate_select
  onFecRateChange();
}//onModulationChange()

function onFecRateChange() {            //FEC Rate changed
  refreshFecRateSelectmenuLabelLayout();
  console.log('FEC Rate -> \'' + getSelectedFecRate() + '\'');
  calculate();
}//onFecRateChange()
function onRollOffChange() {          //Roll-Off changed
  console.log('Roll-Off -> \'' + $('input[type=radio][name=Roll-Off]:checked').val() + '\'');
  calculate();
}//onRollOffChange()
function onFrameLengthChange(frameLengthValue) {          //Frame Length changed
  const selectedFrameLength = typeof frameLengthValue === 'string' ? frameLengthValue : $('input[type=radio][name=Frame_Length]:checked').val();
  $('input[type=radio][id=Frame_Length_' + selectedFrameLength + '_radio]').prop('checked', true);
  $('#Frame_Length_select').buttonset('refresh');
  applyFrameLengthButtonSizing();
  console.log('Frame Length -> \'' + selectedFrameLength + '\'');
  onModulationChange();              //treat as if Modulation changed where FEC Rate 9/10 is only available for Frame Length Normal
}//onFrameLengthChange()
function onPilotInsertionChange() {        //Pilot Insertion changed
  console.log('Pilot Insertion -> \'' + $('input[type=radio][name=Pilot_Insertion]:checked').val() + '\'');
  calculate();
}//onPilotInsertionChange()

function isBPSKSpreadingMode(fecRate) {
  return typeof fecRate === 'string' && fecRate.toUpperCase().indexOf('-S') !== -1;
}//isBPSKSpreadingMode()

function getModulationMultiplierKey(modulation, fecRate) {
  if (modulation === 'BPSK' && isBPSKSpreadingMode(fecRate)) {
    return 'BPSK-S';
  }//if
  return modulation;
}//getModulationMultiplierKey()

function getModulationMultiplier(modulation, fecRate) {
  const multiplierKey = getModulationMultiplierKey(modulation, fecRate);
  const multiplier = ModulationMultipliers[multiplierKey];
  if (typeof multiplier === 'undefined') {
    reportInternalError('getModulationMultiplier() -> modulation/fec/key -> \'' + modulation + '/' + fecRate + '/' + multiplierKey + '\'');
    return 0;
  }//if
  return multiplier;
}//getModulationMultiplier()

function getDVBSProfile(modulation) {
  return DVBSLookup[modulation] || null;
}//getDVBSProfile()

function getDVBS2Profile(pilotInsertion, frameLength, modulation) {
  if (!DVBS2Lookup[pilotInsertion] || !DVBS2Lookup[pilotInsertion][frameLength]) {
    return null;
  }//if
  return DVBS2Lookup[pilotInsertion][frameLength][modulation] || null;
}//getDVBS2Profile()

function getDVBS2XFramesForModulation(modulation) {
  const frames = [];
  const frameKeys = Object.keys(DVBS2XLookupResolved);
  for (let i = 0; i < frameKeys.length; i++) {
    const frameKey = frameKeys[i];
    if (typeof DVBS2XLookupResolved[frameKey][modulation] !== 'undefined') {
      frames.push(frameKey);
    }//if
  }//for
  return frames;
}//getDVBS2XFramesForModulation()

function getDVBS2XProfilesByFrameAndModulation(frameLength, modulation) {
  if (typeof DVBS2XLookupResolved[frameLength] === 'undefined') {
    return null;
  }//if
  return DVBS2XLookupResolved[frameLength][modulation] || null;
}//getDVBS2XProfilesByFrameAndModulation()

function isDVBS2XVLSNRModulation(modulation) {
  return modulation === 'BPSK';
}//isDVBS2XVLSNRModulation()

function applyDVBS2XPilotOverhead(efficiencyPilotsOff, frameLength, modulation) {
  const modulationMultiplier = getModulationMultiplier(modulation);
  const symbolsPerFecFrame = frameLength === 'Short'
    ? 16200
    : frameLength === 'ShortS'
      ? 15390
      : 64800;
  const payloadSymbols = symbolsPerFecFrame / modulationMultiplier;
  const slotsPerFecFrame = payloadSymbols / 90;
  const pilotBlocks = Math.floor((slotsPerFecFrame - 1) / 16);
  const symbolsWithoutPilots = payloadSymbols + 90;
  const symbolsWithPilots = symbolsWithoutPilots + pilotBlocks * 36;
  return efficiencyPilotsOff * (symbolsWithoutPilots / symbolsWithPilots);
}//applyDVBS2XPilotOverhead()

function getDVBS2XProfile(pilotInsertion, frameLength, modulation, fecRate) {
  const frameProfiles = getDVBS2XProfilesByFrameAndModulation(frameLength, modulation);
  if (frameProfiles === null || typeof frameProfiles[fecRate] === 'undefined') {
    return null;
  }//if
  const profile = frameProfiles[fecRate];
  const efficiencyPilotsOff = profile.efficiencyPilotsOff;
  const efficiencyPilotsOn = typeof profile.efficiencyPilotsOn === 'number'
    ? profile.efficiencyPilotsOn
    : applyDVBS2XPilotOverhead(efficiencyPilotsOff, frameLength, modulation);
  return {
    efficiency: pilotInsertion === 'On' ? efficiencyPilotsOn : efficiencyPilotsOff,
    idealEsNo: profile.idealEsNo,
    actualEsNo: typeof profile.actualEsNo === 'number' ? profile.actualEsNo : INVALID_QEF_POINT
  };
}//getDVBS2XProfile()

function calculateEbNoFromEsNo(actualQEFEsNo, efficiency) {
  if (actualQEFEsNo === INVALID_QEF_POINT) {
    return INVALID_QEF_POINT;
  }//if
  return actualQEFEsNo - 10 * Math.log10(efficiency);
}//calculateEbNoFromEsNo()

function parseFecRate(fecRateText) {
  const fecRateMatch = /^(\d+)\/(\d+)(-[A-Za-z0-9]+)?$/.exec(fecRateText);
  if (fecRateMatch === null) {
    return null;
  }//if
  const numerator = Number(fecRateMatch[1]);
  const denominator = Number(fecRateMatch[2]);
  return {
    numerator: numerator,
    denominator: denominator,
    numericRate: numerator / denominator,
    dataArrayKey: String(numerator) + String(denominator)
  };
}//parseFecRate()

function getFecRateDisplayLabel(fecRate, sourceStandard) {
  const prefix = sourceStandard === 'S2' ? 'S2: ' : 'S2X: ';
  return prefix + fecRate;
}//getFecRateDisplayLabel()

function parseFecRateDisplayLabel(displayLabel) {
  const labelMatch = /^(S2X|S2):\s*(.+)$/.exec(displayLabel.trim());
  if (labelMatch === null) {
    return null;
  }//if
  return {
    originLabel: labelMatch[1] + ':',
    fecRate: labelMatch[2]
  };
}//parseFecRateDisplayLabel()

function formatFecRateDisplayLabelHtml(displayLabel) {
  const parsedLabel = parseFecRateDisplayLabel(displayLabel);
  if (parsedLabel === null) {
    return null;
  }//if
  return '<span class="fec-origin">' + parsedLabel.originLabel + '</span>' +
    '<span class="fec-rate">' + parsedLabel.fecRate + '</span>' +
    '<span class="fec-spacer" aria-hidden="true">' + parsedLabel.originLabel + '</span>';
}//formatFecRateDisplayLabelHtml()

function refreshFecRateSelectmenuLabelLayout() {
  const menuItems = $('#FEC_Rate_select-menu .ui-menu-item');
  menuItems.each(function () {
    const menuItem = $(this);
    const menuItemData = menuItem.data('ui-selectmenu-item');
    const rawDisplayLabel = menuItemData && typeof menuItemData.label === 'string'
      ? menuItemData.label.trim()
      : menuItem.text().trim();
    const displayLabelHtml = formatFecRateDisplayLabelHtml(rawDisplayLabel);
    if (displayLabelHtml !== null) {
      menuItem.addClass('fec-rate-option');
      menuItem.html(displayLabelHtml);
    } else {
      menuItem.removeClass('fec-rate-option');
      menuItem.text(rawDisplayLabel);
    }//if else
  });
  const selectMenuButtonText = $('#FEC_Rate_select-button .ui-selectmenu-text');
  if (selectMenuButtonText.length > 0) {
    const selectedDisplayLabel = $('#FEC_Rate_select option:selected').text();
    selectMenuButtonText.removeClass('fec-rate-selected');
    selectMenuButtonText.text(selectedDisplayLabel);
  }//if
}//refreshFecRateSelectmenuLabelLayout()

function getSelectedFecRate() {
  const selectedOption = $('#FEC_Rate_select').find('option:selected');
  const selectedFecRateValue = selectedOption.val();
  if (typeof selectedFecRateValue === 'string' && selectedFecRateValue !== '') {
    return selectedFecRateValue;
  }//if
  return selectedOption.text();
}//getSelectedFecRate()

function getAllowedFecRates(standard, modulation, frameLength) {
  if (standard === 'DVB-S') {
    if (modulation === 'QPSK') return ['1/2', '2/3', '3/4', '5/6', '7/8'];
    if (modulation === '8PSK') return ['2/3', '5/6', '8/9'];
    if (modulation === '16QAM') return ['3/4', '7/8'];
    return [];
  }//if
  if (standard === 'DVB-S2') {
    const with910 = frameLength === 'Normal' ? ['9/10'] : [];
    if (modulation === 'QPSK') return ['1/4', '1/3', '2/5', '1/2', '3/5', '2/3', '3/4', '4/5', '5/6', '8/9'].concat(with910);
    if (modulation === '8PSK') return ['3/5', '2/3', '3/4', '5/6', '8/9'].concat(with910);
    if (modulation === '16APSK') return ['2/3', '3/4', '4/5', '5/6', '8/9'].concat(with910);
    if (modulation === '32APSK') return ['3/4', '4/5', '5/6', '8/9'].concat(with910);
    return [];
  }//if
  return [];
}//getAllowedFecRates()

function fecToKey(fecRate) {
  return fecRate.replace('/', '');
}//fecToKey()

function buildRegressionSnapshot() {
  const scenarios = [];
  const modes = ['Symbol Rate', 'Transport Stream Rate', 'Bandwidth'];
  const modeInputs = {
    'Symbol Rate': { symbolRate: 45, tsRate: 60, bandwidth: 36 },
    'Transport Stream Rate': { symbolRate: 45, tsRate: 60, bandwidth: 36 },
    Bandwidth: { symbolRate: 45, tsRate: 60, bandwidth: 36 }
  };
  const standards = ['DVB-S', 'DVB-S2'];
  const rollOffs = ['0.35', '0.25', '0.20', '0.15', '0.10', '0.05'];
  const pilots = ['Off', 'On'];
  const frameLengths = ['Normal', 'Short'];
  const modByStandard = {
    'DVB-S': ['QPSK', '8PSK', '16QAM'],
    'DVB-S2': ['QPSK', '8PSK', '16APSK', '32APSK']
  };

  for (let s = 0; s < standards.length; s++) {
    const standard = standards[s];
    for (let m = 0; m < modes.length; m++) {
      const mode = modes[m];
      for (let r = 0; r < rollOffs.length; r++) {
        const rollOff = rollOffs[r];
        const frameOptions = standard === 'DVB-S' ? ['Normal'] : frameLengths;
        const pilotOptions = standard === 'DVB-S' ? ['Off'] : pilots;
        for (let f = 0; f < frameOptions.length; f++) {
          const frameLength = frameOptions[f];
          for (let p = 0; p < pilotOptions.length; p++) {
            const pilot = pilotOptions[p];
            for (let mod = 0; mod < modByStandard[standard].length; mod++) {
              const modulation = modByStandard[standard][mod];
              const fecRates = getAllowedFecRates(standard, modulation, frameLength);
              for (let k = 0; k < fecRates.length; k++) {
                const fecRate = fecRates[k];
                const key = fecToKey(fecRate);
                const multiplier = getModulationMultiplier(modulation, fecRate);
                let profile;
                let efficiency = INVALID_EFFICIENCY;
                let idealEbNo = INVALID_QEF_POINT;
                let idealEsNo = INVALID_QEF_POINT;
                let actualEsNo = INVALID_QEF_POINT;
                let actualEbNo = INVALID_QEF_POINT;
                if (standard === 'DVB-S') {
                  profile = getDVBSProfile(modulation);
                  efficiency = (188 / 204) * multiplier * (Number(fecRate.split('/')[0]) / Number(fecRate.split('/')[1]));
                  if (profile.idealEbNo !== null) idealEbNo = profile.idealEbNo[key];
                  idealEsNo = profile.idealEsNo[key];
                  actualEbNo = profile.actualEbNo[key];
                } else {
                  profile = getDVBS2Profile(pilot, frameLength, modulation);
                  efficiency = profile.efficiency[key];
                  idealEsNo = profile.idealEsNo[key];
                  actualEsNo = profile.actualEsNo[key];
                  actualEbNo = calculateEbNoFromEsNo(actualEsNo, efficiency);
                }//if else

                let symbolRateOut;
                let tsRateOut;
                let bandwidthOut;
                const alpha = Number(rollOff);
                if (mode === 'Symbol Rate') {
                  symbolRateOut = modeInputs[mode].symbolRate;
                  bandwidthOut = round(symbolRateOut * (1 + alpha), 6);
                  tsRateOut = round(symbolRateOut * efficiency, 6);
                } else if (mode === 'Transport Stream Rate') {
                  tsRateOut = modeInputs[mode].tsRate;
                  symbolRateOut = round(tsRateOut / efficiency, 6);
                  bandwidthOut = round(symbolRateOut * (1 + alpha), 6);
                } else {
                  bandwidthOut = modeInputs[mode].bandwidth;
                  symbolRateOut = round(bandwidthOut / (1 + alpha), 6);
                  tsRateOut = round(symbolRateOut * efficiency, 6);
                }//if else

                scenarios.push({
                  mode: mode,
                  standard: standard,
                  modulation: modulation,
                  fecRate: fecRate,
                  rollOff: rollOff,
                  frameLength: frameLength,
                  pilotInsertion: pilot,
                  inputs: modeInputs[mode],
                  outputs: {
                    modulationMultiplier: multiplier,
                    efficiency: efficiency,
                    idealEbNo: idealEbNo,
                    idealEsNo: idealEsNo,
                    actualEsNo: actualEsNo,
                    actualEbNo: actualEbNo,
                    symbolRate: symbolRateOut,
                    transportStreamRate: tsRateOut,
                    bandwidth: bandwidthOut
                  }
                });
              }//for fec
            }//for mod
          }//for pilot
        }//for frame
      }//for rolloff
    }//for mode
  }//for standard
  return scenarios;
}//buildRegressionSnapshot()

function downloadRegressionSnapshot() {
  const scenarios = buildRegressionSnapshot();
  const payload = {
    timestamp: new Date().toISOString(),
    version: version || 'unknown',
    count: scenarios.length,
    useLegacyDVBS16QAMIdealEsNo: useLegacyDVBS16QAMIdealEsNo,
    scenarios: scenarios
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'DVB_Calc_regression_snapshot_' + (version || 'v1.0.0') + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('Regression snapshot generated: ' + scenarios.length + ' scenarios.');
}//downloadRegressionSnapshot()

function regressionScenarioKey(scenario) {
  return [
    scenario.mode,
    scenario.standard,
    scenario.modulation,
    scenario.fecRate,
    scenario.rollOff,
    scenario.frameLength,
    scenario.pilotInsertion
  ].join('|');
}//regressionScenarioKey()

function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}//isNumber()

function compareRegressionOutputValues(baselineValue, currentValue, tolerance) {
  if (isNumber(baselineValue) && isNumber(currentValue)) {
    return Math.abs(baselineValue - currentValue) <= tolerance;
  }//if
  return baselineValue === currentValue;
}//compareRegressionOutputValues()

function compareRegressionSnapshot(snapshotPayload, tolerance) {
  if (typeof tolerance === 'undefined') tolerance = 1e-9;
  let baseline = snapshotPayload;
  if (typeof baseline === 'string') {
    baseline = JSON.parse(baseline);
  }//if
  if (!baseline || !baseline.scenarios || !Array.isArray(baseline.scenarios)) {
    throw new Error('Invalid snapshot payload: expected object with scenarios[]');
  }//if

  const currentPayload = {
    timestamp: new Date().toISOString(),
    version: version || 'unknown',
    count: 0,
    useLegacyDVBS16QAMIdealEsNo: useLegacyDVBS16QAMIdealEsNo,
    scenarios: buildRegressionSnapshot()
  };
  currentPayload.count = currentPayload.scenarios.length;

  const baselineMap = {};
  const currentMap = {};
  for (let i = 0; i < baseline.scenarios.length; i++) {
    baselineMap[regressionScenarioKey(baseline.scenarios[i])] = baseline.scenarios[i];
  }//for
  for (let j = 0; j < currentPayload.scenarios.length; j++) {
    currentMap[regressionScenarioKey(currentPayload.scenarios[j])] = currentPayload.scenarios[j];
  }//for

  const keys = {};
  Object.keys(baselineMap).forEach(function (key) { keys[key] = true; });
  Object.keys(currentMap).forEach(function (key) { keys[key] = true; });

  const missingInCurrent = [];
  const missingInBaseline = [];
  const diffs = [];
  const outputFields = [
    'modulationMultiplier',
    'efficiency',
    'idealEbNo',
    'idealEsNo',
    'actualEsNo',
    'actualEbNo',
    'symbolRate',
    'transportStreamRate',
    'bandwidth'
  ];

  Object.keys(keys).forEach(function (key) {
    const baselineScenario = baselineMap[key];
    const currentScenario = currentMap[key];
    if (!baselineScenario) {
      missingInBaseline.push(key);
      return;
    }//if
    if (!currentScenario) {
      missingInCurrent.push(key);
      return;
    }//if
    for (let f = 0; f < outputFields.length; f++) {
      const field = outputFields[f];
      const baselineValue = baselineScenario.outputs[field];
      const currentValue = currentScenario.outputs[field];
      if (!compareRegressionOutputValues(baselineValue, currentValue, tolerance)) {
        diffs.push({
          key: key,
          field: field,
          baseline: baselineValue,
          current: currentValue
        });
      }//if
    }//for fields
  });//forEach key

  const summary = {
    baselineCount: baseline.scenarios.length,
    currentCount: currentPayload.scenarios.length,
    missingInCurrentCount: missingInCurrent.length,
    missingInBaselineCount: missingInBaseline.length,
    diffCount: diffs.length,
    missingInCurrent: missingInCurrent,
    missingInBaseline: missingInBaseline,
    diffs: diffs
  };

  console.log('Regression compare summary:', summary);
  if (diffs.length > 0) {
    console.table(diffs.slice(0, 25));
  }//if
  return summary;
}//compareRegressionSnapshot()

function compareRegressionSnapshotFromText(snapshotJsonText, tolerance) {
  return compareRegressionSnapshot(snapshotJsonText, tolerance);
}//compareRegressionSnapshotFromText()

function compareRegressionSnapshotFromFile(file, tolerance) {
  return new Promise(function (resolve, reject) {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }//if
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const result = compareRegressionSnapshot(e.target.result, tolerance);
        resolve(result);
      } catch (err) {
        reject(err);
      }//try catch
    };
    reader.onerror = function (err) {
      reject(err);
    };
    reader.readAsText(file);
  });
}//compareRegressionSnapshotFromFile()

window.downloadRegressionSnapshot = downloadRegressionSnapshot;
window.compareRegressionSnapshot = compareRegressionSnapshot;
window.compareRegressionSnapshotFromText = compareRegressionSnapshotFromText;
window.compareRegressionSnapshotFromFile = compareRegressionSnapshotFromFile;

function calculate() {                //the main calculation function
  console.log('calculating...');
  //set variables from other selected values and log it
  const varCalculatorMode = $('input[type=radio][name=Calculator_Mode]:checked').val();  //'Symbol Rate'||'Transport Stream Rate'||'Bandwidth'
  console.log('Calculator Mode: \'' + varCalculatorMode + '\'');
  const varDVBStandard = $('input[type=radio][name=DVB_Standard]:checked').val();      //'DVB-S'||'DVB-S2'||'DVB-S2X'
  console.log('DVB Standard: \'' + varDVBStandard + '\'');
  const varModulation = $('input[type=radio][name=Modulation]:checked').val();      //'QPSK'||'8PSK'||'16QAM'||'16APSK'||'32APSK'
  console.log('Modulation: \'' + varModulation + '\'');
  const varFECRate = getSelectedFecRate();  //'1/4'||'1/3'||'2/5'||'1/2'||'3/5'||'2/3'||'3/4'||'4/5'||'5/6'||'7/8'||'8/9'||'9/10'
  console.log('FEC Rate: \'' + varFECRate + '\'');
  const varAlphaFactor = $('input[type=radio][name=Roll-Off]:checked').val();      //'0.35'||'0.25'||'0.20'
  console.log('Roll-Off: \'' + varAlphaFactor + '\'');
  const varFrameLength = $('input[type=radio][name=Frame_Length]:checked').val();      //'Normal'||'Short'||'ShortS'
  console.log('Frame Length: \'' + varFrameLength + '\'');
  const varPilotInsertion = $('input[type=radio][name=Pilot_Insertion]:checked').val();  //'Off'||'On'
  console.log('Pilot Insertion: \'' + varPilotInsertion + '\'');
  //set variables from input values and log it
  let varSymbolRateInput = $('#Symbol_Rate_input_number').val();
  console.log('Symbol Rate input: \'' + varSymbolRateInput + '\'');
  let varTransportStreamRateInput = $('#Transport_Stream_Rate_input_number').val();
  console.log('Transport Stream Rate input: \'' + varTransportStreamRateInput + '\'');
  let varBandwidthInput = $('#Bandwidth_input_number').val();
  console.log('Bandwidth input: \'' + varBandwidthInput + '\'');
  //set variables from output values
  let varIdealQEFEsNo = $('#ideal_QEF_EsNo_number').val();
  let varActualQEFEsNo = $('#actual_QEF_EsNo_number').val();
  let varActualQEFEbNo = $('#actual_QEF_EbNo_number').val();
  let varModulationMultiplierOutput = $('#Modulation_Multiplier_output_number').val();
  let varEfficiencyOutput = $('#Efficiency_output_number').val();
  let varSymbolRateOutput = $('#Symbol_Rate_output_number').val();
  let varTransportStreamRateOutput = $('#Transport_Stream_Rate_output_number').val();
  let varBandwidthOutput = $('#Bandwidth_output_number').val();
  //calculate FEC as number and property name for Efficiency objects
  const parsedFecRate = parseFecRate(varFECRate);
  if (parsedFecRate === null) {
    reportInternalError('calculate() -> parseFecRate() -> varFECRate -> \'' + varFECRate + '\'');
    return;
  }//if
  const varFECRateNumber = parsedFecRate.numericRate;
  const varDataArrayObjectPropertyName = parsedFecRate.dataArrayKey;
  console.log('varDataArrayObjectPropertyName: \'' + varDataArrayObjectPropertyName + '\'');
  //Modulation Multiplier
  varModulationMultiplierOutput = getModulationMultiplier(varModulation, varFECRate);
  //QEF Points and Efficiency
  let varIdealQEFEbNo = INVALID_QEF_POINT; //needed to initialize setDefaultSelections properly
  if (varDVBStandard === 'DVB-S') {
    const varDVBoverhead = 188 / 204;
    const dvbsProfile = getDVBSProfile(varModulation);
    if (dvbsProfile === null) {
      reportInternalError('calculate() -> DVB-S -> varModulation -> \'' + varModulation + '\'');
    } else {
      varEfficiencyOutput = varDVBoverhead * varModulationMultiplierOutput * varFECRateNumber;
      if (dvbsProfile.idealEbNo === null) {
        varIdealQEFEbNo = INVALID_QEF_POINT;
      } else {
        varIdealQEFEbNo = dvbsProfile.idealEbNo[varDataArrayObjectPropertyName];
      }//if else
      varIdealQEFEsNo = dvbsProfile.idealEsNo[varDataArrayObjectPropertyName];
      varActualQEFEsNo = INVALID_QEF_POINT;
      varActualQEFEbNo = dvbsProfile.actualEbNo[varDataArrayObjectPropertyName];
    }//if else
  } else if (varDVBStandard === 'DVB-S2') {
    const dvbs2Profile = getDVBS2Profile(varPilotInsertion, varFrameLength, varModulation);
    if (dvbs2Profile === null) {
      reportInternalError('calculate() -> DVB-S2 profile lookup -> pilot/frame/modulation -> \'' + varPilotInsertion + '/' + varFrameLength + '/' + varModulation + '\'');
    } else {
      varEfficiencyOutput = dvbs2Profile.efficiency[varDataArrayObjectPropertyName];
      varIdealQEFEsNo = dvbs2Profile.idealEsNo[varDataArrayObjectPropertyName];
      varActualQEFEsNo = dvbs2Profile.actualEsNo[varDataArrayObjectPropertyName];
      varActualQEFEbNo = calculateEbNoFromEsNo(varActualQEFEsNo, varEfficiencyOutput);
    }//if else
  } else if (varDVBStandard === 'DVB-S2X') {
    const dvbs2xProfile = getDVBS2XProfile(varPilotInsertion, varFrameLength, varModulation, varFECRate);
    if (dvbs2xProfile === null) {
      reportInternalError('calculate() -> DVB-S2X profile lookup -> pilot/frame/modulation/fec -> \'' + varPilotInsertion + '/' + varFrameLength + '/' + varModulation + '/' + varFECRate + '\'');
    } else {
      varEfficiencyOutput = dvbs2xProfile.efficiency;
      varIdealQEFEsNo = dvbs2xProfile.idealEsNo;
      varActualQEFEsNo = dvbs2xProfile.actualEsNo;
      varActualQEFEbNo = calculateEbNoFromEsNo(varActualQEFEsNo, varEfficiencyOutput);
    }//if else
  } else {
    reportInternalError('calculate() -> varDVBStandard -> \'' + varDVBStandard + '\'');
  }//if else DVB Standard
  //detect unavailable Efficiency  with placeholder -9999 but this should not happen!
  if (varEfficiencyOutput === INVALID_EFFICIENCY) {
    reportInternalError('calculate() -> varEfficiencyOutput -> \'' + varEfficiencyOutput + '\'');
  }//if
  //detect unavailable QEF Points with placeholder -9999
  if (varIdealQEFEbNo === INVALID_QEF_POINT) {
    varIdealQEFEbNo = 'N/A';
  } else {
    varIdealQEFEbNo = varIdealQEFEbNo.toFixed(2);
  }//if
  console.log('calculate(): varIdealQEFEbNo: \'' + varIdealQEFEbNo + '\'');
  if (varIdealQEFEsNo === INVALID_QEF_POINT) {
    varIdealQEFEsNo = 'N/A';
  } else {
    varIdealQEFEsNo = varIdealQEFEsNo.toFixed(2);                  //round QEF Eb/No to 2 decimal places
  }//if
  console.log('calculate(): varIdealQEFEsNo: \'' + varIdealQEFEsNo + '\'');
  if (varActualQEFEsNo === INVALID_QEF_POINT) {
    varActualQEFEsNo = 'N/A';
  } else {
    varActualQEFEsNo = varActualQEFEsNo.toFixed(2);                  //round QEF Eb/No to 2 decimal places
  }//if
  console.log('calculate(): varActualQEFEsNo: \'' + varActualQEFEsNo + '\'');
  if (varActualQEFEbNo === INVALID_QEF_POINT) {
    varActualQEFEbNo = 'N/A';
  } else {
    varActualQEFEbNo = varActualQEFEbNo.toFixed(2);                  //round QEF Eb/No to 2 decimal places
  }//if
  console.log('calculate(): varActualQEFEbNo: \'' + varActualQEFEbNo + '\'');
  //calculations main dependency is Calculator Mode
  if (varCalculatorMode === 'Symbol Rate') {
    varSymbolRateOutput = varSymbolRateInput;
    varBandwidthOutput = varSymbolRateOutput * (1 + Number(varAlphaFactor));
    varBandwidthOutput = round(varBandwidthOutput, 6);              //round Bandwidth to 6 decimal places
    //varBandwidthOutput = Number(varBandwidthOutput).toFixed(6);
    varTransportStreamRateOutput = varSymbolRateOutput * varEfficiencyOutput;
    varTransportStreamRateOutput = round(varTransportStreamRateOutput, 6);    //round TS Rate to 6 decimal places
    //varTransportStreamRateOutput = Number(varTransportStreamRateOutput).toFixed(6);
    varTransportStreamRateInput = varTransportStreamRateOutput;
    //varTransportStreamRateInput = Number(varTransportStreamRateInput).toFixed(6);
    varBandwidthInput = varBandwidthOutput;
    //varBandwidthInput = Number(varBandwidthInput).toFixed(6);
  } else if (varCalculatorMode === 'Transport Stream Rate') {
    varTransportStreamRateOutput = varTransportStreamRateInput;
    varSymbolRateOutput = varTransportStreamRateOutput / varEfficiencyOutput;
    varSymbolRateOutput = round(varSymbolRateOutput, 6);            //round Symbol Rate to 6 decimal places
    //varSymbolRateOutput = Number(varSymbolRateOutput).toFixed(6);
    varBandwidthOutput = varSymbolRateOutput * (1 + Number(varAlphaFactor));
    varBandwidthOutput = round(varBandwidthOutput, 6);              //round Bandwidth to 6 decimal places
    //varBandwidthOutput = Number(varBandwidthOutput).toFixed(6);
    varSymbolRateInput = varSymbolRateOutput;
    //varSymbolRateInput = Number(varSymbolRateInput).toFixed(6);
    varBandwidthInput = varBandwidthOutput;
    //varBandwidthInput = Number(varBandwidthInput).toFixed(6);
  } else if (varCalculatorMode === 'Bandwidth') {
    varBandwidthOutput = varBandwidthInput;
    varSymbolRateOutput = varBandwidthOutput / (1 + Number(varAlphaFactor));
    varSymbolRateOutput = round(varSymbolRateOutput, 6);            //round Symbol Rate to 6 decimal places
    //varSymbolRateOutput = Number(varSymbolRateOutput).toFixed(6);
    varTransportStreamRateOutput = varSymbolRateOutput * varEfficiencyOutput;
    varTransportStreamRateOutput = round(varTransportStreamRateOutput, 6);    //round TS Rate to 6 decimal places
    //varTransportStreamRateOutput = Number(varTransportStreamRateOutput).toFixed(6);
    varSymbolRateInput = varSymbolRateOutput;
    //varSymbolRateInput = Number(varSymbolRateInput).toFixed(6);
    varTransportStreamRateInput = varTransportStreamRateOutput;
    //varTransportStreamRateInput = Number(varTransportStreamRateInput).toFixed(6);
  } else {
    reportInternalError('calculate() -> varCalculatorMode -> \'' + varCalculatorMode + '\'');
  };//if else
  //set output values to variables and log it
  $('#ideal_QEF_EbNo_number').val(varIdealQEFEbNo);
  console.log('Ideal EbNo output: \'' + varIdealQEFEbNo + '\'');
  $('#ideal_QEF_EsNo_number').val(varIdealQEFEsNo);
  console.log('Ideal EsNo output: \'' + varIdealQEFEsNo + '\'');
  $('#actual_QEF_EsNo_number').val(varActualQEFEsNo);
  console.log('Actual EsNo output: \'' + varActualQEFEsNo + '\'');
  $('#actual_QEF_EbNo_number').val(varActualQEFEbNo);
  console.log('Actual EbNo output: \'' + varActualQEFEbNo + '\'');
  $('#Modulation_Multiplier_output_number').val(varModulationMultiplierOutput);
  console.log('Modulation Multiplier output: \'' + varModulationMultiplierOutput + '\'');
  $('#Efficiency_output_number').val(varEfficiencyOutput);
  console.log('Efficiency output: \'' + varEfficiencyOutput + '\'');
  $('#Symbol_Rate_output_number').val(varSymbolRateOutput);
  console.log('Symbol Rate output: \'' + varSymbolRateOutput + '\'');
  $('#Transport_Stream_Rate_output_number').val(varTransportStreamRateOutput);
  console.log('Transport Stream Rate output: \'' + varTransportStreamRateOutput + '\'');
  $('#Bandwidth_output_number').val(varBandwidthOutput);
  console.log('Bandwidth output: \'' + varBandwidthOutput + '\'');
  //set input values to output values and log it
  $('#Symbol_Rate_input_number').val(varSymbolRateInput);
  console.log('Symbol Rate input: \'' + varSymbolRateInput + '\'');
  $('#Transport_Stream_Rate_input_number').val(varTransportStreamRateInput);
  console.log('Transport Stream Rate input: \'' + varTransportStreamRateInput + '\'');
  $('#Bandwidth_input_number').val(varBandwidthInput);
  console.log('Bandwidth input: \'' + varBandwidthInput + '\'');
  emailBody = '';
  //emailBody += 'Priority Input: ' + $('input[type=radio][name=Calculator_Mode]:checked').val() + '\r\n';
  emailBody += 'DVB Standard: ' + $('input[type=radio][name=DVB_Standard]:checked').val() + '\r\n';
  emailBody += 'Modulation: ' + $('input[type=radio][name=Modulation]:checked').val() + '\r\n';
  emailBody += 'FEC Rate: ' + getSelectedFecRate() + '\r\n';
  emailBody += 'Roll-Off: ' + $('input[type=radio][name=Roll-Off]:checked').val() * 100 + '%\r\n';
  emailBody += 'Frame Length: ' + $('input[type=radio][name=Frame_Length]:checked').val() + '\r\n';
  emailBody += 'Pilot Insertion: ' + $('input[type=radio][name=Pilot_Insertion]:checked').val() + '\r\n';
  if (varCalculatorMode === 'Symbol Rate') {
    emailBody += 'Symbol Rate: ' + varSymbolRateOutput + ' ' + $('#Symbol_Rate_output_label_units').text() + '\r\n';
    emailBody += 'Transport Stream Rate: ' + varTransportStreamRateOutput + ' ' + $('#Transport_Stream_Rate_output_label_units').text() + '\r\n';
    emailBody += 'Bandwidth: ' + varBandwidthOutput + ' ' + $('#Bandwidth_output_label_units').text() + '\r\n';
  } else if (varCalculatorMode === 'Transport Stream Rate') {
    emailBody += 'Transport Stream Rate: ' + varTransportStreamRateOutput + ' ' + $('#Transport_Stream_Rate_output_label_units').text() + '\r\n';
    emailBody += 'Symbol Rate: ' + varSymbolRateOutput + ' ' + $('#Symbol_Rate_output_label_units').text() + '\r\n';
    emailBody += 'Bandwidth: ' + varBandwidthOutput + ' ' + $('#Bandwidth_output_label_units').text() + '\r\n';
  } else if (varCalculatorMode === 'Bandwidth') {
    emailBody += 'Bandwidth: ' + varBandwidthOutput + ' ' + $('#Bandwidth_output_label_units').text() + '\r\n';
    emailBody += 'Symbol Rate: ' + varSymbolRateOutput + ' ' + $('#Symbol_Rate_output_label_units').text() + '\r\n';
    emailBody += 'Transport Stream Rate: ' + varTransportStreamRateOutput + ' ' + $('#Transport_Stream_Rate_output_label_units').text() + '\r\n';
  } else {
    reportInternalError('calculate() -> emailBody -> varCalculatorMode -> \'' + varCalculatorMode + '\'');
  };//if else
  //emailBody += 'Modulation Multiplier: ' + varModulationMultiplierOutput + '\r\n';
  //emailBody += 'Efficiency: ' + varEfficiencyOutput + '\r\n';
  if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S') {
    //emailBody += 'ideal QEF Eb/No: ' + varIdealQEFEbNo + ' dB' + '\r\n';
    emailBody += 'actual QEF Eb/No: ' + varActualQEFEbNo + ' dB' + '\r\n';
  } else if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S2') {
    //emailBody += 'ideal QEF Es/No: ' + varIdealQEFEsNo + ' dB' + '\r\n';
    emailBody += 'actual QEF Es/No: ' + varActualQEFEsNo + ' dB' + '\r\n';
  } else if ($('input[type=radio][name=DVB_Standard]:checked').val() === 'DVB-S2X') {
    emailBody += 'ideal QEF Es/No: ' + varIdealQEFEsNo + ' dB' + '\r\n';
  } else {
    reportInternalError('calculate() -> emailBody -> $(\'input[type=radio][name=DVB_Standard]:checked\').val() -> \'' + $('input[type=radio][name=DVB_Standard]:checked').val() + '\'');
  }//if else
  emailBody += '\r\n';
  //console.log(emailBody);
  console.log('Calculation done!\n\n');  //calculation done!
}//calculate()
