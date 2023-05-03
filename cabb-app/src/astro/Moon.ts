import * as AstroUtil from './AstroUtil';
import * as Transform from './Transform';


// Functions for the moon

// Meeus first edition table 45.A Longitude and distance of the moon
const T45AD = [0, 2, 2, 0, 0, 0, 2, 2, 2, 2,
          0, 1, 0, 2, 0, 0, 4, 0, 4, 2,
          2, 1, 1, 2, 2, 4, 2, 0, 2, 2,
          1, 2, 0, 0, 2, 2, 2, 4, 0, 3,
          2, 4, 0, 2, 2, 2, 4, 0, 4, 1,
          2, 0, 1, 3, 4, 2, 0, 1, 2, 2];

const T45AM = [0,  0,  0,  0,  1,  0,  0, -1,  0, -1,
          1,  0,  1,  0,  0,  0,  0,  0,  0,  1,
          1,  0,  1, -1,  0,  0,  0,  1,  0, -1,
          0, -2,  1,  2, -2,  0,  0, -1,  0,  0,
          1, -1,  2,  2,  1, -1,  0,  0, -1,  0,
          1,  0,  1,  0,  0, -1,  2,  1,  0,  0];

const T45AMP = [ 1, -1,  0,  2,  0,  0, -2, -1,  1,  0,
          -1,  0,  1,  0,  1,  1, -1,  3, -2, -1,
            0, -1,  0,  1,  2,  0, -3, -2, -1, -2,
            1,  0,  2,  0, -1,  1,  0, -1,  2, -1,
            1, -2, -1, -1, -2,  0,  1,  4,  0, -2,
            0,  2,  1, -2, -3,  2,  1, -1,  3, -1];

const T45AF = [ 0,  0,  0,  0,  0,  2,  0,  0,  0,  0,
          0,  0,  0, -2,  2, -2,  0,  0,  0,  0,
          0,  0,  0,  0,  0,  0,  0,  0,  2,  0,
          0,  0,  0,  0,  0, -2,  2,  0,  2,  0,
          0,  0,  0,  0,  0, -2,  0,  0,  0,  0,
          -2, -2,  0,  0,  0,  0,  0,  0,  0, -2];

const T45AL = [6288774, 1274027, 658314, 213618, -185116,
          -114332,   58793,  57066,  53322,   45758,
          -40923,  -34720, -30383,  15327,  -12528,
            10980,   10675,  10034,   8548,   -7888,
            -6766,   -5163,   4987,   4036,    3994,
            3861,    3665,  -2689,  -2602,    2390,
            -2348,    2236,  -2120,  -2069,    2048,
            -1773,   -1595,   1215,  -1110,    -892,
            -810,     759,   -713,   -700,     691,
              596,     549,    537,    520,    -487,
            -399,    -381,    351,   -340,     330,
              327,    -323,    299,    294,       0];

const T45AR = [-20905355, -3699111, -2955968, -569925,   48888,
              -3149,   246158,  -152138, -170733, -204586,
            -129620,   108743,   104755,   10321,       0,
              79661,   -34782,   -23210,  -21636,   24208,
              30824,    -8379,   -16675,  -12831,  -10445,
            -11650,    14403,    -7003,       0,   10056,
              6322,    -9884,     5751,       0,   -4950,
              4130,        0,    -3958,       0,    3258,
              2616,    -1897,    -2117,    2354,       0,
                  0,    -1423,    -1117,   -1571,   -1739,
                  0,    -4421,        0,       0,       0,
                  0,     1165,        0,       0,    8752];

// Meeus table 45B latitude of the moon
const T45BD = [0, 0, 0, 2, 2, 2, 2, 0, 2, 0,
          2, 2, 2, 2, 2, 2, 2, 0, 4, 0,
          0, 0, 1, 0, 0, 0, 1, 0, 4, 4,
          0, 4, 2, 2, 2, 2, 0, 2, 2, 2,
          2, 4, 2, 2, 0, 2, 1, 1, 0, 2,
          1, 2, 0, 4, 4, 1, 4, 1, 4, 2];

