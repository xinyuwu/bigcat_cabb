// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/ephemeris/index.html
// Copyright 2001-2011
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.

// Various date and time functions
import * as AstroUtil from './AstroUtil'

export function lst2gst(lst: number, longitude: number) {
  /* Conversion of Local Sidereal time (decimal hours) to Greenwich
    * sidereal time (decimal hours)
    */
  return AstroUtil.rev24(lst - (longitude/15));
}

export function gst2ut(jd: number, gst: number) {
  /* Conversion of GST (decimal hours) to UTC (decimal hours) */
  const S = jd - 2451545.0;
  const T = S / 36525.0;
  const T0 = AstroUtil.rev24(6.697374558 + (2400.051336 * T));
  const ut = AstroUtil.rev24(gst - T0) * 0.9972695663;
  return ut;
}

export function jd(date: Date) {
  // The Julian day
  let A, B, C, D, jd;

  let yr = date.getUTCFullYear();
  let mon = date.getUTCMonth() + 1;
  
  const day = date.getUTCDate();
  const hr = date.getUTCHours();
  const min = date.getUTCMinutes();
  const sec = date.getUTCSeconds();
  const fday =  day + ((3600.0 * hr + 60.0 * min + sec) / 86400.0);

  if( mon <= 2) {
      yr -= 1;
      mon += 12;
  }

  if(yr > 1582) { // 1582 October 15
      A = Math.floor(yr/100);
      B = 2 - A + Math.floor(A/4);
  } else {
      A = 0;
      B = 0;
  }

  if(yr < 0) {
      C = Math.floor((365.25 * yr) - 0.75);
  } else {
      C = Math.floor(365.25 * yr);
  }

  D = Math.floor(30.6001 * (mon + 1));
  jd = B + C + D + fday + 1720994.5;
  return jd;
}

// Modified Julian day
export function mjd(jd: number) {
  const mjd =  Math.floor(jd - 2400000.5);
  return mjd;
}

// GMST: Greenwich Sidereal time in degrees
export function g_sidereal(jd: number) {
  const T=(jd - 2451545.0) / 36525;
  const res = 280.46061837 
            + 360.98564736629 * ( jd - 2451545.0 ) 
            + 0.000387933 * T * T 
            - T * T * T / 38710000;
  return AstroUtil.rev360(res);
}

// Sidereal time in degrees for observer
export function local_sidereal(jd: number) {
  var res = g_sidereal(jd);
  res += AstroUtil.LONGITUDE;
  return AstroUtil.rev360(res);
}

// The calendar date from julian date
// Returns year, month, day, hours, minutes, seconds, day of week
export function jdtocd(jd: number) {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor( alpha /4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const d = B - D - Math.floor(30.6001 * E) + F;

  let month = E - 13;
  if (E < 14)
      month = E-1;

  let year = C - 4715;
  if ( month>2)
      year = C-4716;
  
  var day = Math.floor(d);
  var h = (d - day) * 24;
  var hours = Math.floor(h);
  var m = (h - hours) * 60;
  var minutes = Math.floor(m);
  var seconds = Math.round((m - minutes) * 60);
  if (seconds >= 60) {
      minutes = minutes + 1;
      seconds = seconds - 60;
  }
  if (minutes >= 60) {
      hours = hours + 1;
      minutes = 0;
  }
  var dw = Math.floor(jd + 1.5) - 7 * Math.floor((jd + 1.5) / 7);
  return [year, month, day, hours, minutes, seconds, dw];
}

// returns corresponding lst for the given time in hours
export function lmst(time: number) {
  const gLongitude = AstroUtil.LONGITUDE;
  const lmst_offset = 240 * gLongitude;

  const sec = Math.round( time / 1000.0 );
  const utc = sec%86400.0;

  const clock = {
    // Number of seconds since 1970/01/01 0h UTC
    seconds:  sec,
    utc: utc,

    // Local mean sidereal time (approximate).
    tu: (40587.0 + sec / 86400.0 - 51544.5) / 36525.0,
    lmst: 0
  };

  clock.lmst = lmst_offset 
                + clock.utc 
                + 24110.54841 
                + (8640184.812866 + (0.093104 - 6.2e-6 * clock.tu) * clock.tu) * clock.tu;
  clock.lmst %= 86400.0;

  if (clock.lmst < 0) 
    clock.lmst += 86400;

  return clock.lmst / 3600;
}

export function lst2ut(lst: number, longitude: number, date: Date): number {
  const gst = lst2gst(lst, longitude);
  const jdx = jd(date);
  return gst2ut(jdx, gst);
}
