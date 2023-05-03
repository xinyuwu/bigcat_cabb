from math import pi, cos, sin, acos, asin, atan2, floor, sqrt
from numpy import deg2rad, rad2deg
import numpy as np

import sys
if (sys.version_info < (3, 4)):
   raise Exception('Need  Python >= 3.4')

def posrad(rad):
    while rad<0:
        rad += 2*pi
    while rad>2*pi:
        rad -= 2*pi
    return(rad)

def rad2hour(rad):
    if rad is None:
        return None
    else:
        return (posrad(rad)/2/pi)*24

def Jy2Str(Jy):
    if Jy>100:
        jyStr = "{:.0f} Jy".format(Jy)
    elif Jy>1:
        jyStr = "{:.1f} Jy".format(Jy)
    elif Jy>0.050:
        jyStr = "{:.1f} mJy".format(Jy*1000)
    elif Jy>0.001:
        jyStr = "{:.2f} mJy".format(Jy*1000)
    elif Jy>0.0001:
        jyStr = "{:.3f} mJy".format(Jy*1000)
    else:
        jyStr = "{:.1f} uJy".format(Jy*1e6)
    return(jyStr)

from enum import Enum
class Array(Enum):
    LBA = 1
    EVN = 2
    VLBA = 3
    EAVN = 4
    SKA = 5
    SEAVN = 6
    
# Cartesian Coordinates

class Cartesian:

    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    # Return length of vector
    def length(self):
        return sqrt(self.x**2 + self.y**2 + self.z**2)

    # Return Latitude and Longitude of Vector
    def longlat(self):
        lat = atan2(self.z, sqrt(self.x**2 + self.y**2))
        long = atan2(self.y,self.x)
        return(long, lat)

    # Offset the coordinates by ADDING the offsets
    def offset(self, dx, dy, dz):
        self.x += dx
        self.y += dy
        self.z += dz

