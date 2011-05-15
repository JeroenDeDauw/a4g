#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import gridcalc
import loss
import json

def main():
  gridcells = {}
  for line in open('gentdata').read().split('\n'):
    lat, lon, azimuth, beamwidth, freq = line.split('|')
    lat = float(lat)
    lon = float(lon)
    azimuth = float(azimuth)
    beamwidth = float(beamwidth)
    freq = float(freq)
    cells = gridcalc.gridcalc(lon, lat, azimuth, 2000, beamwidth)
    for cell in cells:
      print azimuth, beamwidth, freq, cell.angle, cell.dist
      value = loss.project_loss(azimuth, beamwidth, freq, cell.angle, cell.dist)
      othervalue = value
      key = (cell.x, cell.y)
      if key in gridcells:
        othervalue = gridcells[key]
      gridcells[key] = max(value, othervalue)
  print json.encode(gridcells)

if __name__ == "__main__":
  main()
