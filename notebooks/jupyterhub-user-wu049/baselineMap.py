#!/usr/bin/env python3

import argparse
import numpy as np
import matplotlib.pyplot as plt
import math
from Vis import *

import cartopy.crs as ccrs
import cartopy.feature as cfeature
import cartopy.io.img_tiles as cimgt

land_colour = '#9ac195'
water_colour = '#d5e0f2'

allTel = telescopeList()

antennas = []
for t in allTel:
    antennas.append(getTelescope(t))

parser = argparse.ArgumentParser()
parser.add_argument('-f', '-filename', '--filename', help="Save image as filename (default not). .png and .pdf supported")
parser.add_argument('-a', '-ant', '--ant', help="Comma seperated list of antenna to plot")
parser.add_argument('-A', '-hilite','--hilite', action='append', help="Highlight specific antenna XX:Y value, XX is antID, Y is colour")
parser.add_argument('-g', '-array','--array', action='append', help="Highlight all antennas on a specific array XXXX:Y value, XXXX is array name, Y is colour")
parser.add_argument('-any', '--any', help='Highlight ALL baselines to array (when using -array)', action="store_true")
parser.add_argument('-t', '-title', '--title', help="Set plot title")
parser.add_argument('-stamen', '--stamen', help='Download higher res image from Stamen tile server', action="store_true")
parser.add_argument('-z', '-zoom', '--zoom', help='Stamen zoom factor, 1..8', type=int, default=4)
parser.add_argument('-ortho', '--ortho', help='Use orthographic Projection', type=float)
parser.add_argument('-view', '--view', help='World view (LBA, Asia, Australia)')
parser.add_argument('-coastline', '--coastline', help='Draw coastlines', action="store_true")
parser.add_argument('-baselines', '--baselines', help='Mark baselines (default)', action="store_true")
parser.add_argument('-locations', '--locations', help='Mark location of stations', action="store_true")
parser.add_argument('-name', '--name', help='Show names not antena code', action="store_true")
parser.add_argument('-angle', '--angle', action='append', help="Move antenna ID to this angle, Use XX:YY where XX is antID, Y angle in deg. Default -45 (NW)")
parser.add_argument('-dpi', '--dpi', help='DPI for output files', type=int, default=200)
parser.add_argument('-latitude', '--latitude', help='Central latitude for ortho plots', type=int, default=0)
parser.add_argument('-offset', '--offset', help='Location label offset', type=float, default=30)

args = parser.parse_args()

if args.ant is not None:
    plotAnt = args.ant.split(',')
    allAnt = antennas
    antennas = []
    for t in plotAnt:
        for a in allAnt:
            if a.code == t:
                antennas.append(a)
                break

baselines = args.baselines
locations = args.locations
if not baselines and not locations:
    baselines = True

            
if baselines:
# Calculate baselines
    baselines = createBaselines(antennas)

if args.stamen:
    stamen_terrain = cimgt.Stamen('terrain-background')
    myProj = stamen_terrain.crs
elif args.ortho is not None:
    myProj = ccrs.Orthographic(central_longitude=args.ortho,central_latitude=args.latitude)
else:
    myProj = ccrs.PlateCarree(central_longitude=80)

myProj._threshold = myProj._threshold/20.  # Avoid blocky great circles

plt.figure(figsize=(12, 9))

ax = plt.axes(projection=myProj)

#ax.set_aspect('auto')

if args.ortho is None:
    if args.view is not None:
        view = args.view.upper()
    else:
        view = ''
    if view.startswith('LBA'):
        print('Using LBA')
        ax.set_extent([10, 180, 0, -60], crs=ccrs.PlateCarree())
    elif view.startswith('AUS'):
        print('Using Aus')
        ax.set_extent([110, 160, -8, -47], crs=ccrs.PlateCarree())
    elif view.startswith('ASIA'):
        print('Using Asia')
        ax.set_extent([60, 190, 26, -55], crs=ccrs.PlateCarree())
    elif view.startswith('SKA'):
        print('Using SKA view')
        ax.set_extent([10, 180, 30, -55], crs=ccrs.PlateCarree())
    elif view.startswith('TEST'):
        print('Using test')
        ax.set_extent([60, 180, -40, -50], crs=ccrs.PlateCarree())
    else:
        print('Using default view')
        ax.set_extent([0, 200, -50, 50], crs=ccrs.PlateCarree())