class Telescope:
### Simple Class for a Telescope

    def __init__(self, name, code, array, el_limit, SEFD, location=[]):
        R_EARTH = 6378.137e3

        self.name = name
        self.code = code
        self.array = array
        self.el_limit = deg2rad(el_limit)
        self.sefd = SEFD # Jy
        self.maxBandwidth = 128 * 1e6 # MHz
        self.rise = None
        self.set = None

        if len(location)==2:
            self.longitude = deg2rad(location[0])
            self.latitude = deg2rad(location[1])

            phi = pi/2 - self.latitude
            x = R_EARTH * sin(phi) * cos(self.longitude)
            y = R_EARTH * sin(phi) * sin(self.longitude)
            z = R_EARTH * cos(phi)
            self.cartesian = Cartesian(x,y,z)
        elif len(location)==3:
            self.setCartesianXYZ(location[0], location[1], location[2])
        elif len(location)==0:
            raise('Must pass location')
        else:
            raise('Unknown location with {} elements'.format(len(location)))
        
    def __str__(self):
        return "{0}: {1:.3f} {2:.3f} {3:.1f}".format(
            self.name, rad2deg(self.longitude), rad2deg(self.latitude), rad2deg(self.el_limit))

    # Return the 3D cartesian position of the telescope, in m
    def Cartesian(self):
        return self.cartesian

    # Return the latitude
    def Latitude(self):
        return self.latitude

    # Return the longitude
    def Longitude(self):
        return self.longitude

    #  Set the 3D cartesian position of the telescope, in m
    def setCartesian(self, loc):
        self.cartesian = loc
        (long,lat) = self.cartesian.longlat()
        self.longitude = long
        self.latitude = lat

    #  Set the 3D cartesian position of the telescope, in m
    def setCartesianXYZ(self, x, y, z):
        self.setCartesian(Cartesian(x, y, z))

    # Calculate the rise and set time for the source, and set the class "rise" and "set" values in the object
    def calcrise(self, ra, dec): # Return GST rise and set for a source
        z_limit = pi/2-self.el_limit; # Zenith limit

        # Does the source ever rises 
        z = acos(sin(self.latitude)*sin(dec) + cos(self.latitude)*cos(dec)) # Highest point
        if (z > z_limit): 
            self.rise = None
            self.set = None
            return
        
        # or is circumpolar
        z = acos(sin(self.latitude)*sin(dec) - cos(self.latitude)*cos(dec)) # Lowest point
        if (z<z_limit): 
            self.rise = 0
            self.set = 2*pi
            return

        ha = acos((cos(z_limit) - sin(self.latitude)*sin(dec))/(cos(self.latitude)*cos(dec)))
        self.rise = posrad(ra-ha-self.longitude)
        self.set= posrad(ra+ha-self.longitude)
        
    # Is the source  up for the given GST (rise time must have been previously set with calcrise)
    def isUp(self, gst):
        if self.rise==None: return None

        if self.rise<self.set: # Non-wrapped case
            if gst>self.rise and gst<self.set:
                return True
            else:
                return False
        elif gst<self.set or gst>self.rise: # Wrapped case
            return True
        else: 
            return False
        
    # Return a list of times when the source is above the elevation limit, with a fixed step size
    def upTimes(self, RA, Dec, step):
        # RA     Radians
        # Dec    Radians
        # step   Step size for GST time calculation *in radians*
        
        allgst = [x*step for x in range(floor(2*pi/step))]
        self.calcrise(RA, Dec)
        return [gst for gst in allgst if (self.isUp(gst))]

    # Calculate times when source is visible to telescope. Set object .gst value for later functions to use
    def calcUp(self, RA, Dec, step):
        self.calcrise(RA, Dec)
        
        allgst = [x*step for x in range(int(floor(2*pi/step)))] # 24 hours
        self.gst = np.array([gst for gst in allgst if (self.isUp(gst))])
    
    # Returns the AzEl of a source at (RA, Dec) , given the passed GST
    def AzEl(self, RA, Dec, gst): 
        lst = posrad(gst + self.longitude)
        ha = posrad(lst-RA)
        sphi = sin(self.latitude)
        cphi = cos(self.latitude)
        sha = sin(ha)
        cha = cos(ha)
        sdec = sin(Dec)
        cdec = cos(Dec)
        az = atan2(-sha,-cha*sphi+sdec*cphi/cdec)
        el= asin(cha*cdec*cphi + sdec*sphi)
        
        return(az, el)
    
    # Return two Lists (Az and El) values, for the given set of GST values (passed as a list)
    def calcAzEl(self, RA, Dec, gsts=None):
        Az = []
        El = []

        if gsts is None: gsts = self.gst
        
        for gst in gsts:
            (Az1, El1) = self.AzEl(RA, Dec, gst)
            Az.append(Az1)
            El.append(El1)
        return(Az, El)

    # Is the telescope in this Array
    def isArray(self, array):
        for a in self.array:
            if a == array:
                return True
        return False

