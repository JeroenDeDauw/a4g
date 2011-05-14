#!/usr/bin/env python
# -*- coding: UTF-8 -*-

from math import sin, cos, pi, trunc, modf, floor, sqrt, atan2
from json import load

GRID_SIZE_LON=0.0001
GRID_SIZE_LAT=0.0001

GRID_ORIG_LON=0
GRID_ORIG_LAT=0

class DegreesToMeter(object):

  def __init__(self, filename):
    f = open(filename)
    self.data = load(f)
    f.close()

  def getmetersperlat(self, lat):
    fractional, integral = modf(lat)
    key = "%dd%dm" % (integral, int(abs(fractional)*6)*10)
    value = self.data[key]
    return value["minutelatinmeters"] * 60

  def getmetersperlon(self, lat):
    fractional, integral = modf(lat)
    key = "%dd%dm" % (integral, int(abs(fractional)*6)*10)
    value = self.data[key]
    return value["minuteloninmeters"] * 60

class BoundingBox(object):
  
  def __init__(self):
    self.min_lon = 180
    self.max_lon = -180
    self.min_lat = 90
    self.max_lat = -90

  def include(self, lon, lat):
    self.min_lon = min(lon, self.min_lon)
    self.min_lat = min(lat, self.min_lat)
    self.max_lon = max(lon, self.max_lon)
    self.max_lat = max(lat, self.max_lat)

  def __str__(self):
    return "min lon: %f, min lat: %f, max lon: %f, max lat: %f" % (self.min_lon, self.min_lat, self.max_lon, self.max_lat)

class Cell(object):

  def __init__(self, x, y, angle, dist):
    self.x = x
    self.y = y
    self.angle = angle
    self.dist = dist

  def __str__(self):
    return "{x: %s, y:%s, angle: %s, dist:%s}" % (self.x, self.y, self.angle, self.dist)

def get_coord_grid(x, y):
  """
  Returns center coordinate of grid
  @param x the x grid coordinate
  @param y the y grid coordinate
  @return tuple of lon lat wgs84 coords
  """
  glon = GRID_ORIG_LON + ((x + 0.5) * GRID_SIZE_LON)
  glat = GRID_ORIG_LAT + ((y + 0.5) * GRID_SIZE_LAT)
  return (glon, glat)

def get_grid_coord(lon, lat):
  """
  @param lon wgs84 decimal longitude
  @param lat wgs84 decimal latitude
  @return the grid coord of where this coord is in
  """
  glon = int(floor((lon - GRID_ORIG_LON) / GRID_SIZE_LON))
  glat = int(floor((lat - GRID_ORIG_LAT) / GRID_SIZE_LAT))
  return (glon, glat)

def gridcalc(lon, lat, azimuth, halfpower, beamwidth):
  """
  @param lon wgs84 decimal longitude
  @param lat wgs84 decimal latitude
  @param azimut angle to north vector in degrees
  @param halfpower distance of where power halves in meters
  @beamwidth width of beam in degrees
  """

  pi2 = pi / 2
  meterperdegreehorz = d2m.getmetersperlon(lat)
  meterperdegreevert = d2m.getmetersperlat(lat)

  wlon = halfpower / meterperdegreehorz
  wlat = halfpower / meterperdegreevert

  az = ((azimuth * pi) / 180) + pi2
  bw = (beamwidth * pi) / 180
  bw2 = bw / 2
  
  # calc p1
  az1 = (az - bw2) % (2 * pi)
  p1lon = lon + cos(az1) * wlon
  p1lat = lat + sin(az1) * wlat
  
  # calc p2
  az2 = (az + bw2) % (2 * pi)
  p2lon = lon + cos(az2) * wlon
  p2lat = lat + sin(az2) * wlat

  # calc bounding box not taking arc into account
  bb = BoundingBox()
  bb.include(lon, lat)
  bb.include(p1lon, p1lat)
  bb.include(p2lon, p2lat)

  # extend for arc (arc goes from p1 to p2)
  if az1 <= az2:
    # arc does not cross east
    # cross north?
    if az1 < pi2 and az2 > pi2:
      bb.include(lon, lat + wlat)
    # cross west?
    if az1 < pi and az2 > pi:
      bb.include(lon - wlon, lat)
    # cross south?
    if az1 < (pi + pi2) and az2 > (pi + pi2):
      bb.include(lon, lat - wlat)
  else:
    # arc crosses east
    bb.include(lon + wlon, lat)
    # cross north?
    if az1 < pi2 or az2 > pi2:
      bb.include(lon, lat + wlat)
    # cross west?
    if az1 < pi or az2 > pi:
      bb.include(lon - wlon, lat)
    # cross south?
    if az1 < (pi + pi2) or az2 > (pi + pi2):
      bb.include(lon, lat - wlat)

  # calc overlapping grid points
  gmin = get_grid_coord(bb.min_lon, bb.min_lat)
  gmax = get_grid_coord(bb.max_lon, bb.max_lat)

  cells = []
  for gx in range(gmin[0], gmax[0] + 1):
    for gy in range(gmin[1], gmax[1] + 1):
      cellcoords = get_coord_grid(gx, gy)
      dxant=cellcoords[0]-lon
      dyant=cellcoords[1]-lat
      distant=sqrt((dxant**2) + (dyant**2))
      normx=dxant/distant
      normy=dyant/distant
      angle = atan2(normy, normx) % (2 * pi)
      dist=sqrt(((dxant * meterperdegreehorz)**2) + ((dyant * meterperdegreevert)**2)) 
      if dist > halfpower:
        continue
      if (az1 <= az2) and ((angle < az1) or (angle > az2)):
        continue
      if (az1 > az2) and (angle < az1) and (angle > az2):
        continue
      cells.append(Cell(cellcoords[0], cellcoords[1], angle, dist))
  return cells

d2m = DegreesToMeter("lonlat2meters.json")
def main(): 
  print gridcalc(3.4567891234, 50.4567891234, -45, 20, 90)


if __name__ == "__main__":
  main()
