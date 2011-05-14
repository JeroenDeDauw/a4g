#!/usr/bin/env python

import math

GRIDSIZE_LON=0.0000001
GRIDSIZE_LAT=0.0000001

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


def gridcalc(lon, lat, azimuth, halfpower, beamwidth):
  """
  @param lon wgs84 decimal longitude
  @param lat wgs84 decimal latitude
  @param azimut angle to north vector in degrees
  @param halfpower distance of where power halves in meters
  @beamwidth width of beam in degrees
  """

  w = halfpower * 100 #how to do this correctly
  
  # calc p1
  az1 = (math.pi + math.pi * (azimuth - (beamwidth / 2)) / 180) % (2 * math.pi)
  p1lon = math.cos(az1) * w
  p1lat = math.sin(az1) * w

  # calc p2
  az2 = (math.pi + math.pi * (azimuth + (beamwidth / 2)) / 180) % (2 * math.pi)
  p2lon = math.cos(az2) * w
  p2lat = math.sin(az2) * w

  # calc bounding box not taking arc into account
  bb = BoundingBox()
  bb.include(lon, lat)
  bb.include(p1lon, p1lat)
  bb.include(p2lon, p2lat)

  # extend for arc
  if az1 > az2:
    #take 0 angle * length into account
    bb.include(lon + w, lat)
  if (az1 < math.pi) and (az2 > math.pi):
    #take pi angle * length into account
    bb.include(lon, lat + w)
  if (az1 < 2*math.pi) and (az2 > 2*math.pi):
    #take 2*pi angle * length into account
    bb.include(lon - w, lat)
  if (az1 < 3*math.pi) and (az2 > 3*math.pi):
    #take 2*pi angle * length into account
    bb.include(lon, lat - w)
  if (az2 < math.pi) and (az1 > math.pi):
    #take pi angle * length into account
    bb.include(lon, lat + w)
  if (az2 < 2*math.pi) and (az1 > 2*math.pi):
    #take 2*pi angle * length into account
    bb.include(lon - w, lat)
  if (az2 < 3*math.pi) and (az1 > 3*math.pi):
    #take 2*pi angle * length into account
    bb.include(lon, lat - w)

  print bb
 
def main(): 
  gridcalc(1, 1, 90, 1, 45)

if __name__ == "__main__":
  main()
