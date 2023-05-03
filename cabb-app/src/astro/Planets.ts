// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001-2009
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.

// Functions for the planets

import * as AstroUtil from './AstroUtil'
import * as AstroSource from './AstroSource'
import * as DatetimeUtil from './DatetimeUtil'
import * as Transform from './Transform'

// Meeus table 30.A DE245 Orbital Elements for the mean equinox of the date
export const PLANETS =
    { 'Mercury' : {
          ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [252.250906, 149474.0722491,    0.00030397,    0.000000018],
          a: [  0.387098310,   0.0,          0.0,           0.0],
          e: [  0.20563175,    0.000020406, -0.0000000284, -0.00000000017],
          i: [  7.004986,      0.0018215,   -0.00001809,    0.000000053],
          N: [ 48.330893,      1.1861890,    0.00017587,    0.000000211],
          P: [ 77.456119,      1.5564775,    0.00029589,    0.000000056]},
      'Venus' : { ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [181.979801,  58519.2130302,    0.00031060,    0.000000015],
          a: [  0.723329820,   0.0,          0.0,           0.0],
          e: [  0.00677188,   -0.000047766,  0.0000000975,  0.00000000044],
          i: [  3.394662,      0.0010037,   -0.00000088,   -0.000000007],
          N: [ 76.679920,      0.9011190,    0.00040665,   -0.000000080],
          P: [131.563707,      1.4022188,   -0.00107337,   -0.000005315]},
      'Earth': {ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [100.466449,  36000.7698231,    0.00030368,    0.000000021],
          a: [  1.000001018,   0.0,          0.0,           0.0],
          e: [  0.01670862,   -0.000042037, -0.0000001236,  0.00000000004],
          i: [  0.0,           0.0,          0.0,           0.0],
          N: [  0.0,           0.0,          0.0,           0.0],
          P: [102.937348,      1.7195269,    0.00045962,    0.000000499]},
      'Mars': { ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [355.433275,  19141.6964746,    0.00031097,    0.000000015],
          a: [  1.523679342,   0.0,          0.0,           0.0],
          e: [  0.09340062,    0.000090483, -0.0000000806, -0.00000000035],
          i: [  1.849726,     -0.0006010,    0.00001276,   -0.000000006],
          N: [ 49.558093,      0.7720923,    0.00001605,    0.000002325],
          P: [336.060234,      1.8410331,    0.00013515,    0.000000318]},
      'Jupiter': {ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [ 34.351484,   3036.3027889,    0.00022374,    0.000000025],
          a: [  5.202603191,   0.0000001913, 0.0,           0.0],
          e: [  0.04849485,    0.000163244, -0.0000004719, -0.00000000197],
          i: [  1.303270,     -0.0054966,    0.00000465,   -0.000000004],
          N: [100.464441,      1.0209550,    0.00040117,    0.000000569],
          P: [ 14.331309,      1.6126668,    0.00103127,   -0.000004569]},
      'Saturn': { ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [ 50.077471,   1223.5110141,    0.00051952,   -0.000000003],
          a: [  9.554909596,  -0.0000021389, 0.0,           0.0],
          e: [  0.05550862,   -0.000346818, -0.0000006456,  0.00000000338],
          i: [  2.488878,     -0.0037363,   -0.00001516,    0.000000089],
          N: [113.665524,      0.8770979,   -0.00012067,   -0.000002380],
          P: [ 93.056787,      1.9637694,    0.00083757,    0.000004899]} ,
      'Uranus': { ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [314.055005,    429.8640561,    0.00030434,    0.000000026],
          a: [ 19.218446062,  -0.0000000372, 0.00000000098, 0.0],
          e: [  0.04629590,   -0.000027337,  0.0000000790,  0.00000000025],
          i: [  0.773196,      0.0007744,    0.00003749,   -0.000000092],
          N: [ 74.005947,      0.5211258,    0.00133982,    0.000018516],
          P: [173.005159,      1.4863784,    0.00021450,    0.000000433]},
      'Neptune': { ra:0, dec:0, azimuth:0, elevation:0,
          never_up: false, circumpolar: false, lstRise: 0, lstSet:0,
          L: [304.348665,    219.8833092,    0.00030926,    0.000000018],
          a: [ 30.110386869,  -0.0000001663, 0.00000000069, 0.0],
          e: [  0.00898809,    0.000006408, -0.0000000008, -0.00000000005],
          i: [  1.769952,     -0.0093082,   -0.00000708,    0.000000028],
          N: [131.784057,      1.1022057,    0.00026006,   -0.000000636],
          P: [ 48.123691,      1.4262677,    0.00037918,   -0.000000003]}};

