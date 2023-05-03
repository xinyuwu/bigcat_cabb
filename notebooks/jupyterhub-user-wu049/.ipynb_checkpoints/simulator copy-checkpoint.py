import matplotlib.pyplot as plt
import numpy as np
import math
import datetime
from astropy.time import Time

from astropy.visualization import astropy_mpl_style, quantity_support
import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time

name = 'J1911-2006 | 1908-201'
ra = '19:11:9.6529'
dec = '-20:06:55.109'

atca_location = EarthLocation(
                  lon=149.550152777777778 * u.deg,
                  lat=-30.312884722222222 * u.deg,
                  height=237*u.m
                )

source = SkyCoord(ra=ra, dec=dec, unit=(u.hourangle, u.deg))
source = SkyCoord.from_name('M33')
time = Time(datetime.datetime.utcnow(), scale='utc')
time = time - 24 * 30 * 6 * u.hour
# find source rise time
i = 0
while True:
    time_point = AltAz(obstime=time, location=atca_location)
    data_point = source.transform_to(time_point)

    if data_point.alt.deg >= -1.0:
        i -= 0.25
        time = time - 0.25 * u.hour
    elif data_point.alt.deg <= -5.0:
        i += 0.25
        time = time + 0.25 * u.hour
    else:
        break

time_interval = np.linspace(-2, 22, 100)*u.hour
time_frame = time + time_interval

data_frame = AltAz(obstime=time_frame, location=atca_location)

source_altazs = source.transform_to(data_frame)

plt.style.use(astropy_mpl_style)
quantity_support()

plt.ylim(0*u.deg, 90*u.deg)

def down(x): return (x - 24) if x > 24 else x


lst_times = time_frame.sidereal_time('mean', atca_location)

lst_array = []
last_lst = -1
for lst in np.nditer(lst_times.hourangle):
    if last_lst > -1:
        if lst < last_lst:
            last_lst = lst + 24
        else:
            last_lst = lst
    else:
        last_lst = lst

    lst_array.append(last_lst)

lst_np_array = np.array(lst_array)
ticks = np.arange(math.floor(lst_np_array.min()),
                  math.ceil(lst_np_array.max()), step=2)

ticker_labels = np.array(list(map(down, ticks)))
plt.xticks(ticks, ticker_labels)

plt.plot(lst_np_array, source_altazs.alt, color='r', label=name)

plt.plot(time_interval,
         source_altazs.alt, color='r', label=name)

