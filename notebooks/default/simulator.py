import matplotlib.pyplot as pyplot
import numpy as np
import math
import datetime
import json
import Vis
import sys

from astropy.visualization import astropy_mpl_style, quantity_support
import astropy.units as units
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time, TimeDelta

atca_location = EarthLocation(
    lon=149.550152777777778 * units.deg,
    lat=-30.312884722222222 * units.deg,
    height=237*units.m,
)

#
# TODO: 
# - double check slew acceleration figures
# - support co-ordinates other than J2000
# - check and wait for start time, both utc and lst
# - different types of observation: track vs dwell 
#   (wether to include slew time)
#
# - add data rate calculation
#
# - add uv-coverage
#

EL_LIMIT = 12,
STOW = {'az': 90, 'el': 85}

ACCELERATION = 80  # deg/min
MAX_VEL_AZ = 38  # deg/min
MAX_VEL_EL = 19  # deg/min

# d = at*t/2
TIME_TO_MAX_AZ = MAX_VEL_AZ / ACCELERATION
TIME_TO_MAX_EL = MAX_VEL_EL / ACCELERATION

DISTANCE_TO_MAX_AZ = 1/2 * ACCELERATION / 60 * TIME_TO_MAX_AZ ** 2
DISTANCE_TO_MAX_EL = 1/2 * ACCELERATION / 60 * TIME_TO_MAX_EL ** 2

COLOR_LIST = ["#3366cc", "#dc3912", "#ff9900", "#109618",
              "#990099", "#0099c6", "#dd4477", "#66aa00",
              "#b82e2e", "#316395", "#994499", "#22aa99",
              "#aaaa11", "#6633cc", "#e67300", "#8b0707",
              "#651067", "#329262", "#5574a6", "#3b3eac"]

