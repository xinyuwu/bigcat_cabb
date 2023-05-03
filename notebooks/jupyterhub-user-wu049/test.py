import simulator
from astropy.coordinates import SkyCoord
import astropy.units as u
import datetime

scheduler = simulator.Scheduler()

scheduler.load_schedule_file(
    'notebooks/jupyterhub-user-wu049/schedule_files/test.sch')

date = datetime.datetime.fromisoformat('2023-03-17T10:00:00')

# scheduler.show_targets()

# scheduler.plot_targets(date_time=date)
# scheduler.plot_targets()

simulator = simulator.Simulator()
date = datetime.datetime.fromisoformat('2023-03-17T17:00:00')
simulator.start(date_time=date)

num = 10
for _ in range(num):
    simulator.track(scheduler=scheduler, scans=[0, 3])

for _ in range(num):
    simulator.track(scheduler=scheduler, scans=[0, 3])

simulator.plot_el()
simulator.show_summary()

array = ['W102', 'W4', 'W45', 'W173', 'W196', 'W392']
simulator.plot_uv(array, 'c3515_p19t', True)

simulator.show_log()