// heliocentric xyz for planet p
export function helios(p: any, jd: number): number[] {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  // longitude of ascending node
  const N = AstroUtil.rev360(p.N[0] + p.N[1] * T + p.N[2] * T2 + p.N[3] * T3);
  // inclination
  const i = p.i[0] + p.i[1] * T + p.i[2] * T2 + p.i[3] * T3;
  // Mean longitude
  const L = AstroUtil.rev360(p.L[0] + p.L[1] * T + p.L[2] * T2 + p.L[3] * T3);
  // semimajor axis
  const a = p.a[0] + p.a[1] * T + p.a[2] * T2 + p.a[3] * T3;
  // eccentricity
  const e = p.e[0] + p.e[1] * T + p.e[2] * T2 + p.e[3] * T3;
  // longitude of perihelion
  const P = AstroUtil.rev360(p.P[0] + p.P[1] * T + p.P[2] * T2 + p.P[3] * T3);
  const M = AstroUtil.rev360(L - P);
  const w = AstroUtil.rev360(L - N - M);
  // Eccentric anomaly
  let E0 = M + (AstroUtil.RTD * e * AstroUtil.sind(M) * (1 + e * AstroUtil.cosd(M)));
  let E = E0 - (E0 - AstroUtil.RTD * e * AstroUtil.sind(E0) - M)/(1 - e * AstroUtil.cosd(E0));
  while (Math.abs(E0 - E) > 0.0005) {
    E0 = E;
    E = E0 - (E0 - AstroUtil.RTD * e * AstroUtil.sind(E0) - M)/(1 - e * AstroUtil.cosd(E0));
  };
  const x = a * (AstroUtil.cosd(E) - e);
  const y = a * Math.sqrt(1 - e * e) * AstroUtil.sind(E);
  const r = Math.sqrt(x * x + y * y);
  const v = AstroUtil.rev360(AstroUtil.atan2d(y,x));
  // Heliocentric Ecliptic Rectangular Coordinates
  const xeclip = r * (AstroUtil.cosd(N) * AstroUtil.cosd(v + w) 
                  - AstroUtil.sind(N) * AstroUtil.sind(v + w) * AstroUtil.cosd(i));
  const yeclip = r * (AstroUtil.sind(N) * AstroUtil.cosd(v + w) 
                  + AstroUtil.cosd(N) * AstroUtil.sind(v + w) * AstroUtil.cosd(i));
  const zeclip = r * AstroUtil.sind(v + w) * AstroUtil.sind(i);

  return [xeclip, yeclip, zeclip];
}

// radecr returns ra, dec and earth distance
// obj and base are Heliocentric Ecliptic Rectangular Coordinates
// for the object and earth
export function radecr(obj: any, base: number[], jd: number) {
  // Equatorial co-ordinates
  const x = obj[0];
  const y = obj[1];
  const z = obj[2];
  // Obliquity of Ecliptic
  const obl = 23.4393 - 3.563E-7 * (jd - 2451543.5);
  // Convert to Geocentric co-ordinates
  const x1 = x - base[0];
  const y1 = (y - base[1]) * AstroUtil.cosd(obl) - (z - base[2]) * AstroUtil.sind(obl);
  const z1 = (y - base[1]) * AstroUtil.sind(obl) + (z - base[2]) * AstroUtil.cosd(obl);
  // RA and dec
  const ra = AstroUtil.rev360(AstroUtil.atan2d(y1, x1))/15.0;
  const dec = AstroUtil.atan2d(z1,Math.sqrt(x1 * x1 + y1 * y1));
  // Earth distance
  const r = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return [ra, dec, r];
}

export function planpos(date: Date): any {
  let jd = DatetimeUtil.jd(date);
  var planets = JSON.parse(JSON.stringify(PLANETS));

  for (let key in planets.key()) {
    if(key === 'Earth') 
      continue;

    const planet = planets[key];
    const earth_xyz = helios(planets['Earth'],jd);
    const planet_xyz = helios(planets['Earth'],jd);
    const lst = DatetimeUtil.local_sidereal(jd);
    const radec = radecr(planet_xyz,earth_xyz,jd);
    const ra = radec[0] * 15;
    const dec = radec[1];
    const altaz = Transform.equ_to_horizon({ra:ra,dec:dec},jd);
    planet.ra = ra;
    planet.dec = dec;
    planet.azimuth = altaz[0];
    planet.elevation = altaz[1];

    const d = AstroSource.calRiseSet(ra, dec, AstroUtil.LATITUDE, 0);
    planet.never_up = d.never_up;
    planet.circumpolar= d.circumpolar;
    planet.lstRise = d.lstRise;
    planet.lstSet = d.lstSet;
  }

  return planets;
}

