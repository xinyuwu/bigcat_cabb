import * as AstroUtil from './AstroUtil'
import * as DatetimeUtil from './DatetimeUtil'

// Obliquity of the ecliptic (angle between ecliptic and celestial equator
const obl = { j2000: 23.4392911, b1950: 23.4457889 };

// Equatorial system of FK4 (B1950.0), the galactic North Pole has coords (degrees):
const fk4r = 192.25; // 12h49m
const fk4d = +27.4;

// Precession matrix for conversion from B1950.0 to J2000.0
const fk4fk5matrix = [[0.999926,-0.011179,-0.004859],
      [0.011179,0.999938,-0.000027],
      [0.004859,0.000027,0.999988]];

// Precenssion matrix for conversion from J2000.0 to Galactic
const fk5galmatrix = [[-0.054875539726,  0.494109453312, -0.867666135858],
      [-0.873437108010, -0.444829589425, -0.198076386122],
      [-0.483834985808,  0.746982251810,  0.455983795705]];

// Coordinate converter from Galactic/B1950 to J2000
export function coord_convert(obj: any, jd: number) {
  let radec;
  if(obj.epoch === 'G') {
    radec = galactic_to_fk4(obj);
    radec = fk4_to_fk5(obj);
  } else {
    radec = [AstroUtil.hms(obj.RA), AstroUtil.dms(obj.Dec)];
    if (obj.epoch === 'B1950') {
      radec = fk4_to_fk5(obj);
    }
  }
  obj.ra = radec[0];
  obj.dec = radec[1];
  obj.RA = AstroUtil.hmsstring(radec[0] / 15);
  obj.Dec = AstroUtil.dmsstring(radec[1]);

  return equ_to_horizon(obj, jd);
}

// fk4gal converts B1950.0 to Galactic coordinates
export function fk4_to_galactic(obj: any): number[] {
  const ra = obj.ra;
  const dec = obj.dec;
  const tanx = AstroUtil.sind(fk4r - ra) 
    / ( AstroUtil.cosd(fk4r - ra) * AstroUtil.sind(fk4d) - AstroUtil.tand(dec) * AstroUtil.cosd(fk4d) );
  const l = AstroUtil.rev360(303 - AstroUtil.atand(tanx));
  const sinb = AstroUtil.sind(dec) * AstroUtil.sind(fk4d) 
                + AstroUtil.cosd(dec) * AstroUtil.cosd(fk4d) * AstroUtil.cosd(fk4r - ra);
  const b = AstroUtil.asind(sinb);
  return [l, b];
}

export function galactic_to_fk4(obj: any): number[] {
  const l = obj.l;
  const b = obj.b;
  const x = AstroUtil.sind(l - 123);
  const y = AstroUtil.cosd(l - 123) * AstroUtil.sind(fk4d) 
          - AstroUtil.tand(b) * AstroUtil.cosd(fk4d);

  let ra = AstroUtil.atan2d(x, y) + 12.25;
  ra = AstroUtil.rev360(ra);
  const sindec = AstroUtil.sind(b) * AstroUtil.sind(fk4d) 
              + AstroUtil.cosd(b) * AstroUtil.cosd(fk4d) * AstroUtil.cosd(l - 123);
  const dec = AstroUtil.asind(sindec);
  return [ra, dec];
}

// fk4fk5 converts B1950.0 to J2000.0 From http://www.stargazing.net/kepler/b1950.html
export function fk4_to_fk5(obj:any): number[] {
  let ra = obj.ra;
  let dec = obj.dec;
  const X = AstroUtil.cosd(ra) * AstroUtil.cosd(dec);
  const Y = AstroUtil.sind(ra) * AstroUtil.cosd(dec);
  const Z = AstroUtil.sind(dec);
  // Calculate J2000 components
  const x = 0.999926 * X - 0.011179 * Y - 0.004859 * Z;
  const y = 0.011179 * X + 0.999938 * Y - 0.000027 * Z;
  const z = 0.004859 * X + 0.000027 * Y + 0.999988 * Z;
  // Convert back to RA/DEC referred to J2000
  ra = AstroUtil.rev360( Math.atan2(y,x) * AstroUtil.RTD );
  dec = AstroUtil.asind(z);
  return [ra,dec];
}

// equ_to_horizon converts ra and dec to elevation and azimuth
export function equ_to_horizon(obj:any, jd: number): number[] {
  const ra   = obj.ra;
  const dec  = obj.dec;
  const H = DatetimeUtil.local_sidereal(jd) - ra;
  const sinH = AstroUtil.sind(H);
  const cosH = AstroUtil.cosd(H);
  const sinl = AstroUtil.sind(AstroUtil.LATITUDE);
  const cosl = AstroUtil.cosd(AstroUtil.LATITUDE);
  const sind = AstroUtil.sind(dec);
  const cosd = AstroUtil.cosd(dec);
  const tand = AstroUtil.tand(dec);
  const az   = AstroUtil.rev360(AstroUtil.atan2d(sinH, cosH * sinl - tand * cosl) + 180 );
  const el   = AstroUtil.asind(sinl * sind + cosl * cosd * cosH);
  obj.azimuth = az;
  obj.elevation = el;
  return [az, el];
}

export function horizon_to_equ(obj: any, jd: number): number[] {
  const az     = obj.azimuth;
  const el     = obj.elevation;
  const lst    = DatetimeUtil.local_sidereal(jd);
  const sinaz  = AstroUtil.sind(az);
  const cosaz  = AstroUtil.cosd(az);
  const sinalt = AstroUtil.sind(el);
  const cosalt = AstroUtil.cosd(el);
  const sinl   = AstroUtil.sind(AstroUtil.LATITUDE);
  const cosl   = AstroUtil.cosd(AstroUtil.LATITUDE);
  const dec    = AstroUtil.asind(sinl * sinalt + cosl * cosalt * cosaz);
  const H      = AstroUtil.asind(-sinaz * cosalt / AstroUtil.cosd(dec));
  const ra     = AstroUtil.rev360(lst - H);
  obj.ra = ra;
  obj.dec = dec;

  return [ra, dec];
}

