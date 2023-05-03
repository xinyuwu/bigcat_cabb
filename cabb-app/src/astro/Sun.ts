// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001 - 2009
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.

// Various functions for the Sun
import * as AstroUtil from "./AstroUtil";
import * as Planets from "./Planets";
import * as Transform from "./Transform";

// Nutation in longitude and obliquity, returns seconds
export function nutation(jd: number): number[] {
  var T = (jd - 2451545.0) / 36525.0;
  var T2 = T * T;
  var T3 = T2 * T;
  var omega = AstroUtil.rev360(125.04452 - 1934.136261 * T);
  var L = AstroUtil.rev360(280.4665 + 36000.7698 * T);
  var LP = AstroUtil.rev360(218.3165 + 481267.8813 * T);
  var deltaL = -17.20 * AstroUtil.sind(omega) 
                - 1.32 * AstroUtil.sind(2 * L) 
                - 0.23 * AstroUtil.sind(2 * LP) 
                + 0.21 * AstroUtil.sind(2 * omega);
  var deltaO = 9.20 * AstroUtil.cosd(omega) 
                + 0.57 * AstroUtil.cosd(2 * L) 
                + 0.10 * AstroUtil.cosd(2 * LP) 
                - 0.09 * AstroUtil.cosd(2 * omega);
  return [deltaL, deltaO];
}

// Obliquity of ecliptic
export function obl_eql(jd: number): number {
  var T = (jd - 2451545.0) / 36525;
  var T2 = T * T;
  var T3 = T2 * T;
  var e0 = 23.0 + (26.0/60.0) 
            + (21.448 - 46.8150 * T - 0.00059 * T2 + 0.001813 * T3) / 3600.0;
  var nut = nutation(jd);
  var e = e0 + nut[1] / 3600.0;
  return e;
}

// Eccentricity of Earths Orbit
export function earth_ecc(jd: number): number {
  var T = (jd - 2451545.0) / 36525;
  var T2 = T * T;
  var T3 = T2 * T;
  var e = 0.016708617 - 0.000042037 * T - 0.0000001236 * T2;
  return e;
}


// The equation of time function returns minutes
export function EoT(jd: number): number {
  var sun_xyz = [0.0, 0.0, 0.0];
  var earth_xyz = Planets.helios(Planets.PLANETS['Earth'], jd);
  var radec = Planets.radecr(sun_xyz, earth_xyz, jd);
  var T = (jd - 2451545.0) / 365250;
  var T2 = T * T;
  var T3 = T2 * T;
  var T4 = T3 * T;
  var T5 = T4 * T;
  var L0 = AstroUtil.rev360(280.4664567 
                            + 360007.6982779 * T 
                            + 0.03032028 * T2 
                            + T3 / 49931.0
                            - T4 / 15299.0 
                            - T5 / 1988000.0);
  var nut = nutation(jd);
  var delta = nut[0] / 3600.0;
  var e = obl_eql(jd);
  var E = 4 * (L0 - 0.0057183 - (radec[0] * 15.0) + delta * AstroUtil.cosd(e));
  while (E <  -1440) 
    E += 1440;
  while (E > 1440) 
    E -= 1440;
    
  return E;
}

export function sunpos(jd: number): any {
  const sun_xyz = [0.0, 0.0, 0.0];
  const earth_xyz = Planets.helios(Planets.PLANETS['Earth'], jd);
  const radec = Planets.radecr(sun_xyz, earth_xyz, jd);
  const ra = 15 * radec[0];
  const dec = radec[1];
  const altaz = Transform.equ_to_horizon({ra:ra, dec:dec}, jd);

  return {
    'ra': ra,
    'dec': dec,
    'azimuth': altaz[0],
    'elevation': altaz[1],
    'isVisible': (altaz[1] > 0) ? true : false
  };
}