class Baseline:
# Simple Class for Baseline
    C = 299792458
    
    def __init__(self, ant1, ant2):
        self.ant1 = ant1
        self.ant2 = ant2

        self.name = ant1.name+"->"+ant2.name
        self.xyz1 = ant1.Cartesian()
        self.xyz2 = ant2.Cartesian()
        self.baseline = Cartesian(self.xyz1.x-self.xyz2.x,self.xyz1.y-self.xyz2.y,self.xyz1.z-self.xyz2.z)
        self.length = self.baseline.length()
        self.gsts = None # List of times souce is up on this baseline
        self.u = None
        self.v = None
        
    # Calculate times when source is visible to both telescopes. Set object .gst value for later functions to use
    def calcUp(self, RA, Dec, step):
        self.ant1.calcrise(RA, Dec)
        self.ant2.calcrise(RA, Dec)
        
        allgst = [x*step for x in range(int(floor(2*pi/step)))] # 24 hours
        self.gst = np.array([gst for gst in allgst if (self.ant1.isUp(gst) and self.ant2.isUp(gst))])

    # Return the baseline UV values (in wavelengths) for a specific GST time
    def uv(self, RA, Dec, gst, wavelength=None):
        ha = gst + self.ant1.longitude - RA

        ha = RA - gst  # This calculation of Baseline hour angle needs to be checked
        sHa = sin(ha)
        cHa = cos(ha)

        sDec = sin(Dec)
        cDec = cos(Dec)

        if wavelength is None: wavelength = 1000; # Return km

        u = (-self.baseline.x*sHa + self.baseline.y*cHa)/wavelength
        v = (-self.baseline.x*cHa*sDec - self.baseline.y*sHa*sDec + self.baseline.z*cDec)/wavelength
    
        return(u,v)

    # Return baseline delay (in seconds?) for a specific gst
    def delay(self, RA, Dec, gst):
        ha = -(gst + self.ant1.longitude - RA)

        #ha = RA - gst  # This calculation of Baseline hour angle needs to be checked
        sHa = sin(ha)
        cHa = cos(ha)
        sDec = sin(Dec)
        cDec = cos(Dec)
        
        d = self.baseline.x*cHa*cDec + self.baseline.y*sHa*cDec + self.baseline.z*sDec
        #d = (self.baseline.x*cHa - self.baseline.y*sHa)*cDec + self.baseline.z*sDec

        return(d/self.C*1e6)

    # Return the baseline rate (Hz) for a specific GST time. If no wavelength passed, return delay rate
    def rate(self, RA, Dec, gst, wavelength=None):
        ha = gst + self.ant1.longitude - RA

        ha = RA - gst  # This calculation of Baseline hour angle needs to be checked
        sHa = sin(ha)
        cHa = cos(ha)

        sDec = sin(Dec)
        cDec = cos(Dec)

        if wavelength is None: wavelength = self.C # Return seconds
        
        rate = (-self.baseline.x*sHa*cDec + self.baseline.y*cHa*cDec) / (12.0*3600.0) * pi / wavelength
        
        return(rate)

    
    # Calculate the UV values and set the object .u and .v values for the last set of GSTS
    def UVtrack(self, RA, Dec, gsts, wavelength=None):
        u = []
        v = []
        for gst in gsts:
            (thisu, thisv) = self.uv(RA, Dec, gst, wavelength)
            u.append(thisu)
            v.append(thisv)
            
        self.u = np.array(u)
        self.v = np.array(v)

    # Calculate baseline sensitivity in Jy for a given integration and bandwidth
    def sensitivity(self, integration, bandwidth, dualpol=True):
        if (dualpol):
            polfact = 2
        else:
            polfact = 1

        #bandwidth = min(bandwidth, self.ant1.maxBandwidth, self.ant2.maxBandwidth)
        if (self.ant1.sefd<0) or (self.ant2.sefd<0): return(0)
        
        return sqrt(self.ant1.sefd * self.ant2.sefd) / (0.88*sqrt(polfact*bandwidth*integration))

    # Is either or both telescopes in the specified array
    def isArray(self, array, both=True):
        if both:
            return self.ant1.isArray(array) and self.ant2.isArray(array)
        else:
            return self.ant1.isArray(array) or self.ant2.isArray(array)

    # Is passed telescope in this baseline (check both code and name)
    def isTel(self, tel):
        if self.ant1.name==tel or self.ant2.name==tel:
            return True
        elif self.ant1.code==tel or self.ant2.code==tel:
            return True
        else:
            return False
   

telescopes = []

telescopes.append(Telescope("N2",   "N2",   "ATCA", 12, 100,
                          location=[-4751637.61372, 2791734.5617, -3200464.67139]))
