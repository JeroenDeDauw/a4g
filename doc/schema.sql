CREATE TABLE site (
	id INTEGER PRIMARY KEY,
	location VARCHAR(255),
	address VARCHAR(100),
	zipcity VARCHAR(100),
	latitude REAL,
	longitude REAL,
	status VARCHAR(10)
);

CREATE TABLE inst (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	siteid INTEGER REFERENCES site (id),
	owner VARCHAR(100),
	owner_ref VARCHAR(100),
	bipt_ref VARCHAR(255)
);


CREATE TABLE antenna (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	instid INTEGER references inst (id),
	antennatype VARCHAR(100),
	azimuth INTEGER,
	height REAL,
	width REAL,
	freq REAL,
	height_mid REAL,
	power REAL,
	tilt REAL,
	horiz_beamwidth REAL,
	vert_beamwidth REAL,
	gain REAL
);