#ax.set_global()

#ax.add_feature(cfeature.LAND,color=land_colour)
if args.coastline: ax.add_feature(cfeature.COASTLINE)
#ax.add_feature(cfeature.OCEAN,color=water_colour)
#ax.add_feature(cfeature.LAKES,color=water_colour)
#ax.add_feature(cfeature.BORDERS, linestyle=':')

if args.stamen:
    ax.add_image(stamen_terrain, args.zoom)
else:
    ax.stock_img()

if args.filename is not None:
    lineWidth=0.6
else:
    lineWidth=1

station_colour = 'r'
size = 5

def isVisible(long,lat):
    if args.ortho is None: return True
    (x,y) = myProj.transform_point(long,lat,ccrs.Geodetic())
    if math.isnan(x) or math.isnan(y):
        return False
    else:
        return True
        
    
if locations:

    if args.ortho is None:
        (x1,x2,y1,y2) = ax.get_extent(crs=ccrs.PlateCarree())
        aax = (x2-x1)/args.offset
        aay = (y2 - y1)/args.offset
    else:
        aax = 3
        aay = 3

    for a in antennas:
        (long, lat) = a.Cartesian().longlat()
        long = rad2deg(long) 
        lat = rad2deg(lat)

        markAngle = -45
        if args.angle is not None:
            for t in args.angle:
                ant, angle = t.split(':')
                if a.code == ant:
                    markAngle = float(angle)
                    break
        markAngle = math.radians(markAngle)
                
        dx = aax*math.sin(markAngle)
        dy = aay*math.cos(markAngle)
        
        if isVisible(long,lat):
            plt.plot(long,lat, marker='o',color=station_colour,  markersize=size, transform=ccrs.Geodetic())
            if args.name:
                ax.text(long+dx, lat+dy, a.name, va='center', ha='right', transform=ccrs.Geodetic(), fontweight='bold')
            else:
                ax.text(long+dx, lat+dy, a.code, va='center', ha='center', transform=ccrs.Geodetic(), fontweight='bold')
        else:
            print("Skipping", a.code)

if baselines:
    for b in baselines:
        plotColour = 'b'
        setColour = False
    
        if args.hilite is not None:
            for t in args.hilite:
                ant, colour = t.split(':')
                if b.isTel(ant):
                    plotColour = colour
                    setColour = True
                    break

        if not setColour and args.array is not None:
            for a in args.array:
                array, colour = a.split(':')
                thisArray = Array[array.upper()]
                if b.isArray(thisArray, not args.any):
                    plotColour = colour
                    setColour = True
                    break

        lat1 = rad2deg(b.ant1.latitude)
        long1 = rad2deg(b.ant1.longitude)
        lat2 = rad2deg(b.ant2.latitude)
        long2 = rad2deg(b.ant2.longitude)

        if isVisible(long1, lat1) and isVisible(long2, lat2):
            plt.plot([long1, long2], [lat1, lat2], color=plotColour,  transform=ccrs.Geodetic(), linewidth=lineWidth)
        else:
            print("Skipping", b.ant1.code, "-", b.ant2.code)

if args.ortho is not None:
    plt.tight_layout(pad=1)
        
if args.title is not None:
    plt.title(args.title)

if args.filename is not None:
#    plt.savefig(args.filename,dpi=args.dpi,bbox_inches='tight')
    plt.savefig(args.filename,dpi=args.dpi)
else:
    plt.show()