telescopes.append(Telescope("N5",   "N5",   "ATCA", 12, 100,
                          location=[-4751657.54872, 2791746.3047, -3200425.00839]))
telescopes.append(Telescope("N7",   "N7",   "ATCA", 12, 100,
                          location=[-4751670.83972, 2791754.1337, -3200398.56639]))
telescopes.append(Telescope("N11",  "N11",  "ATCA", 12, 100,
                          location=[-4751697.42072, 2791769.7907, -3200345.68239]))
telescopes.append(Telescope("N14",  "N14",  "ATCA", 12, 100,
                          location=[-4751717.35672, 2791781.5337, -3200306.01939]))
telescopes.append(Telescope("W0",   "W0",   "ATCA", 12, 100,
                          location=[-4752447.78172, 2790328.7857, -3200491.11339]))
telescopes.append(Telescope("W2",   "W2",   "ATCA", 12, 100,
                          location=[-4752432.24472, 2790355.1617, -3200491.11339]))
telescopes.append(Telescope("W4",   "W4",   "ATCA", 12, 100,
                          location=[-4752416.70772, 2790381.5387, -3200491.11339]))
telescopes.append(Telescope("W6",   "W6",   "ATCA", 12, 100,
                          location=[-4752401.17072, 2790407.9147, -3200491.11339]))
telescopes.append(Telescope("W8",   "W8",   "ATCA", 12, 100,
                          location=[-4752385.63372, 2790434.2907, -3200491.11339]))
telescopes.append(Telescope("W10",  "W10",  "ATCA", 12, 100,
                          location=[-4752370.09672, 2790460.6677, -3200491.11339]))
telescopes.append(Telescope("W12",  "W12",  "ATCA", 12, 100,
                          location=[-4752354.55972, 2790487.0437, -3200491.11339]))
telescopes.append(Telescope("W14",  "W14",  "ATCA", 12, 100,
                          location=[-4752339.02272, 2790513.4207, -3200491.11339]))
telescopes.append(Telescope("W16",  "W16",  "ATCA", 12, 100,
                          location=[-4752323.48572, 2790539.7967, -3200491.11339]))
telescopes.append(Telescope("W32",  "W32",  "ATCA", 12, 100,
                          location=[-4752199.19072, 2790750.8077, -3200491.11339]))
telescopes.append(Telescope("W45",  "W45",  "ATCA", 12, 100,
                          location=[-4752098.19972, 2790922.2537, -3200491.11339]))
telescopes.append(Telescope("W64",  "W64",  "ATCA", 12, 100,
                          location=[-4751950.59872, 2791172.8287, -3200491.11339]))
telescopes.append(Telescope("W84",  "W84",  "ATCA", 12, 100,
                          location=[-4751795.22972, 2791436.5927, -3200491.11339]))
telescopes.append(Telescope("W98",  "W98",  "ATCA", 12, 100,
                          location=[-4751686.47072, 2791621.2277, -3200491.11339]))
telescopes.append(Telescope("W100", "W100", "ATCA", 12, 100,
                          location=[-4751670.93372, 2791647.6037, -3200491.11339]))
telescopes.append(Telescope("W102", "W102", "ATCA", 12, 100,
                          location=[-4751655.39672, 2791673.9797, -3200491.11339]))
telescopes.append(Telescope("W104", "W104", "ATCA", 12, 100,
                          location=[-4751639.85972, 2791700.3567, -3200491.11339]))
telescopes.append(Telescope("W106", "W106", "ATCA", 12, 100,
                          location=[-4751624.32272, 2791726.7327, -3200491.11339]))
telescopes.append(Telescope("W109", "W109", "ATCA", 12, 100,
                          location=[-4751601.01772, 2791766.2967, -3200491.11339]))
telescopes.append(Telescope("W110", "W110", "ATCA", 12, 100,
                          location=[-4751593.24872, 2791779.4857, -3200491.11339]))
