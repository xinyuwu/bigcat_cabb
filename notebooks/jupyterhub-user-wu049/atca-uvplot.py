#!/usr/bin/env python3

import argparse
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from Vis import *

import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from copy import deepcopy

from Vis import *

defaultDec = -20

mpl.rcParams['figure.figsize'] = (14, 6)

# array = ['W102', 'W392']  # Test
# array = ['W196', 'W64', 'W113', 'W392']  # Asteroid RADAR
# array = ['W392', 'W64']  # Asteroid RADAR
array = ['W102', 'W4', 'W45', 'W173', 'W196', 'W392']  # EW 6A
telescopes = getTelescope(array)
# Calculate baselines
baselines = createBaselines(telescopes)

Dec = deg2rad(10)
RA = deg2rad(19.5)  # This actually should make no difference at all

fig = plt.figure()
ax = fig.add_subplot(111)

maxUV = 1

def onpick(event):
    if isinstance(event.artist, Line2D):
            thisline = event.artist
 
    print(thisline)
    return True

marker='o'

step = 0.001
for b in baselines:
    b.calcUp(RA, Dec, step)
    b.UVtrack(RA, Dec, b.gst) 
    u = b.u
    v = b.v

    plotColour = 'b'
    #marker = 'bo'
    setMarker = False
    
    # if args.hilite is not None:
    #     for t in args.hilite:
    #         ant, colour = t.split(':')
    #         if b.isTel(ant):
    #             #marker = '{}o'.format(colour)
    #             plotColour = colour
    #             setMarker = True
    #             break

    # if not setMarker and args.array is not None:
    #     for a in args.array:
    #         array, colour = a.split(':')
    #         thisArray = Array[array.upper()]
    #         if b.isArray(thisArray, not args.any):
    #             #marker = '{}o'.format(colour)
    #             plotColour = colour
    #             setMarker = True
    #             break


    if len(b.u)>0:
        ax.plot(-b.u, b.v, marker, b.u, -b.v, marker, color=plotColour, markersize=0.7, picker=True, label='{}-{}'.format(b.ant1.name, b.ant2.name))
        if b.u.max()>maxUV: maxUV=b.u.max()
        if b.v.max()>maxUV: maxUV=b.v.max()

maxUV *= 1.05

ax.axis('scaled')
ax.axis([-maxUV,maxUV,-maxUV,maxUV])
ax.set_xlabel('U (Km)')
ax.set_ylabel('V (Km)')
ax.set_title('UV plot')

fig.set_tight_layout(True)

# fig.canvas.mpl_connect('pick_event', onpick)
plt.show()

print('finished!')
