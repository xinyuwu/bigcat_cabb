#!/usr/bin/env python3

import argparse
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from Vis import *

allTel = telescopeList()

antennas = []
for t in allTel:
    antennas.append(getTelescope(t))

defaultDec = -20

parser = argparse.ArgumentParser()
parser.add_argument('-d', '-dec', '--dec', help="Declination to use", type=int, default=defaultDec)
parser.add_argument('-f', '-file', '--file', help="Save plot", action="store_true")
parser.add_argument('-m', '-movie', '--movie', help="Label file sequentially", type=int)
parser.add_argument('-n', '-name', '--name', help="Filename prefix (default uv)", default='uv')
parser.add_argument('-t', '-title', '--title', help="Set title")
parser.add_argument('-a', '-ant', '--ant', help="Comma seperated list of antenna to plot")
parser.add_argument('-A', '-hilite','--hilite', action='append', help="Hilight specific antenna XX:Y value, XX is antID, Y is colour")
parser.add_argument('-g', '-array','--array', action='append', help="Hilight specific all antennas on a specific array XXXX:Y value, XXXX is array name, Y is colour")
parser.add_argument('-any', '--any', help='Highlight ALL baselines to array', action="store_true")
parser.add_argument('-pdf', '--pdf', help='Save as pdf, not png', action="store_true")
parser.add_argument('-max', '--max', help='Maximum UV value on axis', default=12000, type=float)
args = parser.parse_args()

prefix = args.name
Dec = deg2rad(args.dec)
RA = deg2rad(0) # This actually should make no difference at all
step = 1  # Interval for calculations, in minutes

if args.ant is not None:
    plotAnt = args.ant.split(',')
    allAnt = antennas
    antennas = []
    for t in plotAnt:
        for a in allAnt:
            if a.code == t:
                antennas.append(a)
                break
    
freq = 8400; # MHz
#bandwidth = 64 # MHz
#calInt = 60 # Seconds

step /= (60*24)  # Convert to radians
step *= 2*pi
freq *= 1e6;
#bandwidth *= 1e6

wavelength = 2.99792458e8/freq

# Calculate baselines
baselines = createBaselines(antennas)

fig = plt.figure()
ax = fig.add_subplot(111)

maxUV = args.max


def onpick(event):
    if isinstance(event.artist, Line2D):
            thisline = event.artist
 
    print(thisline)
    return True

marker='o'

for b in baselines:
    b.calcUp(RA, Dec, step)
    b.UVtrack(RA, Dec, b.gst) 
    u = b.u
    v = b.v

    plotColour = 'b'
    #marker = 'bo'
    setMarker = False
    
    if args.hilite is not None:
        for t in args.hilite:
            ant, colour = t.split(':')
            if b.isTel(ant):
                #marker = '{}o'.format(colour)
                plotColour = colour
                setMarker = True
                break

    if not setMarker and args.array is not None:
        for a in args.array:
            array, colour = a.split(':')
            thisArray = Array[array.upper()]
            if b.isArray(thisArray, not args.any):
                #marker = '{}o'.format(colour)
                plotColour = colour
                setMarker = True
                break

#    if b.isArray(Array.SKA, False):
#        marker = 'yo'
#    if b.isArray(Array.LBA,False):
#        marker = 'go'
#    elif b.isArray(Array.LBA, False) and b.isArray(Array.EAVN, False):
#        marker = 'ro'
#    elif b.isArray(Array.EAVN):
#        marker = 'bo'
#    else:
#        continue
#        marker = 'bo'
#    if not (b.isArray(Array.EAVN) or b.isArray(Array.LBA) or (b.isArray(Array.EAVN, False) and b.isArray(Array.LBA, False))):
#        continue

#    if not setMarker:
#    ## Cross EAVN/LBA baselines
#        if b.isArray(Array.EAVN, False) and b.isArray(Array.LBA, False):
#            plotColour = 'g'

    if len(b.u)>0:
        ax.plot(-b.u, b.v, marker, b.u, -b.v, marker, color=plotColour, markersize=0.7, picker=True, label='{}-{}'.format(b.ant1.name, b.ant2.name))
        if b.u.max()>maxUV: maxUV=b.u.max()
        if b.v.max()>maxUV: maxUV=b.v.max()

maxUV *= 1.05

ax.axis('scaled')
ax.axis([-maxUV,maxUV,-maxUV,maxUV])
ax.set_xlabel('U (Km)')
ax.set_ylabel('V (Km)')
if args.title is not None:
    ax.set_title(args.title)
else:
    ax.set_title("Dec={:.0f}".format(rad2deg(Dec)))

fig.set_tight_layout(True)

if args.pdf:
    suffix = 'pdf'
else:
    suffix = 'png'

if args.file:
    if args.movie is not None:
        filename = '{}{:03.0f}.{}'.format(prefix,args.movie, suffix)
    else:
        filename = '{}{:.0f}.{}'.format(prefix,rad2deg(Dec), suffix)
    fig.savefig(filename,dpi=200,bbox_inches='tight')
else:
    fig.canvas.mpl_connect('pick_event', onpick)
    plt.show()