telescopes.append(Telescope("W111", "W111", "ATCA", 12, 100,
                          location=[-4751585.48072, 2791792.6737, -3200491.11339]))
telescopes.append(Telescope("W112", "W112", "ATCA", 12, 100,
                          location=[-4751577.71172, 2791805.8617, -3200491.11339]))
telescopes.append(Telescope("W113", "W113", "ATCA", 12, 100,
                          location=[-4751569.94372, 2791819.0497, -3200491.11339]))
telescopes.append(Telescope("W124", "W124", "ATCA", 12, 100,
                          location=[-4751484.49072, 2791964.1197, -3200491.11339]))
telescopes.append(Telescope("W125", "W125", "ATCA", 12, 100,
                          location=[-4751476.72172, 2791977.3077, -3200491.11339]))
telescopes.append(Telescope("W128", "W128", "ATCA", 12, 100,
                          location=[-4751453.41672, 2792016.8727, -3200491.11339]))
telescopes.append(Telescope("W129", "W129", "ATCA", 12, 100,
                          location=[-4751445.64772, 2792030.0607, -3200491.11339]))
telescopes.append(Telescope("W140", "W140", "ATCA", 12, 100,
                          location=[-4751360.19472, 2792175.1307, -3200491.11339]))
telescopes.append(Telescope("W147", "W147", "ATCA", 12, 100,
                          location=[-4751305.81472, 2792267.4477, -3200491.11339]))
telescopes.append(Telescope("W148", "W148", "ATCA", 12, 100,
                          location=[-4751298.04672, 2792280.6357, -3200491.11339]))
telescopes.append(Telescope("W163", "W163", "ATCA", 12, 100,
                          location=[-4751181.51972, 2792478.4587, -3200491.11339]))
telescopes.append(Telescope("W168", "W168", "ATCA", 12, 100,
                          location=[-4751142.67672, 2792544.3997, -3200491.11339]))
telescopes.append(Telescope("W172", "W172", "ATCA", 12, 100,
                          location=[-4751111.60372, 2792597.1527, -3200491.11339]))
telescopes.append(Telescope("W173", "W173", "ATCA", 12, 100,
                          location=[-4751103.83472, 2792610.3407, -3200491.11339]))
telescopes.append(Telescope("W182", "W182", "ATCA", 12, 100,
                          location=[-4751033.91872, 2792729.0337, -3200491.11339]))
telescopes.append(Telescope("W189", "W189", "ATCA", 12, 100,
                          location=[-4750979.53872, 2792821.3517, -3200491.11339]))
telescopes.append(Telescope("W190", "W190", "ATCA", 12, 100,
                          location=[-4750971.77072, 2792834.5397, -3200491.11339]))
telescopes.append(Telescope("W195", "W195", "ATCA", 12, 100,
                          location=[-4750932.92772, 2792900.4807, -3200491.11339]))
telescopes.append(Telescope("W196", "W196", "ATCA", 12, 100,
                          location=[-4750925.15972, 2792913.6687, -3200491.11339]))
telescopes.append(Telescope("W392", "W392", "ATCA", 12, 100,
                          location=[-4749402.52072, 2795498.5367, -3200491.06039]))


def getTelescope(tel):
    return list(filter(lambda t: t.name in tel, telescopes))


# Return a list of baselines from a passed list of telescopes
def createBaselines(antennas):
    baselines = []
    for i in range(len(antennas)):
        for j in range(i+1, len(antennas)):
            baselines.append(Baseline(antennas[i], antennas[j]))
    return baselines


def imageRMS(baselines, bandwidth=None, integration=None, dualpol=True, weight=2):
  weight *= -1
  C = 0
  sum = 0

  for b in baselines:
    bRMS = b.sensitivity(bandwidth,integration,dualpol)
    w = bRMS ** weight
    C += w
    sum += w*w*bRMS*bRMS;
  
  return(sqrt(sum)/C)

