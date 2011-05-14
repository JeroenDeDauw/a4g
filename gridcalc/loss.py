import math


def project_loss(azimuth, beamwidth, freq, angle, distance):
	"""Given a transmitter sending towards azimuth with half-power at the
	specified beamwidth, at the given frequency (in Hz),  returns the loss
	in dBm for a point at the given angle and distance (meter).
	"""
	# free space loss in dB
	loss_distance = 20 * math.log(distance, 10) + 20 * math.log(freq, 10) - 147.55

	rel_angle = float(azimuth - angle)
	if rel_angle < 0:
		rel_angle *= -1
	loss_angle = (10 * math.log((beamwidth-rel_angle)/beamwidth, 10)) * -1

	return (loss_distance + loss_angle) * 1000

