// JavaScript by Peter Hayes
// http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001-2008
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.

// Utility functions
export const RTD  = 180 / Math.PI;
export const DTR  = Math.PI / 180;

export const ATCA_POSITION = {
  height: 237, // meters
  longitude: 149.550152777777778, // 149° 33′ 00.500″ east
  latitude: -30.312884722222222, // -30° 18′ 46.385″ south
  limit: 12, // 15 deg
};

export const LONGITUDE = ATCA_POSITION.longitude;
export const LATITUDE = ATCA_POSITION.latitude;
export const HORIZON_LIMIT = ATCA_POSITION.limit;

export function rev360(angle: number) : number {
    return angle - Math.floor(angle / 360.0) * 360.0;
};

export function rev24(hour: number) : number {
    return hour - Math.floor(hour / 24.0) * 24.0;
};

export function sind(angle: number) : number {
    return Math.sin(angle * DTR);
};

export function cosd(angle: number) : number {
    return Math.cos(angle * DTR);
};

export function tand(angle: number) : number {
    return Math.tan(angle * DTR);
};

export function asind(angle: number): number{
    return RTD * Math.asin(angle);
};

export function acosd(angle: number) : number {
    return RTD * Math.acos(angle);
};

export function atand(angle: number) : number {
    return RTD*Math.atan(angle);
};

export function atan2d(y:number, x: number) : number {
    return RTD * Math.atan(y / x) - 180.0 * ((x < 0) ? 1 : 0);
};

//converts hours to a : separated string
export function hmsstring(time : number) :string {
  const time_list = hmsarray(time);
  const hours = time_list[0];
  const minutes = time_list[1];
  const seconds = time_list[2];

  let hmsstr = '';

  if (hours < 0)
    hmsstr += '-';

  hmsstr += ((Math.abs(hours) < 10) ? "0" : "" ) + Math.abs(hours);
  hmsstr += ((minutes < 10) ? ":0" : ":" ) + minutes;
  hmsstr += ((seconds < 10) ? ":0" : ":" ) + seconds;
  return hmsstr;
};


//converts hours to a array containing [hours, minutes, seconds]
export function hmsarray(t: number){
  let hours = Math.abs(t);
  let minutes = 60.0 * (hours - Math.floor(hours));
  hours = Math.floor(hours);
  let seconds = Math.floor(60.0 * (minutes - Math.floor(minutes)));
  minutes = Math.floor(minutes);
  if (hours >= 24) { hours -= 24; }

  if (t < 0)
    hours = -hours;

  return [hours, minutes, seconds];
};


  // dmsstring converts degreees to a : seperated string
export function dmsstring(t: number): string {
  const dec = Math.abs(t);
  const deg = Math.floor(dec);
  const minutes = Math.floor((dec - deg) * 60);
  const seconds = Number(((dec-deg-(minutes / 60)) * 3600).toFixed(2));
  let dmsstr:string =(t < 0) ? "-" : "";

  dmsstr += deg;
  dmsstr += ((minutes < 10) ? ":0" : ":" ) + minutes;
  dmsstr += ((seconds < 10) ? ":0" : ":" ) + seconds;
  return dmsstr;
};

// Convert hours, minutes, seconds string to decimal hour
export function hms(x: string) : number {
  const hms  = x.split(":");
  const hr   = parseInt(hms[0]);
  const min  = parseInt(hms[1]);
  const sec  = parseFloat(hms[2]);
  const decimal = hr + min / 60.0 + sec / 3600.0;
  return decimal;
};

// Convert degrees, minutes, seconds string to decimal degrees
export function dms(x: string) : number  {
  const dms = x.split(":");
  const deg = parseInt(dms[0]);
  let min = parseInt(dms[1]);
  let sec = parseFloat(dms[2]);
  if(x.indexOf("-") === 0 || deg < 0.0) {
            if(min > 0) min = -min;
            if(sec > 0) sec = -sec;
  }
  const decimal = deg + min / 60.0 + sec / 3600.0;
  return decimal;
};

// Convert fractional day to hours, minutes, seconds
export function fday_to_hms(day: number) : number[]  {
  const tsec = day * 86400;
  const tmin = tsec / 60;
  const thour = tmin / 60;
  const hour = thour % 24;
  const minutes = tmin % 60;
  const seconds = tsec %60;
  return [hour,minutes,seconds];
};

// radsep returns the angular separation in deg of 2 objects given RA and dec.
export function radsep(src1: any, src2: any): number {
  const src1_ra = (isNaN(src1.ra)) ? hms(src1.ra) * 15 : src1.ra;
  const src1_dec = (isNaN(src1.dec)) ? dms(src1.dec) : src1.dec;

  const src2_ra = (isNaN(src2.ra)) ? hms(src2.ra) * 15 : src2.ra;
  const src2_dec = (isNaN(src2.dec)) ? dms(src2.dec) : src2.dec;

  const sdec1 = sind(src1_dec);
  const cdec1 = cosd(src1_dec);
  const sdec2 = sind(src2_dec);
  const cdec2 = cosd(src2_dec);

  const angular_separation = 
          acosd(sdec1 * sdec2 + cdec1 * cdec2 * cosd(src1_ra - src2_ra));
  
  return angular_separation;
};

// equ_to_horizon converts ra and dec to elevation and azimuth
export function raDec2AzEl(ra:number, dec: number, lst:number): 
  {az:number, el:number} {

  const H     = 360 * lst/24 - ra;
  const sinH  = sind(H);
  const cosH  = cosd(H);
  const sinl  = sind(LATITUDE);
  const cosl  = cosd(LATITUDE);
  const sindx = sind(dec);
  const cosdx = cosd(dec);
  const tandx = tand(dec);
  const az    = rev360( atan2d(sinH, cosH*sinl - tandx *cosl) + 180 );
  const el    = asind(sinl*sindx + cosl * cosdx * cosH);
  return {az:az, el:el};
}

// calculates flux for a flux model (min_freq max_freq coeff_a coeff_b coeff_c coeff_d coeff_e coeff_f)
// See https://github.com/ska-sa/katpoint/blob/master/katpoint/flux.py line 40
export function calcFlux(freq:number, flux_model:string) : number {
  if (!flux_model)
    return 0;

  let fm:number[] = (flux_model.replace("(","").replace(")","").trim().split(" ")).map(
                      function(item) {
                      return parseFloat(item);
                    });
  for (let i = fm.length; i < 8; i++) {
    fm.push(0);
  }
  
  const power = fm[2] 
                + fm[3] * Math.log10(freq) 
                + fm[4] * Math.log10(freq) ** 2 
                + fm[5] * Math.log10(freq) ** 3 
                + fm[6] * Math.exp(fm[7] * Math.log10(freq));

  return Math.pow(10, power);
}