const T45BM = [ 0,  0,  0,  0,  0,  0,  0, 0,  0,  0,
          -1,  0,  0,  1, -1, -1, -1, 1,  0,  1,
          0,  1,  0,  1,  1,  1,  0, 0,  0,  0,
          0,  0,  0,  0, -1,  0,  0, 0,  0,  1,
          1,  0, -1, -2,  0,  1,  1, 1,  1,  1,
          0, -1,  1,  0, -1,  0,  0, 0, -1, -2];

const T45BML = [ 0,  0,  0,  0,  0,  0,  0, 0,  0,  0,
          -1,  0,  0,  1, -1, -1, -1, 1,  0,  1,
            0,  1,  0,  1,  1,  1,  0, 0,  0,  0,
            0,  0,  0,  0, -1,  0,  0, 0,  0,  1,
            1,  0, -1, -2,  0,  1,  1, 1,  1,  1,
            0, -1,  1,  0, -1,  0,  0, 0, -1, -2];

const T45BMP = [0,  1, 1,  0, -1, -1,  0,  2,  1,  2,
          0, -2, 1,  0, -1,  0, -1, -1, -1,  0,
          0, -1, 0,  1,  1,  0,  0,  3,  0, -1,
          1, -2, 0,  2,  1, -2,  3,  2, -3, -1,
          0,  0, 1,  0,  1,  1,  0,  0, -2, -1,
          1, -2, 2, -2, -1,  1,  1, -1,  0,  0];

const T45BF = [ 1,  1, -1, -1,  1, -1,  1,  1, -1, -1,
          -1, -1,  1, -1,  1,  1, -1, -1, -1,  1,
          3,  1,  1,  1, -1, -1, -1,  1, -1,  1,
          -3,  1, -3, -1, -1,  1, -1,  1, -1,  1,
          1,  1,  1, -1,  3, -1, -1,  1, -1, -1,
          1, -1,  1, -1, -1, -1, -1, -1, -1,  1];


const T45BL = [5128122, 280602, 277693, 173237, 55413,
            46271,  32573,  17198,   9266,  8822,
            8216,   4324,   4200,  -3359,  2463,
            2211,   2065,  -1870,   1828, -1794,
            -1749,  -1565,  -1491,  -1475, -1410,
            -1344,  -1335,   1107,   1021,   833,
              777,    671,    607,    596,   491,
            -451,    439,    422,    421,  -366,
            -351,    331,    315,    302,  -283,
            -229,    223,    223,   -220,  -220,
            -185,    181,   -177,    176,   166,
            -164,    132,   -119,    115,   107];


