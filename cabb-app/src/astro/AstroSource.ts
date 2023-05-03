/**
 * this component wraps astrojs from astrojs javascript library.
 * as well as adding a few useful functions
 **/
import * as AstroUtil from "./AstroUtil";
import * as DatetimeUtil from "./DatetimeUtil";

/*
    Determine the rise/set times (LST/UT..) for a body, at the given JD, latitude.
  */
export function calRiseSet(ra: number, dec: number, latitude: number, 
  thresh_hold: number): any {

  const cos_h = -(AstroUtil.sind(-thresh_hold)
                + AstroUtil.sind(latitude) * AstroUtil.sind(dec) ) / ( AstroUtil.cosd(latitude) * AstroUtil.cosd(dec) );

  /*
    cos_h > 1.0  => object permanently below the horizon and never rises
    cos_h < -1.0 => circumpolar: object permanently above the horizon and never sets
    */

  const obj = {
    never_up: false,
    circumpolar: false,
    lstRise: 0,
    lstSet: 0
  };

  if (cos_h > 1.0) {
    obj.never_up = true;
  } else if (cos_h < -1.0) {
    obj.circumpolar = true;
  } else {
    let	ha = AstroUtil.acosd(cos_h) / 15.0; // hours
    ra /= 15.0; // hours

    obj.lstRise = AstroUtil.rev24(ra  - ha);
    obj.lstSet = AstroUtil.rev24(ra + ha);
  }
  return obj;
};

export function calculateElevation(target: {ra:string, dec: string}, 
  date: Date): any {

  const ra = AstroUtil.hms(target.ra)*15;
  const dec = AstroUtil.dms(target.dec);

  // cal the rise and set times lst
  const obj = calRiseSet(ra, dec, AstroUtil.LATITUDE, 0);

  // call the rise and set time in UTC for now
  let utcStart = DatetimeUtil.lst2ut(obj.lstRise, AstroUtil.LONGITUDE, date);
  const utcSet = DatetimeUtil.lst2ut(obj.lstSet, AstroUtil.LONGITUDE, date);

  // calculate at 10min intervals the el for the target
  let points:any[] = [];
  let data = {
    never_up: obj.never_up,
    circumpolar: obj.circumpolar,
    ra: ra,
    dec: dec,
    lstRise: obj.lstRise,
    lstSet: obj.lstSet,
    utcRise: utcStart,
    utcSet: utcSet,
    points: points
  };

  let lstSet = obj.lstSet;

  if (obj.circumpolar)
    lstSet = obj.lstRise + 36;

  if (lstSet<=obj.lstRise)
    lstSet+=24;

  for (let lst = Math.floor(obj.lstRise); lst<=Math.ceil(lstSet); lst+=(1/20)) {
    utcStart += (1/20);
    let azEl = {az:0, el:0};
    if (!obj.never_up)
      azEl = AstroUtil.raDec2AzEl(ra, dec, lst);

    const point = {
      lst: lst,
      utc: utcStart,
      az: azEl.az,
      el: azEl.el
    };
    points.push(point);
  }

  return data;
}