class Simulator:
  def __init__(self):
      self.init()

  def init(self):
      self.time = None
      self.points = []
      self.logs = []
      self.data_amount = 0
      # stowed position
      self.current_target = None
      self.az_el = STOW
      self.target_time = {}

      pyplot.style.use(astropy_mpl_style)
      quantity_support()


  def start(self, date_time=datetime.datetime.utcnow()):
      self.init()
      self.time = Time(date_time)

  def track(self, scheduler, scans=[]):
      targets = scheduler.get_targets(scans)

      # TODO: track vs dwell
      for target in targets:
          source = SkyCoord(ra=target.get('ra', ''),
                            dec=target.get('dec', ''), 
                            unit=(units.hourangle, units.deg))
          time_location = AltAz(obstime=self.time, location=atca_location) 
          next_az_el_start = source.transform_to(time_location)

          time_location = AltAz(
              obstime=self.time + units.second * target['duration'], location=atca_location)
          next_az_el_end = source.transform_to(time_location)

          # both have to be above limit
          if next_az_el_start.alt.deg < EL_LIMIT or next_az_el_end.alt.deg < EL_LIMIT:
              log = {
                  'time': self.time,
                  'target': target,
                  'message': 'skipping',
                  'el': next_az_el_start.alt
              }
              self.logs.append(log)
              print('\033[31m' + log['time'].iso, '-', log['message'], target['name'],
                    'at el', '{0:.2f}'.format(log['el']), 'deg\033[m')
              continue

          # need to slew to new target
          # if it's above el limit
          el_diff = abs(self.az_el['el'] - next_az_el_start.alt.deg)
          az_diff = abs(self.az_el['az'] - next_az_el_start.az.deg)

          if el_diff>= DISTANCE_TO_MAX_EL * 2:
              el_slew_time = TIME_TO_MAX_EL * 2 + \
                              (el_diff - DISTANCE_TO_MAX_EL * 2) / MAX_VEL_EL
          else:
              el_slew_time = math.sqrt(TIME_TO_MAX_EL * 60 / ACCELERATION) * 2
            
          if az_diff >= DISTANCE_TO_MAX_AZ * 2:
              az_slew_time = TIME_TO_MAX_AZ * 2 + \
                  (el_diff - DISTANCE_TO_MAX_AZ * 2) / MAX_VEL_AZ
          else:
              az_slew_time = math.sqrt(TIME_TO_MAX_AZ * 60 / ACCELERATION) * 2

          slew_time = az_slew_time
          if el_slew_time> az_slew_time:
              slew_time = el_slew_time
          
          log = {
              'time': self.time,
              'target': target,
              'message': 'slewing to target for ' + '{0:.2f}'.format(slew_time) + ' seconds',
              'el': next_az_el_start.alt.deg
          }
          self.logs.append(log)
          print(log['time'].iso, '-', log['message'],
                target['name'], 'at el', '{0:.2f}'.format(log['el']), 'deg')
          
          self.time = self.time + units.second * slew_time

          time_frame = np.arange(log['time'], 
              log['time'] + TimeDelta((target['duration'] + 60) * units.second),
              step=TimeDelta(60 * units.second))
          data_frame = AltAz(obstime=time_frame, location=atca_location)
          points = source.transform_to(data_frame)
          self.points.append({
              'target': target,
              'points': points
              })

          target_time = self.target_time.get(target['name'], 0)
          self.target_time[target['name']] = target_time + target['duration']
          self.time = self.time + target['duration'] * units.second
          log = {
              'time': self.time,
              'target': target,
              'message': 'tracking target for ' + str(target['duration']) + ' seconds',
              'el': next_az_el_start.alt.deg
          }

          self.logs.append(log)
          print(log['time'].iso, '-', log['message'],
                target['name'], 'at el', '{0:.2f}'.format(log['el']), 'deg')

          self.current_target = source
          self.az_el = {'az': next_az_el_start.az.deg, 'el': next_az_el_start.alt.deg}

  def show_log(self):
      # print log and data usage
      print()

  def show_summary(self):
      total_time = 0

      for name, value in self.target_time.items():
          total_time += value
          print('\033[32m' + name, 'observed for',
                str(datetime.timedelta(seconds=value)), '\033[m')
      
      print('\033[32mtotal on target time:',
            str(datetime.timedelta(seconds=total_time)), '\033[m')

  def plot_uv(self, array, scan_name, block=False):
      plt = pyplot.figure()
      ax = plt.add_subplot(111)

      telescopes = Vis.getTelescope(array)
      # Calculate baselines
      baselines = Vis.createBaselines(telescopes)
      marker = 'o'
      maxUV = 6

      # get times for the given name
      for p in self.points:
          points = p['points']
          name = p['target']['name']
          if name != scan_name:
              continue
          target = p['target']
          coord = SkyCoord(ra=target.get('ra', ''),
                          dec=target.get('dec', ''), 
                          unit=(units.hourangle, units.deg))
          Dec = coord.dec.radian
          # This actually should make no difference at all
          RA = coord.ra.radian

          lst = points.obstime.sidereal_time('mean', atca_location)
          gst = (lst - (atca_location.lon/15)).value
          for b in baselines:
              b.UVtrack(RA, Dec, gst)
              u = b.u
              v = b.v

              plotColour = 'b'
              if len(b.u)>0:
                  ax.plot(-b.u, b.v, marker, 
                          b.u, -b.v, marker, 
                          color=plotColour, 
                          markersize=0.7, 
                          picker=True, 
                          label='{}-{}'.format(b.ant1.name, b.ant2.name))
                  if b.u.max()>maxUV: maxUV=b.u.max()
                  if b.v.max()>maxUV: maxUV=b.v.max()

      maxUV *= 1.05
    
      # plt.axis('scaled')
      ax.axis([-maxUV, maxUV, -maxUV, maxUV])
      ax.set_xlabel('U (Km)')
      ax.set_ylabel('V (Km)')
      ax.set_title("UV plot for {name}".format(name=scan_name))

      plt.tight_layout()
      pyplot.show(block=block)

  def plot_el(self, block=False):
      plt = pyplot.figure()
      ax = plt.add_subplot()
      ax.set_ylim(0, 90)

      target_colors = {}
      handles = {}
      for p in self.points:
          points = p['points']
          name = p['target']['name']

          color = target_colors.get(name, '')
          if not color:
              color = COLOR_LIST[len(target_colors)]
              target_colors[name] = color

          h = ax.plot(points.obstime.value, points.alt,
                   color=color, label=name)
          
          handle = handles.get(name, '')
          if not handle:
              handles[name] = h[0]

      plt.legend(loc='upper left', handles=handles.values())
      ax.set_ylabel('El in Deg')

      if len(self.points) > 0:
          min_date = min(self.points[0]['points'].obstime)
          max_date = max(self.points[len(self.points) - 1]['points'].obstime)
          plot_utc_lst_ticks(min_date, max_date, 1 * units.hour, ax)

      pyplot.show(block=block)

  def stop(self):
      # print log and data usage
      self.show_log()