// moonpos calculates the Moon position, based on Meeus chapter 45
// and the illuminated percentage from Meeus equations 46.4 and 46.1
export function moonpos(jd: number) {
    const T  = (jd - 2451545.0) / 36525;
    const T2 = T * T;
    const T3 = T2 * T;
    const T4 = T3 * T;
    // Moons mean longitude L'
    const LP = 218.3164477
                + 481267.88123421 * T
                - 0.0015786 * T2
                + T3 / 538841.0
                - T4 / 65194000.0;

    // Moons mean elongation Meeus first edition
    // var D=297.8502042+445267.1115168*T-0.0016300*T2+T3/545868.0-T4/113065000.0;
    // Moons mean elongation Meeus second edition
    const D = 297.8501921
              + 445267.1114034 * T
              - 0.0018819 * T2 
              + T3 / 545868.0
              - T4 / 113065000.0;

    // Moons mean anomaly M' Meeus first edition
    // var MP=134.9634114+477198.8676313*T+0.0089970*T2+T3/69699.0-T4/14712000.0;
    // Moons mean anomaly M' Meeus second edition
    const MP = 134.9633964
                + 477198.8675055 * T
                + 0.0087414 * T2
                + T3 / 69699.0
                - T4 / 14712000.0;

    // Moons argument of latitude
    const F = 93.2720950
              + 483202.0175233 * T
              - 0.0036539 * T2 
              - T3 / 3526000.0
              + T4 / 863310000.0;

    // Suns mean anomaly
    const M = 357.5291092
              + 35999.0502909 * T
              - 0.0001536 * T2
              + T3 / 24490000.0;

    // Additional arguments
    const A1 = 119.75 + 131.849 * T;
    const A2 = 53.09 + 479264.290 * T;
    const A3 = 313.45 + 481266.484 * T;
    const E = 1-0.002516 * T - 0.0000074 * T2;
    const E2 = E * E;
    // Sums of periodic terms from table 45.A and 45.B
    var Sl = 0.0;
    var Sr = 0.0;
    for (var i=0; i<60; i++) {
              var Eterm=1;
        if (Math.abs( T45AM[i]) === 1) 
          Eterm=E;
        if (Math.abs( T45AM[i]) === 2) 
          Eterm=E2;

        Sl += T45AL[i] * Eterm * AstroUtil.sind(
                AstroUtil.rev360(
                    T45AD[i] * D + T45AM[i] * M + T45AMP[i] * MP + T45AF[i] * F
            ));
        Sr += T45AR[i] * Eterm * AstroUtil.cosd(
                AstroUtil.rev360(
                    T45AD[i] * D + T45AM[i] * M + T45AMP[i] * MP + T45AF[i] * F
            ));
    }

    let Sb = 0.0;
    for (let i=0; i<60; i++) {
        let Eterm = 1;
        if (Math.abs(T45BM[i]) === 1) 
          Eterm=E;
        if (Math.abs(T45BM[i]) === 2) 
          Eterm=E2;
        Sb += T45BL[i] * Eterm * AstroUtil.sind(
                AstroUtil.rev360(
                  T45BD[i] * D + T45BM[i] * M + T45BMP[i] * MP + T45BF[i] * F
        ));
    }
  // Additional additive terms
  Sl = Sl + 3958 * AstroUtil.sind(AstroUtil.rev360(A1))
       + 1962 * AstroUtil.sind(AstroUtil.rev360(LP - F))
       + 318 * AstroUtil.sind(AstroUtil.rev360(A2));

  Sb = Sb - 2235 * AstroUtil.sind(AstroUtil.rev360(LP))
      + 382 * AstroUtil.sind(AstroUtil.rev360(A3))
      + 175 * AstroUtil.sind(AstroUtil.rev360(A1 - F))
      + 175 * AstroUtil.sind(AstroUtil.rev360(A1 + F))
      + 127 * AstroUtil.sind(AstroUtil.rev360(LP - MP))
      - 115 * AstroUtil.sind(AstroUtil.rev360(LP + MP));

  // geocentric longitude, latitude and distance
  let mglong = AstroUtil.rev360(LP + Sl / 1000000.0);
  let mglat = AstroUtil.rev360(Sb / 1000000.0);
  if (mglat > 180.0) 
    mglat = mglat - 360;
  const mr = Math.round(385000.56 + Sr / 1000.0);
  // Obliquity of Ecliptic
  const obl = 23.4393 - 3.563E-7 * (jd - 2451543.5);
  // RA and dec
  const ra = AstroUtil.rev360(AstroUtil.atan2d(
            AstroUtil.sind(mglong) * AstroUtil.cosd(obl) - AstroUtil.tand(mglat) * AstroUtil.sind(obl),
            AstroUtil.cosd(mglong)));

  let dec = AstroUtil.rev360(AstroUtil.asind(
            AstroUtil.sind(mglat) * AstroUtil.cosd(obl)
            + AstroUtil.cosd(mglat) * AstroUtil.sind(obl) * AstroUtil.sind(mglong)));

  if (dec > 180.0)
    dec = dec - 360;

  // phase angle
  const pa = 180.0 - D 
            - 6.289 * AstroUtil.sind(MP)
            + 2.1 * AstroUtil.sind(M)
            - 1.274 * AstroUtil.sind(2 * D - MP)
            - 0.658 * AstroUtil.sind(2 * D) 
            - 0.214 * AstroUtil.sind(2 * MP)
            - 0.11 * AstroUtil.sind(D);

  // Altitude and azimuth
  const altaz= Transform.equ_to_horizon({ra:ra, dec:dec}, jd);

  const moon = {
      ra : ra,
      dec : dec,
      distance : mr,
      positionangle : AstroUtil.rev360(pa),
      azimuth : altaz[0],
      elevation : altaz[1],
      isVisible : (altaz[1] > 0) ? true : false
  };

  return moon;
}
