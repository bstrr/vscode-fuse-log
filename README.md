# fuse-log
Unofficial integration of Fuse log-messages into VS Code's output-panel.

## Features
This extension connects to the Fuse daemon and creates an output channel for build-events, logs and exceptions.<br/><br/>
Grab the Output-Colorizer extension for nice colour-coding of the output.

This extension looks for MainView.ux in the root folder in order to activate.

## Known Issues
Some error-strings from Fuse does play nicely with the colourizer and there might generally be a need for prettifying the various logs.

## Release Notes

### 0.33.0
Initial release, based on Fuse 0.33.0

## Support
Drop me an [email](contact@cassette.dk) for suggestions and problems.

## Attribution
This extension is based on the Fuse example provided in the [documentation](https://www.fusetools.com/docs/technical-corner/fuse-protocol).