def plot_utc_lst_ticks(min_date, max_date, step, ax):
    # very messy here. I just want to get rid of minute and sec
    # components of Time. I don't know how to do it neatly :-(
    min_val = (min_date - 1 * units.hour).ymdhms
    max_val = (max_date + 1 * units.hour).ymdhms

    # get rid of minutes and seconds
    min_val[4] = 0
    min_val[5] = 0
    max_val[4] = 0
    max_val[5] = 0

    min_date = Time(min_val, scale='utc')
    max_date = Time(max_val, scale='utc')

    # ticks = np.arange(min_date, max_date, step=TimeDelta(2 * units.hour))
    ticks = np.arange(min_date, max_date,
                      step=TimeDelta(step))

    date_labels = []
    ticks_time = []
    lst_labels = []
    for time in ticks:
        ticks_time.append(time.datetime)
        lst = time.sidereal_time('mean', atca_location)
        lst_labels.append('{hour}:{minute}'.format(
            hour=str(int(lst.hms.h)).zfill(2),
            minute=str(int(lst.hms.m)).zfill(2),
        ))
        date_labels.append(time.datetime.strftime("%H"))

    ax.set_xlim(min_date.datetime, max_date.datetime)
    ax.set_xticks(ticks_time, date_labels)

    # reduce the number of lst ticks by 1/2
    ticks_time = ticks_time[1::2]
    lst_labels = lst_labels[1::2]

    ax.set_xlabel('UTC (start at {utc_time})'.format(
        utc_time=min_date.strftime('%Y-%m-%dT%H:%M')))

    ax2 = ax.twiny()
    ax2.set_xlabel('LST')
    ax2.set_xlim(min_date.datetime, max_date.datetime)
    ax2.set_xticks(ticks_time)
    ax2.set_xticklabels(lst_labels)


class Scheduler:

  def __init__(self):
      self.schedule = {}

  def load_schedule_file(self, filename):
      with open(filename) as user_file:
          self.schedule = json.load(user_file)

  def get_targets(self, indices=[]):
      if (len(indices) == 0):
        return self.schedule.get('targets', [])
      else:
        targets = self.schedule.get('targets', [])
        return [targets[i] for i in indices]
      
  def show_targets(self, indices=[]):
      targets = self.schedule.get('targets', [])
      if len(indices) < 1:
          indices = range(1, len(targets) + 1)
      for index in indices:
          if index <= len(targets) + 1:
            print(index, ": ", json.dumps(targets[index - 1]))
      
  def plot_target(self, source, utc_date, color, ax):
      # find source rise time
      time = Time(utc_date, scale='utc')

      time_interval = np.linspace(-2, 22, 100)*units.hour
      time_frame = time + time_interval

      data_frame = AltAz(obstime=time_frame, location=atca_location)

      source_altazs = source.transform_to(data_frame)
      
      ax.plot(time_frame.value, source_altazs.alt,
               color=color, label=source.name)

      return time_frame.min(), time_frame.max()

  # index of targets as well as sun/moon
  def plot_targets(self, targets=[], date_time=datetime.datetime.utcnow()):
      plt = pyplot.figure()
      ax = plt.add_subplot()

      ax.set_ylim(0, 90)

      min_max_list = []
      sources = []
      scans = self.schedule.get('targets')

      if len(targets) == 0:
          targets = range(len(scans))

      for t in targets:
          target = scans[t]
          s = SkyCoord(ra=target.get('ra', ''), 
                       dec=target.get('dec', ''), 
                       unit=(units.hourangle, units.deg))
          
          s.name = target.get('name', '')
          sources.append(s)

      for index, source in enumerate(sources):
          min_val, max_val = self.plot_target(source, date_time, COLOR_LIST[index], ax)
          min_max_list.append(min_val)
          min_max_list.append(max_val)

      plt.legend(loc='upper left')
      ax.set_ylabel('El in Deg')

      plot_utc_lst_ticks(min(min_max_list), max(min_max_list), 2 * units.hour, ax)
