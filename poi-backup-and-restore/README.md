# RailTrail POI Backup

This application creates and restores backups of the Points of Interest that are
present in RailTrail. To do that, it simulates a client and requests a list of
all Points of Interest.

## Requirements

This tool is written in Python. The minimum supported Python version is 3.10.
To install the required libraries, execute `pip install -r requirements.txt`.
We recommend that you do that in a [virtual environment](https://docs.python.org/3/library/venv.html).

## Usage

### Backup

To create a backup, simply run `python src/main.py backup <backup_file.json>`,
where ``<backup_file.json>`` is the name of the file where the backup should be
written to. If the filename is not present, the backup will be written to the
standard output instead.

This will ask you for the backend URI, and a username and password. You can also
provide these values by command line arguments. Remember that providing a password
this way has security implications.

For a full reference of valid command line options, run `python src/main.py backup --help`.

### Restore

To restore a backup, simply run `python src/main.py restore <backup_file.json>`,
where ``<backup_file.json>`` is the name of the file where the backup should be
read from. If the filename is not present, the program will attempt to read from
stdin instead.

This will ask you for the backend URI, and a username and password. You can also
provide these values by command line arguments. Remember that providing a password
this way has security implications.

For a full reference of valid command line options, run `python src/main.py restore --help`.
