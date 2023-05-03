import matplotlib.pyplot as plt
import numpy as np
import math
import datetime
from astropy.time import Time

from astropy.visualization import astropy_mpl_style, quantity_support
import astropy.units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time


atca_location = EarthLocation(
    lon=149.550152777777778 * u.deg,
    lat=-30.312884722222222 * u.deg,
    height=237*u.m
)

def down(x): return (x - 24) if x > 24 else x


def plot_source(source, utc_date):
    # find source rise time
    time = Time(utc_date, scale='utc')
    while True:
        time_point = AltAz(obstime=time, location=atca_location)
        data_point = source.transform_to(time_point)

        if data_point.alt.deg >= -1.0:
            time = time - 0.25 * u.hour
        elif data_point.alt.deg <= -5.0:
            time = time + 0.25 * u.hour
        else:
            break

    time_interval = np.linspace(-2, 22, 100)*u.hour
    time_frame = time + time_interval

    data_frame = AltAz(obstime=time_frame, location=atca_location)

    source_altazs = source.transform_to(data_frame)

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

    plt.plot(lst_np_array, source_altazs.alt, color='r', label=source.name)

    return lst_np_array.min(), lst_np_array.max()


def plot_sources(sources, date_time=datetime.datetime.utcnow()):
    plt.style.use(astropy_mpl_style)
    quantity_support()

    plt.ylim(0*u.deg, 90*u.deg)

    min_max_list = []

    for source in sources:
        min_val, max_val = plot_source(source, date_time)
        min_max_list.append(min_val)
        min_max_list.append(max_val)

    min_val = min(min_max_list)
    max_val = max(min_max_list)

    ticks = np.arange(math.floor(min_val),
                      math.ceil(max_val), step=2)

    ticker_labels = np.array(list(map(down, ticks)))
    plt.xticks(ticks, ticker_labels)


# ra = '19:11:9.6529'
# dec = '-20:06:55.109'

# s = SkyCoord(ra=ra, dec=dec, unit=(u.hourangle, u.deg))
# s.name = 'J1911-2006 | 1908-201'

# sources = [s]

# sources.append(SkyCoord.from_name('M33'))

# plot_sources(sources)

# plt.show(block=True)