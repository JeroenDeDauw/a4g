#!/usr/bin/python

import os
import sys
import cgi




#
# main
#

print "content-type: text/json\n"

vars = cgi.parse_qs(os.environ['QUERY_STRING'])
for f in ('nwlat', 'nwlon', 'selat', 'selon'):
	if f not in vars:
		print "missing var", f
		sys.exit()









